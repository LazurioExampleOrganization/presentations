import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * This checkout is the Marketplace template itself, not a module an
 * Organization adopted from it: its identity is still the placeholder the
 * adoption replaces (`lazurio.module.json` `company`). Tests of the template
 * alone (its placeholders, listing, screens, exact design system pin) skip
 * in an adopted module; everything else runs there too.
 */
export const IS_TEMPLATE =
  JSON.parse(readFileSync(resolve(import.meta.dir, "../../../../lazurio.module.json"), "utf8"))
    .company === "REPLACE-WITH-ORG-NAME";
