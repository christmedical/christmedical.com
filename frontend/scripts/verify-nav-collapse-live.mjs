#!/usr/bin/env node
/** Verify nav auto-collapses when viewport shrinks without reload. */
import { chromium } from "playwright";

const url = process.env.NAV_URL ?? "http://localhost:3000/queue";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });

const aside = page.locator('aside[aria-label="Clinical workflow"]');
const wideWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
const wideHasClinicalLabel = await page.getByText("Clinical", { exact: true }).isVisible();

await page.setViewportSize({ width: 800, height: 900 });
await page.waitForTimeout(400);

const narrowWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
const narrowHasClinicalLabel = await page.getByText("Clinical", { exact: true }).isVisible();
const searchVisible = await page.getByRole("button", { name: "Search patients" }).isVisible();

await browser.close();

console.log(JSON.stringify({ wideWidth, narrowWidth, wideHasClinicalLabel, narrowHasClinicalLabel, searchVisible }, null, 2));

if (wideWidth <= narrowWidth) throw new Error("Rail should be wider at 1440 than 800");
if (!wideHasClinicalLabel) throw new Error("Clinical section label should show at 1440");
if (narrowHasClinicalLabel) throw new Error("Clinical section label should hide at 800");
if (!searchVisible) throw new Error("Search button needs aria-label at 800");

console.log("Live resize check passed.");
