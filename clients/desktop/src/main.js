"use strict";

const path = require("node:path");
const { app, BrowserWindow, Menu, shell } = require("electron");
const { resolvePortalUrl, isAllowedNavigation } = require("./config");
const { loadWindowState, trackWindowState, clampToVisibleDisplay } = require("./windowState");
const { buildAppMenu } = require("./menu");

/** @type {BrowserWindow | null} */
let mainWindow = null;

function getMainWindow() {
  return mainWindow;
}

function createWindow() {
  const portalUrl = resolvePortalUrl();
  const state = clampToVisibleDisplay(loadWindowState());

  mainWindow = new BrowserWindow({
    ...state,
    minWidth: 800,
    minHeight: 600,
    title: "Christ Medical",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  trackWindowState(mainWindow);

  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  // Keep in-app navigations on the portal host / christmedical.com; else → system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url, portalUrl)) {
      return { action: "allow" };
    }
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url, portalUrl)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  void mainWindow.loadURL(portalUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildAppMenu(getMainWindow));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
