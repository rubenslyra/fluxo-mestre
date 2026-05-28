export const APP_SETTINGS_CHANGED_EVENT = "fluxolab-settings-changed";

const SETTINGS_KEY = "fluxolab-settings-v1";
const API_KEY_LOCAL_KEY = "fluxolab-ai-api-key-v1";
const API_KEY_SESSION_KEY = "fluxolab-ai-api-key-session-v1";

export type AiProvider = "openai-compatible" | "gemini";
export type AiMode = "local" | "external";
export type ApiKeyStorage = "none" | "session" | "local";

export interface AppSettings {
  ui: {
    confirmBeforeClear: boolean;
    reduceMotion: boolean;
  };
  ai: {
    mode: AiMode;
    provider: AiProvider;
    endpoint: string;
    model: string;
    apiKeyStorage: ApiKeyStorage;
    temperature: number;
  };
}

export const defaultAppSettings: AppSettings = {
  ui: {
    confirmBeforeClear: true,
    reduceMotion: false,
  },
  ai: {
    mode: "local",
    provider: "openai-compatible",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1-mini",
    apiKeyStorage: "none",
    temperature: 0.2,
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeStorage(kind: "local" | "session") {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function coerceProvider(value: unknown): AiProvider {
  return value === "gemini" ? "gemini" : "openai-compatible";
}

function coerceStorage(value: unknown): ApiKeyStorage {
  if (value === "local" || value === "session") return value;
  return "none";
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isObject(value)) return defaultAppSettings;
  const ui = isObject(value.ui) ? value.ui : {};
  const ai = isObject(value.ai) ? value.ai : {};

  return {
    ui: {
      confirmBeforeClear:
        typeof ui.confirmBeforeClear === "boolean"
          ? ui.confirmBeforeClear
          : defaultAppSettings.ui.confirmBeforeClear,
      reduceMotion:
        typeof ui.reduceMotion === "boolean" ? ui.reduceMotion : defaultAppSettings.ui.reduceMotion,
    },
    ai: {
      mode: ai.mode === "external" ? "external" : "local",
      provider: coerceProvider(ai.provider),
      endpoint:
        typeof ai.endpoint === "string" && ai.endpoint.trim()
          ? ai.endpoint.trim()
          : defaultAppSettings.ai.endpoint,
      model:
        typeof ai.model === "string" && ai.model.trim()
          ? ai.model.trim()
          : defaultAppSettings.ai.model,
      apiKeyStorage: coerceStorage(ai.apiKeyStorage),
      temperature:
        typeof ai.temperature === "number" && Number.isFinite(ai.temperature)
          ? Math.max(0, Math.min(1, ai.temperature))
          : defaultAppSettings.ai.temperature,
    },
  };
}

export function loadAppSettings(): AppSettings {
  const storage = safeStorage("local");
  if (!storage) return defaultAppSettings;
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : defaultAppSettings;
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(settings: AppSettings) {
  const next = normalizeSettings(settings);
  const storage = safeStorage("local");
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage restrictions.
  }
  applyAppSettings(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AppSettings>(APP_SETTINGS_CHANGED_EVENT, { detail: next }),
    );
  }
  return next;
}

export function applyAppSettings(settings: AppSettings) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("fluxolab-reduce-motion", settings.ui.reduceMotion);
}

export function readStoredApiKey(storageMode: ApiKeyStorage) {
  if (storageMode === "local") return safeStorage("local")?.getItem(API_KEY_LOCAL_KEY) ?? "";
  if (storageMode === "session") return safeStorage("session")?.getItem(API_KEY_SESSION_KEY) ?? "";
  return "";
}

export function saveStoredApiKey(storageMode: ApiKeyStorage, apiKey: string) {
  clearStoredApiKeys();
  const trimmed = apiKey.trim();
  if (!trimmed || storageMode === "none") return;
  try {
    if (storageMode === "local") safeStorage("local")?.setItem(API_KEY_LOCAL_KEY, trimmed);
    if (storageMode === "session") safeStorage("session")?.setItem(API_KEY_SESSION_KEY, trimmed);
  } catch {
    // Ignore storage restrictions.
  }
}

export function clearStoredApiKeys() {
  try {
    safeStorage("local")?.removeItem(API_KEY_LOCAL_KEY);
    safeStorage("session")?.removeItem(API_KEY_SESSION_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}
