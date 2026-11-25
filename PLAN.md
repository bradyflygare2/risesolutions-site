# risesolutions.ai copy: static site off GHL

Decisions (Nov 25, 2026): own code in a GitHub repo, hosted on Cloudflare like staffhuddle.ai.
Keep GHL forms, booking calendar and chat widget embedded so leads still land in GHL.

## Pages (sitemap, 18)
/ , /riseai-reception , /rise-messaging , /digitalmarketing , /contact , /about-us , /faqs ,
/privacy-policy , /term-of-service , /blogs , /senior-living , /real-estate
/post/schedule-senior-living-tour-call , /post/modern-business-communication-solutions-ai ,
/post/capture-more-leads-inbound-calls , /post/customers-prefer-text-messaging-business ,
/post/customers-expect-24-7-availability , /post/easy-ai-receptionist-setup-guide
Plus pages not in the sitemap (client support and others) to confirm.

## Steps
1. Capture: each page's full HTML, head tags (title, meta, JSON-LD, page CSS), custom code block (RB-START..RB-END).
2. Inventory: images and files on GHL CDN, GHL embeds (forms, calendar, chat), Retell orb, tracking (GA, Meta pixel).
3. Build: shared header and footer once, one file per page, build script to dist/ like staffhuddle.
4. Images: copy to the repo so the site doesn't depend on GHL file hosting.
5. Redirects: keep every URL the same; add redirects for old URLs.
6. Test on a preview URL: desktop, tablet, phone, forms, orb, chat, booking.
7. Go live: point risesolutions.ai DNS to Cloudflare. Brady approves this step.

## More decisions (Nov 25, 2026, Brady let Claude decide)
- Repo: new public GitHub repo bradyflygare2/risesolutions-site (public so Claude can clone it; no secrets in it), same setup as staffhuddle-site.
- Blog: moves into the static site; posts as files, same URLs (/post/<slug>, /blogs). New posts published by Claude on request.

## Capture done (Nov 25, 2026)
- Full HTML of 26 URLs saved to capture/pages.json (GHL nuxt data scripts over 40KB stripped). Source: public repo bradyflygare2/risesolutions-site, capture/pages.0-5.b64 (gzip+base64 JSON).
- Main pages each have one custom code block (RB-START/RB-END); /blogs has 2.
- GHL embeds on every page: form aneteSXBOsIm6iFyjYeO (site-wide), booking widget bradyriseconsult. /contact form LO8kFRxfhMxARJNyO3qa. /clientsupport form di5uGq4ukxbHkYDnMsP7.
- Real blog posts (GHL blog): schedule-senior-living-tour-call, modern-business-communication-solutions-ai, ai-for-staffing-and-hiring, follow-up-on-marketing-leads. Blog index pages under /rise-solutions-ai/ (category, tags, author).
- Sitemap /post URLs that actually serve a service page (canonical points there): capture-more-leads-inbound-calls, customers-expect-24-7-availability, easy-ai-receptionist-setup-guide -> /riseai-reception; customers-prefer-text-messaging-business -> /rise-messaging. Make these 301 redirects.

## /cx/ mystery shopping reports (decided Nov 25, 2026)
- 9 reports today (/cx/<code>/<name>), GHL pages, noindex, each with site header/footer in custom code.
- Keep them in GHL. New site proxies /cx/* to the GHL copy and swaps in the current shared header/footer on the fly. Do NOT copy report content into the public repo.
- Grokbot keeps creating reports in GHL as today. Need from Grokbot at go-live: the GHL address the reports stay reachable at.
- Header on phones: do NOT use a ::before cover above the sticky header (made it shake on iPhone Safari). Use .rz .hdr{box-shadow:0 -2px 0 #1E4FA3} to close the seam. Live on GHL home Nov 25.
- iPhone Safari shake/white line: likely from overflow-x on <html>. Trial fix on GHL home Nov 25: html{overflow-x:visible} body{overflow-x:clip}, like staffhuddle.ai. If Brady confirms, use this sitewide in the new site.
- Nov 25 home fixes on GHL (pending Brady's iPhone check): hero .glow parallax off (scroll listener moved it every frame; only home has it), header shadow only below the bar (0 10px 20px -10px) since the old 0 2px 20px shadow spread above it. Carry both into the new site if they work.
- CONFIRMED Nov 25 (Brady, iPhone Safari): home header shake and white line fixed by pinning the header with position:fixed on screens up to 1024px (.rz>.hdr fixed top:0, .rz padding-top:74px). Only home had the problem. Also live on home from testing: glow parallax off, header shadow below only, html overflow-x visible/body clip. In the new site, build the header as fixed on phones and drop the glow parallax.
- Nov 25 home on phones (<=900px): order is headline, intro text, orb card, highlights list, then the report button (moved under "50+ languages"). Live on GHL via head CSS plus a script that clones the button into .trust. Desktop unchanged. Build this order directly in the new site.
- Nov 25 home orb: idle breathing pulse on all screens (rzOrbBreath 2.4s, scale 1 to 1.08 with a brighter glow), only while waiting to be tapped, off for reduced-motion. Phones: 16px space between headline and intro text.
- Nov 25 home orb: swirl canvas (.orbv2-c) spins one turn every 10s on all screens, off for reduced-motion.

## Build status (Nov 25, 2026)
- Repo builds with `node build.js` into dist/: 13 pages, /blogs list, 4 posts (src/posts/<slug>/post.json + content.html), 404 page, _redirects.
- New post: add src/posts/<slug>/post.json and content.html, push. The list and post page are generated.
- Images and audio copied off GHL into public/media/ by tools/images.js (runs in GitHub Actions).
- Site-wide head code (Meta pixel 644709328543788, GA4 G-76PWQWRQXB, shared style fixes) in src/partials/tracking.html, added to every page.
- Cloudflare: worker.js + wrangler.jsonc (Workers static assets, drop-trailing-slash). Build command `node build.js`.
- worker.js passes these to GHL at GHL_ORIGIN (set at go-live): /cx/* reports (menu and footer swapped in, noindex) and the paid marketing funnel
  (/marketing-plans, /funnel-landing, /marketing-agreement, /marketing-checkout*, /marketing-welcome, /funnel-welcome, /marketing-onboarding).
- Go-live needs: a second GHL domain for the reports and the funnel (for example go.risesolutions.ai) and GHL_ORIGIN set to it.
