"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

// the theme lives on <html data-theme>, set before paint by the inline script in the root layout
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

function setTheme(theme: Theme) {
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {}
  listeners.forEach(fn => fn());
}

// filled crescent moon (switch to dark) and a sun with a filled disk and short rays (switch to light)
const moon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z" />
  </svg>
);
const sun = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" stroke="none" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" fill="none" />
  </svg>
);

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as Theme);
  const next = theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      className="nav-link theme-toggle"
      data-id="NAV-2227"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      suppressHydrationWarning
    >
      {next === "light" ? sun : moon}
    </button>
  );
}
