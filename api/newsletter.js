// Vercel serverless function — fetches all MVP posts via beehiiv API v2.
// Deployed at /api/newsletter

export const config = { runtime: 'edge' };

const PUB_ID  = 'pub_030810ba-6dbe-4b31-9ebf-05947c2eb8f5';
const API_KEY = 'd3iDiO9Uq9x5cY0AOyvBvGpsYFUfbQdifQXQI4Mwqdy40QpAhlgtkM4jr1AyGpjX';
const CACHE_SECONDS = 604800; // 7 days — refreshed by Vercel Cron (Thu 11am AST)

function formatDate(unixTs) {
  if (!unixTs) return '';
  const d = new Date(unixTs * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

async function fetchPage(page) {
  const url = `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts`
    + `?limit=50&page=${page}&status=confirmed&order_by=publish_date&direction=desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`beehiiv API ${res.status}`);
  return res.json();
}

export default async function handler() {
  try {
    const first = await fetchPage(1);
    const totalPages = first.total_pages || 1;

    // Fetch remaining pages in parallel if needed
    let allPosts = first.data || [];
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2))
      );
      rest.forEach(r => { allPosts = allPosts.concat(r.data || []); });
    }

    const posts = allPosts.map(p => ({
      title:   p.title || p.subject_line || '',
      excerpt: p.subtitle || p.preview_text || '',
      date:    formatDate(p.publish_date || p.displayed_date),
      iso:     p.publish_date ? new Date(p.publish_date * 1000).toISOString().slice(0, 10) : '',
      url:     p.web_url || `https://mvpower.beehiiv.com/p/${p.slug}`,
    })).filter(p => p.title);

    return new Response(
      JSON.stringify({ posts, total: posts.length, fetchedAt: new Date().toISOString() }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, posts: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
