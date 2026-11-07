# Facebook News Integration — Wolkite Youth Wing

Integrates the **latest 10 posts** from the Wolkite City Youth Wing Facebook page
(public profile, ID `61595349102494`) into the party website as native, premium,
bilingual news cards — **no Facebook branding, comments, reactions or widgets**.

```


Page:   https://facebook.com/profile.php?id=61595349102494
Page ID: 61595349102494
Name:   የወልቂጤ ከተማ ወጣቶች ክንፍ ጽ/�ቤት (Wolkite City Youth Wing Office)
```

## Architecture

```
Website (index.html)
   │  fetch /api/news
   ▼
Cloudflare Worker  ──▶ Facebook Graph API v18.0 + Page Access Token
(edge cache 1h)         └─ transp. → clean JSON news + CORS + Cache-Control
   ▼
js/facebook-news.js  → renders native cards + localStorage cache + lazy images
```

## Files

| File | Purpose |
|------|---------|
| `cloudflare-worker/facebook-news-worker.js` | Serverless backend (Cloudflare Worker) |
| `js/facebook-news.js` | Frontend fetch + render + caching (no framework) |
| `facebook-news-sample.html` | Drop-in HTML section + wiring example |

## Step 1 — Create the Facebook App & Access Token

1. Go to **developers.facebook.com** → *My Apps* → *Create App* (Business type).
2. In the app dashboard add the **Facebook Login for Business** product.
3. Under *Products* → *Facebook Login* → *Settings* → add your site domain.
4. Generate a **Page Access Token**:
   - *Tools* → *Graph API Explorer* → select the app → select the **Youth Wing page**.
   - Add the permission **`pages_read_engagement`** to the token.
   - Copy the token (long-lived token preferred — regenerate/refresh it as needed).

> **Graph API requirement.** Posts from a page like this are fetched via
> `/v18.0/{PAGE_ID}/posts`. Two access modes exist:
> - **Own page** (you're an admin of the page) → the token above works directly.
> - **Any public page** → Graph API requires an **App Access Token** with a
>   business-verified app and (for page content) usually a page-level token. If
>   the page isn't owned by you, you'll need a token whose Facebook App has the
>   relevant pages permission granted by an admin of that page, or the call will
>   return a permission error (`#200`/`#190`). The worker surfaces any such
>   error message verbatim to the frontend for easy diagnosis.

## Step 2 — Configure secrets (serverless)

Create a `.dev.vars` for local dev and a secret for production:

```
# .dev.vars (local, do NOT commit)
FACEBOOK_ACCESS_TOKEN=EAAGm...3731
```

```bash
wrangler secret put FACEBOOK_ACCESS_TOKEN   # production secret
```

## Step 3 — Deploy the Worker (Cloudflare)

```bash
cd cloudflare-worker
npm init -y
npm i -D wrangler
# copy facebook-news-worker.js → src/index.js
wrangler secret put FACEBOOK_ACCESS_TOKEN
wrangler deploy
```

You now have `https://<worker-name>.<subdomain>.workers.dev/api/news`.

### Netlify / Vercel alternative
The same logic ports directly:
- **Netlify Functions**: `netlify/functions/news.mjs` — export `handler`, read
  `process.env.FACEBOOK_ACCESS_TOKEN`, `headers: { 'Access-Control-Allow-Origin': '*' }`.
- **Vercel Functions**: `api/news.js` — export default, store token in Vercel env vars.

## Step 4 — Point the website at your endpoint

In the wiring script (or `js/facebook-news.js` default), set the URL:

```js
FACEBOOK_CONFIG.ENDPOINT = 'https://<your-worker>.workers.dev/api/news';
```

## Verify

1. Open the page — **loading skeletons** appear, then the **10 most recent posts**.
2. Images load lazily; cards are **16:9 feature image, date (Amharic ▸ ƥ+English), title, 200-char snippet**, gold **Read More → original post**.
3. After the first load, cached posts render **instantly** while fresh data reloads in the background.
4. Kill the network → graceful bilingual fallback with a **Try Again** button.
5. Invalid token → the worker returns `GRAPH_API_ERROR` with Facebook's message, surfaced cleanly.

## Error & caching behavior

- **Edge**: worker caches responses `max-age=3600` (1 h) to dodge rate limits.
- **Client**: `localStorage` caches posts 1 h (`wolkite_fb_news_v1`), renders stale-first then background-refreshed automatically.
- Language: follows the site's `lang-am` body class (auto-switches Amharic/English on the language toggle).

> ⚠️ The token is powerful — store it only as a server-side secret, never in
> `index.html`. Rotate it if ever exposed.