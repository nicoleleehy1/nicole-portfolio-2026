"use client";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useCollection } from "./collection";
import { AsciiCover } from "./ascii-cover";
import type { CoverKind } from "@/lib/ascii-covers";
import { Arrow } from "./arrow";

export type GalleryItem = {
  title: string;
  // Muted line under the title on the card.
  subtitle: string;
  // Used by the filter menu.
  category: string;
  // e.g. "Jan '21 – Present"; enables date sorting when present.
  date?: string;
  image?: string;
  // Badge on the card cover, e.g. "1st Place, HackMIT".
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

// "After You" -> "after-you"; the #anchor that opens a card's popup, e.g. /projects#aster.
export const gallerySlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
  intro,
  hideGrid = false,
}: {
  title: string;
  items: GalleryItem[];
  filterLabel?: string;
  // Shown between the header and the cards, e.g. the projects collage.
  intro?: ReactNode;
  // Opens each item as a full-screen page (projects) instead of the small centered popup.
  wide?: boolean;
  // Leaves out the cards (and their filter/sort menus); items still open from #slug links, e.g. the collage.
  hideGrid?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<GalleryItem | null>(null);
  const { shown, header } = useCollection(items, { title, filterLabel });

  function open(item: GalleryItem) {
    setActive(item);
    dialogRef.current?.showModal();
  }

  // Links like /projects#aster (e.g. from a blog post) open that card's popup.
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const item = id && items.find(i => gallerySlug(i.title) === id);
      if (!item) return;
      setActive(item);
      if (!dialogRef.current?.open) dialogRef.current?.showModal();
    };
    const frame = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [items]);

  function close() {
    setActive(null);
    // Drop the #anchor so the same link opens the popup again.
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  return (
    <>
      {hideGrid ? (
        <div className="gallery-header is-solo">
          <h1 className="page-title">{title}</h1>
        </div>
      ) : (
        header
      )}

      {intro}

      {!hideGrid && (
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
      )}

      <dialog
        ref={dialogRef}
        className={wide ? "peek peek-full" : "peek"}
        onClose={close}
        // A click landing on the dialog element itself is a click on the backdrop.
        onClick={ev => ev.target === dialogRef.current && dialogRef.current.close()}
      >
        {active && wide && (
          // Projects: a full-screen page. Title and one-line pitch, then the write-up beside a column of facts,
          // then the cover and screenshots.
          <article className="proj">
            <button
              type="button"
              className="proj-close"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              close ×
            </button>
            <div className="proj-inner">
              <header className="proj-head">
                <h2 className="proj-title">{active.title}</h2>
                {active.summary?.[0] && <p className="proj-sub">{active.summary[0]}</p>}
              </header>
              <div className="proj-grid">
                <div className="proj-body">
                  {active.summary && active.summary.length > 1 && (
                    <p className="proj-lede">{active.summary.slice(1).join(" ")}</p>
                  )}
                  {active.body ?? (active.bullets.length > 0 && (
                    <>
                      {active.bulletsLabel && <h3 className="proj-label">{active.bulletsLabel}</h3>}
                      <ul className="proj-desc">
                        {active.bullets.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </>
                  ))}
                </div>
                <dl className="proj-meta">
                  {active.props.map(p => (
                    <div key={p.label}>
                      <dt>{p.label}:</dt>{" "}
                      <dd>
                        {p.href ? (
                          <a href={p.href} target="_blank" rel="noreferrer" className="link">
                            {p.value} <Arrow dir="up-right" />
                          </a>
                        ) : (
                          p.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              {active.image && <img src={active.image} alt={active.title} className="proj-hero" />}
              {active.images && active.images.length > 0 && (
                <div className="proj-shots">
                  {active.images.map(src => (
                    <img key={src} src={src} alt={active.title} loading="lazy" />
                  ))}
                </div>
              )}
            </div>
          </article>
        )}
        {active && !wide && (
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
                          {p.value} <Arrow dir="up-right" />
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
