const ICONS = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35",
  filter: "M4 5h16M7 12h10M10 19h4",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  wallet: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm13 5h.01M21 9H3",
  plus: "M12 5v14M5 12h14",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  orders: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  portfolio: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  help: "M12 17h.01M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
  chevron: "M9 18l6-6-6-6",
  chevronLeft: "M15 18l-6-6 6-6",
  calendar: "M8 2v3M16 2v3M4 9h16M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14",
  chart: "M4 19h16M7 16V9M12 16V5M17 16v-6",
  markets: "M4 10h4v10H4V10Zm6-6h4v16h-4V4Zm6 8h4v8h-4v-8Z",
  check: "M20 6 9 17l-5-5",
  close: "M6 6l12 12M18 6 6 18",
  minus: "M5 12h14",
  info: "M12 16v-4M12 8h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
  sport: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM12 3c2 3 2 6 0 9s-2 6 0 9M3.6 9h16.8M3.6 15h16.8",
  politics: "M4 20h16M8 20V8l4-3 4 3v12M10 12h4",
  unique: "M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z",
  medal: "M8 11a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM8.2 13.2 5 21l7-3 7 3-3.2-7.8"
};

function icon(name, opts) {
  opts = opts || {};
  const d = ICONS[name] || ICONS.help;
  const size = opts.size || 20;
  const cls = opts.className ? "icon " + opts.className : "icon";
  const label = opts.label ? ' aria-label="' + String(opts.label).replace(/"/g, "&quot;") + '"' : ' aria-hidden="true"';
  return '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + label + '><path d="' + d + '"/></svg>';
}

if (typeof window !== "undefined") {
  window.icon = icon;
  window.ICONS = ICONS;
}
