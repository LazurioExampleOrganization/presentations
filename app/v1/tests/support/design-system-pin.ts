// The two supported ways a module pins its design system (docs/design-system.md,
// LazurioTemplates/design-system docs/adoption.md): the public template
// `github:<owner>/<repo>#v<semver>`, and an Organization's own, private design
// system `git+ssh://git@github.com/<owner>/<repo>.git#v<semver>`. Either way a
// released tag, and a bun.lock that pins it to one commit, in the format Bun
// 1.4.4 writes for that form. Never a branch, a bare commit, `file:` or a path.

const NAME = "[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?";
const TAG = "v\\d+\\.\\d+\\.\\d+";
const GITHUB = new RegExp(`^github:(${NAME})/(${NAME})#(${TAG})$`);
const SSH = new RegExp(`^git\\+ssh://git@github\\.com/(${NAME})/(${NAME})\\.git#(${TAG})$`);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");

export type DesignSystemPin = {
  form: "github" | "git+ssh";
  owner: string;
  repo: string;
  tag: string;
};

/** The pin of `dependencies["design-system"]`, or null when it is no supported form. */
export function parseDesignSystemPin(spec: string | undefined): DesignSystemPin | null {
  const github = spec ? GITHUB.exec(spec) : null;
  if (github?.[1] && github[2] && github[3]) {
    return { form: "github", owner: github[1], repo: github[2], tag: github[3] };
  }
  const ssh = spec ? SSH.exec(spec) : null;
  if (ssh?.[1] && ssh[2] && ssh[3]) {
    return { form: "git+ssh", owner: ssh[1], repo: ssh[2], tag: ssh[3] };
  }
  return null;
}

/** What is wrong with the design system's pin and its lock; empty when both hold. */
export function designSystemPinProblems(spec: string | undefined, lock: string): string[] {
  const pin = parseDesignSystemPin(spec);
  if (!pin) {
    return [
      `dependencies["design-system"] is ${JSON.stringify(spec)}; it must be ` +
        "github:<owner>/<repo>#v<semver> or git+ssh://git@github.com/<owner>/<repo>.git#v<semver>",
    ];
  }
  const problems: string[] = [];
  if (!lock.includes(`"design-system": ${JSON.stringify(spec)}`)) {
    problems.push(`bun.lock does not record the dependency ${spec}; run bun install`);
  }
  const owner = escapeRegExp(pin.owner);
  const repo = escapeRegExp(pin.repo);
  const entry =
    pin.form === "github"
      ? // github: the tag's object, the tarball's directory and its sha512.
        new RegExp(
          `"design-system": \\["design-system@github:${owner}/${repo}#[0-9a-f]{7,40}", \\{[^\\n]*\\}, "[^"\\n]+", "sha512-[A-Za-z0-9+/=]+"\\]`,
        )
      : // git+ssh: the full commit of the tag, twice.
        new RegExp(
          `"design-system": \\["design-system@git\\+ssh://git@github\\.com/${owner}/${repo}\\.git#([0-9a-f]{40})", \\{[^\\n]*\\}, "\\1"\\]`,
        );
  if (!entry.test(lock)) {
    problems.push(`bun.lock does not pin ${spec} to one commit in the form Bun writes for it`);
  }
  return problems;
}
