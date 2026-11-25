// Builds the static risesolutions.ai site into dist/.
// Each page lives in src/pages/<slug>/ with head.html (title, meta, styles) and body.html (page content).
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const ROUTES = {
  home: '/', 'riseai-reception': '/riseai-reception', 'rise-messaging': '/rise-messaging',
  digitalmarketing: '/digitalmarketing', contact: '/contact', 'about-us': '/about-us', faqs: '/faqs',
  'privacy-policy': '/privacy-policy', 'term-of-service': '/term-of-service', blogs: '/blogs',
  'senior-living': '/senior-living', 'real-estate': '/real-estate', clientsupport: '/clientsupport',
};
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const HEADER = read('src/partials/header.html');
const FOOTER = read('src/partials/footer.html');
// Marks the current page's menu links so the menu shows where you are.
const headerFor = (url) => HEADER.split(`<a href="${url}"`).join(`<a href="${url}" aria-current="page"`);
fs.rmSync(OUT, { recursive: true, force: true });
for (const [slug, url] of Object.entries(ROUTES)) {
  const head = read(`src/pages/${slug}/head.html`);
  const body = read(`src/pages/${slug}/body.html`)
    .replace('<!--@HEADER-->', headerFor(url))
    .replace('<!--@FOOTER-->', FOOTER);
  if (body.includes('<!--@')) throw new Error(`unfilled partial in ${slug}`);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${head}</head>
<body>
${body}</body>
</html>
`;
  const dir = url === '/' ? OUT : path.join(OUT, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
console.log('built', Object.keys(ROUTES).length, 'pages');
