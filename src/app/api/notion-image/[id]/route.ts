import { freshFileUrl, notionEnabled } from "@/lib/notion";

// Sends the browser to a fresh link for an image uploaded to a Notion blog post.
// Notion's file links expire after an hour, so the redirect is only cached until shortly before that.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const field = new URL(request.url).searchParams.get("field") ?? undefined;
  if (!notionEnabled || !/^[0-9a-f-]{32,36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const file = await freshFileUrl(id, field).catch(() => null);
  if (!file) return new Response("Not found", { status: 404 });

  const left = file.expires ? Math.floor((new Date(file.expires).getTime() - Date.now()) / 1000) - 300 : 3600;
  const maxAge = Math.max(0, Math.min(left, 3000));
  return new Response(null, {
    status: 307,
    headers: { Location: file.url, "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}` },
  });
}
