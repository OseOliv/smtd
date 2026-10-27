#!/usr/bin/env node
/**
 * show-me-the-design — zero-dependency preview server.
 *
 * Serves a design workspace at http://localhost:<port>/ with:
 *   GET /            gallery grouping options by artifact into isolated A/B/C comparison cards
 *   GET /<path>      static file (HTML gets live-reload injected)
 *   GET /__reload    server-sent events used for live reload
 *
 * State and preview.json live in <design-dir>/.preview/.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_MS = 15 * 1000;

const MIME_TYPES = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm'
}));

const RELOAD_SNIPPET = "<script>/* show-me-the-design live reload */(function(){var source=new EventSource('/__reload');source.addEventListener('reload',function(){location.reload();});})();</script>";

function fail(message) {
  process.stderr.write(JSON.stringify({ error: message }) + '\n');
  process.exit(1);
}

function parseArguments(argv) {
  const options = { designDir: '', port: 0, host: '127.0.0.1' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--design-dir') {
      options.designDir = argv[index + 1] ?? '';
      index += 1;
    } else if (argument.startsWith('--design-dir=')) {
      options.designDir = argument.slice('--design-dir='.length);
    } else if (argument === '--port') {
      options.port = Number(argv[index + 1] ?? 0);
      index += 1;
    } else if (argument.startsWith('--port=')) {
      options.port = Number(argument.slice('--port='.length));
    } else if (argument === '--host') {
      options.host = argv[index + 1] ?? '127.0.0.1';
      index += 1;
    } else if (argument.startsWith('--host=')) {
      options.host = argument.slice('--host='.length);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write(
        'Usage: preview-server.mjs --design-dir <path> [--port <n>] [--host <host>]\n',
      );
      process.exit(0);
    } else {
      fail(`Unknown argument: ${argument}`);
    }
  }
  if (!options.designDir) fail('Missing --design-dir');
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    fail('Invalid --port');
  }
  return options;
}

const options = parseArguments(process.argv.slice(2));
const DESIGN_DIR = path.resolve(options.designDir);
const STATE_DIR = path.join(DESIGN_DIR, '.preview');
const HOST = options.host;
const REQUESTED_PORT = options.port;
const DISPLAY_HOST = HOST === '0.0.0.0' || HOST === '::' ? 'localhost' : HOST;

fs.mkdirSync(DESIGN_DIR, { recursive: true });
fs.mkdirSync(STATE_DIR, { recursive: true });

/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set();
let lastActivity = Date.now();
let shuttingDown = false;
let watcher = null;
let pollTimer = null;
let idleTimer = null;
let reloadTimer = null;
let lastSnapshot = '';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function encodeRelPath(relativePath) {
  return relativePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function isWithin(child, parent) {
  return child === parent || child.startsWith(parent + path.sep);
}

function sendText(response, status, message) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(message + '\n');
}

function collectHtmlFiles() {
  const files = [];
  const walk = (directory, prefix) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        files.push(relativePath);
      }
    }
  };
  walk(DESIGN_DIR, '');
  return files.sort();
}

function deriveOptionLabel(filename, index) {
  const stem = filename.replace(/\.html?$/i, '');
  const match = stem.match(/(?:^|[-_\s])option[-_\s]*([a-z0-9])$/i) || stem.match(/^([a-z])$/i);
  if (match) return match[1].toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[index] ?? String(index + 1);
}

