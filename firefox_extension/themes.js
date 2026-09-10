"use strict";

/**
 * Gruvbox "medium" contrast palettes mapped onto Firefox's theme colour keys.
 *
 * These objects are passed straight to `browser.theme.update()`, which recolours
 * the browser chrome (frame, toolbar, tabs, address bar, sidebar, popups and
 * Firefox's own in-content pages such as the new tab page). They do NOT touch
 * the rendering of ordinary web pages.
 *
 * Palette reference: https://github.com/morhetz/gruvbox
 */

// --- Raw Gruvbox medium palette ---------------------------------------------

const GRUVBOX_DARK_PALETTE = {
  bg_h: "#1d2021",
  bg0: "#282828",
  bg1: "#3c3836",
  bg2: "#504945",
  bg3: "#665c54",
  bg4: "#7c6f64",
  gray: "#928374",
  fg4: "#a89984",
  fg3: "#bdae93",
  fg2: "#d5c4a1",
  fg1: "#ebdbb2",
  fg0: "#fbf1c7",
  red: "#fb4934",
  green: "#b8bb26",
  yellow: "#fabd2f",
  blue: "#83a598",
  purple: "#d3869b",
  aqua: "#8ec07c",
  orange: "#fe8019"
};

const GRUVBOX_LIGHT_PALETTE = {
  bg_h: "#f9f5d7",
  bg0: "#fbf1c7",
  bg1: "#ebdbb2",
  bg2: "#d5c4a1",
  bg3: "#bdae93",
  bg4: "#a89984",
  gray: "#7c6f64",
  fg4: "#7c6f64",
  fg3: "#665c54",
  fg2: "#504945",
  fg1: "#3c3836",
  fg0: "#282828",
  red: "#9d0006",
  green: "#79740e",
  yellow: "#b57614",
  blue: "#076678",
  purple: "#8f3f71",
  aqua: "#427b58",
  orange: "#af3a03"
};

// --- Map a palette onto Firefox theme keys ---------------------------------

function buildTheme(p, scheme) {
  return {
    colors: {
      // Window frame / titlebar
      frame: p.bg_h,
      frame_inactive: p.bg_h,

      // Main toolbar (nav bar + bookmarks bar)
      toolbar: p.bg0,
      toolbar_text: p.fg1,
      bookmark_text: p.fg1,
      toolbar_top_separator: p.bg_h,
      toolbar_bottom_separator: p.bg1,
      toolbar_vertical_separator: p.bg1,

      // Address bar / search field
      toolbar_field: p.bg_h,
      toolbar_field_text: p.fg1,
      toolbar_field_border: p.bg1,
      toolbar_field_focus: p.bg_h,
      toolbar_field_text_focus: p.fg0,
      toolbar_field_border_focus: p.blue,
      toolbar_field_highlight: p.blue,
      toolbar_field_highlight_text: p.bg_h,

      // Tabs
      tab_background_text: p.fg4,
      tab_selected: p.bg0,
      tab_text: p.fg0,
      tab_line: p.orange,
      tab_loading: p.blue,
      tab_background_separator: p.bg_h,

      // Toolbar button states
      button_background_hover: p.bg1,
      button_background_active: p.bg2,
      icons: p.fg3,
      icons_attention: p.orange,

      // New tab page (Firefox's own page, not web content)
      ntp_background: p.bg0,
      ntp_text: p.fg1,

      // Autocomplete / doorhanger popups
      popup: p.bg0,
      popup_text: p.fg1,
      popup_border: p.bg1,
      popup_highlight: p.blue,
      popup_highlight_text: p.bg_h,

      // Sidebar (bookmarks, history, etc.)
      sidebar: p.bg0,
      sidebar_text: p.fg1,
      sidebar_border: p.bg1,
      sidebar_highlight: p.blue,
      sidebar_highlight_text: p.bg_h
    },
    properties: {
      color_scheme: scheme,
      content_color_scheme: scheme
    }
  };
}

globalThis.GRUVBOX = {
  light: buildTheme(GRUVBOX_LIGHT_PALETTE, "light"),
  dark: buildTheme(GRUVBOX_DARK_PALETTE, "dark")
};
