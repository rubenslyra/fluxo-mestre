import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Define a rota base apenas quando estiver gerando o build de produção
  base: process.env.NODE_ENV === "production" ? "/fluxolab/" : "/",
  plugins: [tanstackStart(), viteReact(), tailwindcss(), tsConfigPaths()],
  build: {
    // Garante que a saída seja uma pasta limpa chamada 'dist' com o index.html na raiz
    outDir: "dist",
    emptyOutDir: true,
  },
});
