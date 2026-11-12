import { expect, test } from "bun:test";
import packageJson from "../package.json";

// The built version from `main` (Module Standard): an App with its own server
// declares `start_script` and its client build, and the preparation never
// builds. Without these Lazurio would run the development server from `main`.
const { runtime, preparation } = packageJson.lazurio;
const scripts: Record<string, string> = packageJson.scripts;

test("declares the built version: start_script, build_script and build_output", () => {
  expect(runtime.start_script).toBe("start");
  expect(runtime.build_script).toBe("build");
  expect(runtime.build_output).toBe("dist");
  for (const name of [runtime.dev_script, runtime.start_script, runtime.build_script]) {
    expect(scripts[name], name).toBeString();
  }
  expect("static_fallback" in runtime).toBe(false);
});

test("start_script is one production process, not a development server or a build", () => {
  const start = scripts[runtime.start_script] ?? "";
  expect(start).toStartWith("bun --no-env-file run ");
  for (const forbidden of ["&&", "--hot", "--watch", "vite", "build", "NODE_ENV="]) {
    expect(start).not.toContain(forbidden);
  }
});

test("the preparation only checks; the client build is build_script's alone", () => {
  expect(preparation.check_script).toBe("check:prepared");
  expect("prepare_script" in preparation).toBe(false);
  expect(scripts[preparation.check_script]).not.toContain("vite");
  expect(scripts[runtime.build_script]).toContain("vite.js build");
});
