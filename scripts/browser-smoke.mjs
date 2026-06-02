import { spawn } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = process.cwd();
const tmpDir = path.join(rootDir, "tmp");
const artifactDir = path.join(tmpDir, "browser-smoke");
const screenshotDir = path.join(artifactDir, "screenshots");
const videoDir = path.join(artifactDir, "video");
const chromeProfileDir = path.join(artifactDir, "chrome-profile");
const reportPath = path.join(artifactDir, "report.md");
const framesListPath = path.join(artifactDir, "frames.txt");
const videoPath = path.join(artifactDir, "session.mp4");
const appOrigin = process.env.BROWSER_SMOKE_ORIGIN ?? "http://127.0.0.1:8088";
const appBaseURL = new URL("/fluxolab/", appOrigin).toString();
const chromePath =
  process.env.BROWSER_SMOKE_CHROME_PATH ??
  path.join("C:", "Program Files", "Google", "Chrome", "Application", "chrome.exe");
const debugPort = Number(process.env.BROWSER_SMOKE_DEBUG_PORT ?? 9222);
let chromeStderr = "";

function rel(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

async function ensureDirs() {
  await rm(artifactDir, { force: true, recursive: true });
  await mkdir(screenshotDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });
  await mkdir(chromeProfileDir, { recursive: true });
}

async function waitForDevtools(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // Keep polling until Chrome exposes the DevTools endpoint.
    }
    await delay(500);
  }

  throw new Error(`Chrome did not expose a DevTools endpoint on port ${port}.`);
}

async function launchChrome() {
  const args = [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeProfileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--disable-popup-blocking",
    "--disable-dev-shm-usage",
    "--disable-features=Translate,OptimizationHints",
  ];

  const child = spawn(chromePath, args, {
    detached: false,
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });

  if (child.stderr) {
    child.stderr.on("data", (chunk) => {
      chromeStderr += chunk.toString("utf8");
      if (chromeStderr.length > 16_000) {
        chromeStderr = chromeStderr.slice(-16_000);
      }
    });
  }

  const exitPromise = new Promise((_, reject) => {
    child.once("exit", (code, signal) => {
      reject(
        new Error(
          `Chrome exited before exposing DevTools (code=${code ?? "n/a"}, signal=${signal ?? "n/a"}).`,
        ),
      );
    });
  });

  child.unref();
  await Promise.race([waitForDevtools(debugPort, 90000), exitPromise]);
  return child;
}

async function stopChrome(child) {
  if (!child) return;
  try {
    if (child.pid) {
      await new Promise((resolve) => {
        const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          detached: false,
          stdio: "ignore",
          windowsHide: true,
        });
        killer.once("exit", resolve);
        killer.once("error", resolve);
      });
    }
  } catch {
    try {
      child.kill();
    } catch {
      // Ignore cleanup failures.
    }
  }
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = [];
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.onMessage(event));
    this.ws.addEventListener("close", () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error("CDP socket closed unexpectedly."));
      }
      this.pending.clear();
    });
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message || "CDP command failed."));
        return;
      }
      pending.resolve(message.result);
      return;
    }

    if (message.method) {
      for (let index = 0; index < this.eventWaiters.length; index += 1) {
        const waiter = this.eventWaiters[index];
        if (waiter.method !== message.method) continue;
        if (waiter.sessionId && waiter.sessionId !== message.sessionId) continue;
        this.eventWaiters.splice(index, 1);
        clearTimeout(waiter.timer);
        waiter.resolve(message.params);
        return;
      }
    }
  }

  send(method, params = {}, sessionId) {
    if (!this.ws) throw new Error("CDP socket is not open.");
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(
        JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }),
      );
    });
  }

  waitForEvent(method, sessionId, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.eventWaiters = this.eventWaiters.filter((item) => item.resolve !== resolve);
        reject(new Error(`Timed out waiting for ${method}.`));
      }, timeoutMs);
      this.eventWaiters.push({ method, sessionId, resolve, timer });
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      // Ignore close errors.
    }
  }
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true, userGesture: true },
    sessionId,
  );
  return result.result?.value;
}

async function clickByText(client, sessionId, text) {
  return evaluate(
    client,
    sessionId,
    `(() => {
      const needle = ${JSON.stringify(text)}.toLowerCase();
      const candidates = [...document.querySelectorAll('button,a,[role="button"],label,summary')];
      const match = candidates.find((el) => {
        const content = (el.innerText || el.textContent || '').trim().toLowerCase();
        const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();
        return content.includes(needle) || aria.includes(needle);
      });
      if (!match) return false;
      match.click();
      return true;
    })()`,
  );
}

