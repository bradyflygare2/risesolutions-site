// Cloudflare Worker for risesolutions.ai.
// Static pages in dist/ are served directly. This code only runs for addresses that are not a file:
//  - /cx/... mystery shopping reports stay in GHL. We fetch them from GHL and swap in today's menu and footer.
//  - the marketing funnel (plans, agreement, checkout, welcome, onboarding) stays in GHL and passes through as is.
//  - anything else gets the 404 page.
import HEADER from './src/partials/header.html';
import FOOTER from './src/partials/footer.html';

const FUNNEL = ['/marketing-plans', '/funnel-landing', '/marketing-agreement', '/marketing-checkout',
  '/marketing-checkout-minimum', '/marketing-checkout-growth', '/marketing-checkout-complete',
  '/marketing-welcome', '/funnel-welcome', '/marketing-onboarding'];

const fromGhl = (request, env, url) => fetch(new Request(new URL(url.pathname + url.search, env.GHL_ORIGIN), request), { redirect: 'manual' });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (env.GHL_ORIGIN && FUNNEL.includes(path)) return fromGhl(request, env, url);
    if (env.GHL_ORIGIN && url.pathname.startsWith('/cx/')) {
      const res = await fromGhl(request, env, url);
      if (res.ok && (res.headers.get('content-type') || '').includes('text/html')) {
        const out = new HTMLRewriter()
          .on('header.hdr', { element(e) { e.replace(HEADER, { html: true }); } })
          .on('footer.ftr', { element(e) { e.replace(FOOTER, { html: true }); } })
          .transform(res);
        const h = new Headers(out.headers);
        h.set('x-robots-tag', 'noindex');
        return new Response(out.body, { status: res.status, headers: h });
      }
      if (res.status !== 404) return res;
    }
    const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url), request));
    return new Response(nf.body, { status: 404, headers: nf.headers });
  },
};