function normalizePalette(raw) {
  if (!raw) return [];
  const items = Array.isArray(raw)
    ? raw
    : String(raw).split(/[,;|]+/);
  const result = [];
  for (const item of items) {
    if (!item) continue;
    if (typeof item === 'object') {
      const hex = String(item.hex ?? item.color ?? item.value ?? '').trim();
      const name = String(item.name ?? item.role ?? item.label ?? '').trim();
      if (hex) result.push({ color: hex, label: name ? `${name} (${hex})` : hex });
      continue;
    }
    const text = String(item).trim();
    if (!text) continue;
    const hexMatch = text.match(/(#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\([^)]+\))/);
    if (hexMatch) {
      const color = hexMatch[1];
      const prefix = text.slice(0, hexMatch.index).replace(/[:\-–—()\s]+$/g, '').trim();
      result.push({ color, label: prefix ? `${prefix} (${color})` : color });
    } else {
      result.push({ color: text, label: text });
    }
  }
  return result;
}

function normalizeFidelity(raw) {
  const text = String(raw ?? '').trim().toLowerCase();
  if (!text) return '';
  if (text.includes('explor')) return 'exploration';
  if (text.includes('faith') || text.includes('product') || text.includes('system')) return 'faithful';
  return String(raw).trim();
}

function parseHtmlMeta(fullPath) {
  let content = '';
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    return {};
  }
  const headSlice = content.slice(0, 16384);
  const meta = {};
  const titleMatch = headSlice.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    meta.htmlTitle = decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim());
  }
  const metaTagRegex = /<meta\b[^>]*>/gi;
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let tagMatch;
  while ((tagMatch = metaTagRegex.exec(headSlice)) !== null) {
    const attrs = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(tagMatch[0])) !== null) {
      const key = attrMatch[1].toLowerCase();
      const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
      attrs[key] = decodeHtmlEntities(val.trim());
    }
    const name = (attrs.name ?? attrs.property ?? '').toLowerCase();
    if (name.startsWith('smtd-') && attrs.content !== undefined) {
      meta[name.slice('smtd-'.length)] = attrs.content;
    }
  }
  return meta;
}

