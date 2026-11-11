import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseDesignSystemPin } from "./design-system-pin.ts";

// What an adoption changes in a checkout, for the tests that check an
// adopted module (tests/adopted-copy.test.ts): the Organization's identity
// and its design system pin with the lock entry `bun install` writes for it.

const DEPENDENCY = /^(\s*)"design-system": "[^"\n]+",$/gm;
const ENTRY = /^(\s*)"design-system": (\[.*\]),$/gm;

/** JSON the way bun.lock writes one line: `{ "a": 1 }`, `["a", "b"]`. */
function inline(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (value && typeof value === "object") {
    const fields = Object.entries(value).map(
      ([key, item]) => `${JSON.stringify(key)}: ${inline(item)}`,
    );
    return `{ ${fields.join(", ")} }`;
  }
  return JSON.stringify(value);
}

/**
 * The lock after `bun install` for a new `git+ssh` pin of the design system,
 * whatever the lock pinned before (`github:` or `git+ssh`): the workspace's
 * dependency and the package's entry with the tag's full `commit`, keeping
 * the entry's peer metadata. Throws when the lock has no single such entry.
 */
export function repinDesignSystem(lock: string, spec: string, commit: string): string {
  const pin = parseDesignSystemPin(spec);
  if (pin?.form !== "git+ssh") throw new Error(`${spec}: only a git+ssh pin is written here`);
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`${commit}: not a full commit`);
  const dependencies = [...lock.matchAll(DEPENDENCY)];
  const entries = [...lock.matchAll(ENTRY)];
  if (dependencies.length !== 1 || entries.length !== 1) {
    throw new Error(
      `bun.lock has ${dependencies.length} design-system dependencies and ${entries.length} entries; expected one each`,
    );
  }
  const [, , array] = entries[0] as RegExpMatchArray;
  const [, metadata] = JSON.parse(array as string) as [string, unknown, ...unknown[]];
  const url = `git+ssh://git@github.com/${pin.owner}/${pin.repo}.git`;
  return lock
    .replace(
      DEPENDENCY,
      (_line, indent: string) => `${indent}"design-system": ${JSON.stringify(spec)},`,
    )
    .replace(
      ENTRY,
      (_line, indent: string) =>
        `${indent}"design-system": ${inline([`design-system@${url}#${commit}`, metadata, commit])},`,
    );
}

/** Gives a checkout the Organization's identity and its design system pin over SSH. */
export function adopt(
  root: string,
  options: { organization: string; slug: string; spec: string; commit: string },
): void {
  const { organization, slug, spec, commit } = options;
  const manifestPath = join(root, "lazurio.module.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.company = organization;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const app = join(root, "app", "v1");
  const packagePath = join(app, "package.json");
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  pkg.lazurio.runtime.company = organization;
  pkg.lazurio.runtime.id = `${slug}-presentations-v1`;
  pkg.dependencies["design-system"] = spec;
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

  const lockPath = join(app, "bun.lock");
  writeFileSync(lockPath, repinDesignSystem(readFileSync(lockPath, "utf8"), spec, commit));
}
