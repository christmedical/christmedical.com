#!/usr/bin/env node
/**
 * Capture left nav rail at a given viewport width.
 * Usage: node scripts/capture-nav-rail-screenshot.mjs <width> <output.png>
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const width = Number.parseInt(process.argv[2] ?? "", 10);
const outArg = process.argv[3];
if (!width || !outArg) {
  console.error("Usage: node scripts/capture-nav-rail-screenshot.mjs <width> <output.png>");
  process.exit(1);
}

const url = process.env.NAV_URL ?? "http://localhost:3000/queue";
const out = path.isAbsolute(outArg) ? outArg : path.resolve(process.cwd(), outArg);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForSelector('aside[aria-label="Clinical workflow"]', { timeout: 30_000 });

const aside = page.locator('aside[aria-label="Clinical workflow"]');
await mkdir(path.dirname(out), { recursive: true });
await aside.screenshot({ path: out });
await browser.close();
console.log(`Saved ${out} (${width}px)`);
