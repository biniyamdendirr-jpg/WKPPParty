/**
 * ============================================================
 * News — Native Website Articles (frontend integration)
 * Wolkite City Prosperity Party — Wolkite City Branch
 * ------------------------------------------------------------
 * DATA FLOW (.update):
 *   Wolkite City Youth Wing Facebook Page (SOURCE)
 *     → /api/news  (structured JSON, no FB branding)
 *     → native website article card
 *     → full in-page article view
 *
 * Facebook is treated as the SOURCE only — the News section is
 * native website content with article cards, a full article
 * view, subtle source attribution and #news/<id> deep links.
 *
 * PUBLIC API: FACEBOOK_NEWS.init(el) / .refresh() / .rerender()
 *             .renderPosts(data, el) / .formatDateAm / .formatDateEn
 * ============================================================ */

const FACEBOOK_CONFIG = {
  PAGE_ID: '61595349102494',
  PAGE_NAME: 'https://facebook.com/profile.php?id=61595349102494',
  SOURCE_LABEL: {
    am: 'ምንጭ: https://facebook.com/profile.php?id=61595349102494',
    en: 'Source: https://facebook.com/profile.php?id=61595349102494'
  },
  POSTS_LIMIT: 10,              // latest N posts (unchanged architecture)
  FEATURED_LAYOUT: true,        // newest post rendered as the featured story
  CACHE_DURATION: 3600,         // client-side localStorage cache (seconds)
  ENDPOINT: '/api/news'         // serverless function URL (override in deployment)
};

