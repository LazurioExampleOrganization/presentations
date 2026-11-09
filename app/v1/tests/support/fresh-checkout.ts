import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

/** Set in a suite run inside a fresh checkout, so the tests that make one skip there. */
export const NESTED_RUN = "PRESENTATIONS_NESTED_RUN";
export const IS_NESTED_RUN = process.env[NESTED_RUN] === "1";

const ROOT = resolve(import.meta.dir, "..", "..", "..", "..");

/**
 * A fresh checkout of the tracked tree in a temporary directory, as a clone
 * has it (Git keeps no empty directory), without the `remove`d paths. Its
 * `app/v1/node_modules` links to this checkout's installed packages.
 */
export function freshCheckout(prefix: string, remove: readonly string[] = []) {
  const work = mkdtempSync(join(realpathSync.native(tmpdir()), `${prefix}-`));
  const removed = (file: string) =>
    remove.some((path) => file === path || file.startsWith(`${path}/`));
  const listed = Bun.spawnSync(["git", "-c", "core.quotePath=false", "ls-files", "-z"], {
    cwd: ROOT,
    stdout: "pipe",
  });
  for (const file of listed.stdout.toString().split("\0").filter(Boolean)) {
    if (removed(file) || !existsSync(join(ROOT, file))) continue;
    mkdirSync(dirname(join(work, file)), { recursive: true });
    cpSync(join(ROOT, file), join(work, file));
  }
  const app = join(work, "app", "v1");
  const modules = join(app, "node_modules");
  symlinkSync(
    join(ROOT, "app", "v1", "node_modules"),
    modules,
    process.platform === "win32" ? "junction" : "dir",
  );
  return {
    root: work,
    app,
    /** Records the tree in Git (the tests read `git ls-files`) and runs the whole suite there. */
    runSuite(): { exitCode: number; output: string } {
      Bun.spawnSync(["git", "init", "-q"], { cwd: work });
      Bun.spawnSync(["git", "add", "-A"], { cwd: work });
      const run = Bun.spawnSync([process.execPath, "test", "tests"], {
        cwd: app,
        env: { ...process.env, [NESTED_RUN]: "1" },
        stdout: "pipe",
        stderr: "pipe",
      });
      return { exitCode: run.exitCode, output: `${run.stdout}\n${run.stderr}` };
    },
    dispose() {
      if (existsSync(modules)) unlinkSync(modules);
      rmSync(work, { recursive: true, force: true });
    },
  };
}
