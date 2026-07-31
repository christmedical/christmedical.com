"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { app, screen } = require("electron");

const DEFAULT_BOUNDS = { width: 1280, height: 800 };

/**
 * Persist BrowserWindow bounds across launches (no extra deps).
 */
function stateFilePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

/**
 * @returns {{ width: number, height: number, x?: number, y?: number }}
 */
function loadWindowState() {
  try {
    const raw = fs.readFileSync(stateFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.width === "number" &&
      typeof parsed.height === "number" &&
      parsed.width >= 400 &&
      parsed.height >= 300
    ) {
      return {
        width: Math.round(parsed.width),
        height: Math.round(parsed.height),
        ...(typeof parsed.x === "number" ? { x: Math.round(parsed.x) } : {}),
        ...(typeof parsed.y === "number" ? { y: Math.round(parsed.y) } : {}),
      };
    }
  } catch {
    // first launch or corrupt file — use defaults
  }
  return { ...DEFAULT_BOUNDS };
}

/**
 * @param {import("electron").BrowserWindow} win
 */
function trackWindowState(win) {
  const save = () => {
    if (win.isDestroyed() || win.isMinimized()) return;
    const bounds = win.getBounds();
    try {
      fs.mkdirSync(path.dirname(stateFilePath()), { recursive: true });
      fs.writeFileSync(stateFilePath(), JSON.stringify(bounds, null, 2));
    } catch {
      // ignore persistence failures
    }
  };

  win.on("resize", save);
  win.on("move", save);
  win.on("close", save);
}

/**
 * Drop x/y if the saved position is off any current display.
 * @param {{ width: number, height: number, x?: number, y?: number }} state
 */
function clampToVisibleDisplay(state) {
  if (typeof state.x !== "number" || typeof state.y !== "number") {
    return { width: state.width, height: state.height };
  }
  const displays = screen.getAllDisplays();
  const visible = displays.some((d) => {
    const { x, y, width, height } = d.workArea;
    return (
      state.x >= x - 50 &&
      state.y >= y - 50 &&
      state.x < x + width &&
      state.y < y + height
    );
  });
  if (!visible) {
    return { width: state.width, height: state.height };
  }
  return state;
}

module.exports = {
  loadWindowState,
  trackWindowState,
  clampToVisibleDisplay,
  DEFAULT_BOUNDS,
};
