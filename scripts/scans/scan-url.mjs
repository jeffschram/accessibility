import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const url = process.argv[2];

if (!url) {
  console.error("Usage: npm run scan:url -- https://example.com");
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

try {
  await page.goto(url, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();

  console.log(
    JSON.stringify(
      {
        url,
        scannedAt: new Date().toISOString(),
        violations: results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          tags: violation.tags,
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        })),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
