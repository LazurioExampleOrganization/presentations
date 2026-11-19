import { describe, expect, test } from "bun:test";
import { formatDay } from "../src/ui-app/format.ts";

describe("formatDay", () => {
  test("a calendar day is written in the interface's language", () => {
    expect(formatDay("2026-11-02", "cs")).toBe("2. 11. 2026");
    expect(formatDay("2026-11-02", "en")).toBe("2 Nov 2026");
  });

  test("anything else stays as written", () => {
    expect(formatDay("2026-11", "cs")).toBe("2026-11");
    expect(formatDay("2026-02-30", "cs")).toBe("2026-02-30");
    expect(formatDay("0099-11-02", "en")).toBe("0099-11-02");
    expect(formatDay("listopad 2026", "en")).toBe("listopad 2026");
  });
});