function readJsonFile(fullPath) {
  try {
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

function lookupOptionInJson(jsonData, relativePath, filename, label) {
  if (!jsonData || typeof jsonData !== 'object') return null;

  if (jsonData.groups && typeof jsonData.groups === 'object') {
    const groupDir = path.posix.dirname(relativePath);
    const groupKey = groupDir === '.' ? '' : groupDir;
    const groupEntry = jsonData.groups[groupKey] ?? jsonData.groups[groupDir];
    if (groupEntry) {
      const found = lookupOptionInJson(groupEntry, relativePath, filename, label);
      if (found) return found;
    }
  }

  const list = Array.isArray(jsonData)
    ? jsonData
    : Array.isArray(jsonData.options)
      ? jsonData.options
      : null;

  if (list) {
    const stem = filename.replace(/\.html?$/i, '');
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const itemFile = String(item.file ?? item.path ?? item.href ?? '').replace(/^\.\//, '');
      const itemLabel = String(item.label ?? item.id ?? item.option ?? '').toUpperCase();
      if (
        itemFile === relativePath ||
        itemFile === filename ||
        itemFile.replace(/\.html?$/i, '') === stem ||
        (itemLabel && itemLabel === label)
      ) {
        return item;
      }
    }
    return null;
  }

  const stem = filename.replace(/\.html?$/i, '');
  const candidates = [relativePath, filename, stem, label, label.toLowerCase()];
  for (const key of candidates) {
    if (key && jsonData[key] && typeof jsonData[key] === 'object' && !Array.isArray(jsonData[key])) {
      return jsonData[key];
    }
  }
  return null;
}

function resolveOptionMetadata(group, relativePath, index, groupJson, rootJson) {
  const filename = path.posix.basename(relativePath);
  const defaultLabel = deriveOptionLabel(filename, index);
  const fullPath = path.join(DESIGN_DIR, relativePath);

  const htmlMeta = parseHtmlMeta(fullPath);
  const fromGroup = lookupOptionInJson(groupJson, relativePath, filename, defaultLabel);
  const fromRoot = lookupOptionInJson(rootJson, relativePath, filename, defaultLabel);
  const jsonMeta = { ...(fromRoot ?? {}), ...(fromGroup ?? {}) };

  const label = String(
    jsonMeta.label ?? jsonMeta.option ?? htmlMeta.label ?? defaultLabel
  ).trim().toUpperCase() || defaultLabel;

  const title = String(
    jsonMeta.title ?? jsonMeta.name ?? htmlMeta.title ?? htmlMeta.name ?? htmlMeta.htmlTitle ?? filename.replace(/\.html?$/i, '')
  ).trim();

  const thesis = String(
    jsonMeta.thesis ?? jsonMeta.summary ?? jsonMeta.description ?? htmlMeta.thesis ?? htmlMeta.summary ?? ''
  ).trim();

  const fidelity = normalizeFidelity(
    jsonMeta.fidelity ?? jsonMeta.mode ?? htmlMeta.fidelity ?? htmlMeta.mode ?? ''
  );

  const palette = normalizePalette(
    jsonMeta.palette ?? jsonMeta.colors ?? htmlMeta.palette ?? htmlMeta.colors ?? ''
  );

  const typography = String(
    jsonMeta.type ?? jsonMeta.typography ?? jsonMeta.fonts ?? htmlMeta.type ?? htmlMeta.typography ?? ''
  ).trim();

  const tradeoffsRaw = jsonMeta.tradeoffs ?? jsonMeta['trade-offs'] ?? jsonMeta.tradeOffs ?? htmlMeta.tradeoffs ?? htmlMeta['trade-offs'] ?? '';
  const tradeoffs = Array.isArray(tradeoffsRaw)
    ? tradeoffsRaw.map((item) => String(item).trim()).filter(Boolean).join(' · ')
    : String(tradeoffsRaw).trim();

  const lookAtRaw = jsonMeta.lookAt ?? jsonMeta['look-at'] ?? jsonMeta.focus ?? jsonMeta.whatToLookAt ?? htmlMeta['look-at'] ?? htmlMeta.lookat ?? htmlMeta.focus ?? '';
  const lookAt = Array.isArray(lookAtRaw)
    ? lookAtRaw.map((item) => String(item).trim()).filter(Boolean).join(' · ')
    : String(lookAtRaw).trim();

  return {
    label,
    title,
    filename,
    relativePath,
    thesis,
    fidelity,
    palette,
    typography,
    tradeoffs,
    lookAt
  };
}

function renderCard(meta, index) {
  const href = '/' + encodeRelPath(meta.relativePath);
  const cardId = `card-${meta.relativePath.replace(/[^a-zA-Z0-9_-]/g, '-')}-${index}`;

  const fidelityBadge = meta.fidelity
    ? `<span class="fidelity fidelity-${escapeHtml(meta.fidelity)}" title="Design system fidelity mode">${escapeHtml(meta.fidelity)}</span>`
    : '';

  const thesisBlock = meta.thesis
    ? `<p class="thesis">${escapeHtml(meta.thesis)}</p>`
    : '';

  const swatchesHtml = meta.palette.length > 0
    ? `<div class="swatches" role="list" aria-label="Option ${escapeHtml(meta.label)} color palette">
        ${meta.palette.map((swatch) => `<span class="swatch-chip" role="listitem" title="${escapeHtml(swatch.label)}">
          <span class="swatch-dot" style="background:${escapeHtml(swatch.color)}" aria-hidden="true"></span>
          <code>${escapeHtml(swatch.color)}</code>
        </span>`).join('')}
      </div>`
    : '';

  const detailsRows = [];
  if (meta.palette.length > 0) {
    detailsRows.push(`<div class="spec-row"><dt>Palette</dt><dd>${swatchesHtml}</dd></div>`);
  }
  if (meta.typography) {
    detailsRows.push(`<div class="spec-row"><dt>Type</dt><dd>${escapeHtml(meta.typography)}</dd></div>`);
  }
  if (meta.tradeoffs) {
    detailsRows.push(`<div class="spec-row"><dt>Trade-offs</dt><dd>${escapeHtml(meta.tradeoffs)}</dd></div>`);
  }
  if (meta.lookAt) {
    detailsRows.push(`<div class="spec-row spec-look"><dt>What to look at</dt><dd>${escapeHtml(meta.lookAt)}</dd></div>`);
  }

  const specsBlock = detailsRows.length > 0
    ? `<dl class="card-specs">${detailsRows.join('')}</dl>`
    : '';

  return `<article class="card" data-option="${escapeHtml(meta.label)}" aria-labelledby="${cardId}-title">
  <div class="card-head">
    <div class="card-title-group">
      <span class="option-badge" aria-label="Option ${escapeHtml(meta.label)}">${escapeHtml(meta.label)}</span>
      <div class="card-titles">
        <h3 id="${cardId}-title" class="card-title">${escapeHtml(meta.title)}</h3>
        <span class="name" title="${escapeHtml(meta.relativePath)}">${escapeHtml(meta.filename)}</span>
      </div>
      ${fidelityBadge}
    </div>
    <div class="card-actions">
      <button type="button" class="interact-toggle" aria-pressed="false" title="Toggle pointer interaction inside preview">Interact</button>
      <a class="open" href="${href}" target="_blank" rel="noopener" aria-label="Open Option ${escapeHtml(meta.label)} (${escapeHtml(meta.title)}) in new tab">Open ↗</a>
    </div>
  </div>
  ${thesisBlock || specsBlock ? `<div class="card-meta">${thesisBlock}${specsBlock}</div>` : ''}
  <div class="frame-wrap">
    <div class="frame">
      <iframe src="${href}" title="Option ${escapeHtml(meta.label)} — ${escapeHtml(meta.title)} (${escapeHtml(meta.relativePath)})" loading="lazy"></iframe>
    </div>
  </div>
</article>`;
}

function renderGroup(group, entries, rootJson) {
  const title = group === '' ? 'Root' : group;
  const groupDir = group === '' ? DESIGN_DIR : path.join(DESIGN_DIR, group);
  const groupJson = readJsonFile(path.join(groupDir, 'options.json'));
  const cards = entries
    .map((relativePath, index) => {
      const meta = resolveOptionMetadata(group, relativePath, index, groupJson, rootJson);
      return renderCard(meta, index);
    })
    .join('\n');
  const count = entries.length === 1 ? '1 option' : `${entries.length} options`;
  return `<section class="group" aria-label="${escapeHtml(title)} options">
  <div class="group-head">
    <h2>${escapeHtml(title)}</h2>
    <span class="count">${count}</span>
  </div>
  <div class="row">
${cards}
  </div>
</section>`;
}

function renderGallery() {
  const files = collectHtmlFiles();
  const groups = new Map();
  for (const relativePath of files) {
    const directory = path.posix.dirname(relativePath);
    const key = directory === '.' ? '' : directory;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(relativePath);
  }
  const rootJson = readJsonFile(path.join(DESIGN_DIR, 'options.json'));
  const orderedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const groupsHtml = orderedGroups.length > 0
    ? orderedGroups.map(([group, entries]) => renderGroup(group, entries, rootJson)).join('\n')
    : `<section class="empty">
  <h2>No HTML artifacts yet</h2>
  <p>Add files such as <code>home/option-a.html</code> or <code>button/option-a.html</code>.</p>
</section>`;
  const documents = ['tokens.json', 'REFERENCES.md', 'DECISIONS.md', 'IMAGE-NOTES.md']
    .filter((name) => fs.existsSync(path.join(DESIGN_DIR, name)))
    .map((name) => `<a class="doc" href="/${name}" target="_blank" rel="noopener">${escapeHtml(name.replace(/\.(md|json)$/, ''))}</a>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Show Me The Design — ${escapeHtml(path.basename(DESIGN_DIR))}</title>
<style>
:root {
  color-scheme: light dark;
  --bg: #faf9f7;
  --fg: #18181b;
  --muted: #64645e;
  --line: #e2e0d8;
  --surface: #ffffff;
  --surface-subtle: #f4f3ef;
  --accent: #2457ff;
  --accent-soft: #eef2ff;
  --faithful-bg: #dcfce7;
  --faithful-fg: #166534;
  --exploration-bg: #fef3c7;
  --exploration-fg: #92400e;
  --frame-w: 1440px;
  --frame-h: 900px;
  --frame-scale: 0.28;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f10;
    --fg: #f2f1ee;
    --muted: #9c9b93;
    --line: #282826;
    --surface: #171718;
    --surface-subtle: #1f1f21;
    --accent: #8ea8ff;
    --accent-soft: #1e2640;
    --faithful-bg: #132e1f;
    --faithful-fg: #86efac;
    --exploration-bg: #36240c;
    --exploration-fg: #fcd34d;
  }
}
body[data-device="tablet"] { --frame-w: 768px; --frame-h: 1024px; --frame-scale: 0.48; }
body[data-device="mobile"] { --frame-w: 390px; --frame-h: 844px; --frame-scale: 0.78; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg);
  color: var(--fg);
  font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  z-index: 100;
  padding: 8px 14px;
  background: var(--accent);
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}
.skip-link:focus { left: 16px; }
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; gap: 12px; align-items: center; min-width: 0; }
.mark {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}
.brand h1 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.01em; }
.path {
  display: block;
  max-width: 48vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted);
  font-size: 12px;
}
.actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.devices { display: flex; gap: 4px; padding: 3px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }
.devices button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  min-height: 28px;
  border-radius: 999px;
  cursor: pointer;
}
.devices button:hover { color: var(--fg); }
.devices button.active { background: var(--accent); color: #fff; }
.devices button:focus-visible,
.doc:focus-visible,
.open:focus-visible,
.interact-toggle:focus-visible,
.skip-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.doc {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.doc:hover { color: var(--fg); border-color: var(--muted); }
main { padding: 24px 20px 64px; }
.group { margin: 0 0 44px; }
.group-head { display: flex; gap: 12px; align-items: baseline; margin: 0 0 16px; }
.group-head h2 { margin: 0; font-size: 16px; font-weight: 650; letter-spacing: -0.01em; }
.count { color: var(--muted); font-size: 12px; }
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: stretch;
}
.card {
  display: flex;
  flex-direction: column;
  width: calc(var(--frame-w) * var(--frame-scale) + 2px);
  max-width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.card-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-subtle);
}
.card-title-group {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  flex: 1;
}
.option-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 7px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.card-titles {
  min-width: 0;
  flex: 1;
}
.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name {
  display: block;
  font-size: 11px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fidelity {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: capitalize;
  flex-shrink: 0;
  border: 1px solid transparent;
}
.fidelity-faithful {
  background: var(--faithful-bg);
  color: var(--faithful-fg);
}
.fidelity-exploration {
  background: var(--exploration-bg);
  color: var(--exploration-fg);
}
.card-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}
.interact-toggle, .open {
  appearance: none;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--fg);
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 9px;
  min-height: 26px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.interact-toggle:hover, .open:hover {
  border-color: var(--accent);
}
.interact-toggle[aria-pressed="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.open {
  color: var(--accent);
}
.card-meta {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
}
.thesis {
  margin: 0;
  color: var(--fg);
  font-size: 12.5px;
  line-height: 1.45;
}
.card-specs {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.spec-row {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 8px;
  align-items: baseline;
}
.spec-row dt {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.spec-row dd {
  margin: 0;
  color: var(--fg);
  font-size: 12px;
  line-height: 1.4;
  min-width: 0;
}
.spec-look {
  padding-top: 6px;
  border-top: 1px dashed var(--line);
}
.spec-look dd {
  font-weight: 500;
}
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.swatch-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 6px 1px 4px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--surface-subtle);
}
.swatch-dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  flex-shrink: 0;
}
.swatch-chip code {
  background: transparent;
  padding: 0;
  font-size: 11px;
}
.frame-wrap {
  position: relative;
  background: var(--surface-subtle);
}
.frame {
  display: block;
  position: relative;
  width: calc(var(--frame-w) * var(--frame-scale));
  height: calc(var(--frame-h) * var(--frame-scale));
  background: #fff;
  overflow: hidden;
}
.frame iframe {
  display: block;
  width: var(--frame-w);
  height: var(--frame-h);
  border: 0;
  transform: scale(var(--frame-scale));
  transform-origin: top left;
  pointer-events: none;
  background: #fff;
}
.card.is-interactive .frame iframe {
  pointer-events: auto;
}
.empty { padding: 48px 0; color: var(--muted); }
.empty h2 { margin: 0 0 8px; color: var(--fg); font-size: 16px; }
code { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--line); padding: 2px 5px; border-radius: 4px; }
@media (max-width: 640px) {
  .path { max-width: 70vw; }
  .devices button { padding: 6px 9px; }
  .spec-row { grid-template-columns: 1fr; gap: 2px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
</head>
<body data-device="desktop">
<a class="skip-link" href="#gallery-main">Skip to options</a>
<header class="bar">
  <div class="brand">
    <span class="mark" aria-hidden="true"></span>
    <div>
      <h1>show-me-the-design</h1>
      <span class="path" title="${escapeHtml(DESIGN_DIR)}">${escapeHtml(DESIGN_DIR)}</span>
    </div>
  </div>
  <div class="actions">
    ${documents}
    <div class="devices" role="group" aria-label="Preview viewport width">
      <button type="button" data-device="desktop" data-viewport="1440" aria-pressed="true" title="Desktop viewport (1440px) — shortcut 1">Desktop 1440</button>
      <button type="button" data-device="tablet" data-viewport="768" aria-pressed="false" title="Tablet viewport (768px) — shortcut 2">Tablet 768</button>
      <button type="button" data-device="mobile" data-viewport="390" aria-pressed="false" title="Mobile viewport (390px) — shortcut 3">Mobile 390</button>
    </div>
  </div>
</header>
<main id="gallery-main">
${groupsHtml}
</main>
<script>
(function () {
  var body = document.body;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.devices button'));
  var stored = localStorage.getItem('smtd-device');
  if (stored === 'desktop' || stored === 'tablet' || stored === 'mobile') {
    body.dataset.device = stored;
  }
  function setDevice(device) {
    body.dataset.device = device;
    localStorage.setItem('smtd-device', device);
    sync();
  }
  function sync() {
    buttons.forEach(function (button) {
      var active = button.dataset.device === body.dataset.device;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      setDevice(button.dataset.device);
    });
  });
  var toggles = Array.prototype.slice.call(document.querySelectorAll('.interact-toggle'));
  toggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var card = toggle.closest('.card');
      if (!card) return;
      var active = card.classList.toggle('is-interactive');
      toggle.setAttribute('aria-pressed', active ? 'true' : 'false');
      toggle.textContent = active ? 'Interactive' : 'Interact';
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
    if (event.key === '1') setDevice('desktop');
    else if (event.key === '2') setDevice('tablet');
    else if (event.key === '3') setDevice('mobile');
  });
  sync();
  var source = new EventSource('/__reload');
  source.addEventListener('reload', function () { location.reload(); });
})();
</script>
</body>
</html>`;
}

function injectReload(html) {
  if (html.includes('/__reload')) return html;
  const closingBodyIndex = html.toLowerCase().lastIndexOf('</body>');
  if (closingBodyIndex !== -1) {
    return html.slice(0, closingBodyIndex) + RELOAD_SNIPPET + html.slice(closingBodyIndex);
  }
  return html + RELOAD_SNIPPET;
}

function serveGallery(response, request) {
  const body = Buffer.from(injectReload(renderGallery()), 'utf8');
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

async function serveStatic(parsedUrl, request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch {
    return sendText(response, 400, 'Bad request');
  }
  if (pathname.includes('\0')) return sendText(response, 400, 'Bad request');

  let target = path.resolve(DESIGN_DIR, '.' + pathname);
  if (!isWithin(target, DESIGN_DIR)) return sendText(response, 403, 'Forbidden');
  if (isWithin(target, STATE_DIR)) return sendText(response, 403, 'Forbidden');

  const relativePath = path.relative(DESIGN_DIR, target);
  if (relativePath.split(path.sep).some((segment) => segment.startsWith('.'))) {
    return sendText(response, 403, 'Forbidden');
  }

  let stat;
  try {
    stat = await fsp.stat(target);
  } catch {
    return sendText(response, 404, 'Not found');
  }

  if (stat.isDirectory()) {
    target = path.join(target, 'index.html');
    try {
      stat = await fsp.stat(target);
    } catch {
      return sendText(response, 404, 'Not found');
    }
  }
  if (!stat.isFile()) return sendText(response, 404, 'Not found');

  const extension = path.extname(target).toLowerCase();
  const contentType = MIME_TYPES.get(extension) ?? 'application/octet-stream';
  let body;
  try {
    body = await fsp.readFile(target);
  } catch {
    return sendText(response, 500, 'Read failed');
  }
  if (contentType.startsWith('text/html')) {
    body = Buffer.from(injectReload(body.toString('utf8')), 'utf8');
  }

  response.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

function handleReloadStream(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  response.write('retry: 1000\n\n');
  sseClients.add(response);

  const heartbeat = setInterval(() => {
    try {
      response.write(': heartbeat\n\n');
    } catch {
      // The client vanished; cleanup is handled by the close event.
    }
  }, HEARTBEAT_MS);
  heartbeat.unref?.();

  const cleanup = () => {
    clearInterval(heartbeat);
    sseClients.delete(response);
  };
  request.on('close', cleanup);
  request.on('error', cleanup);
}

function broadcastReload() {
  if (shuttingDown) return;
  const payload = `event: reload\ndata: ${Date.now()}\n\n`;
  for (const client of [...sseClients]) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function snapshot() {
  const entries = [];
  const walk = (directory) => {
    let listing;
    try {
      listing = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of listing) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          entries.push(`${fullPath}:${stat.mtimeMs}:${stat.size}`);
        } catch {
          // Ignore files removed mid-walk.
        }
      }
    }
  };
  walk(DESIGN_DIR);
  return entries.sort().join('|');
}

function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    lastSnapshot = snapshot();
    broadcastReload();
  }, 120);
  reloadTimer.unref?.();
}

