import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true, // Garante que ele vai mapear e gerar o HTML de todas as suas rotas internas
      },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});

// export default defineConfig({
//   plugins: [tanstackStart(), viteReact(), tailwindcss(), tsConfigPaths()],
// });
