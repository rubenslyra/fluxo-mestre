import server from "../dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.APP_HOST ?? "127.0.0.1";

if (typeof server?.fetch !== "function") {
  throw new Error("TanStack Start server entry does not expose a fetch handler.");
}

Bun.serve({
  hostname,
  port,
  fetch: (request) => server.fetch(request),
});

console.log(`FluxoLab SSR listening on http://${hostname}:${port}`);
