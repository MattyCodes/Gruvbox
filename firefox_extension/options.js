"use strict";

const DEFAULTS = { mode: "auto", manualTheme: "dark", override: null };

const modeInputs = document.querySelectorAll('input[name="mode"]');
const manualInputs = document.querySelectorAll('input[name="manualTheme"]');
const manualSection = document.getElementById("manual-section");
const currentEl = document.getElementById("current");

function systemTheme() {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function effectiveTheme(s) {
  if (s.mode === "manual") return s.manualTheme;
  return s.override || systemTheme();
}

function render(s) {
  for (const input of modeInputs) input.checked = input.value === s.mode;
  for (const input of manualInputs) {
    input.checked = input.value === s.manualTheme;
  }
  manualSection.hidden = s.mode !== "manual";

  const theme = effectiveTheme(s);
  const label = theme === "dark" ? "Gruvbox Dark" : "Gruvbox Light";
  currentEl.textContent =
    s.mode === "auto" && !s.override ? `${label} (following system)` : label;
}

async function load() {
  render(await browser.storage.sync.get(DEFAULTS));
}

for (const input of modeInputs) {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    // Switching mode discards any temporary override.
    browser.storage.sync.set({ mode: input.value, override: null });
  });
}

for (const input of manualInputs) {
  input.addEventListener("change", () => {
    if (input.checked) browser.storage.sync.set({ manualTheme: input.value });
  });
}

browser.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") load();
});

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", load);

load();
