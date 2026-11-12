/**
 * Which requests the App answers (Lazurio Module Standard).
 *
 * `hosts` is module-kit's `allowedHosts()`: loopback, plus the hostname of the
 * listener's external origin (`LAZURIO_RUNTIME_LISTENER_<ID>_EXTERNAL_ORIGIN`)
 * when Lazurio hosts the App. The hosted gateway passes the browser's own
 * `Host` through to the App, so the module's address arrives here as itself.
 *
 * Only the request's own `Host` (and, for the development client, `Origin`)
 * counts. Forwarded headers (`X-Forwarded-Host`, `Forwarded`) are written by
 * whoever sends the request and never widen the set.
 */

// `host[":" port]` or `"[" IPv6 "]" [":" port]`: a hostname of letters, digits,
// dots and hyphens, an IPv6 address in brackets, an optional port of digits.
// Userinfo, a path, a query, a fragment, an empty port or anything else is not
// a Host value.
const AUTHORITY = /^(?:\[([0-9A-Fa-f:.]+)\]|([A-Za-z0-9.-]+))(?::([0-9]{1,5}))?$/;

/** The hostname of a `host[:port]` value, lower-cased and without IPv6
 * brackets, or null when the value is not exactly that. */
export function hostnameOf(authority: string): string | null {
  const match = AUTHORITY.exec(authority);
  if (!match) return null;
  const port = match[3];
  if (port !== undefined && Number(port) > 65_535) return null;
  return (match[1] ?? match[2] ?? "").toLowerCase();
}

/** Whether the request's `Host` names one of `hosts`; a missing or malformed
 * `Host` is refused. */
export function hostAllowed(request: Request, hosts: ReadonlySet<string>): boolean {
  const header = request.headers.get("host");
  if (header === null) return false;
  const hostname = hostnameOf(header);
  return hostname !== null && hosts.has(hostname);
}

/** Whether the request's `Origin`, when it has one, is a page of one of
 * `hosts`. A browser sends `Origin` on WebSocket handshakes and on scripted
 * requests; a page elsewhere (or an opaque `null` origin) is refused, a
 * request without `Origin` is not a browser's cross-origin request. */
export function originAllowed(request: Request, hosts: ReadonlySet<string>): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  const match = /^https?:\/\/(.*)$/.exec(origin);
  if (!match?.[1]) return false;
  const hostname = hostnameOf(match[1]);
  return hostname !== null && hosts.has(hostname);
}
