// Read-only readiness of the preparation (Module Standard, `check_script`):
// the packages the server and the client build need are installed. The
// client build itself is the Platform's `build_script`, never a preparation
// step. Exit 0 when prepared, 1 otherwise.
import { resolve } from "node:path";

const required = ["@lazurio/module-kit", "react", "react-dom", "vite", "@vitejs/plugin-react"];
const missing: string[] = [];
for (const name of required) {
  const manifest = resolve(import.meta.dir, "..", "node_modules", name, "package.json");
  if (!(await Bun.file(manifest).exists())) missing.push(name);
}
if (missing.length > 0) {
  console.error(
    `not prepared: ${missing.join(", ")} not installed; run \`bun install --frozen-lockfile\``,
  );
  process.exit(1);
}
