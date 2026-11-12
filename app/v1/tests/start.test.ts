import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import packageJson from "../package.json";
import { listDeckSlugs } from "../src/decks.ts";

// The start contract of the Lazurio Module Standard. Lazurio runs `dev_script`
// for a development run and, from `main`, `build_script` and then
// `start_script` with NODE_ENV=production and the installed client build in
// LAZURIO_RUNTIME_BUILD_OUTPUT. Each run gets only bun on PATH and the
// listener environment; without it the App refuses to start, with it the
// declared health path answers 200 directly (the probe does not follow
// redirects), a foreign Host is refused and SIGTERM ends the App with exit 0.
// A hosted run also gets the listener's external origin: Lazurio's gateway
// passes the browser's Host through, so the module's own address must open
// the library, its API and the decks in both runs (in a development run also
// Bun's client and its hot-reload socket), while a forwarded header never
// makes a foreign Host acceptable. A local run has no external origin and
// answers loopback only.
const app = resolve(import.meta.dir, "..");
const runtime = packageJson.lazurio.runtime;
const [entrypoint] = runtime.listeners;
if (!entrypoint) throw new Error("lazurio.runtime declares no listener");
const variable = `LAZURIO_RUNTIME_LISTENER_${entrypoint.id.toUpperCase().replaceAll("-", "_")}`;
const baseEnv = { HOME: process.env.HOME ?? "", PATH: dirname(process.execPath) };
const startTimeoutMs = 60_000;
// The module's address when Lazurio hosts it (a reserved name, never resolved).
const hostedOrigin = "https://presentations.example.test";
const hostedHost = new URL(hostedOrigin).host;
// A deck of the library, when it has one (an empty start has none).
const [anyDeck] = await listDeckSlugs();
const cleanup: string[] = [];

afterAll(() => {
  for (const path of cleanup) rmSync(path, { recursive: true, force: true });
});

