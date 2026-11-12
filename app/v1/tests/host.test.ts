import { describe, expect, test } from "bun:test";
import { allowedHosts } from "@lazurio/module-kit";
import { hostAllowed, hostnameOf, originAllowed } from "../src/host.ts";

// Which requests the App answers: loopback always, the hostname of the
// external origin only when Lazurio hosts the listener, never what a forwarded
// header claims, and only a Host that is exactly `host[:port]`.
// `tests/start.test.ts` checks the same against the running server.
const listenerEnv = {
  LAZURIO_RUNTIME_LISTENER_WEB_HOST: "127.0.0.1",
  LAZURIO_RUNTIME_LISTENER_WEB_PORT: "4100",
};
const hostedOrigin = "https://presentations.example.test";
const local = new Set(allowedHosts("web", listenerEnv));
const hosted = new Set(
  allowedHosts("web", {
    ...listenerEnv,
    LAZURIO_RUNTIME_LISTENER_WEB_EXTERNAL_ORIGIN: hostedOrigin,
  }),
);

function request(headers: Record<string, string>): Request {
  return new Request("http://127.0.0.1:4100/api/health", { headers });
}

describe("hostnameOf", () => {
  test("reads host[:port] and [IPv6][:port]", () => {
    expect(hostnameOf("localhost")).toBe("localhost");
    expect(hostnameOf("LOCALHOST:4100")).toBe("localhost");
    expect(hostnameOf("presentations.example.test:443")).toBe("presentations.example.test");
    expect(hostnameOf("127.0.0.1:65535")).toBe("127.0.0.1");
    expect(hostnameOf("[::1]")).toBe("::1");
    expect(hostnameOf("[::1]:4100")).toBe("::1");
  });

  test("refuses userinfo, a path, a query, a fragment and a bad port", () => {
    for (const value of [
      "attacker.invalid@localhost",
      "localhost@attacker.invalid",
      "user:pass@localhost:4100",
      "localhost/path",
      "localhost:4100/path",
      "localhost?query",
      "localhost#fragment",
      "localhost:",
      "localhost:http",
      "localhost:65536",
      "localhost:4100:4100",
      "localhost\\attacker.invalid",
      " localhost",
      "localhost ",
      "[::1",
      "::1",
      "[::1]x",
      "[localhost]",
      "",
    ]) {
      expect(hostnameOf(value), JSON.stringify(value)).toBeNull();
    }
  });
});

describe("hostAllowed", () => {
  test("a local run answers loopback, with or without a port", () => {
    for (const host of [
      "127.0.0.1:4100",
      "127.0.0.1",
      "localhost:4100",
      "LOCALHOST",
      "[::1]:4100",
      "[::1]",
    ]) {
      expect(hostAllowed(request({ host }), local), host).toBe(true);
    }
  });

  test("a local run refuses every other host, the hosted name included", () => {
    for (const host of [
      "presentations.example.test",
      "foreign.invalid",
      "127.0.0.2",
      "x.localhost",
      "0.0.0.0",
    ]) {
      expect(hostAllowed(request({ host }), local), host).toBe(false);
    }
  });

  test("a hosted run answers its external origin's hostname and loopback", () => {
    for (const host of [
      "presentations.example.test",
      "Presentations.Example.Test",
      "presentations.example.test:443",
      "127.0.0.1:4100",
      "localhost",
      "[::1]:4100",
    ]) {
      expect(hostAllowed(request({ host }), hosted), host).toBe(true);
    }
  });

  test("a hosted run refuses look-alikes of its hostname", () => {
    for (const host of [
      "example.test",
      "other.example.test",
      "presentations.example.test.",
      "presentations.example.test.attacker.invalid",
      "attacker.invalid.presentations.example.test",
      "foreign.invalid",
    ]) {
      expect(hostAllowed(request({ host }), hosted), host).toBe(false);
    }
  });

  test("a Host that only parses as an allowed name is refused", () => {
    for (const host of [
      "attacker.invalid@localhost",
      "attacker.invalid@presentations.example.test",
      "presentations.example.test@attacker.invalid",
      "localhost/path",
      "presentations.example.test/path",
      "localhost?x",
      "localhost#x",
      "localhost:",
    ]) {
      expect(hostAllowed(request({ host }), hosted), host).toBe(false);
      expect(hostAllowed(request({ host }), local), host).toBe(false);
    }
  });

  test("forwarded headers never allow a foreign Host", () => {
    const spoofed = request({
      host: "foreign.invalid",
      "x-forwarded-host": "presentations.example.test",
      forwarded: "host=presentations.example.test;proto=https",
      "x-forwarded-for": "127.0.0.1",
    });
    expect(hostAllowed(spoofed, hosted)).toBe(false);
    expect(hostAllowed(spoofed, local)).toBe(false);
  });

  test("a missing or malformed Host is refused", () => {
    const missing = new Request("http://127.0.0.1:4100/api/health");
    missing.headers.delete("host");
    expect(hostAllowed(missing, hosted)).toBe(false);
    expect(hostAllowed(request({ host: "" }), hosted)).toBe(false);
    expect(hostAllowed(request({ host: "[::1" }), hosted)).toBe(false);
  });
});

describe("originAllowed", () => {
  test("a request without Origin is not a browser's cross-origin request", () => {
    expect(originAllowed(request({}), local)).toBe(true);
  });

  test("a page of an allowed host", () => {
    expect(originAllowed(request({ origin: hostedOrigin }), hosted)).toBe(true);
    expect(originAllowed(request({ origin: "http://localhost:4100" }), hosted)).toBe(true);
    expect(originAllowed(request({ origin: "http://[::1]:4100" }), local)).toBe(true);
  });

  test("a page elsewhere, an opaque origin or a malformed one is refused", () => {
    for (const origin of [
      "https://attacker.invalid",
      "https://presentations.example.test.attacker.invalid",
      "null",
      "presentations.example.test",
      "https://presentations.example.test/path",
      "https://attacker.invalid@presentations.example.test",
      "file://localhost",
      "https://",
    ]) {
      expect(originAllowed(request({ origin }), hosted), origin).toBe(false);
    }
    // The hosted page is foreign to a local run.
    expect(originAllowed(request({ origin: hostedOrigin }), local)).toBe(false);
  });
});
