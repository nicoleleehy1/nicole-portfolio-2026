"use client";

import { useSyncExternalStore } from "react";

// ticks once a second; the server renders nothing so the visitor's own clock fills it in
const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};

const format = () => {
  const d = new Date();
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${date} · ${time}`.toUpperCase().replace(/,/g, "");
};

export function LiveClock() {
  const now = useSyncExternalStore(subscribe, format, () => "");
  return (
    <p className="hud-readout" aria-hidden="true" suppressHydrationWarning>
      {now}
    </p>
  );
}
