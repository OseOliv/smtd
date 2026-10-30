#!/usr/bin/env node
/**
 * show-me-the-design — zero-dependency preview server.
 *
 * Serves a design workspace at http://localhost:<port>/ with:
 *   GET /            gallery grouping options by artifact
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

function renderGroup(group, entries) {
  const title = group === '' ? 'Root' : group;
  const cards = entries.map((relativePath) => {
    const href = '/' + encodeRelPath(relativePath);
    const name = path.posix.basename(relativePath);
    return `<article class="card">
  <div class="card-head">
    <span class="name" title="${escapeHtml(relativePath)}">${escapeHtml(name)}</span>
    <a class="open" href="${href}" target="_blank" rel="noopener">Open ↗</a>
  </div>
  <a class="frame" href="${href}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(relativePath)}">
    <iframe src="${href}" title="${escapeHtml(relativePath)}" loading="lazy"></iframe>
  </a>
</article>`;
  }).join('\n');
  const count = entries.length === 1 ? '1 option' : `${entries.length} options`;

  const groupDirectory = group === '' ? DESIGN_DIR : path.join(DESIGN_DIR, group);
  const documents = [
    ['DESIGN.md', 'Design language'],
    ['system.html', 'System catalog']
  ]
    .filter(([name]) => fs.existsSync(path.join(groupDirectory, name)))
    .map(([name, label]) => {
      const relativePath = group === '' ? name : `${group}/${name}`;
      return `<a class="doc" href="/${encodeRelPath(relativePath)}" target="_blank" rel="noopener">${label}</a>`;
    })
    .join('');

  return `<section class="group">
  <div class="group-head">
    <h2>${escapeHtml(title)}</h2>
    <span class="count">${count}</span>
    <span class="group-docs">${documents}</span>
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
  const orderedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const groupsHtml = orderedGroups.length > 0
    ? orderedGroups.map(([group, entries]) => renderGroup(group, entries)).join('\n')
    : `<section class="empty">
  <h2>No HTML artifacts yet</h2>
  <p>Add files such as <code>home/option-a/index.html</code> or <code>button/option-a/index.html</code>.</p>
</section>`;
  const documents = ['REFERENCES.md', 'DECISIONS.md', 'IMAGE-NOTES.md']
    .filter((name) => fs.existsSync(path.join(DESIGN_DIR, name)))
    .map((name) => `<a class="doc" href="/${name}" target="_blank" rel="noopener">${name.replace(/\.md$/, '')}</a>`)
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
  --fg: #1b1b1a;
  --muted: #6b6a66;
  --line: #e3e1dc;
  --surface: #ffffff;
  --accent: #2457ff;
  --frame-w: 1440px;
  --frame-h: 900px;
  --frame-scale: 0.25;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #101010;
    --fg: #f2f1ee;
    --muted: #9a998f;
    --line: #2a2a28;
    --surface: #171716;
    --accent: #8ea8ff;
  }
}
body[data-device="tablet"] { --frame-w: 768px; --frame-h: 1024px; --frame-scale: 0.47; }
body[data-device="mobile"] { --frame-w: 390px; --frame-h: 844px; --frame-scale: 0.72; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg);
  color: var(--fg);
  font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; gap: 12px; align-items: center; min-width: 0; }
.mark {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}
.brand strong { display: block; font-size: 13px; letter-spacing: 0.01em; }
.path {
  display: block;
  max-width: 52vw;
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
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}
.devices button:hover { color: var(--fg); }
.devices button.active { background: var(--accent); color: #fff; }
.devices button:focus-visible, .doc:focus-visible, .open:focus-visible, .frame:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.doc { color: var(--muted); font-size: 12px; text-decoration: none; padding: 6px 8px; }
.doc:hover { color: var(--fg); }
main { padding: 24px 20px 64px; }
.group { margin: 0 0 40px; }
.group-head { display: flex; gap: 12px; align-items: baseline; margin: 0 0 14px; }
.group-head h2 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.01em; }
.count { color: var(--muted); font-size: 12px; }
.group-docs { display: flex; gap: 4px; align-items: center; margin-left: auto; }
.group-docs .doc { border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }
.row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  overflow: hidden;
}
.card-head { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid var(--line); }
.name { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.open { color: var(--accent); font-size: 12px; text-decoration: none; white-space: nowrap; }
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
.empty { padding: 48px 0; color: var(--muted); }
.empty h2 { margin: 0 0 8px; color: var(--fg); font-size: 16px; }
code { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--line); padding: 2px 5px; border-radius: 4px; }
@media (max-width: 640px) {
  .path { max-width: 70vw; }
  .devices button { padding: 6px 9px; }
}
@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; }
}
</style>
</head>
<body data-device="desktop">
<header class="bar">
  <div class="brand">
    <span class="mark" aria-hidden="true"></span>
    <div>
      <strong>show-me-the-design</strong>
      <span class="path" title="${escapeHtml(DESIGN_DIR)}">${escapeHtml(DESIGN_DIR)}</span>
    </div>
  </div>
  <div class="actions">
    ${documents}
    <div class="devices" role="group" aria-label="Preview width">
      <button type="button" data-device="desktop" aria-pressed="true">Desktop</button>
      <button type="button" data-device="tablet" aria-pressed="false">Tablet</button>
      <button type="button" data-device="mobile" aria-pressed="false">Mobile</button>
    </div>
  </div>
</header>
<main>
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
  function sync() {
    buttons.forEach(function (button) {
      var active = button.dataset.device === body.dataset.device;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      body.dataset.device = button.dataset.device;
      localStorage.setItem('smtd-device', button.dataset.device);
      sync();
    });
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
  } catch {
    // Ignore removal errors.
  }
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
  setTimeout(() => process.exit(0), 1000).unref();
}

const server = http.createServer((request, response) => {
  lastActivity = Date.now();

  let parsedUrl;
  try {
    parsedUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
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
