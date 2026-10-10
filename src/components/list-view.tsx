"use client";
import { useCollection } from "./collection";

export type ListItem = {
  title: string;
  // Muted text after the title, e.g. the issuer.
  subtitle?: string;
  // Second muted line under the title.
  note?: string;
  // Used by the filter menu; not displayed.
  category: string;
  date?: string;
};

// Notion-style list view: one row per item with its title and a right-aligned date.
export function ListView({
  title,
  items,
  filterLabel = "Category",
}: {
  title: string;
  items: ListItem[];
  filterLabel?: string;
}) {
  const { shown, header } = useCollection(items, { title, filterLabel });

  return (
    <>
      {header}
      <ul className="list">
        {shown.map(item => (
          <li key={item.title} className="list-row">
            <div className="list-main">
              <div className="list-title">
                {item.title}
                {item.subtitle && <span className="list-subtitle">{item.subtitle}</span>}
              </div>
              {item.note && <div className="list-note">{item.note}</div>}
            </div>
            <span className="list-date">{item.date}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
