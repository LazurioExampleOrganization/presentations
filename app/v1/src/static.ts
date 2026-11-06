import { resolve, sep } from "node:path";
import { DIST_DIR } from "./paths.ts";

/**
 * The client build the built version serves. A start from `main` gets it from
 * Lazurio as `LAZURIO_RUNTIME_BUILD_OUTPUT` (installed outside the checkout and
 * unchanged while the App runs); a local production run uses the package's own
 * `dist/` (Module Standard, "The built version from `main`").
 */
export function clientDirectory(env: Record<string, string | undefined> = process.env): string {
  const output = env.LAZURIO_RUNTIME_BUILD_OUTPUT;
  return output ? resolve(output) : DIST_DIR;
}

export type StaticHandler = (pathname: string) => Promise<Response | null>;

/**
 * Serves the files of one directory and nothing outside it. With `spa`, an
 * unknown path whose last segment has no extension gets `index.html`, so a
 * reload of an App route works. Returns null for anything it does not serve.
 */
export function createStaticHandler(root: string, options: { spa: boolean }): StaticHandler {
  const base = resolve(root);
  return async (pathname) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    const target = resolve(base, `.${decoded === "/" ? "/index.html" : decoded}`);
    if (target !== base && !target.startsWith(`${base}${sep}`)) return null;
    const file = Bun.file(target);
    if (await file.exists()) {
      // Vite fingerprints everything under assets/; the rest revalidates.
      const immutable = decoded.startsWith("/assets/");
      return new Response(file, {
        headers: {
          "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
        },
      });
    }
    if (!options.spa || /\.[a-z0-9]+$/i.test(decoded)) return null;
    const index = Bun.file(resolve(base, "index.html"));
    if (!(await index.exists())) return null;
    return new Response(index, {
      headers: { "cache-control": "no-cache", "content-type": "text/html; charset=utf-8" },
    });
  };
}
