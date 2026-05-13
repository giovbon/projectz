#!/usr/bin/env bash
# build-gh-pages.sh
# Pre-renders markdown content into static JSON files for GitHub Pages mode.
#
# This script converts the content/ directory into JSON files that the
# Preact frontend can fetch at runtime on GitHub Pages (no backend).
# Uses Node.js (available in CI) and the `marked` library.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT_DIR="$ROOT_DIR/content"
OUTPUT_DIR="$ROOT_DIR/gh-pages/projectz/api"

mkdir -p "$OUTPUT_DIR/pages"
mkdir -p "$OUTPUT_DIR/slides"

echo "🔨 Building static API for GitHub Pages..."

# The Node.js script below will:
# 1. Scan content/ recursively
# 2. Parse frontmatter from each .md file
# 3. Render markdown → HTML using marked
# 4. Split slides when type: slides
# 5. Output menu.json and individual page JSONs

node -e "
const fs = require('fs');
const path = require('path');

// Try to require marked from the web/ directory
let marked;
try {
  marked = require('$ROOT_DIR/web/node_modules/marked').marked;
} catch {
  // Fallback: simple markdown renderer
  marked = { parse: (md) => {
    let h = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, '<pre><code class=\"language-\$1\">\$2</code></pre>')
      .replace(/\`([^\`]+)\`/g, '<code>\$1</code>')
      .replace(/^#### (.+)$/gm, '<h4>\$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>\$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>\$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>\$1</h1>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>\$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>\$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>\$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href=\"\$2\">\$1</a>')
      .replace(/^- (.+)$/gm, '<li>\$1</li>')
      .replace(/(<li>.*<\\/li>\\n?)+/g, '<ul>\$&</ul>');
    return '<p>' + h.replace(/\\n\\n/g, '</p><p>') + '</p>';
  }};
}

const CONTENT_DIR = '$CONTENT_DIR';
const OUTPUT_DIR = '$OUTPUT_DIR';

function parseFrontmatter(raw) {
  let body = raw;
  const fm = {};

  // Normalize line endings
  raw = raw.replace(/\\r\\n/g, '\\n');

  if (raw.startsWith('---')) {
    const end = raw.indexOf('---', 3);
    if (end !== -1) {
      const fmText = raw.slice(3, end).trim();
      body = raw.slice(end + 3).trim();
      for (const line of fmText.split('\\n')) {
        const idx = line.indexOf(':');
        if (idx !== -1) {
          fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      }
    }
  }
  return { fm, body };
}

function extractTitle(body) {
  const m = body.match(/^#\\s+(.+)/m);
  return m ? m[1].trim() : 'Untitled';
}

const sections = [];

function walk(dir, prefix, allFiles) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, prefix ? prefix + '/' + e.name : e.name, allFiles);
    } else if (e.name.endsWith('.md')) {
      const slug = (prefix ? prefix + '/' + e.name : e.name).replace(/\\.md\$/, '');
      const raw = fs.readFileSync(full, 'utf-8').replace(/\\r\\n/g, '\\n');
      const { fm, body } = parseFrontmatter(raw);
      const title = fm.title || extractTitle(body);
      const html = marked.parse(body);
      allFiles.set(slug, { title, html, raw, fm, body });
    }
  }
}

// Read all markdown files
const allFiles = new Map();
walk(CONTENT_DIR, '', allFiles);

// Build menu structure
const rootEntries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
for (const e of rootEntries.sort((a, b) => a.name.localeCompare(b.name))) {
  if (e.name.startsWith('.')) continue;

  if (e.isDirectory()) {
    const pages = [];
    for (const [slug, data] of allFiles) {
      if (slug.startsWith(e.name + '/') && !slug.endsWith('/_index')) {
        const pageName = path.basename(slug);
        pages.push({
          title: data.title,
          slug: pageName,
          path: slug + '.md',
          type: data.fm.type || (e.name === 'slides' ? 'slides' : ''),
          theme: data.fm.theme || ''
        });
      }
    }

    if (pages.length > 0) {
      const label = e.name.replace(/[-_]/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
      const stype = e.name === 'slides' ? 'slides' : '';
      sections.push({ label, slug: e.name, pages, type: stype });
    }
  } else if (e.name.endsWith('.md')) {
    const slug = e.name.replace(/\\.md\$/, '');
    const data = allFiles.get(slug);
    if (data) {
      sections.push({
        label: data.title,
        slug,
        pages: [{ title: data.title, slug, path: e.name, type: data.fm.type || '' }]
      });
    }
  }
}

// Write menu.json
fs.writeFileSync(path.join(OUTPUT_DIR, 'menu.json'), JSON.stringify({ sections }, null, 2));
console.log('  ✅ menu.json (' + sections.length + ' sections)');

// Write individual page JSONs
let pageCount = 0;
for (const [slug, data] of allFiles) {
  const pageDir = slug.includes('/') ? slug.substring(0, slug.lastIndexOf('/')) : '';
  const pageName = slug.includes('/') ? slug.substring(slug.lastIndexOf('/') + 1) : slug;
  const pagePath = path.join(OUTPUT_DIR, 'pages', pageDir);
  fs.mkdirSync(pagePath, { recursive: true });

  const { fm, body } = parseFrontmatter(data.raw);
  const theme = fm.theme || 'black';
  const ptype = fm.type || '';

  const pageJson = {
    title: data.title,
    slug: pageName,
    path: slug + '.md',
    html: data.html,
    raw: data.raw,
    type: ptype,
    theme: theme
  };

  fs.writeFileSync(path.join(pagePath, pageName + '.json'), JSON.stringify(pageJson, null, 2));
  pageCount++;
}

console.log('  ✅ ' + pageCount + ' page JSONs generated');
console.log('');
console.log('📦 GitHub Pages build complete → ' + OUTPUT_DIR);
"
