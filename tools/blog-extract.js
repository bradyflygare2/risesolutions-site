// One-time import of the 4 GHL blog posts into src/posts/<slug>/ (post.json + content.html),
// and the /blogs page without the GHL blog widget (build.js adds the post list).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const cap = path.join(ROOT, 'capture');
const b64 = fs.readdirSync(cap).filter((f) => /^pages\.\d+\.b64$/.test(f))
  .sort((a, b) => parseInt(a.split('.')[1]) - parseInt(b.split('.')[1]))
  .map((f) => fs.readFileSync(path.join(cap, f), 'utf8').replace(/\s+/g, '')).join('');
const pages = JSON.parse(zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'));

const POSTS = ['ai-for-staffing-and-hiring', 'follow-up-on-marketing-leads', 'schedule-senior-living-tour-call',
  'modern-business-communication-solutions-ai'];
const attr = (html, re) => { const m = html.match(re); return m ? m[1] : ''; };
const unent = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

for (const slug of POSTS) {
  const h = pages['/post/' + slug];
  const head = h.slice(0, h.indexOf('</head>'));
  const body = h.slice(h.indexOf('<body'));
  const start = body.indexOf('<div class="blog-html" id="blogPostContent">');
  const inner = body.slice(start);
  const re = /<(\/?)div\b[^>]*>/g; let d = 0, m, end = -1;
  while ((m = re.exec(inner))) { d += m[1] ? -1 : 1; if (d === 0) { end = m.index; break; } }
  let content = inner.slice(inner.indexOf('>') + 1, end);
  content = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(style|data-indent)=("[^"]*"|'[^']*')/g, '')
    .replace(/href=(["'])https:\/\/risesolutions\.ai\/?/g, 'href=$1/')
    .replace(/<p><br><br><\/p>/g, '')
    .replace(/(<br>\s*){2,}/g, '\n')
    .replace(/<p>\s*<\/p>/g, '');
  // Quote single-quoted attributes the GHL editor wrote.
  content = content.replace(/(\s[a-z-]+)='([^']*)'/g, (x, a, v) => `${a}="${v.replace(/"/g, '&quot;')}"`);
  const dateText = attr(body, /<span class="blog-date">([^<]+)<\/span>/);
  const [mon, day, yr] = dateText.replace(',', '').split(' ');
  const iso = `${yr}-${String(MONTHS.indexOf(mon) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const meta = {
    slug,
    title: unent(attr(body, /<h1 class="header-title blog-content-title">([^<]+)<\/h1>/)),
    seoTitle: unent(attr(head, /<title>([^<]+)<\/title>/)),
    description: unent(attr(head, /<meta name="description" content="([^"]*)"/)),
    image: attr(body, /<img class="[^"]*header-image[^"]*" src="([^"]+)"/),
    date: iso,
    readTime: attr(body, /<span class="blog-read-time">([^<]+)<\/span>/),
    author: 'Brady Flygare',
  };
  fs.mkdirSync(path.join(ROOT, 'src/posts', slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'src/posts', slug, 'post.json'), JSON.stringify(meta, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, 'src/posts', slug, 'content.html'), content.trim() + '\n');
}

// /blogs: keep the top part only and let its own main and footer show.
const blogs = path.join(ROOT, 'src/pages/blogs/body.html');
let b = fs.readFileSync(blogs, 'utf8');
const cut = b.indexOf('<!-- RB-START blogs-2');
if (cut > 0) b = b.slice(0, cut);
b = b.replace(' data-part="top"', '');
if (!b.includes('<!--@POSTS-->')) b = b.replace('<main id="main">\n', '<main id="main">\n<!--@POSTS-->\n');
fs.writeFileSync(blogs, b);
console.log('posts', POSTS.length);
