// Site view counter, stored in Upstash Redis (free tier, added through the Vercel Marketplace).
// POST counts a view and returns the new total; GET only reads it.
// Without the env vars (e.g. local dev before setup) both return { views: null } and the counter stays hidden.

const KEY = "portfolio:views";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command: "incr" | "get") {
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/${command}/${KEY}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { result } = (await res.json()) as { result: number | string | null };
    return result == null ? 0 : Number(result);
  } catch {
    return null;
  }
}

export async function GET() {
  return Response.json({ views: await redis("get") }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  return Response.json({ views: await redis("incr") }, { headers: { "Cache-Control": "no-store" } });
}
