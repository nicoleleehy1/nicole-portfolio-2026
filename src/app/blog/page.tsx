import type { Metadata } from "next";
import Link from "next/link";
import { getWritings, type Writing } from "@/lib/writings";
import { AsciiCover } from "@/components/ascii-cover";

export const metadata: Metadata = { title: "Blog" };

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

function Byline({ w }: { w: Writing }) {
  return (
    <p className="blog-byline">
      {[w.date && dateFormat.format(w.date), `${w.minutes} min read`].filter(Boolean).join(" · ")}
    </p>
  );
}

type StoryProps = {
  w: Writing;
  // which layout block this story fills; each has its own type scale and cover treatment
  variant: "row" | "stack" | "feature" | "duo" | "long" | "thumb" | "list";
  cover?: [cols: number, rows: number];
  summary?: boolean;
};

function Story({ w, variant, cover, summary = true }: StoryProps) {
  return (
    <Link href={`/blog/${w.slug}`} className={`blog-story story-${variant}`}>
      {cover && <AsciiCover slug={w.slug} kind={w.cover} cols={cover[0]} rows={cover[1]} />}
      <div className="blog-story-text">
        {w.kind && <span className="blog-kicker">{w.kind}</span>}
        <h3 className="blog-headline">{w.title}</h3>
        {summary && w.summary && <p className="blog-summary">{w.summary}</p>}
        <Byline w={w} />
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const writings = await getWritings();
  const latest = writings.find(w => w.date)?.date;

  // Fill the front page slot by slot, newest first. The longest remaining piece gets the "long read" block.
  // pinned posts (the running "what i've been up to") stack above the lead story's text
  const pinned = writings.filter(w => w.pinned);
  const queue = writings.filter(w => !w.pinned);
  const take = (n: number) => queue.splice(0, n);
  const lead = take(1)[0];
  const stack = take(2);
  const feature = take(1)[0];
  // the two-up cards are narrow, so they get the two shortest headlines left
  const duo = [...queue].sort((a, b) => a.title.length - b.title.length).slice(0, 2);
  duo.forEach(w => queue.splice(queue.indexOf(w), 1));
  const longIdx = queue.reduce((best, w, i) => (w.minutes > (queue[best]?.minutes ?? -1) ? i : best), -1);
  const long = longIdx >= 0 ? queue.splice(longIdx, 1)[0] : undefined;
  // thumbnails go two across, so only an even number; any odd one out joins the rail list
  const thumbs = take(Math.min(4, Math.floor(queue.length / 2) * 2));
  const list = queue;

  return (
    <section className="section scrim blog" data-content data-exclude>
      <header className="blog-masthead">
        <div className="blog-masthead-row">
          <span className="blog-ear">{latest ? longDate.format(latest) : " "}</span>
          <h1 className="blog-title">⋆°• blog ✦ ݁˖</h1>
          <span className="blog-ear blog-ear-right">
            {writings.length} {writings.length === 1 ? "story" : "stories"}
          </span>
        </div>
        <div className="blog-dateline">research, notes and thoughts written by yours truly</div>
      </header>

      <div className="blog-front">
        <div className="blog-main">
          {lead && (
            <div className="blog-pkg blog-pkg-top">
              {/* the pinned post(s), then the newest story: each a row of text beside its cover */}
              <div className="blog-top-rows">
                {[...pinned, lead].map(w => <Story key={w.slug} w={w} variant="row" cover={[50, 30]} />)}
              </div>
              {stack.length > 0 && (
                <div className="blog-top-stack">
                  {stack.map(w => <Story key={w.slug} w={w} variant="stack" />)}
                </div>
              )}
            </div>
          )}

          {long && (
            <div className="blog-pkg">
              <p className="blog-label">The long read</p>
              <Story w={long} variant="long" cover={[70, 26]} />
            </div>
          )}

          {thumbs.length > 0 && (
            <div className="blog-pkg">
              <p className="blog-label">More stories</p>
              <div className="blog-thumbs">
                {thumbs.map(w => <Story key={w.slug} w={w} variant="thumb" cover={[30, 18]} summary={false} />)}
              </div>
            </div>
          )}
        </div>

        {(feature || duo.length > 0 || list.length > 0) && (
          <aside className="blog-rail">
            {feature && <Story w={feature} variant="feature" cover={[58, 24]} />}
            {duo.length > 0 && (
              <div className="blog-duo">
                {duo.map(w => <Story key={w.slug} w={w} variant="duo" cover={[34, 20]} summary={false} />)}
              </div>
            )}
            {list.length > 0 && (
              <div className="blog-list">
                <p className="blog-label">Also in the blog</p>
                {list.map(w => <Story key={w.slug} w={w} variant="list" cover={[24, 16]} summary={false} />)}
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
