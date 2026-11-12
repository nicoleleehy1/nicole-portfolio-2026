"use client";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { useCollection } from "./collection";
import { AsciiCover } from "./ascii-cover";
import type { CoverKind } from "@/lib/ascii-covers";

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
  // Short "what is it" points, shown in a callout above the bullets.
  summary?: string[];
  // Heading over the bullets when a summary is shown, e.g. "What I did".
  bulletsLabel?: string;
  bullets: string[];
  // Long-form case study; replaces the bullets in the popup when present.
  body?: ReactNode;
  // Extra screenshots shown under the bullets.
  images?: string[];
  // ASCII-art cover, used when there's no image.
  ascii?: CoverKind;
};

// Photo cover, or a plain light-gray panel when there's no image yet.
function Cover({ item }: { item: GalleryItem }) {
  return (
    <div className="cover">
      {item.image ? (
        <img src={item.image} alt={item.title} className="cover-media" />
      ) : (
        item.ascii && <AsciiCover slug={item.title} kind={item.ascii} cols={72} rows={26} className="cover-ascii" />
      )}
    </div>
  );
}

// Notion-style gallery: cover cards with filter/sort, opening a centered "peek" dialog.
export function Gallery({
  title,
  items,
  filterLabel = "Category",
  wide = false,
}: {
  title: string;
  items: GalleryItem[];
  filterLabel?: string;
  // Wider popup that shows the whole cover image instead of a cropped strip.
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<GalleryItem | null>(null);
  const { shown, header } = useCollection(items, { title, filterLabel });

  function open(item: GalleryItem) {
    setActive(item);
    dialogRef.current?.showModal();
  }

  return (
    <>
      {header}

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
        className={wide ? "peek peek-wide" : "peek"}
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
            {wide && active.image ? (
              <img src={active.image} alt={active.title} className="peek-hero" />
            ) : (
              <Cover item={active} />
            )}
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
              {active.summary && active.summary.length > 0 && (
                <aside className="peek-callout">
                  <ul>
                    {active.summary.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </aside>
              )}
              {active.body ?? (active.bullets.length > 0 && (
                <>
                  {active.summary && active.bulletsLabel && (
                    <h3 className="peek-label">{active.bulletsLabel}</h3>
                  )}
                  <ul className="peek-desc">
                    {active.bullets.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              ))}
              {active.images && active.images.length > 0 && (
                <div className="peek-shots">
                  {active.images.map(src => (
                    <img key={src} src={src} alt={active.title} loading="lazy" />
                  ))}
                </div>
              )}
            </div>
          </article>
        )}
      </dialog>
    </>
  );
}
