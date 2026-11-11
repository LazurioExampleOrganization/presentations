/**
 * Whether a request names a host the App answers (Lazurio Module Standard).
 *
 * `hosts` is module-kit's `allowedHosts()`: loopback, plus the hostname of the
 * listener's external origin (`LAZURIO_RUNTIME_LISTENER_<ID>_EXTERNAL_ORIGIN`)
 * when Lazurio hosts the App. The hosted gateway passes the browser's own
 * `Host` through to the App, so the module's address arrives here as itself.
 *
 * Only the request's `Host` header counts. Forwarded headers
 * (`X-Forwarded-Host`, `Forwarded`) are written by whoever sends the request
 * and never widen the set; a missing or malformed `Host` is refused.
 */
export function hostAllowed(request: Request, hosts: ReadonlySet<string>): boolean {
  const header = request.headers.get("host");
  if (header === null) return false;
  let hostname: string;
  try {
    hostname = new URL(`http://${header}`).hostname;
  } catch {
    return false;
  }
  return hosts.has(hostname.replace(/^\[(.*)\]$/, "$1"));
}
