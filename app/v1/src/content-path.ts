import { posix } from "node:path";

export const DECKS_PREFIX = "/decks/";
export const EXPORTS_PREFIX = "/exports/";
/** The first slide of every deck, built into `public/previews/`: content too. */
export const PREVIEWS_PREFIX = "/previews/";

/**
 * The path a request means, as the file handlers read it: percent-decoded,
 * backslashes as slashes, dot segments and repeated slashes resolved. Every
 * decision about content is made on it, so an encoded variant of a content
 * path (`/%70reviews/…`) is content too. `null` when it does not decode.
 */
export function logicalPath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  return posix.normalize(`/${decoded.replaceAll("\\", "/")}`);
}

/** Whether a path is the Organization's content, which needs an application role. */
export function isContentPath(pathname: string): boolean {
  const logical = logicalPath(pathname);
  if (logical === null) return true;
  return (
    (logical.startsWith("/api/") && logical !== "/api/health") ||
    [DECKS_PREFIX, EXPORTS_PREFIX, PREVIEWS_PREFIX].some(
      (prefix) => logical.startsWith(prefix) || `${logical}/` === prefix,
    )
  );
}
