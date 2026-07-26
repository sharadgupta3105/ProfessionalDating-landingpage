#!/usr/bin/env node
/**
 * Netlify build: copy site to dist/, inject env meta tags, write _redirects.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DEFAULT_API =
  'http://promatch-api-env.eba-rt5gymna.ap-south-1.elasticbeanstalk.com';

const apiUrl = (process.env.LINKEDUP_API_URL || DEFAULT_API).replace(/\/$/, '');
const supportEmail = process.env.LINKEDUP_SUPPORT_EMAIL || 'help@matchedin.app';
const useProxy = process.env.LINKEDUP_API_PROXY !== 'false';

const CLEAN_URLS = [
  ['privacy', 'privacy.html'],
  ['terms', 'terms.html'],
  ['faq', 'faq.html'],
  ['safety', 'safety.html'],
  ['contact', 'contact.html'],
  ['delete-account', 'delete-account.html'],
  ['community-guidelines', 'community-guidelines.html'],
  ['play-store-guide', 'play-store-guide.html'],
  ['admin', 'admin.html'],
];

const SKIP = new Set([
  'node_modules',
  'dist',
  'scripts',
  '.git',
  '.env',
  '.env.example',
  'package.json',
  'package-lock.json',
  'link-pages.py',
  'NETLIFY_DEPLOY.md',
  'README.md',
  'DESIGN.md',
  '.gitignore',
  'netlify.toml',
]);

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (SKIP.has(name)) continue;
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

function patchHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  const setMeta = (name, value) => {
    const re = new RegExp(
      `<meta[^>]*name=["']${name}["'][^>]*/>`,
      'i',
    );
    const tag = `<meta content="${value}" name="${name}"/>`;
    if (re.test(html)) {
      html = html.replace(re, tag);
    } else {
      html = html.replace(
        '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>',
        `<meta content="width=device-width, initial-scale=1.0" name="viewport"/>\n${tag}`,
        1,
      );
    }
  };

  setMeta('linkedup-api-url', useProxy ? '' : apiUrl);
  setMeta('linkedup-support-email', supportEmail);
  setMeta('linkedup-api-proxy', useProxy ? 'true' : 'false');

  fs.writeFileSync(filePath, html, 'utf8');
}

function writeRedirects() {
  const lines = [];

  if (useProxy) {
    lines.push(
      '# Proxy API through Netlify (HTTPS site → HTTP backend, avoids mixed-content)',
      `/auth/*  ${apiUrl}/auth/:splat  200`,
      `/users/*  ${apiUrl}/users/:splat  200`,
      `/admin/*  ${apiUrl}/admin/:splat  200`,
      `/subscriptions/*  ${apiUrl}/subscriptions/:splat  200`,
      `/health  ${apiUrl}/health  200`,
      '',
    );
  }

  lines.push('# Clean URLs for Play Console / marketing');
  for (const [slug, file] of CLEAN_URLS) {
    lines.push(`/${slug}  /${file}  200`);
  }

  lines.push('', '# Custom 404');
  lines.push('/*  /404.html  404');

  fs.writeFileSync(path.join(DIST, '_redirects'), lines.join('\n') + '\n', 'utf8');
}

function writeHeaders() {
  const src = path.join(ROOT, '_headers');
  const dest = path.join(DIST, '_headers');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

rimraf(DIST);
fs.mkdirSync(DIST, { recursive: true });
copyRecursive(ROOT, DIST);

const htmlFiles = fs
  .readdirSync(DIST)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(DIST, f));

htmlFiles.forEach(patchHtml);
writeRedirects();
writeHeaders();

console.log('Netlify build complete → dist/');
console.log(`  API: ${apiUrl}`);
console.log(`  Proxy via site origin: ${useProxy}`);
console.log(`  Support: ${supportEmail}`);
console.log(`  HTML files patched: ${htmlFiles.length}`);
