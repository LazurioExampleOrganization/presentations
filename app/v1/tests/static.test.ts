import { afterAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DIST_DIR } from "../src/paths.ts";
import { clientDirectory, createStaticHandler } from "../src/static.ts";

const root = mkdtempSync(join(realpathSync.native(tmpdir()), "presentations-static-"));
mkdirSync(join(root, "assets"));
writeFileSync(join(root, "index.html"), "<div id=root></div>");
writeFileSync(join(root, "assets", "app-1a2b.js"), "console.log(1)");
writeFileSync(join(resolve(root, ".."), `${root.split(/[\\/]/).pop()}-outside.txt`), "outside");

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(`${root}-outside.txt`, { force: true });
});

test("the client build comes from LAZURIO_RUNTIME_BUILD_OUTPUT, else the package's dist/", () => {
  expect(clientDirectory({ LAZURIO_RUNTIME_BUILD_OUTPUT: root })).toBe(root);
  expect(clientDirectory({})).toBe(DIST_DIR);
});

test("serves files of its root with caching by kind", async () => {
  const serve = createStaticHandler(root, { spa: true });
  const index = await serve("/");
  expect(await index?.text()).toContain("root");
  expect(index?.headers.get("cache-control")).toBe("no-cache");
  const asset = await serve("/assets/app-1a2b.js");
  expect(asset?.headers.get("cache-control")).toContain("immutable");
});

test("falls back to index.html only for extensionless paths, and only with spa", async () => {
  const spa = createStaticHandler(root, { spa: true });
  expect((await spa("/library/deck"))?.status).toBe(200);
  expect(await spa("/missing.css")).toBeNull();
  const files = createStaticHandler(root, { spa: false });
  expect(await files("/library/deck")).toBeNull();
});

test("never leaves its root", async () => {
  const serve = createStaticHandler(root, { spa: false });
  const name = root.split(/[\\/]/).pop();
  for (const path of [`/../${name}-outside.txt`, `/..%2f${name}-outside.txt`, "/%E0%A4%A"]) {
    expect(await serve(path), path).toBeNull();
  }
});
