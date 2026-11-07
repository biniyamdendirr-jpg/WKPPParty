/**
 * ============================================================
 * Facebook News API — Cloudflare Worker
 * Wolkite City Prosperity Party Branch — Youth Wing Page News
 * ------------------------------------------------------------
 * Fetches the latest posts from the Youth Wing Facebook page
 * via Graph API, transforms them into clean news JSON, and
 * caches responses at the edge (no Facebook branding exposed).
 *
 * SETUP:
 *   1. wrangler init wolkite-fb-news
 *   2. Paste this file as src/index.js (or wrangler deploy this file)
 *   3. Set the secret:  wrangler secret put FACEBOOK_ACCESS_TOKEN
 *   4. wrangler deploy  ->  https://<worker>.workers.dev/api/news
 *
 * Endpoints:
 *   GET /api/news   -> { ok, count, posts: [...] }
 *   GET /           -> health check
 * ============================================================
 */

const FACEBOOK_CONFIG = {
  PAGE_ID: '61595349102494',              // የነገር ተዛማዕ ተማሪዎች አካባቢ
  PAGE_NAME: 'https://facebook.com/profile.php?id=61595349102494',
  POSTS_LIMIT: 10,                        // latest N posts
  CACHE_SECONDS: 3600,                    // edge cache: 1 hour
  GRAPH_VERSION: 'v18.0'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',     // tighten to your domain in production
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname !== '/api/news') {
      return jsonResponse({ ok: true, service: 'wolkite-fb-news', endpoints: ['/api/news'] });
    }

    const accessToken = env && env.FACEBOOK_ACCESS_TOKEN;
    if (!accessToken) {
      return jsonResponse(
        { ok: false, error: 'CONFIG_ERROR', message: 'FACEBOOK_ACCESS_TOKEN secret is not set. Run: wrangler secret put FACEBOOK_ACCESS_TOKEN' },
        500
      );
    }

    // ---- Edge cache: serve stale-but-fresh within CACHE_SECONDS ----
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const age = Math.floor((Date.now() - new Date(cached.headers.get('x-fetched-at') || Date.now()).getTime()) / 1000);
      const body = await cached.json();
      return jsonResponse({ ...body, cached: true, ageSeconds: age });
    }

    // ---- Fetch from Graph API ----
    const fields = 'id,message,full_picture,created_time,permalink_url';
    const graphUrl = `https://graph.facebook.com/${FACEBOOK_CONFIG.GRAPH_VERSION}/${FACEBOOK_CONFIG.PAGE_ID}/posts?fields=${fields}&limit=${FACEBOOK_CONFIG.POSTS_LIMIT}&access_token=${encodeURIComponent(accessToken)}`;

    let graphData;
    try {
      const res = await fetch(graphUrl);
      graphData = await res.json();
      if (graphData.error) {
        const status = graphData.error.code === 190 ? 401 : 502;
        return jsonResponse(
          { ok: false, error: 'GRAPH_API_ERROR', message: graphData.error.message || 'Facebook Graph API returned an error' },
          status
        );
      }
    } catch (err) {
      return jsonResponse({ ok: false, error: 'NETWORK_ERROR', message: String(err && err.message || err) }, 502);
    }

    // ---- Transform into clean news format (no FB branding) ----
    const posts = (graphData.data || [])
      .filter(p => (p.message && p.message.trim()) || p.full_picture)
      .map(p => transformPost(p));

    const responseBody = {
      ok: true,
      count: posts.length,
      page: { id: FACEBOOK_CONFIG.PAGE_ID, name: FACEBOOK_CONFIG.PAGE_NAME },
      generatedAt: new Date().toISOString(),
      posts
    };

    // ---- Store in edge cache (fire-and-forget) ----
    const cacheRes = new Response(JSON.stringify(responseBody), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${FACEBOOK_CONFIG.CACHE_SECONDS}`,
        'x-fetched-at': new Date().toISOString()
      }
    });
    ctx.waitUntil(cache.put(cacheKey, cacheRes.clone()));

    return jsonResponse(responseBody);
  }
};

/* ---- Helpers ---- */

function transformPost(p) {
  const message = (p.message || '').trim();
  const sourceUrl = p.permalink_url || `https://www.facebook.com/${p.id}`;
  return {
    id: p.id,
    title: extractTitle(message),
    content: message,
    snippet: message.length > 200 ? message.slice(0, 200).trimEnd() + '…' : message,
    image: p.full_picture || null,
    date: p.created_time,
    url: sourceUrl,
    sourceName: FACEBOOK_CONFIG.PAGE_NAME,
    sourceUrl
  };
}

function extractTitle(message) {
  if (!message) return '';
  const firstLine = message.split('\n').find(l => l.trim().length > 0) || '';
  const sentence = firstLine.split(/(?<=[.!?።፣])\s+/)[0] || firstLine;
  return sentence.length > 90 ? sentence.slice(0, 90).trimEnd() + '…' : sentence;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${FACEBOOK_CONFIG.CACHE_SECONDS}`,
      ...CORS_HEADERS
    }
  });
}