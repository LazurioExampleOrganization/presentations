import { describe, expect, test } from "bun:test";
import { allowedHosts } from "@lazurio/module-kit";
import { hostAllowed } from "../src/host.ts";

// Which Host the App answers: loopback always, the hostname of the external
// origin only when Lazurio hosts the listener, never what a forwarded header
// claims. `tests/start.test.ts` checks the same against the running server.
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
    for (const host of ["presentations.example.test", "foreign.invalid", "127.0.0.2"]) {
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
      "presentations.example.test.attacker.invalid",
      "attacker.invalid.presentations.example.test",
      "presentations.example.test@attacker.invalid",
      "foreign.invalid",
    ]) {
      expect(hostAllowed(request({ host }), hosted), host).toBe(false);
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