function onFileChange(filename) {
  const value = filename ? String(filename) : '';
  if (value.split(/[\\/]/).includes('.preview')) return;
  scheduleReload();
}

function startPolling() {
  if (pollTimer || shuttingDown) return;
  lastSnapshot = snapshot();
  pollTimer = setInterval(() => {
    if (shuttingDown) return;
    const nextSnapshot = snapshot();
    if (nextSnapshot !== lastSnapshot) {
      lastSnapshot = nextSnapshot;
      broadcastReload();
    }
  }, 1000);
  pollTimer.unref?.();
}

function startWatching() {
  lastSnapshot = snapshot();
  try {
    watcher = fs.watch(DESIGN_DIR, { recursive: true }, (_event, filename) => onFileChange(filename));
    watcher.on('error', () => {
      try {
        watcher?.close();
      } catch {
        // Ignore close errors.
      }
      watcher = null;
      startPolling();
    });
  } catch {
    startPolling();
  }
}

function writePreviewInfo(port) {
  const info = {
    type: 'preview-started',
    url: `http://${DISPLAY_HOST}:${port}/`,
    gallery: `http://${DISPLAY_HOST}:${port}/`,
    port,
    host: HOST,
    designDir: DESIGN_DIR,
    state: STATE_DIR,
    pid: process.pid,
    startedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(STATE_DIR, 'preview.json'), JSON.stringify(info, null, 2) + '\n');
  process.stdout.write(JSON.stringify(info) + '\n');
}

