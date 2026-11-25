// One-time import of the GHL site into src/. Reads capture/pages.N.b64 (gzip JSON of each page's HTML),
// writes src/pages/<slug>/head.html and body.html plus src/partials/header.html and footer.html.
// Also applies the Nov 25, 2026 fixes made on the live GHL home page.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const cap = path.join(ROOT, 'capture');
const b64 = fs.readdirSync(cap).filter((f) => /^pages\.\d+\.b64$/.test(f))
  .sort((a, b) => parseInt(a.split('.')[1]) - parseInt(b.split('.')[1]))
  .map((f) => fs.readFileSync(path.join(cap, f), 'utf8').replace(/\s+/g, '')).join('');
const pages = JSON.parse(zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'));

const MAINS = ['/', '/riseai-reception', '/rise-messaging', '/digitalmarketing', '/contact', '/about-us', '/faqs',
  '/privacy-policy', '/term-of-service', '/blogs', '/senior-living', '/real-estate', '/clientsupport'];
const SKIP_STYLE = ['--transparent: transparent', '--sticky-header-height', '.c-row>.inner{flex-direction', 'Font Awesome',
  '--animate-duration', '.testimonial-modal-overlay', 'html,body{background:#EAF3FF!important'];
const dec = (h) => { const k = parseInt(h.slice(0, 2), 16); let s = ''; for (let i = 2; i < h.length; i += 2) s += String.fromCharCode(parseInt(h.slice(i, i + 2), 16) ^ k); return s; };
const cleanEmail = (s) => s
  .replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g, (m, h) => `<a href="mailto:${dec(h)}">${dec(h)}</a>`)
  .replace(/\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/g, (m, h) => 'mailto:' + dec(h))
  .replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/span>/g, (m, h) => dec(h))
  .replace(/<script[^>]*cdn-cgi[^>]*><\/script>/g, '');

const HOME_CSS = fs.readFileSync(path.join(__dirname, 'home-fixes.css'), 'utf8');
let header = null, footer = null;
for (const url of MAINS) {
  const h = pages[url];
  const head = h.slice(0, h.indexOf('</head>'));
  const keep = [];
  keep.push(head.match(/<title[^>]*>[\s\S]*?<\/title>/)[0].replace(/<title[^>]*>/, '<title>'));
  for (const m of head.matchAll(/<meta\b[^>]*>/g)) if (/name="(description|robots|keywords|author)"|property="og:|name="twitter:|name="theme-color"/.test(m[0])) keep.push(m[0]);
  for (const m of head.matchAll(/<link\b[^>]*>/g)) if (/rel="(canonical|icon|apple-touch-icon)"/.test(m[0])) keep.push(m[0]);
  for (const m of head.matchAll(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g)) keep.push(m[0]);
  for (const m of head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) if (!SKIP_STYLE.some((k) => m[1].includes(k))) keep.push(`<style>${m[1]}</style>`);
  let body = (h.match(/<!-- RB-START [\s\S]*?<!-- RB-END[^>]*-->/g) || []).join('\n');
  body = cleanEmail(body);
  const hdr = body.match(/<header class="hdr"[\s\S]*?<\/header>/)[0];
  const ftr = body.match(/<footer class="ftr"[\s\S]*?<\/footer>/)[0];
  if (url === '/') { header = hdr.split(' aria-current="page"').join(''); footer = ftr; }
  body = body.replace(hdr, '<!--@HEADER-->').replace(ftr, '<!--@FOOTER-->');
  let headOut = cleanEmail(keep.join('\n')) + '\n';
  if (url === '/') {
    body = body.replace('<span class="eyebrow">For senior living, real estate and growing businesses</span>\n', '');
    const cta = body.match(/<div class="hero-ctas">[\s\S]*?<\/a><\/div>/)[0];
    const end = '</li></ul></div></section>';
    const i = body.indexOf('<section class="trust"'); const j = body.indexOf(end, i);
    body = body.slice(0, j) + '</li></ul>' + cta.replace('class="hero-ctas"', 'class="hero-ctas cta-m"') + '</div></section>' + body.slice(j + end.length);
    headOut += `<style id="rz-home-fixes">\n${HOME_CSS}</style>\n`;
  }
  const slug = url === '/' ? 'home' : url.slice(1);
  fs.mkdirSync(path.join(ROOT, 'src/pages', slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'src/pages', slug, 'head.html'), headOut);
  fs.writeFileSync(path.join(ROOT, 'src/pages', slug, 'body.html'), body + '\n');
}
fs.mkdirSync(path.join(ROOT, 'src/partials'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/partials/header.html'), header);
fs.writeFileSync(path.join(ROOT, 'src/partials/footer.html'), footer);
console.log('extracted', MAINS.length, 'pages');
