import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";

import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.BASE_URL || "http://localhost:3000";
mkdirSync("docs/qa", { recursive: true });
const browser = await chromium.launch({
  args: ["--remote-debugging-port=9222"],
});
for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base);
  await page.screenshot({ path: `docs/qa/home-${name}.png`, fullPage: true });
  await page.goto(base + "/tools/json-formatter");
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: /Run tool/ }).click();
  await page
    .getByRole("region", { name: "Tool output" })
    .getByText('"name"', { exact: true })
    .waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `docs/qa/tool-${name}.png`, fullPage: true });
  await page.close();
}

try {
  const summary = {};
  for (const [name, path] of [
    ["home", "/"],
    ["json-formatter", "/tools/json-formatter"],
  ]) {
    const report = await lighthouse(base + path, {
      port: 9222,
      output: "html",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    writeFileSync(`docs/qa/lighthouse-${name}.html`, report.report);
    summary[name] = report.lhr.runtimeError ? {error:report.lhr.runtimeError.message} : Object.fromEntries(
      Object.entries(report.lhr.categories).map(([k, v]) => [
        k,
        v.score===null?null:Math.round(v.score * 100),
      ]),
    );
  }
  writeFileSync("docs/qa/scores.json", JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
} finally {
  await browser.close();
}