function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(JSON.stringify({ type: 'preview-stopped', reason }) + '\n');

  try {
    watcher?.close();
  } catch {
    // Ignore close errors.
  }
  clearInterval(pollTimer);
  clearInterval(idleTimer);
  clearTimeout(reloadTimer);
  for (const client of sseClients) {
    try {
      client.end();
    } catch {
      // Ignore client close errors.
    }
  }
  sseClients.clear();
  try {
    fs.rmSync(path.join(STATE_DIR, 'preview.json'), { force: true });
    fs.rmSync(path.join(STATE_DIR, 'server.pid'), { force: true });
  } catch {
    // Ignore removal errors.
  }
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
  setTimeout(() => process.exit(0), 1000).unref();
}

const server = http.createServer((request, response) => {
  lastActivity = Date.now();

  const rawUrl = request.url ?? '/';
  const rawPathname = rawUrl.split('?')[0].split('#')[0];
  let rawDecodedPathname;
  try {
    rawDecodedPathname = decodeURIComponent(rawPathname);
  } catch {
    return sendText(response, 400, 'Bad request');
  }
  if (
    rawPathname.split('/').some((segment) => segment === '..') ||
    rawDecodedPathname.split(/[\\/]/).some((segment) => segment === '..')
  ) {
    return sendText(response, 403, 'Forbidden');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl, `http://${request.headers.host ?? 'localhost'}`);
  } catch {
    return sendText(response, 400, 'Bad request');
  }

  if (parsedUrl.pathname === '/__reload') {
    return handleReloadStream(request, response);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return sendText(response, 405, 'Method not allowed');
  }
  if (parsedUrl.pathname === '/') {
    return serveGallery(response, request);
  }

  serveStatic(parsedUrl, request, response).catch((error) => {
    if (!response.headersSent) {
      sendText(response, 500, error instanceof Error ? error.message : 'Internal error');
    } else {
      response.end();
    }
  });
});

server.on('error', (error) => {
  fail(error instanceof Error ? error.message : 'Server error');
});

server.listen(REQUESTED_PORT, HOST, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : REQUESTED_PORT;
  writePreviewInfo(port);
  startWatching();

  idleTimer = setInterval(() => {
    if (shuttingDown) return;
    if (sseClients.size > 0) {
      lastActivity = Date.now();
      return;
    }
    if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) shutdown('idle');
  }, 30 * 1000);
  idleTimer.unref?.();
});

process.on('SIGTERM', () => shutdown('signal'));
process.on('SIGINT', () => shutdown('signal'));