async function waitForButtonEnabledByText(client, sessionId, text, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const enabled = await evaluate(
      client,
      sessionId,
      `(() => {
        const needle = ${JSON.stringify(text)}.toLowerCase();
        const buttons = [...document.querySelectorAll('button')];
        const button = buttons.find((el) => {
          const content = (el.innerText || el.textContent || '').trim().toLowerCase();
          const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();
          return content.includes(needle) || aria.includes(needle);
        });
        return !!button && !button.disabled;
      })()`,
    );
    if (enabled) return true;
    await delay(250);
  }
  throw new Error(`Timed out waiting for enabled button: ${text}`);
}

async function clickLabelCheckbox(client, sessionId, labelText) {
  return evaluate(
    client,
    sessionId,
    `(() => {
      const needle = ${JSON.stringify(labelText)}.toLowerCase();
      const labels = [...document.querySelectorAll('label')];
      const label = labels.find((el) => (el.innerText || el.textContent || '').toLowerCase().includes(needle));
      if (!label) return false;
      const checkbox = label.querySelector('input[type="checkbox"]');
      if (!checkbox) return false;
      if (!checkbox.checked) checkbox.click();
      return true;
    })()`,
  );
}

async function fillByLabel(client, sessionId, labelText, value) {
  return evaluate(
    client,
    sessionId,
    `(() => {
      const needle = ${JSON.stringify(labelText)}.toLowerCase();
      const labels = [...document.querySelectorAll('label')];
      const label = labels.find((el) => (el.innerText || el.textContent || '').toLowerCase().includes(needle));
      if (!label) return false;
      const control = label.querySelector('input,textarea,select');
      if (!control) return false;
      const nextValue = ${JSON.stringify(value)};
      const proto = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      descriptor?.set?.call(control, nextValue);
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
}

async function textPresent(client, sessionId, text) {
  return Boolean(
    await evaluate(
      client,
      sessionId,
      `document.body && document.body.innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`,
    ),
  );
}

async function waitForText(client, sessionId, text, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await textPresent(client, sessionId, text)) return true;
    await delay(500);
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function waitForTextAbsent(client, sessionId, text, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await textPresent(client, sessionId, text))) return true;
    await delay(500);
  }
  throw new Error(`Timed out waiting for text to disappear: ${text}`);
}

async function captureScreenshot(client, sessionId, name, screenshots) {
  const filePath = path.join(screenshotDir, `${name}.png`);
  const result = await client.send(
    "Page.captureScreenshot",
    { format: "png", fromSurface: true, captureBeyondViewport: false },
    sessionId,
  );
  await writeFile(filePath, Buffer.from(result.data, "base64"));
  screenshots.push(rel(filePath));
}

async function navigate(client, sessionId, url) {
  await client.send("Page.navigate", { url }, sessionId);
  await client.waitForEvent("Page.loadEventFired", sessionId, 30000);
}

async function makeVideo(screenshots) {
  const frameLines = screenshots.map((item) => {
    const absolute = path.join(rootDir, item).split(path.sep).join("/");
    return `file '${absolute}'`;
  });
  await writeFile(framesListPath, `${frameLines.join("\n")}\n`, "utf8");
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      framesListPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      videoPath,
    ],
    { windowsHide: true, stdio: "ignore" },
  );

  await new Promise((resolve, reject) => {
    ffmpeg.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}.`));
    });
    ffmpeg.once("error", reject);
  });
}

