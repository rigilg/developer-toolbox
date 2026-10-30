// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import {
  validateHostname,
  publicAddress,
} from "../src/lib/security/certificate";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/certificate/route";
import { getRunner } from "../src/lib/tools/runner";
describe("certificate diagnostic boundary", () => {
  it("accepts public DNS names", () =>
    expect(validateHostname("Example.COM")).toBe("example.com"));
  it.each([
    "localhost",
    "127.0.0.1",
    "[::1]",
    "https://example.com",
    "example.com:443",
    "example.com/path",
    "a.local",
    "a.internal",
    "x.localhost",
  ])("rejects %s", (value) => expect(() => validateHostname(value)).toThrow());
  it.each([
    "127.0.0.1",
    "10.1.1.1",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "224.0.0.1",
    "100.64.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "192.0.2.1",
  ])("blocks reserved/private %s", (value) =>
    expect(publicAddress(value)).toBe(false),
  );
  it("accepts globally routable IPv4/IPv6", () => {
    expect(publicAddress("1.1.1.1")).toBe(true);
    expect(publicAddress("2606:4700:4700::1111")).toBe(true);
  });
  it("rejects cross-origin requests", async () => {
    const r = await POST(
      new NextRequest("https://toolbox.example/api/certificate", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
        body: '{"hostname":"example.com"}',
      }),
    );
    expect(r.status).toBe(403);
  });
  it("returns errors without making private connections", async () => {
    const r = await POST(
      new NextRequest("https://toolbox.example/api/certificate", {
        method: "POST",
        body: '{"hostname":"127.0.0.1"}',
      }),
    );
    expect(r.status).toBe(400);
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
  it("client runner returns a certificate result", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          hostname: "example.com",
          chain: [{ subject: { CN: "example.com" } }],
        }),
      ),
    );
    const runner = await getRunner("ssl-certificate-inspector");
    expect((await runner("example.com", {}, "")).text).toContain("chain");
    fetch.mockRestore();
  });
  it("client runner surfaces errors", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"error":"blocked"}', { status: 400 }));
    const runner = await getRunner("ssl-certificate-inspector");
    await expect(runner("localhost", {}, "")).rejects.toThrow("blocked");
    fetch.mockRestore();
  });
});
