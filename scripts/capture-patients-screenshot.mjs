#!/usr/bin/env node
/**
 * Capture /patients at desktop width with a patient selected.
 * Usage: node scripts/capture-patients-screenshot.mjs <output.png>
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const out = process.argv[2];
if (!out) {
  console.error("Usage: node scripts/capture-patients-screenshot.mjs <output.png>");
  process.exit(1);
}

const url = process.env.PATIENTS_URL ?? "http://localhost:3000/patients";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });

// Wait for table or empty state
await page.waitForSelector("table tbody tr, text=No patients returned", {
  timeout: 30_000,
});

const row = page.locator("table tbody tr").first();
if ((await row.count()) > 0) {
  await row.click();
  await page.waitForSelector("text=Clinical notes", { timeout: 10_000 });
}

await mkdir(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`Saved ${out}`);
