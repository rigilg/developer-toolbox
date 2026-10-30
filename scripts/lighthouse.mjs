import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";

const base = process.env.BASE_URL || "https://toolbox.rigilgilbert.com";
const output = "docs/qa/lighthouse";
mkdirSync(output, { recursive: true });
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
try {
  for (const [page, path] of [
    ["home", "/"],
    ["json-formatter", "/tools/json-formatter"],
  ]) {
    for (const device of ["mobile", "desktop"]) {
      const report = await lighthouse(
        base + path,
        {
          port: chrome.port,
          output: ["html", "json"],
          onlyCategories: [
            "performance",
            "accessibility",
            "best-practices",
            "seo",
          ],
        },
        device === "desktop"
          ? {
              extends: "lighthouse:default",
              settings: {
                formFactor: "desktop",
                screenEmulation: {
                  mobile: false,
                  width: 1350,
                  height: 940,
                  deviceScaleFactor: 1,
                  disabled: false,
                },
                throttling: {
                  rttMs: 40,
                  throughputKbps: 10240,
                  cpuSlowdownMultiplier: 1,
                  requestLatencyMs: 0,
                  downloadThroughputKbps: 0,
                  uploadThroughputKbps: 0,
                },
              },
            }
          : undefined,
      );
      for (const [index, ext] of ["html", "json"].entries())
        writeFileSync(
          `${output}/${page}-${device}.${ext}`,
          report.report[index],
        );
      if (report.lhr.runtimeError)
        throw Error(`${page}/${device}: ${report.lhr.runtimeError.message}`);
      const scores = Object.fromEntries(
        Object.entries(report.lhr.categories).map(([k, v]) => [
          k,
          v.score === null ? null : Math.round(v.score * 100),
        ]),
      );
      const metrics = Object.fromEntries(
        [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
        ].map((k) => [
          k,
          {
            value: report.lhr.audits[k].numericValue,
            display: report.lhr.audits[k].displayValue,
          },
        ]),
      );
      const issues = Object.values(report.lhr.audits)
        .filter(
          (a) =>
            a.score !== null &&
            a.score < 1 &&
            !["notApplicable", "informative", "manual"].includes(
              a.scoreDisplayMode,
            ),
        )
        .map((a) => ({
          id: a.id,
          title: a.title,
          score: a.score,
          display: a.displayValue,
          savings: a.metricSavings,
          details: a.details,
        }));
      const result = {
        page,
        device,
        url: base + path,
        fetchedAt: report.lhr.fetchTime,
        lighthouseVersion: report.lhr.lighthouseVersion,
        scores,
        metrics,
        issues,
      };
      results.push(result);
      console.log(
        "LIGHTHOUSE_RESULT " +
          JSON.stringify({
            ...result,
            issues: issues.map((issue) => ({
              id: issue.id,
              title: issue.title,
              score: issue.score,
              display: issue.display,
              savings: issue.savings,
            })),
          }),
      );
    }
  }
} finally {
  await chrome.kill();
  writeFileSync(
    `${output}/results.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = results.map(
      (r) =>
        `| ${r.page} | ${r.device} | ${Object.values(r.scores).join(" | ")} |`,
    );
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        "## Production Lighthouse audit",
        "",
        "| Page | Device | Performance | Accessibility | Best practices | SEO |",
        "| --- | --- | --- | --- | --- | --- |",
        ...rows,
        "",
        "Single lab runs; scores vary with network and machine load. Full reports are attached as workflow artifacts.",
        "",
      ].join("\n"),
    );
  }
}
