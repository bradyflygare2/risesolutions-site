// Builds the static risesolutions.ai site into dist/.
// Each page lives in src/pages/<slug>/ with head.html (title, meta, styles) and body.html (page content).
// Blog posts live in src/posts/<slug>/ with post.json (title, date, image...) and content.html.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://risesolutions.ai';
const ROUTES = {
  home: '/', 'riseai-reception': '/riseai-reception', 'rise-messaging': '/rise-messaging',
  digitalmarketing: '/digitalmarketing', contact: '/contact', 'about-us': '/about-us', faqs: '/faqs',
  'privacy-policy': '/privacy-policy', 'term-of-service': '/term-of-service', blogs: '/blogs',
  'senior-living': '/senior-living', 'real-estate': '/real-estate', clientsupport: '/clientsupport',
};
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const rel = (u) => u.replace(SITE, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const HEADER = read('src/partials/header.html');
const FOOTER = read('src/partials/footer.html');
// Site-wide head code from GHL website settings: Meta pixel, Google tag and shared style fixes.
const TRACK = read('src/partials/tracking.html');
const BLOG_CSS = `<style id="rz-blog">\n${read('src/partials/blog.css')}</style>\n`;
// Marks the current page's menu links so the menu shows where you are.
const headerFor = (url) => HEADER.split(`<a href="${url}"`).join(`<a href="${url}" aria-current="page"`);
const page = (head, body) => `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}${TRACK}\n</head>\n<body>\n${body}</body>\n</html>\n`;
const write = (url, html) => {
  const dir = url === '/' ? OUT : path.join(OUT, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
};
const fill = (body, url) => {
  const out = body.replace('<!--@HEADER-->', headerFor(url)).replace('<!--@FOOTER-->', FOOTER);
  if (out.includes('<!--@')) throw new Error(`unfilled partial in ${url}`);
  return out;
};

// Posts, newest first.
const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const posts = fs.readdirSync(path.join(ROOT, 'src/posts'))
  .map((slug) => ({ ...JSON.parse(read(`src/posts/${slug}/post.json`)), content: read(`src/posts/${slug}/content.html`) }))
  .sort((a, b) => b.date.localeCompare(a.date));
const card = (p) => `<a class="rzb-card" href="/post/${p.slug}"><img src="${esc(rel(p.image))}" alt="" loading="lazy" width="1200" height="675"><div class="pc-body"><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><span class="post-meta">${fmtDate(p.date)} &middot; ${esc(p.readTime)}</span><span class="more">Read the post</span></div></a>`;
const POST_LIST = `<section class="sec"><div class="wrap"><div class="rzb-grid">${posts.map(card).join('')}</div></div></section>`;

fs.rmSync(OUT, { recursive: true, force: true });
for (const [slug, url] of Object.entries(ROUTES)) {
  let head = read(`src/pages/${slug}/head.html`);
  let body = read(`src/pages/${slug}/body.html`);
  if (slug === 'blogs') { head += BLOG_CSS; body = body.replace('<!--@POSTS-->', POST_LIST); }
  write(url, page(head, fill(body, url)));
}

// Post pages reuse the privacy policy page's frame: same styles, header, footer and scripts.
const frameHead = read('src/pages/privacy-policy/head.html')
  .split('\n').filter((l) => !/^<(title|meta|link rel="canonical")/.test(l)).join('\n');
const frame = read('src/pages/privacy-policy/body.html');
const pre = frame.slice(0, frame.indexOf('<section class="hero page-hero">'));
const post = frame.slice(frame.indexOf('</main>'));
for (const p of posts) {
  const url = `/post/${p.slug}`;
  const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description,
    image: p.image, datePublished: p.date, author: { '@type': 'Person', name: p.author },
    publisher: { '@type': 'Organization', name: 'Rise AI Solutions', url: SITE }, mainEntityOfPage: SITE + url };
  const head = `<title>${esc(p.seoTitle || p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${SITE}${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${esc(p.image)}">
<meta property="og:url" content="${SITE}${url}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${frameHead}\n${BLOG_CSS}`;
  const body = `${pre}<section class="hero page-hero post-hero"><div class="wrap"><span class="eyebrow">Rise&#160;AI Blog</span><h1>${esc(p.title)}</h1><p class="post-meta">${fmtDate(p.date)} &middot; ${esc(p.readTime)}</p></div></section><main id="main"><section class="sec"><div class="wrap"><article class="rzb-post"><img class="post-cover" src="${esc(rel(p.image))}" alt="${esc(p.title)}" width="1200" height="675"><div class="post-body">
${p.content}</div><div class="post-author">By ${esc(p.author)}, Founder of Rise&#160;AI Solutions</div><a class="post-back" href="/blogs">&larr; All posts</a></article></div></section>${post}`;
  write(url, page(head, fill(body, '/blogs')));
}

// 404 page in the same frame.
fs.writeFileSync(path.join(OUT, '404.html'), page(`<title>Page not found | Rise AI Solutions</title>\n<meta name="robots" content="noindex">\n${frameHead}\n`,
  fill(`${pre}<section class="hero page-hero"><div class="wrap"><span class="eyebrow">404</span><h1>We couldn't find that page</h1><p class="lead">The link may be old. Try the menu above or head back home.</p><p><a class="btn btn-cta" href="/"><span class="btn-label">Go to the home page</span></a></p></div></section><main id="main">${post}`, '/404')));

// Embeddable home hero with the working orb (shown on staffhuddle.ai). No menu, footer or tracking.
{
  const home = read('src/pages/home/body.html');
  const open = home.match(/<div class="rz"[^>]*>/)[0];
  const hs = home.indexOf('<section class="hero">');
  const he = home.indexOf('</section>', hs) + '</section>'.length;
  const hero = home.slice(hs, he)
    .replace(/<div class="hero-ctas">[\s\S]*?<\/a><\/div>/, '')
    .replace(/<a /g, '<a target="_top" ');
  const SKIP = ['form_embed', 'RZ_BOOK', "FID='", '[data-sample-call]', '"duration"', 'application/ld+json'];
  const extras = ((home.slice(0, hs).match(/<style\b[\s\S]*?<\/style>/g) || []).concat(home.slice(he).match(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/g) || []))
    .filter((b) => b.startsWith('<style') || !SKIP.some((k) => b.includes(k)));
  const fit = '<script>(function(){function s(){try{var h=document.querySelector(".rz .hero");parent.postMessage({riseHeroHeight:Math.ceil(h.getBoundingClientRect().bottom)},"*")}catch(e){}}addEventListener("load",function(){s();setTimeout(s,800);setTimeout(s,2500)});addEventListener("resize",s)})();</script>';
  const head = read('src/pages/home/head.html').split('\n').filter((l) => !/^<(title|meta|link rel="canonical")/.test(l)).join('\n');
  const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex">\n<title>Rise AI Virtual Reception demo</title>\n${head}${(TRACK.match(/<style\b[\s\S]*?<\/style>/g) || []).join('\n')}\n<style>html,body{margin:0;background:transparent}.rz{padding-top:0!important}.rz .hero{padding-top:56px!important;padding-bottom:56px!important}@media (max-width:900px){.rz .hero{padding-top:28px!important;padding-bottom:28px!important}}</style>\n</head>\n<body>\n${open}\n${hero}\n</div>\n${extras.join('\n')}\n${fit}\n</body>\n</html>\n`;
  fs.mkdirSync(path.join(OUT, 'embed/hero'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'embed/hero/index.html'), html);
}

// Static files (images and media copied off GHL hosting).
if (fs.existsSync(path.join(ROOT, 'public'))) fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
// Sitemap and robots.txt so search engines find every page.
const today = new Date().toISOString().slice(0, 10);
const urls = [...Object.values(ROUTES).filter((u) => u !== '/clientsupport').map((u) => [u, today]), ...posts.map((p) => [`/post/${p.slug}`, p.date])];
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `<url><loc>${SITE}${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /cx/\nDisallow: /embed/\n\nSitemap: ${SITE}/sitemap.xml\n`);
// Cloudflare redirects: old GHL blog addresses.
fs.copyFileSync(path.join(ROOT, 'src/_redirects'), path.join(OUT, '_redirects'));
console.log('built', Object.keys(ROUTES).length, 'pages and', posts.length, 'posts');
