import { afterAll, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

// docs/adoption.md, "Empty start": what an Organization removes to start with
// an empty library. The test makes a fresh checkout of the tree without these
// paths (Git keeps no empty directory, so only tracked files are copied) and
// runs the whole suite there. The run inside sets CHILD and skips this test.
const EMPTY_START_REMOVES = [
  "data/v1/decks/2026-10-11-project-proposal",
  "app/v1/public/previews/2026-10-11-project-proposal.jpg",
  "app/v1/tests/template-seed.test.ts",
];
const CHILD = "PRESENTATIONS_EMPTY_START_CHILD";
const root = resolve(import.meta.dir, "..", "..", "..");
const work = mkdtempSync(join(realpathSync.native(tmpdir()), "presentations-empty-"));
const modules = join(work, "app", "v1", "node_modules");

afterAll(() => {
  if (existsSync(modules)) unlinkSync(modules);
  rmSync(work, { recursive: true, force: true });
});

test.skipIf(process.env[CHILD] === "1")(
  "an empty start as docs/adoption.md describes it passes the checks on a fresh checkout",
  () => {
    const adoption = readFileSync(join(root, "docs/adoption.md"), "utf8");
    for (const path of EMPTY_START_REMOVES) expect(adoption, path).toContain(path);

    const listed = Bun.spawnSync(["git", "-c", "core.quotePath=false", "ls-files", "-z"], {
      cwd: root,
      stdout: "pipe",
    });
    const removed = (file: string) =>
      EMPTY_START_REMOVES.some((path) => file === path || file.startsWith(`${path}/`));
    for (const file of listed.stdout.toString().split("\0").filter(Boolean)) {
      if (removed(file) || !existsSync(join(root, file))) continue;
      mkdirSync(dirname(join(work, file)), { recursive: true });
      cpSync(join(root, file), join(work, file));
    }
    Bun.spawnSync(["git", "init", "-q"], { cwd: work });
    Bun.spawnSync(["git", "add", "-A"], { cwd: work });
    // The library's directory survives the removal only through its .gitkeep.
    expect(existsSync(join(work, "data", "v1", "decks", ".gitkeep"))).toBe(true);

    symlinkSync(
      join(root, "app", "v1", "node_modules"),
      modules,
      process.platform === "win32" ? "junction" : "dir",
    );
    const run = Bun.spawnSync([process.execPath, "test", "tests"], {
      cwd: join(work, "app", "v1"),
      env: { ...process.env, [CHILD]: "1" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = `${run.stdout.toString()}\n${run.stderr.toString()}`;
    expect(run.exitCode, output).toBe(0);
    expect(output).toMatch(/\b0 fail\b/);
    expect(output).toMatch(/\b[1-9]\d* pass\b/);
    expect(output).not.toContain("template-seed");
  },
  240_000,
);
