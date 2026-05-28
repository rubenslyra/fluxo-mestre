import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

function normalizeBase(base: string) {
  const trimmed = base.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function hostingerStaticFiles(base: string): Plugin {
  const rewriteBase = normalizeBase(base);
  const directoryName = rewriteBase.replace(/^\/+|\/+$/g, "") || "fluxolab";

  return {
    name: "hostinger-static-files",
    closeBundle() {
      const outDir = join(process.cwd(), "dist", "hostinger");
      mkdirSync(outDir, { recursive: true });

      writeFileSync(
        join(outDir, ".htaccess"),
        [
          "Options -MultiViews",
          "",
          "<IfModule mod_rewrite.c>",
          "  RewriteEngine On",
          `  RewriteBase ${rewriteBase}`,
          "  RewriteRule ^index\\.html$ - [L]",
          "  RewriteCond %{REQUEST_FILENAME} -f [OR]",
          "  RewriteCond %{REQUEST_FILENAME} -d",
          "  RewriteRule ^ - [L]",
          "  RewriteRule . index.html [L]",
          "</IfModule>",
          "",
          "<IfModule mod_mime.c>",
          "  AddType application/javascript js mjs",
          "  AddType text/css css",
          "</IfModule>",
          "",
        ].join("\n"),
      );

      writeFileSync(
        join(outDir, "nginx-fluxolab.conf"),
        [
          "# Exemplo para Nginx, caso o painel da hospedagem permita editar o servidor.",
          "# Ajuste o caminho fisico antes de usar.",
          `location ${rewriteBase} {`,
          `  alias /home/SEU_USUARIO/public_html/${directoryName}/;`,
          `  try_files $uri $uri/ ${rewriteBase}index.html;`,
          "}",
          "",
        ].join("\n"),
      );
    },
  };
}

const base = normalizeBase(process.env.FLUXOLAB_BASE_PATH ?? "/fluxolab/");

export default defineConfig({
  base,
  plugins: [viteReact(), tailwindcss(), tsConfigPaths(), hostingerStaticFiles(base)],
  build: {
    outDir: "dist/hostinger",
    emptyOutDir: true,
  },
});
