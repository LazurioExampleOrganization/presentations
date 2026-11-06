import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import packageJson from "../package.json";

// The start contract of the Lazurio Module Standard. Lazurio runs `dev_script`
// for a development run and, from `main`, `build_script` and then
// `start_script` with NODE_ENV=production and the installed client build in
// LAZURIO_RUNTIME_BUILD_OUTPUT. Each run gets only bun on PATH and the
// listener environment; without it the App refuses to start, with it the
// declared health path answers 200 directly (the probe does not follow
// redirects), a foreign Host is refused and SIGTERM ends the App with exit 0.
const app = resolve(import.meta.dir, "..");
const runtime = packageJson.lazurio.runtime;
const [entrypoint] = runtime.listeners;
if (!entrypoint) throw new Error("lazurio.runtime declares no listener");
const variable = `LAZURIO_RUNTIME_LISTENER_${entrypoint.id.toUpperCase().replaceAll("-", "_")}`;
const baseEnv = { HOME: process.env.HOME ?? "", PATH: dirname(process.execPath) };
const startTimeoutMs = 60_000;
const starterSlug = "2026-10-11-project-proposal";
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
    "development run: health, the client bundled by Bun, public files and decks",
    async () => {
      await withServer(runtime.dev_script, {}, async (origin) => {
        const page = await fetch(`${origin}/`);
        expect(page.status).toBe(200);
        expect(await page.text()).toContain('id="root"');
        expect((await fetch(`${origin}/lazurio/tokens.css`)).status).toBe(200);
        expect((await fetch(`${origin}/previews/${starterSlug}.jpg`)).status).toBe(200);
        expect((await fetch(`${origin}/decks/${starterSlug}/`)).status).toBe(200);
      });
    },
    startTimeoutMs + 30_000,
  );

  test(
    "built version: `build_script` writes `build_output`, `start_script` serves the installed build",
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
      expect(existsSync(join(output, "previews", `${starterSlug}.jpg`))).toBe(true);

      // Lazurio installs the build outside the checkout; a marker proves the
      // server reads that copy and not the package's own dist/.
      const installed = mkdtempSync(join(realpathSync.native(tmpdir()), "presentations-build-"));
      cleanup.push(installed);
      cpSync(output, installed, { recursive: true });
      writeFileSync(join(installed, "installed-marker.txt"), "installed build");

      await withServer(
        runtime.start_script,
        { NODE_ENV: "production", LAZURIO_RUNTIME_BUILD_OUTPUT: installed },
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
          expect((await fetch(`${origin}/previews/${starterSlug}.jpg`)).status).toBe(200);
          expect((await fetch(`${origin}/decks/${starterSlug}/`)).status).toBe(200);
        },
      );
    },
    startTimeoutMs + 120_000,
  );
});

/**
 * Starts `script` on a free loopback port, waits for health and checks what
 * every run must do (health 200 with the runtime context, foreign Host 403),
 * runs `check`, then stops the App with SIGTERM and expects exit 0.
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
    const url = `${origin}${entrypoint.health.path}`;
    const health = await firstResponse(url, startTimeoutMs);
    expect(health.status).toBe(200);
    const context = await health.json();
    expect(context.company).toBe(runtime.company);
    expect(context.module).toBe(runtime.module);
    const foreign = await fetch(url, {
      headers: { host: "foreign.invalid" },
      redirect: "manual",
    });
    expect(foreign.status).toBe(403);
    await check(origin);
  } finally {
    server.kill("SIGTERM");
  }
  expect(await server.exited).toBe(0);
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
