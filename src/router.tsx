import { createRouter } from "@tanstack/react-router";
import { DefaultErrorComponent } from "./components/system/DefaultErrorComponent";
import { routeTree } from "./routeTree.gen";

function normalizeBasepath(baseUrl: string) {
  const withoutTrailingSlash = baseUrl.replace(/\/+$/, "");
  return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    basepath: normalizeBasepath(import.meta.env.BASE_URL),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
