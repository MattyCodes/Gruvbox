"use strict";

/*
 * State model (persisted in storage.sync):
 *
 *   mode        : "auto" | "manual"
 *   manualTheme : "light" | "dark"   -- the choice used while mode === "manual"
 *   override    : null | "light" | "dark"
 *                 A temporary flip applied while mode === "auto". It is cleared
 *                 the next time the OS colour scheme changes, or on browser
 *                 restart -- after that, auto mode resumes following the OS.
 *
 * storage.local holds `lastSystem` so we can tell, on wake-up, whether the OS
 * scheme changed while the background page was suspended.
 */

const { light: LIGHT_THEME, dark: DARK_THEME } = globalThis.GRUVBOX;

const DEFAULTS = { mode: "auto", manualTheme: "dark", override: null };
const ALARM_NAME = "gruvbox-watch";

const darkMediaQuery =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-color-scheme: dark)")
    : null;

function systemTheme() {
  return darkMediaQuery && darkMediaQuery.matches ? "dark" : "light";
}

async function getState() {
  const s = await browser.storage.sync.get(DEFAULTS);
  if (s.mode !== "auto" && s.mode !== "manual") s.mode = DEFAULTS.mode;
  if (s.manualTheme !== "light" && s.manualTheme !== "dark") {
    s.manualTheme = DEFAULTS.manualTheme;
  }
  if (s.override !== "light" && s.override !== "dark") s.override = null;
  return s;
}

function effectiveTheme(s) {
  if (s.mode === "manual") return s.manualTheme;
  return s.override || systemTheme();
}

function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function updateButton(s, theme) {
  const other = theme === "dark" ? "Light" : "Dark";
  const suffix = s.mode === "auto" ? " · Auto" : "";
  await browser.action.setTitle({
    title: `Gruvbox: ${titleCase(theme)}${suffix} — click for ${other}`
  });
  try {
    await browser.action.setIcon({
      path: theme === "dark" ? "icons/dark.svg" : "icons/light.svg"
    });
  } catch (_) {
    /* setIcon can fail transiently during startup; harmless */
  }
  try {
    await browser.action.setBadgeText({ text: s.mode === "auto" ? "A" : "" });
    await browser.action.setBadgeBackgroundColor({
      color: theme === "dark" ? "#504945" : "#d5c4a1"
    });
  } catch (_) {
    /* badge APIs unavailable in some contexts; ignore */
  }
}

let lastApplied = null; // { theme, mode } most recently pushed to the browser

async function applyFromState(s) {
  if (!s) s = await getState();
  const theme = effectiveTheme(s);
  if (!lastApplied || lastApplied.theme !== theme) {
    await browser.theme.update(theme === "dark" ? DARK_THEME : LIGHT_THEME);
  }
  if (!lastApplied || lastApplied.theme !== theme || lastApplied.mode !== s.mode) {
    await updateButton(s, theme);
  }
  lastApplied = { theme, mode: s.mode };
}

/**
 * Recompute and apply. Detects an OS scheme change that may have happened while
 * this page was suspended and clears any temporary override in that case.
 */
async function tick() {
  const sys = systemTheme();
  const { lastSystem } = await browser.storage.local.get({ lastSystem: null });
  const s = await getState();

  if (lastSystem !== null && sys !== lastSystem && s.override) {
    s.override = null;
    await browser.storage.sync.set({ override: null });
  }
  await browser.storage.local.set({ lastSystem: sys });
  await applyFromState(s);
}

// --- Toolbar button -------------------------------------------------------

browser.action.onClicked.addListener(async () => {
  const s = await getState();
  if (s.mode === "manual") {
    const next = s.manualTheme === "dark" ? "light" : "dark";
    await browser.storage.sync.set({ manualTheme: next });
    // storage.onChanged handler re-applies.
  } else {
    const current = effectiveTheme(s);
    const next = current === "dark" ? "light" : "dark";
    await browser.storage.sync.set({ override: next });
  }
});

// --- Right-click menu on the toolbar button --------------------------------

const MENU_AUTO = "gruvbox-menu-auto";
const MENU_OPTIONS = "gruvbox-menu-options";

async function buildMenus() {
  await browser.menus.removeAll();
  const s = await getState();
  browser.menus.create({
    id: MENU_AUTO,
    title: "Follow system colour scheme",
    type: "checkbox",
    checked: s.mode === "auto",
    contexts: ["action"]
  });
  browser.menus.create({
    id: MENU_OPTIONS,
    title: "Options…",
    contexts: ["action"]
  });
}

browser.menus.onClicked.addListener(async (info) => {
  if (info.menuItemId === MENU_AUTO) {
    const mode = info.checked ? "auto" : "manual";
    const patch = { mode, override: null };
    if (mode === "manual") patch.manualTheme = effectiveTheme(await getState());
    await browser.storage.sync.set(patch);
  } else if (info.menuItemId === MENU_OPTIONS) {
    await browser.runtime.openOptionsPage();
  }
});

// --- OS colour-scheme changes ------------------------------------------------

if (darkMediaQuery) {
  darkMediaQuery.addEventListener("change", () => {
    tick();
  });
}

// Safety net for when the media-query listener doesn't fire the suspended page.
browser.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) tick();
});

// --- React to settings written by the options page ------------------------

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  applyFromState();
  if (changes.mode) buildMenus();
});

// --- Lifecycle ------------------------------------------------------------

browser.runtime.onInstalled.addListener(async () => {
  // Fresh install / update: start from a clean auto-follow state.
  await browser.storage.sync.set({ override: null });
  await buildMenus();
  await tick();
});

browser.runtime.onStartup.addListener(async () => {
  // Browser restart clears any temporary override.
  await browser.storage.sync.set({ override: null });
  await buildMenus();
  await tick();
});

// Runs whenever the event page is (re)loaded.
buildMenus();
tick();
