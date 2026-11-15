"use client";

import { useEffect, useState } from "react";

// Sits right under the live date on the home page, in the same mono HUD type.
// A visit is counted once per browser session, so refreshing or coming back to home doesn't inflate it.
const SESSION_KEY = "views-counted";

export function ViewCount() {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}

    fetch("/api/views", { method: counted ? "GET" : "POST", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { views: number | null } | null) => {
        if (typeof data?.views !== "number") return;
        if (!counted) {
          try {
            sessionStorage.setItem(SESSION_KEY, "1");
          } catch {}
        }
        setViews(data.views);
      })
      .catch(() => {});
  }, []);

  return (
    <p className="hud-readout view-count" aria-live="polite">
      {views === null ? "" : `${views.toLocaleString("en-US")} ${views === 1 ? "VIEW" : "VIEWS"}`}
    </p>
  );
}
