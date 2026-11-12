/**
 * The Organization's own settings of Presentations. An adopting Organization
 * changes them in a pull request of its own (`docs/adoption.md`).
 */
export const instance: { language: "cs" | "en" } = {
  /**
   * The language of the library when Lazurio names none: `cs` (the default)
   * or `en`. Lazurio passes no language in a Module's environment; where the
   * App's origin answers `/.lazurio/shell.json` (`lazurio.shell.v1`), its
   * `locale` wins. The agent that adopts the template sets this from the
   * language of the Organization's Lazurio, the `locale` of the Folder profile
   * (Settings → General), and the person confirms it.
   */
  language: "en",
};