const FACEBOOK_NEWS = (() => {
  'use strict';

  const LS_KEY = 'wolkite_fb_news_v1';
  const STATE_KEY = 'wolkite_fb_news_state_v1';
  let container = null;
  const ARTICLES = new Map();   // id -> article record (for Read More + deep links)

  /* ---------- Caching ---------- */
  function readCache() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > FACEBOOK_CONFIG.CACHE_DURATION * 1000) return null; // stale
      return data;
    } catch { return null; }
  }
  function refreshCache(payload) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), payload }));
      localStorage.removeItem(STATE_KEY); // clear stale "error" state
    } catch { /* quota exceeded — non-fatal */ }
  }
  function readErrorState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch { return null; }
  }
  function writeErrorState(msg) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ ts: Date.now(), message: msg })); } catch {}
  }

  /* ---------- Network ---------- */
  async function fetchFresh() {
    const res = await fetch(FACEBOOK_CONFIG.ENDPOINT, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Service returned an error');
    return data;
  }

  /* ---------- Date formatting (bilingual, display-only) ---------- */
  const EC_MONTHS_AM = ['ጥቅምት','ሕዳር','ታህሳስ','ጥር','የካቲት','መጋቢት','ሚያዝያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜ'];
  function toEthiopian(gregDate) {
    const d = new Date(gregDate);
    let y = d.getUTCFullYear() - 8;
    const gMonth = d.getUTCMonth() + 1;      // 1-based Gregorian
    const day = d.getUTCDate();
    let eMonth, eDay;
    if (gMonth >= 9 && (gMonth > 9 || day >= 11)) {
      eMonth = d.getUTCMonth() - 8; if (eMonth < 0) eMonth += 12;
      eDay = day;
      y = y + 1;
    } else {
      eMonth = d.getUTCMonth() + 4;
      eDay = day;
    }
    return { y, monthName: EC_MONTHS_AM[eMonth % 12], day: eDay }; // approximate, display-only
  }
  function formatDateAm(iso) {
    if (!iso) return '';
    try { const e = toEthiopian(iso); return `የ${e.monthName} ${e.day}, ${e.y} ዓ.ም.`; }
    catch { return String(iso).slice(0, 10); }
  }
  function formatDateEn(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch { return String(iso).slice(0, 10); }
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }
  function lang() { return (document.body.classList.contains('lang-am') ? 'am' : 'en'); }
  function sourceLabel(am) {
    return am ? FACEBOOK_CONFIG.SOURCE_LABEL.am : FACEBOOK_CONFIG.SOURCE_LABEL.en;
  }

  /* ---------- Article registry (Read More + #news/<id> deep links) ---------- */
  function registerArticles(data, posts) {
    ARTICLES.clear();
    const pageName = (data && data.page && data.page.name) || FACEBOOK_CONFIG.PAGE_NAME;
    (posts || []).forEach(p => {
      ARTICLES.set(String(p.id), {
        id: String(p.id),
        title: p.title || '',
        date: p.date || '',
        image: p.image || null,
        body: p.content || p.snippet || '',
        sourceName: pageName,
        sourceUrl: p.url || ('https://www.facebook.com/' + p.id)
      });
    });
  }

  /* ---------- Native article card (.update PART 2 — no FB branding) ---------- */
  function buildCard(p, lng, featured) {
    const am = lng === 'am';
    const title = p.title || (am ? 'ዜና' : 'News');
    const dateTxt = am ? formatDateAm(p.date) : formatDateEn(p.date);
    const img = p.image
      ? `<img src="${esc(p.image)}" alt="${esc(title)}" loading="lazy">`
      : `<span class="news-thumb-fallback"><i class="fa-solid fa-newspaper"></i></span>`;
    return `
    <article class="news-card${featured ? ' news-featured' : ''}" data-news-id="${esc(String(p.id))}">
      <figure class="news-thumb">${img}</figure>
      <div class="news-wrap">
        <time class="news-date" datetime="${esc(p.date || '')}"><i class="fa-regular fa-calendar"></i>${esc(dateTxt)}</time>
        <h3 class="news-title">${esc(title)}</h3>
        ${p.snippet ? `<p class="news-excerpt">${esc(p.snippet)}</p>` : ''}
        <div class="news-foot">
          <button type="button" class="news-more" data-article="${esc(String(p.id))}">
            <i class="fa-solid fa-book-open"></i>${esc(am ? 'ተጨማሪ ያንብቡ' : 'Read More')}
          </button>
          <span class="news-src-sub">${esc(sourceLabel(am))}</span>
        </div>
      </div>
    </article>`;
  }

  function showLoading(grid) {
    grid.innerHTML = Array(3).fill(`
      <div class="news-card animate-pulse">
        <div style="height:12rem;background:rgba(127,127,127,.14)"></div>
        <div class="p-6 space-y-3">
          <div style="height:.9rem;width:40%;border-radius:.5rem;background:rgba(127,127,127,.14)"></div>
          <div style="height:.9rem;border-radius:.5rem;background:rgba(127,127,127,.14)"></div>
          <div style="height:.9rem;width:66%;border-radius:.5rem;background:rgba(127,127,127,.14)"></div>
        </div>
      </div>`).join('');
  }
  function showError(grid, message) {
    const am = lang() === 'am';
    const label = am ? ('መረጃውን ማምጣት አልተቻለም። ' + (message || '')) : ('Unable to load the latest updates. ' + (message || ''));
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <i class="fa-solid fa-wifi text-4xl" style="color:rgba(127,127,127,.4)"></i>
        <p class="mt-4 prose-body text-lg" style="color:var(--muted)">${esc(label)}</p>
        <button class="btn btn-gold mt-6" onclick="FACEBOOK_NEWS.refresh()">${am ? 'እንደገና ይሞክሩ' : 'Try Again'}</button>
      </div>`;
  }

  /* ---------- Full article view (native — stays on the website) ---------- */
  function openArticle(id) {
    const a = ARTICLES.get(String(id));
    const sheet = document.getElementById('newsSheet');
    const modal = document.getElementById('newsModal');
    if (!a || !sheet || !modal) return;
    const am = lang() === 'am';
    const img = a.image
      ? `<img src="${esc(a.image)}" alt="${esc(a.title || '')}" class="news-article-img">`
      : `<div class="news-article-img news-article-img-fallback"><i class="fa-solid fa-newspaper"></i></div>`;
    const paras = String(a.body || '').split(/\n+/).map(s => s.trim()).filter(Boolean)
      .map(s => `<p>${esc(s)}</p>`).join('');
    sheet.innerHTML = `
      ${img}
      <div class="p-6 sm:p-8">
        <time class="news-date" datetime="${esc(a.date)}"><i class="fa-regular fa-calendar"></i>${esc(am ? formatDateAm(a.date) : formatDateEn(a.date))}</time>
        <h3 class="news-article-title">${esc(a.title || (am ? 'ዜና' : 'News'))}</h3>
        <div class="news-article-body">${paras || `<p>${esc(am ? 'ሙሉ ጽሁፍ በመጀመሪያው ምንጭ ላይ ይገኛል።' : 'Full text is available at the original source.')}</p>`}</div>
        <div class="news-article-source">
          <span>${esc(sourceLabel(am))}</span>
          <a class="news-src-link" href="${esc(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>${esc(am ? 'የመጀመሪያውን ምንጭ ይመልከቱ' : 'View Original Source')}
          </a>
        </div>
        <button type="button" class="btn btn-gold mt-6" id="newsSheetClose"><i class="fa-solid fa-xmark"></i>${esc(am ? 'ዝጋ' : 'Close')}</button>
      </div>`;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (history.replaceState) history.replaceState(null, '', '#news/' + encodeURIComponent(a.id));
    const btn = document.getElementById('newsSheetClose');
    if (btn) btn.addEventListener('click', closeArticle);
  }
  function closeArticle() {
    const modal = document.getElementById('newsModal');
    if (modal && modal.classList.contains('open')) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (String(location.hash).indexOf('#news/') === 0 && history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }
  }
  function tryDeepLink() {
    const m = /^#news\/(.+)$/.exec(String(location.hash));
    if (m && ARTICLES.size) openArticle(decodeURIComponent(m[1]));
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeArticle(); });
  window.addEventListener('hashchange', tryDeepLink);

  /* ---------- Rendering ---------- */
  function renderPosts(data, gridEl) {
    const am = lang() === 'am';
    const posts = (data.posts || []).slice(0, FACEBOOK_CONFIG.POSTS_LIMIT);
    registerArticles(data, posts);
    if (!posts.length) {
      gridEl.innerHTML = `<p class="text-center py-10 prose-body" style="color:var(--muted)">${am ? 'ምንም ዜና የለም።' : 'No posts yet.'}</p>`;
      return;
    }
    gridEl.innerHTML = posts.map((p, i) => buildCard(p, lang(), i === 0 && FACEBOOK_CONFIG.FEATURED_LAYOUT)).join('');
    gridEl.querySelectorAll('[data-article]').forEach(btn =>
      btn.addEventListener('click', () => openArticle(btn.getAttribute('data-article'))));
    tryDeepLink();
  }
  async function load(gridEl) {
    try {
      const data = await fetchFresh();
      refreshCache(data);
      renderPosts(data, gridEl);
    } catch (err) {
      writeErrorState(String(err.message));
      showError(gridEl, String(err.message));
    }
  }
  /* Public entry point — wire a grid element and start loading fresh (cached data wins on repeat visits). */
  function init(gridEl) {
    if (!gridEl) return;
    container = gridEl;
    const cached = readCache();
    if (cached) renderPosts(cached.payload, gridEl);
    showLoading(gridEl);
    load(gridEl);
  }
  function backgroundRefresh(gridEl) {
    try { setTimeout(() => fetchFresh().then(d => { refreshCache(d); renderPosts(d, gridEl); }).catch(() => {}), 0); }
    catch { /* keep served cache on failure */ }
  }
  function refresh() {
    if (!container) return;
    showLoading(container);
    load(container);
  }
  /* Re-render from cache on language switch (falls back to refresh) */
  function rerender() {
    if (!container) return;
    const cached = readCache();
    if (cached) renderPosts(cached.payload, container);
    else refresh();
  }

  return { init, refresh, rerender, renderPosts, formatDateAm, formatDateEn };
})();

/* ---------- Global helper (kept for backward compatibility) ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
