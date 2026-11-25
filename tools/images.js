// Copies images and media off GHL hosting into public/media/ and points src/ at the copies.
// Runs in GitHub Actions (the runner can reach the GHL file hosts). Files already downloaded are kept.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://risesolutions.ai';
const MEDIA = path.join(ROOT, 'public/media');
const RE = /(?:https:\/\/images\.leadconnectorhq\.com\/image\/[^"'\s)<>]*?u_)?https:\/\/(?:files\.leadconnectorhq\.com\/file|assets\.cdn\.filesafe\.space|storage\.googleapis\.com\/msgsndr)\/[^"'\s)<>?]+?\.(?:png|jpe?g|webp|gif|svg|ico|mp3|mp4)/gi;
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(html|json|css)$/.test(f)) files.push(p); } };
walk(path.join(ROOT, 'src'));
const nameFor = (url) => {
  const inner = url.replace(/^.*u_(https:)/, '$1');
  const parts = inner.split('/');
  let name = parts.pop();
  if (/^(image|file)\.\w+$/.test(name) || /^[0-9a-f-]{24,}\.\w+$/.test(name)) name = `${parts.pop()}-${name}`;
  name = name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  if (url.includes('images.leadconnectorhq.com')) name = name.replace(/\.\w+$/, '') + '.webp';
  return name;
};
(async () => {
  const urls = new Set();
  for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(RE)) urls.add(m[0]);
  if (process.env.DRY) { for (const u of urls) console.log(nameFor(u), u.slice(0, 90)); return; }
  fs.mkdirSync(MEDIA, { recursive: true });
  const map = {};
  for (const url of urls) {
    const name = nameFor(url);
    map[url] = `/media/${name}`;
    const out = path.join(MEDIA, name);
    if (fs.existsSync(out)) continue;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log('saved', name);
  }
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    let t = s;
    for (const k of keys) t = t.split(k).join(map[k]);
    // Social previews and structured data need full addresses.
    t = t.replace(/(content=")\/media\//g, `$1${SITE}/media/`).replace(/("(?:image|logo|url)"\s*:\s*")\/media\//g, `$1${SITE}/media/`);
    if (f.endsWith('post.json')) t = t.replace(/"image": "\/media\//, `"image": "${SITE}/media/`);
    if (t !== s) fs.writeFileSync(f, t);
  }
  console.log('media', urls.size);
})().catch((e) => { console.error(e); process.exit(1); });
