import type { ReactNode } from "react";
import { Arrow } from "@/components/arrow";
import { localize, type NotionBlock, type RichText } from "@/lib/notion";

// Renders a Notion page's blocks as the same plain HTML the .mdx posts produce, so the
// existing .prose styles apply. Blocks without a web equivalent are skipped.

function Text({ rich }: { rich?: RichText[] }) {
  return (
    <>
      {(rich ?? []).map((t, i) => {
        let node: ReactNode = t.plain_text;
        const a = t.annotations;
        if (a.code) node = <code>{node}</code>;
        if (a.bold) node = <strong>{node}</strong>;
        if (a.italic) node = <em>{node}</em>;
        if (a.strikethrough) node = <s>{node}</s>;
        if (a.underline) node = <u>{node}</u>;
        if (t.href) {
          const href = localize(t.href);
          const external = /^https?:/.test(href);
          node = (
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {node}
            </a>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

const plain = (rich?: RichText[]) => (rich ?? []).map(t => t.plain_text).join("");

function mediaUrl(b: NotionBlock) {
  const f = b[b.type];
  return f.type === "external" ? localize(f.external.url as string) : `/api/notion-image/${b.id}`;
}

function Block({ b }: { b: NotionBlock }) {
  const v = b[b.type] ?? {};
  const kids = b.children ? <NotionBody blocks={b.children} /> : null;
  switch (b.type) {
    case "paragraph": {
      const rich: RichText[] = v.rich_text;
      if (!plain(rich)) return null;
      // a line that is only a link ending in "→" becomes a pill button, like "see the project →"
      const label = plain(rich).trim();
      if (rich.every(t => t.href && t.href === rich[0].href) && label.endsWith("→")) {
        return (
          <p>
            <a className="post-button" href={localize(rich[0].href!)}>
              {label.slice(0, -1).trim()} <Arrow />
            </a>
          </p>
        );
      }
      // gray text in Notion is the small tech-stack line under a project heading
      return <p className={v.color === "gray" ? "post-stack" : undefined}><Text rich={rich} /></p>;
    }
    case "heading_1":
      return <h2><Text rich={v.rich_text} /></h2>;
    case "heading_2":
      return <h3><Text rich={v.rich_text} /></h3>;
    case "heading_3":
      return <h4><Text rich={v.rich_text} /></h4>;
    case "quote":
      return <blockquote><p><Text rich={v.rich_text} /></p>{kids}</blockquote>;
    case "callout":
      return (
        <blockquote>
          <p>{v.icon?.emoji ? `${v.icon.emoji} ` : ""}<Text rich={v.rich_text} /></p>
          {kids}
        </blockquote>
      );
    case "code":
      return <pre><code>{plain(v.rich_text)}</code></pre>;
    case "equation":
      return <p className="center"><code>{v.expression}</code></p>;
    case "divider":
      return <hr />;
    case "image":
      return (
        <figure className="writing-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(b)} alt={plain(v.caption)} loading="lazy" />
          {plain(v.caption) && <figcaption><Text rich={v.caption} /></figcaption>}
        </figure>
      );
    case "video":
      return v.type === "file" ? (
        <figure className="writing-art">
          <video src={mediaUrl(b)} controls playsInline />
          {plain(v.caption) && <figcaption><Text rich={v.caption} /></figcaption>}
        </figure>
      ) : (
        <p><a href={v.external.url} target="_blank" rel="noopener noreferrer">{plain(v.caption) || v.external.url}</a></p>
      );
    case "bookmark":
    case "embed":
    case "link_preview":
      return <p><a href={v.url} target="_blank" rel="noopener noreferrer">{plain(v.caption) || v.url}</a></p>;
    case "toggle":
      return (
        <details>
          <summary><Text rich={v.rich_text} /></summary>
          {kids}
        </details>
      );
    case "to_do":
      return (
        <p>
          <input type="checkbox" checked={v.checked} readOnly disabled /> <Text rich={v.rich_text} />
          {kids}
        </p>
      );
    case "table":
      return (
        <table>
          <tbody>
            {(b.children ?? []).map((row, r) => (
              <tr key={row.id}>
                {((row.table_row?.cells ?? []) as RichText[][]).map((cell, c) =>
                  (r === 0 && v.has_column_header) || (c === 0 && v.has_row_header)
                    ? <th key={c}><Text rich={cell} /></th>
                    : <td key={c}><Text rich={cell} /></td>,
                )}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "column_list":
    case "column":
    case "synced_block":
      return kids;
    default:
      return null;
  }
}

// Consecutive list items are grouped into one <ul> or <ol>.
export function NotionBody({ blocks }: { blocks: NotionBlock[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const items: NotionBlock[] = [];
      while (blocks[i]?.type === b.type) items.push(blocks[i++]);
      i--;
      const List = b.type === "bulleted_list_item" ? "ul" : "ol";
      out.push(
        <List key={b.id}>
          {items.map(item => (
            <li key={item.id}>
              <Text rich={item[item.type].rich_text} />
              {item.children && <NotionBody blocks={item.children} />}
            </li>
          ))}
        </List>,
      );
    } else {
      out.push(<Block key={b.id} b={b} />);
    }
  }
  return <>{out}</>;
}
