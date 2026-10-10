"use client";
import { Fragment, useRef, useState } from "react";
import { useCollection } from "./collection";

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

// Photo cover, or a plain light-gray panel when there's no image yet.
function Cover({ item }: { item: GalleryItem }) {
  return (
    <div className="cover">
      {item.image && <img src={item.image} alt={item.title} className="cover-media" />}
    </div>
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
