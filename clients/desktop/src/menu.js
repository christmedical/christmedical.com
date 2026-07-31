"use strict";

const { Menu, shell } = require("electron");

/**
 * Build the application menu (reload / back / forward / standard edit + window).
 *
 * @param {() => import("electron").BrowserWindow | null} getMainWindow
 * @returns {import("electron").Menu}
 */
function buildAppMenu(getMainWindow) {
  const isMac = process.platform === "darwin";

  /** @type {import("electron").MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [
          {
            label: "Christ Medical",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            const win = getMainWindow();
            if (win && !win.isDestroyed()) win.webContents.reload();
          },
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac ? [{ role: "pasteAndMatchStyle" }, { role: "delete" }, { role: "selectAll" }] : [
          { role: "delete" },
          { type: "separator" },
          { role: "selectAll" },
        ]),
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            const win = getMainWindow();
            if (win && !win.isDestroyed()) win.webContents.reload();
          },
        },
        {
          label: "Force Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => {
            const win = getMainWindow();
            if (win && !win.isDestroyed()) win.webContents.reloadIgnoringCache();
          },
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(process.env.NODE_ENV === "development" || process.env.ELECTRON_DEVTOOLS === "1"
          ? [{ type: "separator" }, { role: "toggleDevTools" }]
          : []),
      ],
    },
    {
      label: "History",
      submenu: [
        {
          label: "Back",
          accelerator: "CmdOrCtrl+[",
          click: () => {
            const win = getMainWindow();
            if (win && !win.isDestroyed() && win.webContents.canGoBack()) {
              win.webContents.goBack();
            }
          },
        },
        {
          label: "Forward",
          accelerator: "CmdOrCtrl+]",
          click: () => {
            const win = getMainWindow();
            if (win && !win.isDestroyed() && win.webContents.canGoForward()) {
              win.webContents.goForward();
            }
          },
        },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, ...(isMac ? [{ type: "separator" }, { role: "front" }] : [{ role: "close" }])],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Christ Medical Portal",
          click: async () => {
            await shell.openExternal("https://login.christmedical.com/");
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

module.exports = { buildAppMenu };