async function main() {
  await ensureDirs();

  const screenshots = [];
  const checks = [];
  let chromeProcess = null;
  let client = null;
  let browserTargetId = null;
  let sessionId = null;
  let failure = null;

  try {
    chromeProcess = await launchChrome();
    const version = await waitForDevtools(debugPort, 5000);
    client = new CdpClient(version.webSocketDebuggerUrl);
    await client.open();

    const target = await client.send("Target.createTarget", { url: "about:blank" });
    browserTargetId = target.targetId;
    const attached = await client.send("Target.attachToTarget", {
      targetId: browserTargetId,
      flatten: true,
    });
    sessionId = attached.sessionId;

    await client.send("Runtime.enable", {}, sessionId);
    await client.send("Page.enable", {}, sessionId);
    await client.send(
      "Emulation.setDeviceMetricsOverride",
      {
        width: 1440,
        height: 1100,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: 1440,
        screenHeight: 1100,
        positionX: 0,
        positionY: 0,
        screenOrientation: { type: "landscapePrimary", angle: 0 },
      },
      sessionId,
    );

    await navigate(client, sessionId, appBaseURL);
    await waitForText(client, sessionId, "Editor de fluxogramas e artefatos técnicos");
    await captureScreenshot(client, sessionId, "01-home-splash", screenshots);
    checks.push("Splash carregada no primeiro acesso.");

    await waitForText(client, sessionId, "Ambiente pronto para uso");
    await waitForButtonEnabledByText(client, sessionId, "Entrar no editor");
    await clickByText(client, sessionId, "Entrar no editor");
    await captureScreenshot(client, sessionId, "02-post-enter", screenshots);
    await waitForText(client, sessionId, "Buscar no fluxo");
    await captureScreenshot(client, sessionId, "03-home-editor", screenshots);
    checks.push("Splash dispensada e editor exibido.");

    await clickByText(client, sessionId, "Desafios de Lógica");
    await waitForText(client, sessionId, "Desafios de Pensamento Lógico");
    await captureScreenshot(client, sessionId, "04-desafios", screenshots);
    checks.push("Alternância para o modo de desafios.");

    await clickByText(client, sessionId, "Editor de Fluxogramas");
    await waitForText(client, sessionId, "Editor de Fluxogramas");
    await captureScreenshot(client, sessionId, "05-editor", screenshots);
    checks.push("Retorno ao modo editor.");

    await clickByText(client, sessionId, "Abrir configurações");
    await waitForText(client, sessionId, "Configurações");
    await captureScreenshot(client, sessionId, "06-settings-open", screenshots);
    checks.push("Painel de configurações aberto.");

    await clickLabelCheckbox(client, sessionId, "Confirmar limpeza do fluxo");
    await clickLabelCheckbox(client, sessionId, "Reduzir movimento");
    await clickByText(client, sessionId, "API externa");
    await fillByLabel(client, sessionId, "Endpoint", "https://example.com/v1/chat/completions");
    await fillByLabel(client, sessionId, "Modelo", "smoke-test-model");
    await fillByLabel(client, sessionId, "Temperatura", "0.4");
    await clickByText(client, sessionId, "Salvar");
    await captureScreenshot(client, sessionId, "07-settings-after-save", screenshots);
    checks.push("Alterações locais aplicadas no painel.");

    await clickByText(client, sessionId, "Fechar configurações");
    await waitForTextAbsent(client, sessionId, "Configurações");

    await navigate(client, sessionId, `${appOrigin}/fluxolab/privacidade`);
    await waitForText(client, sessionId, "Política de Privacidade");
    await captureScreenshot(client, sessionId, "08-privacidade", screenshots);
    checks.push("Rota de privacidade acessada.");

    await navigate(client, sessionId, `${appOrigin}/fluxolab/uso`);
    await waitForText(client, sessionId, "Termos de Uso");
    await captureScreenshot(client, sessionId, "09-uso", screenshots);
    checks.push("Rota de uso acessada.");

    await navigate(client, sessionId, `${appOrigin}/fluxolab/cookies`);
    await waitForText(client, sessionId, "Política de Cookies");
    await captureScreenshot(client, sessionId, "10-cookies", screenshots);
    checks.push("Rota de cookies acessada.");

    await navigate(client, sessionId, appBaseURL);
    await waitForText(client, sessionId, "Editor de Fluxogramas");
    await waitForTextAbsent(client, sessionId, "Entrar no editor");
    await captureScreenshot(client, sessionId, "11-final-editor", screenshots);
    checks.push("Retorno final ao editor sem a splash na mesma sessão.");

    await makeVideo(screenshots);
  } catch (error) {
    failure = error;
  } finally {
    if (client) client.close();
    await stopChrome(chromeProcess);

    const chromeStderrLines = chromeStderr
      ? chromeStderr
          .trim()
          .split("\n")
          .map((line) => `  ${line}`)
      : [];
    const videoExists = await access(videoPath)
      .then(() => true)
      .catch(() => false);

    const lines = [
      "# Browser smoke report",
      "",
      `- Base URL: ${appOrigin}`,
      `- App URL: ${appBaseURL}`,
      `- Status: ${failure ? "failed" : "passed"}`,
      ...(chromeStderrLines.length > 0 ? ["- Chrome stderr:", ...chromeStderrLines] : []),
      "- Screenshots:",
      ...screenshots.map((item) => `  - ${item}`),
      `- Video: ${videoExists ? rel(videoPath) : "(not generated)"}`,
      "",
      "## Checks",
      ...checks.map((item) => `- ${item}`),
      "",
    ];

    await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
    if (failure) throw failure;
  }
}

await main();