describe("start contract", () => {
  for (const script of [runtime.dev_script, runtime.start_script]) {
    test(`\`${script}\` refuses to start without the listener environment`, () => {
      const run = Bun.spawnSync([process.execPath, "--no-env-file", "run", script], {
        cwd: app,
        env: baseEnv,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(run.exitCode).toBe(2);
      expect(run.stderr.toString()).toContain(`${variable}_HOST`);
    });
  }

  test(
    "development run (local): health, the client bundled by Bun, public files and decks",
    async () => {
      await withServer(runtime.dev_script, {}, async (origin) => {
        const page = await fetch(`${origin}/`);
        expect(page.status).toBe(200);
        expect(await page.text()).toContain('id="root"');
        expect((await fetch(`${origin}/lazurio/tokens.css`)).status).toBe(200);
        if (anyDeck) {
          expect((await fetch(`${origin}/previews/${anyDeck}.jpg`)).status).toBe(200);
          expect((await fetch(`${origin}/decks/${anyDeck}/`)).status).toBe(200);
        }

        // Loopback only, on the page and Bun's client too (Bun's own
        // development server would also answer any IP address and *.localhost).
        const script = await clientScript(origin, new URL(origin).host);
        expect((await fetch(`${origin}${script}`)).status).toBe(200);
        for (const host of [hostedHost, "127.0.0.2", "x.localhost"]) {
          for (const path of ["/", script]) {
            expect((await fetchAs(origin, path, host)).status, `${host} ${path}`).toBe(403);
          }
        }
        expect(await hotReloadAnswers(origin, origin)).toBe(true);
        expect(await hotReloadAnswers(origin, hostedOrigin)).toBe(false);
      });
    },
    startTimeoutMs + 30_000,
  );

  test(
    "development run (hosted): the library, Bun's client, the API and hot reload at the module's address",
    async () => {
      await withServer(
        runtime.dev_script,
        { [`${variable}_EXTERNAL_ORIGIN`]: hostedOrigin },
        async (origin) => {
          // The browser at the module's address: the page, Bun's client
          // script, an App route, the API, public files and a deck.
          const script = await clientScript(origin, hostedHost);
          expect((await fetchAs(origin, script, hostedHost)).status).toBe(200);
          const route = await fetchAs(origin, "/some/app/route", hostedHost);
          expect(route.status).toBe(200);
          expect(await route.text()).toContain('id="root"');
          const decks = await fetchAs(origin, "/api/decks", hostedHost);
          expect(decks.status).toBe(200);
          expect(Array.isArray((await decks.json()).decks)).toBe(true);
          if (anyDeck) {
            expect((await fetchAs(origin, `/previews/${anyDeck}.jpg`, hostedHost)).status).toBe(
              200,
            );
            expect((await fetchAs(origin, `/decks/${anyDeck}/`, hostedHost)).status).toBe(200);
          }
          // The hot-reload socket opens for the module's page, not for a page
          // elsewhere; Bun's error report refuses a page elsewhere too.
          expect(await hotReloadAnswers(origin, hostedOrigin)).toBe(true);
          expect(await hotReloadAnswers(origin, "https://attacker.invalid")).toBe(false);
          const report = await fetch(`${origin}/_bun/report_error`, {
            method: "POST",
            headers: { host: hostedHost, origin: "https://attacker.invalid" },
            body: "x",
          });
          expect(report.status).toBe(403);
          // A foreign Host stays refused on the page, Bun's client and the
          // API, whatever it forwards.
          for (const host of ["foreign.invalid", "127.0.0.2", `attacker.invalid@${hostedHost}`]) {
            for (const path of ["/", script, "/api/decks"]) {
              const refused = await fetchAs(origin, path, host, {
                "x-forwarded-host": hostedHost,
                forwarded: `host=${hostedHost};proto=https`,
              });
              expect(refused.status, `${host} ${path}`).toBe(403);
            }
          }
        },
      );
    },
    startTimeoutMs + 30_000,
  );

  test(
    "built version (hosted): `build_script` writes `build_output`, `start_script` serves the installed build at the module's address",
    async () => {
      const build = Bun.spawnSync(
        [process.execPath, "--no-env-file", "run", runtime.build_script],
        {
          cwd: app,
          env: { ...baseEnv, NODE_ENV: "production" },
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      expect(build.exitCode, build.stderr.toString()).toBe(0);
      const output = join(app, runtime.build_output);
      expect(existsSync(join(output, "index.html"))).toBe(true);
      if (anyDeck) expect(existsSync(join(output, "previews", `${anyDeck}.jpg`))).toBe(true);

      // Lazurio installs the build outside the checkout; a marker proves the
      // server reads that copy and not the package's own dist/.
      const installed = mkdtempSync(join(realpathSync.native(tmpdir()), "presentations-build-"));
      cleanup.push(installed);
      cpSync(output, installed, { recursive: true });
      writeFileSync(join(installed, "installed-marker.txt"), "installed build");

      await withServer(
        runtime.start_script,
        {
          NODE_ENV: "production",
          LAZURIO_RUNTIME_BUILD_OUTPUT: installed,
          [`${variable}_EXTERNAL_ORIGIN`]: hostedOrigin,
        },
        async (origin) => {
          const page = await fetch(`${origin}/`);
          expect(page.status).toBe(200);
          const html = await page.text();
          expect(html).toContain('id="root"');
          const marker = await fetch(`${origin}/installed-marker.txt`);
          expect(await marker.text()).toBe("installed build");
          const asset = html.match(/\/assets\/[^"]+\.js/)?.[0];
          if (!asset) throw new Error("the built index.html names no script asset");
          const script = await fetch(`${origin}${asset}`);
          expect(script.status).toBe(200);
          expect(script.headers.get("cache-control")).toContain("immutable");
          // App routes fall back to index.html; missing files and escapes do not.
          const route = await fetch(`${origin}/some/app/route`);
          expect(route.status).toBe(200);
          expect(await route.text()).toContain('id="root"');
          expect((await fetch(`${origin}/missing.js`)).status).toBe(404);
          expect((await fetch(`${origin}/..%2f..%2fpackage.json`)).status).toBe(404);
          if (anyDeck) {
            expect((await fetch(`${origin}/previews/${anyDeck}.jpg`)).status).toBe(200);
            expect((await fetch(`${origin}/decks/${anyDeck}/`)).status).toBe(200);
          }

          // The browser at the module's address: the library, its API and a deck.
          const library = await fetchAs(origin, "/", hostedHost);
          expect(library.status).toBe(200);
          expect(await library.text()).toContain('id="root"');
          const decks = await fetchAs(origin, "/api/decks", hostedHost);
          expect(decks.status).toBe(200);
          expect(Array.isArray((await decks.json()).decks)).toBe(true);
          if (anyDeck) {
            expect((await fetchAs(origin, `/api/decks/${anyDeck}`, hostedHost)).status).toBe(200);
            expect((await fetchAs(origin, `/decks/${anyDeck}/`, hostedHost)).status).toBe(200);
          }
          // A foreign Host stays refused on every route, whatever it forwards.
          for (const path of ["/", "/api/decks", "/api/health"]) {
            const spoofed = await fetchAs(origin, path, "foreign.invalid", {
              "x-forwarded-host": hostedHost,
              forwarded: `host=${hostedHost};proto=https`,
            });
            expect(spoofed.status, path).toBe(403);
          }
        },
      );
    },
    startTimeoutMs + 120_000,
  );
});

/**
 * Starts `script` on a free loopback port, waits for health and checks what
 * every run must do (health 200 with the runtime context on loopback, foreign
 * Host 403 even with forwarded headers naming the module's address, the
 * module's address 200 only when the run is hosted), runs `check`, then stops
 * the App with SIGTERM and expects exit 0.
 */
async function withServer(
  script: string,
  env: Record<string, string>,
  check: (origin: string) => Promise<void>,
): Promise<void> {
  const port = await freePort();
  const server = Bun.spawn([process.execPath, "--no-env-file", "run", script], {
    cwd: app,
    env: {
      ...baseEnv,
      ...env,
      [`${variable}_HOST`]: "127.0.0.1",
      [`${variable}_PORT`]: `${port}`,
    },
    stdout: "ignore",
    stderr: "inherit",
  });
  const origin = `http://127.0.0.1:${port}`;
  try {
    const healthPath = entrypoint.health.path;
    const health = await firstResponse(`${origin}${healthPath}`, startTimeoutMs);
    expect(health.status).toBe(200);
    const context = await health.json();
    expect(context.company).toBe(runtime.company);
    expect(context.module).toBe(runtime.module);
    for (const host of [`127.0.0.1:${port}`, `localhost:${port}`]) {
      expect((await fetchAs(origin, healthPath, host)).status, host).toBe(200);
    }
    expect((await fetchAs(origin, healthPath, "foreign.invalid")).status).toBe(403);
    const forwarded = await fetchAs(origin, healthPath, "foreign.invalid", {
      "x-forwarded-host": hostedHost,
      forwarded: `host=${hostedHost};proto=https`,
    });
    expect(forwarded.status).toBe(403);
    const hosted = env[`${variable}_EXTERNAL_ORIGIN`] === hostedOrigin;
    expect((await fetchAs(origin, healthPath, hostedHost)).status).toBe(hosted ? 200 : 403);
    await check(origin);
  } finally {
    server.kill("SIGTERM");
  }
  const exitCode = await server.exited;
  // Windows has no SIGTERM; the platform terminates the process instead.
  if (process.platform !== "win32") expect(exitCode).toBe(0);
}

/** The script of Bun's client that the development page names. */
async function clientScript(origin: string, host: string): Promise<string> {
  const page = await fetchAs(origin, "/", host);
  expect(page.status).toBe(200);
  const html = await page.text();
  expect(html).toContain('id="root"');
  const script = html.match(/\/_bun\/client\/[^"]+\.js/)?.[0];
  if (!script) throw new Error("the development page names no script of Bun's client");
  return script;
}

/**
 * Opens Bun's hot-reload socket through the App's listener as a page of
 * `pageOrigin` would; true when its first message arrives, false when the
 * handshake is refused.
 */
function hotReloadAnswers(origin: string, pageOrigin: string): Promise<boolean> {
  return new Promise((settle) => {
    const socket = new WebSocket(`${origin.replace(/^http/, "ws")}/_bun/hmr`, {
      headers: { origin: pageOrigin },
    });
    const finish = (answered: boolean) => {
      clearTimeout(timer);
      socket.close();
      settle(answered);
    };
    const timer = setTimeout(() => finish(false), 10_000);
    socket.addEventListener("message", () => finish(true));
    socket.addEventListener("error", () => finish(false));
    socket.addEventListener("close", () => finish(false));
  });
}

/** A request to the App on loopback that names `host` in its Host header. */
function fetchAs(
  origin: string,
  path: string,
  host: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${origin}${path}`, { headers: { ...headers, host }, redirect: "manual" });
}

async function firstResponse(url: string, timeoutMs: number): Promise<Response> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(url, { redirect: "manual" }).catch(() => null);
    if (response) return response;
    await Bun.sleep(200);
  }
  throw new Error(`${url} did not answer within ${timeoutMs} ms`);
}

function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() =>
        address && typeof address === "object"
          ? resolvePort(address.port)
          : reject(new Error("no free port")),
      );
    });
  });
}
