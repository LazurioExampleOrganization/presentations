import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { allowedHosts, listener, ModuleKitError, onShutdown } from "@lazurio/module-kit";
import appPackage from "../package.json";
import { getDeckDetail, getDeckSummaries } from "./decks.ts";
import { type Relay, startDevelopmentClient } from "./dev-client.ts";
import { hostAllowed, originAllowed } from "./host.ts";
import type { HealthResponse } from "./model.ts";
import {
  DECKS_ROOT,
  EXPORTS_ROOT,
  isRealpathWithinDecks,
  isRealpathWithinExports,
  isValidDeckSlug,
  PUBLIC_DIR,
  resolveDeckPath,
  resolveExportPath,
} from "./paths.ts";
import { clientDirectory, createStaticHandler } from "./static.ts";

const DECKS_PREFIX = "/decks/";
const EXPORTS_PREFIX = "/exports/";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

function contentType(filePath: string): string {
  return MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

async function fileResponse(filePath: string): Promise<Response> {
  return new Response(await readFile(filePath), {
    headers: { "content-type": contentType(filePath) },
  });
}

/**
 * Serve a file from the decks store, strictly contained inside decks/.
 * `/decks/<slug>` (a directory) redirects to `/decks/<slug>/` so the deck's
 * relative asset/export URLs resolve. Traversal attempts resolve to null and
 * become 404. Returns null when the request is not a servable deck path.
 */
async function serveDeck(pathname: string): Promise<Response | null> {
  const rawRest = pathname.slice(DECKS_PREFIX.length);
  let rest: string;
  try {
    rest = decodeURIComponent(rawRest);
  } catch {
    return null;
  }
  if (rest === "") return null;
  const resolved = resolveDeckPath(rest);
  if (!resolved) return null;
  let stats: Awaited<ReturnType<typeof stat>>;
  try {
    stats = await stat(resolved);
  } catch {
    return null;
  }
  if (stats.isDirectory()) {
    if (!pathname.endsWith("/")) {
      return new Response(null, {
        status: 308,
        headers: { location: `${pathname}/` },
      });
    }
    const indexPath = join(resolved, "index.html");
    const indexStats = await stat(indexPath).catch(() => null);
    if (indexStats?.isFile() && (await isRealpathWithinDecks(indexPath))) {
      return fileResponse(indexPath);
    }
    return null;
  }
  if (stats.isFile()) {
    // Symlink-aware boundary: the lexical guard above is not enough because
    // stat/readFile follow symlinks. Confirm the real target stays in decks/.
    if (!(await isRealpathWithinDecks(resolved))) return null;
    return fileResponse(resolved);
  }
  return null;
}

/**
 * Serve a derived PDF export from the generated/v1 store. URL shape is
 * /exports/<slug>/<file>; on disk it lives at EXPORTS_ROOT/<slug>/exports/<file>.
 * The slug is validated and the resolved file is contained (lexical + realpath).
 */
async function serveExport(pathname: string): Promise<Response | null> {
  let rest: string;
  try {
    rest = decodeURIComponent(pathname.slice(EXPORTS_PREFIX.length));
  } catch {
    return null;
  }
  const firstSlash = rest.indexOf("/");
  if (firstSlash <= 0) return null;
  const slug = rest.slice(0, firstSlash);
  const file = rest.slice(firstSlash + 1);
  if (!isValidDeckSlug(slug) || !file) return null;
  const resolved = resolveExportPath(`${slug}/exports/${file}`);
  if (!resolved) return null;
  const stats = await stat(resolved).catch(() => null);
  if (!stats?.isFile()) return null;
  if (!(await isRealpathWithinExports(resolved))) return null;
  return fileResponse(resolved);
}

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  // Refuse foreign Host headers even on a loopback listener; the module's
  // hosted address is not foreign (see hostAllowed).
  if (!hostAllowed(req, hosts)) return forbidden("foreign_host");

  if (req.method === "GET" && pathname === "/api/health") {
    return Response.json({
      ok: true,
      app: "presentations",
      generation: "v1",
      company: appPackage.lazurio.runtime.company,
      module: appPackage.lazurio.runtime.module,
    } satisfies HealthResponse);
  }
  const language = url.searchParams.get("lang") ?? undefined;
  if (req.method === "GET" && pathname === "/api/decks") {
    return Response.json({
      decks: await getDeckSummaries(language),
      generatedAt: new Date().toISOString(),
    });
  }
  const detailMatch = pathname.match(/^\/api\/decks\/([^/]+)$/);
  if (req.method === "GET" && detailMatch) {
    let slug: string;
    try {
      slug = decodeURIComponent(detailMatch[1]);
    } catch {
      return Response.json({ error: "malformed_slug" }, { status: 400 });
    }
    const detail = await getDeckDetail(slug, language);
    if (!detail) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(detail);
  }

  if (req.method === "GET" && pathname.startsWith(DECKS_PREFIX)) {
    const deckResponse = await serveDeck(pathname);
    if (deckResponse) return deckResponse;
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (req.method === "GET" && pathname.startsWith(EXPORTS_PREFIX)) {
    const exportResponse = await serveExport(pathname);
    if (exportResponse) return exportResponse;
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if ((req.method === "GET" || req.method === "HEAD") && !pathname.startsWith("/api/")) {
    const staticResponse = await serveStatic(pathname);
    if (staticResponse) return staticResponse;
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}

function forbidden(error: "foreign_host" | "foreign_origin"): Response {
  return Response.json({ error }, { status: 403 });
}

/**
 * The paths a development run answers itself: the API, decks, exports and the
 * top-level entries of `public/` (Vite copies them into the build). Every
 * other path belongs to the client that Bun bundles.
 */
async function appPaths(): Promise<(pathname: string) => boolean> {
  const entries = await readdir(PUBLIC_DIR, { withFileTypes: true }).catch(() => []);
  const files = new Set(
    entries.filter((entry) => !entry.isDirectory()).map((entry) => `/${entry.name}`),
  );
  const prefixes = [
    "/api/",
    DECKS_PREFIX,
    EXPORTS_PREFIX,
    ...entries.filter((entry) => entry.isDirectory()).map((entry) => `/${entry.name}/`),
  ];
  return (pathname) =>
    files.has(pathname) || prefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * A development run: one listener that checks every request's Host (and the
 * client's Origin) itself, answers the App's paths and forwards the rest to
 * Bun's bundler behind it (see dev-client.ts). Bun's own check would refuse
 * the module's hosted address.
 */
async function serveDevelopment(): Promise<{ url: URL; stop: () => Promise<void> }> {
  const ownPath = await appPaths();
  const client = startDevelopmentClient((await import("../index.html")).default, web.host);
  const server = Bun.serve<Relay>({
    hostname: web.host,
    port: web.port,
    async fetch(req, self) {
      if (!hostAllowed(req, hosts)) return forbidden("foreign_host");
      if (ownPath(new URL(req.url).pathname)) return fetchWithErrors(req);
      if (!originAllowed(req, hosts)) return forbidden("foreign_origin");
      try {
        return await client.forward(req, self);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          "[presentation] client request failed",
          req.method,
          new URL(req.url).pathname,
          message,
        );
        return Response.json({ error: "client_unavailable", message }, { status: 502 });
      }
    },
    websocket: client.websocket,
  });
  return {
    url: server.url,
    stop: async () => {
      await server.stop(true);
      await client.stop();
    },
  };
}

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "::1" || host === "localhost";
}

async function fetchWithErrors(req: Request): Promise<Response> {
  try {
    return await route(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[presentation] request failed", req.method, new URL(req.url).pathname, message);
    return Response.json({ error: "internal_error", message }, { status: 500 });
  }
}

// Host and port come only from the Launchpad's listener environment
// (Lazurio Module Standard 4.2); without them the App does not start. The
// App answers loopback and, when Lazurio hosts it, the hostname of the
// listener's external origin; a local run has no external origin.
let web: ReturnType<typeof listener>;
let hosts: ReadonlySet<string>;
try {
  web = listener("web");
  hosts = new Set(allowedHosts("web"));
} catch (error) {
  if (!(error instanceof ModuleKitError)) throw error;
  console.error(`Start through Lazurio lifecycle: ${error.message}`);
  process.exit(2);
}
if (!isLoopbackHost(web.host)) {
  console.error(`Presentation listener must use a loopback host, received ${web.host}.`);
  process.exit(2);
}

// The built version (`start_script` from `main`, NODE_ENV=production) serves
// the client build; a development run lets Bun bundle the client itself
// (HTML import with hot reload, behind the App's listener) and serves
// `public/` beside it. One process either way (Module Standard, "One process").
const production = process.env.NODE_ENV === "production";
const clientRoot = production ? clientDirectory() : PUBLIC_DIR;
const serveStatic = createStaticHandler(clientRoot, { spa: production });

let running: { url: URL; stop: () => Promise<void> };
if (production) {
  const server = Bun.serve({ hostname: web.host, port: web.port, fetch: fetchWithErrors });
  running = { url: server.url, stop: () => server.stop(true) };
} else {
  running = await serveDevelopment();
}
onShutdown(() => running.stop());

console.log(
  `Presentation app/v1 (${production ? "built version" : "development"}) running at ${running.url.origin}`,
);
console.log(`[presentation] client: ${production ? clientRoot : "bundled by Bun"}`);
console.log(`[presentation] decks: ${DECKS_ROOT}`);
console.log(`[presentation] exports: ${EXPORTS_ROOT}`);
