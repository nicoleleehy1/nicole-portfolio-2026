"use client";
import { Fragment, useEffect, useRef, useState } from "react";

export type GalleryItem = {
  title: string;
  // Muted line under the title on the card.
  subtitle: string;
  // Used by the filter menu.
  category: string;
  // e.g. "Jan '21 – Present"; enables date sorting when present.
  date?: string;
  image?: string;
  // Badge on the card cover, e.g. "1st Place · HackMIT".
  award?: string;
  // Property rows at the top of the popup.
  props: { label: string; value: string; href?: string }[];
  bullets: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Sortable value from the start of a date like "Jan '21 – Present" or "'18 – '23".
function startValue(date = "") {
  const m = date.match(/^(?:([A-Z][a-z]{2}) )?'(\d{2})/);
  if (!m) return 0;
  return Number(m[2]) * 12 + (m[1] ? MONTHS.indexOf(m[1]) : 0);
}

type Sort = "default" | "name" | "newest" | "oldest";

// Photo cover, or a plain light-gray panel when there's no image yet.
function Cover({ item }: { item: GalleryItem }) {
  return (
    <div className="cover">
      {item.image && <img src={item.image} alt={item.title} className="cover-media" />}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M5 13V3M2.5 10.5 5 13l2.5-2.5M11 3v10M8.5 5.5 11 3l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Notion-style gallery: cover cards with filter/sort, opening a centered "peek" dialog.
export function Gallery({
  title,
  items,
  filterLabel = "Category",
}: {
  title: string;
  items: GalleryItem[];
  filterLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [menu, setMenu] = useState<"filter" | "sort" | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("default");

  const allCategories = [...new Set(items.map(i => i.category))];
  const sorts: { value: Sort; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "name", label: "Name (A → Z)" },
    ...(items.some(i => i.date)
      ? [
          { value: "newest" as const, label: "Newest first" },
          { value: "oldest" as const, label: "Oldest first" },
        ]
      : []),
  ];

  const shown = items.filter(i => categories.length === 0 || categories.includes(i.category));
  if (sort === "name") shown.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "newest") shown.sort((a, b) => startValue(b.date) - startValue(a.date));
  if (sort === "oldest") shown.sort((a, b) => startValue(a.date) - startValue(b.date));

  // Close an open menu on outside click or Escape.
  useEffect(() => {
    if (!menu) return;
    const onDown = (ev: PointerEvent) => {
      if (!toolbarRef.current?.contains(ev.target as Node)) setMenu(null);
    };
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function open(item: GalleryItem) {
    setActive(item);
    dialogRef.current?.showModal();
  }

  function toggleCategory(c: string) {
    setCategories(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]));
  }

  return (
    <>
      <div className="gallery-header">
        <h1 className="page-title">{title}</h1>
        <div className="gallery-toolbar" ref={toolbarRef}>
          <div className="gallery-tool">
            <button
              type="button"
              className={`gallery-icon${categories.length ? " is-active" : ""}`}
              aria-label="Filter"
              aria-expanded={menu === "filter"}
              onClick={() => setMenu(m => (m === "filter" ? null : "filter"))}
            >
              <FilterIcon />
            </button>
            {menu === "filter" && (
              <div className="gallery-menu" role="menu">
                <div className="gallery-menu-label">{filterLabel}</div>
                {allCategories.map(c => (
                  <label key={c} className="gallery-menu-item">
                    <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCategory(c)} />
                    {c}
                  </label>
                ))}
                {categories.length > 0 && (
                  <button type="button" className="gallery-menu-clear" onClick={() => setCategories([])}>
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="gallery-tool">
            <button
              type="button"
              className={`gallery-icon${sort !== "default" ? " is-active" : ""}`}
              aria-label="Sort"
              aria-expanded={menu === "sort"}
              onClick={() => setMenu(m => (m === "sort" ? null : "sort"))}
            >
              <SortIcon />
            </button>
            {menu === "sort" && (
              <div className="gallery-menu" role="menu">
                <div className="gallery-menu-label">Sort by</div>
                {sorts.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={sort === s.value}
                    className="gallery-menu-item"
                    onClick={() => {
                      setSort(s.value);
                      setMenu(null);
                    }}
                  >
                    {s.label}
                    {sort === s.value && <span className="gallery-menu-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="gallery">
        {shown.map(item => (
          <button
            key={item.title}
            type="button"
            className="gallery-card"
            onClick={() => open(item)}
          >
            <div className="gallery-cover">
              <Cover item={item} />
              {item.award && <span className="badge">{item.award}</span>}
            </div>
            <div className="gallery-body">
              <span className="gallery-title">{item.title}</span>
              <span className="gallery-role">{item.subtitle}</span>
            </div>
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="peek"
        onClose={() => setActive(null)}
        // A click landing on the dialog element itself is a click on the backdrop.
        onClick={ev => ev.target === dialogRef.current && dialogRef.current.close()}
      >
        {active && (
          <article>
            <button
              type="button"
              className="peek-close"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
            <Cover item={active} />
            <div className="peek-content">
              <h2 className="peek-title">{active.title}</h2>
              <dl className="peek-props">
                {active.props.map(p => (
                  <Fragment key={p.label}>
                    <dt>{p.label}</dt>
                    <dd>
                      {p.href ? (
                        <a href={p.href} target="_blank" rel="noreferrer" className="link">
                          {p.value} ↗
                        </a>
                      ) : (
                        p.value
                      )}
                    </dd>
                  </Fragment>
                ))}
              </dl>
              {active.bullets.length > 0 && (
                <ul className="peek-desc">
                  {active.bullets.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        )}
      </dialog>
    </>
  );
}
