import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { tools } from "../../src/config/tools";
import { SignJWT, generateKeyPair, exportJWK } from "jose";
import { createHmac } from "node:crypto";
test("directory search, navigation and theme", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every developer tool.",
  );
  await page.getByLabel("Search utilities").fill("Base64");
  await page.getByRole("link", { name: /Base64 Encoder/ }).click();
  await expect(page).toHaveURL(/\/tools\/base64$/);
  await page.getByLabel("Toggle color theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("format, clear, download and clipboard", async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === "chromium")
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/json-formatter");
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: /Run tool/ }).click();
  await expect(page.getByRole("region", { name: "Tool output" })).toContainText(
    "Ada",
  );
  await page.getByLabel("Copy output").click();
  await expect(page.getByText("Copied to clipboard")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByLabel("Download output").click();
  expect((await download).suggestedFilename()).toBe("json-formatter.json");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByLabel("Input")).toHaveValue("");
});
test("local processing does not transmit or persist sensitive input", async ({
  page,
}) => {
  await page.goto("/tools/base64");
  const sent: string[] = [];
  page.on("request", (r) => {
    if (
      (r.postData() || "").includes("secret-sentinel") ||
      r.url().includes("secret-sentinel")
    )
      sent.push(r.url());
  });
  await page.getByLabel("Input").fill("secret-sentinel");
  await page.getByRole("button", { name: /Run tool/ }).click();
  await expect(page.getByRole("region", { name: "Tool output" })).toContainText(
    "c2VjcmV0LXNlbnRpbmVs",
  );
  expect(sent).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "secret-sentinel",
  );
});
test("regex computation is isolated and times out", async ({ page }) => {
  await page.goto("/tools/regex-tester");
  await page.getByLabel("Input", { exact: true }).fill("a".repeat(60) + "!");
  await page.getByLabel("Regular expression").fill("(a+)+$");
  await page.getByLabel("Flags", { exact: true }).fill("");
  await page.getByRole("button", { name: /Run tool/ }).click();
  await expect(page.locator(".error-message")).toContainText("500 ms");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByLabel("Input", { exact: true })).toHaveValue("");
});
test("all dedicated tool routes render and remain within viewport", async ({
  page,
}) => {
  for (const t of tools) {
    await page.goto("/tools/" + t.slug);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("homepage and workbench meet automated accessibility checks", async ({
  page,
}) => {
  for (const path of ["/", "/tools/json-formatter", "/tools/jwt-verifier"]) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
test("certificate endpoint rejects local destinations", async ({ request }) => {
  const r = await request.post("/api/certificate", {
    data: { hostname: "127.0.0.1" },
  });
  expect(r.status()).toBe(400);
  expect((await r.json()).error).toContain("public hostname");
});
test("every local utility produces a real result", async ({ page }) => {
  test.setTimeout(90000);
  const secret = "test-only-secret-with-32-characters";
  const jwt = await new SignJWT({ sub: "example", exp: 1893456000 })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));
  const pair = await generateKeyPair("RS256", { extractable: true });
  const jwk = JSON.stringify(await exportJWK(pair.publicKey));
  for (const tool of tools.filter((t) => !t.remote)) {
    await page.goto("/tools/" + tool.slug);
    await page.getByRole("button", { name: "Load example" }).click();
    if (tool.slug === "jwt-verifier") {
      await page.getByLabel("Input", { exact: true }).fill(jwt);
      await page.getByLabel("HMAC secret or public PEM key").fill(secret);
    }
    if (tool.slug === "jwk-pem-converter")
      await page.getByLabel("Input", { exact: true }).fill(jwk);
    if (tool.slug === "webhook-signature-verifier") {
      await page.getByLabel("Secret", { exact: true }).fill(secret);
      await page
        .getByLabel("Expected signature")
        .fill(createHmac("sha256", secret).update("hello").digest("hex"));
    }
    await page.getByRole("button", { name: /^(Run tool|Generate)/ }).click();
    await expect(
      page.getByRole("region", { name: "Tool output" }),
    ).not.toContainText("Your result will appear here");
    await expect(page.locator(".error-message")).toHaveCount(0);
  }
});
test("hashes a local file with a known result", async ({ page }) => {
  await page.goto("/tools/hash-generator");
  await page
    .getByLabel("File to hash")
    .setInputFiles({
      name: "fixture.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("abc"),
    });
  await page.getByRole("button", { name: /Run tool/ }).click();
  await expect(page.getByRole("region", { name: "Tool output" })).toContainText(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});
