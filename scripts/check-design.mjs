#!/usr/bin/env node
/**
 * show-me-the-design — zero-dependency design contract validator.
 *
 * Validates every DESIGN.md workspace under a design directory:
 *   - frontmatter parses and carries real provenance
 *   - every {token.ref} in the prose resolves
 *   - tokens.css mirrors DESIGN.md 1:1
 *   - no raw color literals outside tokens.css
 *   - required sections and Known Gaps are present
 *   - system.html exists, links tokens.css, and carries the required specimens
 *
 * Usage: check-design.mjs --design-dir <path> [--pretty] [--strict]
 */

import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_SECTIONS = [
  'Overview',
  'Colors',
  'Typography',
  'Layout',
  'Elevation & Depth',
  'Shapes',
  'Components',
  "Do's and Don'ts",
  'Responsive Behavior',
  'Motion',
  'Iteration Guide',
  'Known Gaps',
  'Agent Prompt Guide'
];

const ARTIFACT_KINDS = new Set(['page', 'section', 'component', 'state', 'flow', 'analysis']);
const METHODS = new Set(['brief', 'visual-inference', 'css-extraction']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);

const TYPE_PROP_SUFFIX = {
  fontFamily: 'family',
  fontSize: 'size',
  fontWeight: 'weight',
  lineHeight: 'leading',
  letterSpacing: 'tracking'
};

const REQUIRED_SPECIMENS = ['swatches', 'type-ramp', 'radius', 'spacing', 'elevation', 'components'];
const OPTIONAL_SPECIMENS = ['surfaces'];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.preview',
  'dist',
  'build',
  'templates',
  'scripts'
]);

const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:oklab|oklch|lab|lch|hwb)\(/;

function fail(message) {
  process.stderr.write(JSON.stringify({ error: message }) + '\n');
  process.exit(2);
}

function parseArguments(argv) {
  const options = { designDir: '', pretty: false, strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--design-dir') {
      options.designDir = argv[index + 1] ?? '';
      index += 1;
    } else if (argument.startsWith('--design-dir=')) {
      options.designDir = argument.slice('--design-dir='.length);
    } else if (argument === '--pretty') {
      options.pretty = true;
    } else if (argument === '--strict') {
      options.strict = true;
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write(
        'Usage: check-design.mjs --design-dir <path> [--pretty] [--strict]\n'
      );
      process.exit(0);
    } else {
      fail(`Unknown argument: ${argument}`);
    }
  }
  if (!options.designDir) fail('Missing --design-dir');
  return options;
}

function normalizeHeading(value) {
  return String(value)
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/[.:]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeValue(raw) {
  let value = String(raw).trim().replace(/\s+/g, ' ');
  value = value.replace(/#([0-9a-fA-F]{3,8})\b/g, (_, hex) => `#${expandHex(hex).toLowerCase()}`);
  value = value.replace(/\s*,\s*/g, ', ');
  return value;
}

function expandHex(hex) {
  if (hex.length === 3 || hex.length === 4) {
    return hex.split('').map((character) => character + character).join('');
  }
  return hex;
}

function lineAt(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index && cursor < text.length; cursor += 1) {
    if (text[cursor] === '\n') line += 1;
  }
  return line;
}

function maskFences(text) {
  return text.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ' '));
}

function stripInlineComment(value) {
  if (value.startsWith('"') || value.startsWith("'")) {
    const quote = value[0];
    const closing = value.lastIndexOf(quote);
    if (closing > 0) {
      const rest = value.slice(closing + 1).trim();
      if (rest === '' || rest.startsWith('#')) return value.slice(0, closing + 1);
    }
    return value;
  }
  const marker = value.indexOf(' #');
  return marker === -1 ? value : value.slice(0, marker).trim();
}

function stripQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  const errors = [];
  if (lines[0]?.trim() !== '---') {
    errors.push({ rule: 'frontmatter-missing', line: 1, message: 'DESIGN.md must start with a --- frontmatter block.' });
    return { data: {}, end: -1, errors };
  }
  let end = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      end = index;
      break;
    }
  }
  if (end === -1) {
    errors.push({ rule: 'frontmatter-unclosed', line: 1, message: 'Frontmatter block is never closed with ---.' });
    return { data: {}, end: -1, errors };
  }

  const root = {};
  const stack = [{ indent: -1, node: root }];

  for (let index = 1; index < end; index += 1) {
    const raw = lines[index];
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (raw.includes('\t')) {
      errors.push({ rule: 'frontmatter-tabs', line, message: 'Use spaces, not tabs, for indentation.' });
      continue;
    }
    const indent = raw.match(/^\s*/)[0].length;
    if (indent % 2 !== 0) {
      errors.push({ rule: 'frontmatter-indent', line, message: `Indentation must be a multiple of 2 spaces (found ${indent}).` });
      continue;
    }
    const match = trimmed.match(/^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/);
    if (!match) {
      errors.push({ rule: 'frontmatter-syntax', line, message: `Cannot parse line: ${trimmed}` });
      continue;
    }
    const key = match[1];
    const value = (match[2] ?? '').trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].node;
    if (Object.prototype.hasOwnProperty.call(parent, key)) {
      errors.push({ rule: 'frontmatter-duplicate', line, message: `Duplicate key: ${key}` });
      continue;
    }

    if (value === '') {
      const node = {};
      parent[key] = node;
      stack.push({ indent, node });
    } else {
      parent[key] = stripQuotes(stripInlineComment(value));
    }
  }

  return { data: root, end, errors };
}

function getToken(data, dottedPath) {
  const segments = dottedPath.split('.');
  let node = data;
  for (const segment of segments) {
    if (node === null || typeof node !== 'object' || !Object.prototype.hasOwnProperty.call(node, segment)) {
      return { found: false };
    }
    node = node[segment];
  }
  return { found: true, value: node };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function refsIn(text) {
  const pattern = /\{([a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+)\}/g;
  return [...String(text).matchAll(pattern)].map((match) => ({
    tokenPath: match[1],
    index: match.index
  }));
}

function collectStringValues(value, prefix, out) {
  if (typeof value === 'string') {
    out.push({ path: prefix, value });
  } else if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      collectStringValues(child, `${prefix}.${key}`, out);
    }
  }
}

function walkDesignFiles(root) {
  const files = [];
  const walk = (directory) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(fullPath);
      } else if (entry.isFile() && entry.name === 'DESIGN.md') {
        files.push(fullPath);
      }
    }
  };
  walk(root);
  return files.sort();
}

function expectedVars(data) {
  const map = new Map();
  const add = (name, tokenPath, value) => {
    if (typeof value === 'string') map.set(name, { tokenPath, value });
  };

  for (const [key, value] of Object.entries(isPlainObject(data.colors) ? data.colors : {})) {
    add(`--color-${key}`, `colors.${key}`, value);
  }
  for (const [key, value] of Object.entries(isPlainObject(data.rounded) ? data.rounded : {})) {
    add(`--radius-${key}`, `rounded.${key}`, value);
  }
  for (const [key, value] of Object.entries(isPlainObject(data.spacing) ? data.spacing : {})) {
    add(`--space-${key}`, `spacing.${key}`, value);
  }
  for (const [key, value] of Object.entries(isPlainObject(data.shadows) ? data.shadows : {})) {
    add(`--shadow-${key}`, `shadows.${key}`, value);
  }
  for (const [role, props] of Object.entries(isPlainObject(data.typography) ? data.typography : {})) {
    if (!isPlainObject(props)) continue;
    for (const [prop, value] of Object.entries(props)) {
      const suffix = TYPE_PROP_SUFFIX[prop];
      if (!suffix) continue;
      add(`--type-${role}-${suffix}`, `typography.${role}.${prop}`, value);
    }
  }

  return map;
}

function parseCssVars(text) {
  const map = new Map();
  const pattern = /--([a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    map.set(`--${match[1]}`, { value: match[2].trim(), index: match.index });
  }
  return map;
}

function hasOverrideNear(cssText, index) {
  const prefix = cssText.slice(Math.max(0, index - 400), index);
  return /@design-md-override/.test(prefix);
}

function scanCssColorLiterals(cssText, file, severity, errors, warnings) {
  const withoutUrls = cssText.replace(/url\([^)]*\)/g, (match) => ' '.repeat(match.length));
  const declaration = /(?:^|[;{}])\s*([a-zA-Z-]+)\s*:\s*([^;{}]+)/g;
  let match;
  while ((match = declaration.exec(withoutUrls)) !== null) {
    const value = match[2];
    if (!COLOR_LITERAL.test(value)) continue;
    const index = match.index + match[0].indexOf(match[1]);
    const line = lineAt(withoutUrls, index);
    const sourceLine = cssText.split(/\r?\n/)[line - 1] ?? '';
    if (/@design-md-allow-color/.test(sourceLine)) continue;
    const entry = {
      file,
      line,
      rule: 'raw-color-literal',
      message: `Color literal in "${match[1]}: ${value.trim()}". Use a token from tokens.css.`
    };
    (severity === 'error' ? errors : warnings).push(entry);
  }
}

function scanInlineStyles(html, file, severity, errors, warnings) {
  const blocks = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = blocks.exec(html)) !== null) {
    if (/data-catalog-chrome/.test(match[0])) continue;
    const contentOffset = match.index + match[0].indexOf(match[1]);
    const content = match[1];
    const withoutUrls = content.replace(/url\([^)]*\)/g, (value) => ' '.repeat(value.length));
    const declaration = /(?:^|[;{}])\s*([a-zA-Z-]+)\s*:\s*([^;{}]+)/g;
    let rule;
    while ((rule = declaration.exec(withoutUrls)) !== null) {
      if (!COLOR_LITERAL.test(rule[2])) continue;
      const index = contentOffset + rule.index;
      const line = lineAt(html, index);
      const sourceLine = html.split(/\r?\n/)[line - 1] ?? '';
      if (/@design-md-allow-color/.test(sourceLine)) continue;
      const entry = {
        file,
        line,
        rule: 'raw-color-literal',
        message: `Color literal in "${rule[1]}: ${rule[2].trim()}". Use a token from tokens.css.`
      };
      (severity === 'error' ? errors : warnings).push(entry);
    }
  }

  const inline = /style\s*=\s*(["'])(.*?)\1/gis;
  while ((match = inline.exec(html)) !== null) {
    const value = match[2];
    if (!COLOR_LITERAL.test(value)) continue;
    if (/@design-md-allow-color/.test(value)) continue;
    const line = lineAt(html, match.index);
    const entry = {
      file,
      line,
      rule: 'raw-color-literal',
      message: 'Color literal in an inline style. Use var(--token) instead.'
    };
    (severity === 'error' ? errors : warnings).push(entry);
  }
}

function bodyOffsetAfter(text, endLine) {
  if (endLine < 0) return 0;
  const lines = text.split(/\r?\n/);
  let offset = 0;
  for (let index = 0; index <= endLine; index += 1) {
    offset += (lines[index] ?? '').length;
    if (index < endLine) {
      offset += text.startsWith('\r\n', offset) ? 2 : 1;
    }
  }
  if (text.startsWith('\r\n', offset)) offset += 2;
  else if (text[offset] === '\n') offset += 1;
  return offset;
}

function validateDesign(designPath, rootDir, errors, warnings) {
  const directory = path.dirname(designPath);
  const relative = (file) => path.relative(rootDir, file) || file;
  const text = fs.readFileSync(designPath, 'utf8');
  const { data, end, errors: parseErrors } = parseFrontmatter(text);
  const tokens = { count: 0 };

  for (const error of parseErrors) {
    errors.push({ file: relative(designPath), ...error });
  }

  const bodyOffset = bodyOffsetAfter(text, end);
  const body = text.slice(bodyOffset);
  const maskedBody = maskFences(body);

  const requireToken = (tokenPath) => {
    const result = getToken(data, tokenPath);
    if (!result.found || (typeof result.value === 'string' && result.value.trim() === '')) {
      errors.push({
        file: relative(designPath),
        line: 1,
        rule: 'frontmatter-required',
        message: `Missing required frontmatter value: ${tokenPath}`
      });
      return false;
    }
    return true;
  };

  requireToken('version');
  requireToken('name');
  const artifact = getToken(data, 'artifact');
  if (!artifact.found || !ARTIFACT_KINDS.has(artifact.value)) {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'artifact-invalid',
      message: `artifact must be one of: ${[...ARTIFACT_KINDS].join(', ')}`
    });
  }
  requireToken('provenance.source');
  requireToken('provenance.captured_at');
  requireToken('provenance.method');
  requireToken('provenance.confidence');

  const method = getToken(data, 'provenance.method');
  if (method.found && !METHODS.has(method.value)) {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'method-invalid',
      message: `provenance.method must be one of: ${[...METHODS].join(', ')}`
    });
  }
  const confidence = getToken(data, 'provenance.confidence');
  if (confidence.found && !CONFIDENCE.has(confidence.value)) {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'confidence-invalid',
      message: `provenance.confidence must be one of: ${[...CONFIDENCE].join(', ')}`
    });
  }
  const capturedAt = getToken(data, 'provenance.captured_at');
  if (capturedAt.found && typeof capturedAt.value === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedAt.value) || Number.isNaN(Date.parse(capturedAt.value))) {
      errors.push({
        file: relative(designPath),
        line: 1,
        rule: 'captured-at-invalid',
        message: `provenance.captured_at must be a real YYYY-MM-DD date (found "${capturedAt.value}").`
      });
    }
  }

  const sourceUrl = getToken(data, 'provenance.source_url');
  const needsUrl = method.found && method.value !== 'brief';
  if (needsUrl && (!sourceUrl.found || String(sourceUrl.value).trim() === '')) {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'source-url-required',
      message: `provenance.source_url is required when provenance.method is "${method.value}".`
    });
  }
  if (artifact.found && artifact.value === 'analysis' && method.found && method.value === 'brief') {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'analysis-requires-source',
      message: 'An analysis artifact needs provenance.method css-extraction or visual-inference.'
    });
  }
  if (artifact.found && artifact.value === 'analysis' && !/inspired interpretation/i.test(body)) {
    warnings.push({
      file: relative(designPath),
      line: 1,
      rule: 'analysis-label',
      message: 'Analysis bodies should label themselves as an "inspired interpretation", not an official specification.'
    });
  }

  for (const mapName of ['colors', 'typography', 'rounded', 'spacing']) {
    const value = data[mapName];
    if (!isPlainObject(value) || Object.keys(value).length === 0) {
      errors.push({
        file: relative(designPath),
        line: 1,
        rule: 'frontmatter-map',
        message: `Frontmatter map "${mapName}" is required and must not be empty.`
      });
    }
  }
  if (!isPlainObject(data.shadows)) {
    warnings.push({
      file: relative(designPath),
      line: 1,
      rule: 'shadows-missing',
      message: 'No shadows map. Elevation must then be justified by surface polarity in DESIGN.md.'
    });
  }
  if (!isPlainObject(data.components)) {
    warnings.push({
      file: relative(designPath),
      line: 1,
      rule: 'components-missing',
      message: 'No components map. Component tokens keep the language reusable.'
    });
  }

  const varMap = expectedVars(data);
  tokens.count = varMap.size;

  // Every {a.b} reference must resolve to a scalar token.
  const resolveRefs = (matches, lineFor) => {
    for (const match of matches) {
      const tokenPath = match.tokenPath;
      const result = getToken(data, tokenPath);
      if (!result.found) {
        errors.push({
          file: relative(designPath),
          line: lineFor(match),
          rule: 'broken-token-ref',
          message: `Reference {${tokenPath}} does not resolve in the frontmatter.`
        });
      } else if (isPlainObject(result.value) && !/^typography\.[^.]+$/.test(tokenPath)) {
        errors.push({
          file: relative(designPath),
          line: lineFor(match),
          rule: 'ref-not-scalar',
          message: `Reference {${tokenPath}} points to a group, not a value.`
        });
      }
    }
  };

  resolveRefs(refsIn(maskedBody), (match) => lineAt(body, match.index));

  if (isPlainObject(data.components)) {
    const componentValues = [];
    for (const [name, props] of Object.entries(data.components)) {
      collectStringValues(props, `components.${name}`, componentValues);
    }
    for (const entry of componentValues) {
      resolveRefs(refsIn(entry.value), () => 1);
    }
  }

  // Required sections.
  const headings = [];
  const headingPattern = /^##\s+(.+?)\s*$/gm;
  let heading;
  while ((heading = headingPattern.exec(maskedBody)) !== null) {
    headings.push({
      raw: heading[1],
      normalized: normalizeHeading(heading[1]),
      index: heading.index,
      line: lineAt(body, heading.index),
      end: heading.index + heading[0].length
    });
  }
  const present = new Set(headings.map((entry) => entry.normalized));
  for (const section of REQUIRED_SECTIONS) {
    if (!present.has(normalizeHeading(section))) {
      errors.push({
        file: relative(designPath),
        line: 1,
        rule: 'section-missing',
        message: `Missing required section: ## ${section}`
      });
    }
  }

  const gaps = headings.find((entry) => entry.normalized === normalizeHeading('Known Gaps'));
  if (gaps) {
    const next = headings.find((entry) => entry.index > gaps.index);
    const sectionBody = body.slice(gaps.end, next ? next.index : body.length);
    const stripped = sectionBody
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    if (stripped === '') {
      errors.push({
        file: relative(designPath),
        line: gaps.line,
        rule: 'known-gaps-empty',
        message: 'Known Gaps must state the limits, or literally "None." when there are none.'
      });
    }
  }

  if (/\bTODO\b/.test(text)) {
    warnings.push({
      file: relative(designPath),
      line: 1,
      rule: 'todo-present',
      message: 'DESIGN.md still contains TODO markers.'
    });
  }

  // tokens.css parity.
  const tokensPath = path.join(directory, 'tokens.css');
  if (!fs.existsSync(tokensPath)) {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'tokens-css-missing',
      message: 'tokens.css must sit next to DESIGN.md and mirror the frontmatter.'
    });
  } else {
    const cssText = fs.readFileSync(tokensPath, 'utf8');
    const cssVars = parseCssVars(cssText);
    for (const [name, expected] of varMap) {
      const actual = cssVars.get(name);
      if (!actual) {
        errors.push({
          file: relative(tokensPath),
          line: 1,
          rule: 'token-missing',
          message: `Missing ${name} (from ${expected.tokenPath}).`
        });
        continue;
      }
      if (normalizeValue(actual.value) === normalizeValue(expected.value)) continue;
      const entry = {
        file: relative(tokensPath),
        line: lineAt(cssText, actual.index),
        rule: 'token-drift',
        message: `${name} is "${actual.value.trim()}" but ${expected.tokenPath} is "${expected.value}".`
      };
      if (hasOverrideNear(cssText, actual.index)) {
        entry.rule = 'token-override';
        entry.message += ' Explicit @design-md-override in use.';
        warnings.push(entry);
      } else {
        errors.push(entry);
      }
    }
    for (const [name, actual] of cssVars) {
      if (!/^--(color|radius|space|shadow|type)-/.test(name)) continue;
      if (varMap.has(name)) continue;
      warnings.push({
        file: relative(tokensPath),
        line: lineAt(cssText, actual.index),
        rule: 'orphan-token',
        message: `${name} is not declared in DESIGN.md.`
      });
    }
  }

  // system.html contract.
  const systemPath = path.join(directory, 'system.html');
  if (!fs.existsSync(systemPath)) {
    errors.push({
      file: relative(designPath),
      line: 1,
      rule: 'system-html-missing',
      message: 'system.html must exist and render the token catalog.'
    });
  } else {
    const system = fs.readFileSync(systemPath, 'utf8');
    if (!/href\s*=\s*["']\.?\/?tokens\.css["']/.test(system)) {
      errors.push({
        file: relative(systemPath),
        line: 1,
        rule: 'system-tokens-link',
        message: 'system.html must link tokens.css.'
      });
    }
    if (!/var\(--/.test(system)) {
      errors.push({
        file: relative(systemPath),
        line: 1,
        rule: 'system-no-tokens',
        message: 'system.html never uses a token variable.'
      });
    }
    for (const specimen of REQUIRED_SPECIMENS) {
      if (!system.includes(`data-specimen="${specimen}"`)) {
        errors.push({
          file: relative(systemPath),
          line: 1,
          rule: 'specimen-missing',
          message: `system.html is missing data-specimen="${specimen}".`
        });
      }
    }
    for (const specimen of OPTIONAL_SPECIMENS) {
      if (!system.includes(`data-specimen="${specimen}"`)) {
        warnings.push({
          file: relative(systemPath),
          line: 1,
          rule: 'specimen-optional',
          message: `system.html has no data-specimen="${specimen}" block.`
        });
      }
    }
    if (system.includes('data-specimen="elevation"') && !isPlainObject(data.shadows)) {
      warnings.push({
        file: relative(systemPath),
        line: 1,
        rule: 'elevation-without-shadows',
        message: 'Elevation specimen exists but DESIGN.md declares no shadows.'
      });
    }
    if (artifact.found && artifact.value !== 'analysis') {
      const siblings = fs.readdirSync(directory).filter((name) => name.endsWith('.html') && name !== 'system.html');
      if (siblings.length === 0) {
        errors.push({
          file: relative(directory),
          line: 1,
          rule: 'artifact-page-missing',
          message: 'The option has no artifact HTML next to system.html.'
        });
      }
    }
    scanInlineStyles(system, relative(systemPath), 'warning', errors, warnings);
  }

  // Any CSS outside tokens.css must be token-only.
  const cssFiles = fs.readdirSync(directory).filter((name) => name.endsWith('.css') && name !== 'tokens.css');
  for (const name of cssFiles) {
    const cssPath = path.join(directory, name);
    const css = fs.readFileSync(cssPath, 'utf8');
    scanCssColorLiterals(css, relative(cssPath), 'error', errors, warnings);
  }

  const indexCandidates = fs.readdirSync(directory).filter((name) => name.endsWith('.html') && name !== 'system.html');
  for (const name of indexCandidates) {
    const htmlPath = path.join(directory, name);
    const html = fs.readFileSync(htmlPath, 'utf8');
    scanInlineStyles(html, relative(htmlPath), 'error', errors, warnings);
  }

  return { directory, tokens: tokens.count, artifact: artifact.found ? artifact.value : '' };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const designDir = path.resolve(options.designDir);

  if (!fs.existsSync(designDir) || !fs.statSync(designDir).isDirectory()) {
    fail(`Not a directory: ${designDir}`);
  }

  const errors = [];
  const warnings = [];
  const files = walkDesignFiles(designDir);
  let tokenCount = 0;

  if (files.length === 0) {
    errors.push({
      file: designDir,
      line: 1,
      rule: 'no-design-md',
      message: 'No DESIGN.md found under the design directory.'
    });
  }

  for (const file of files) {
    const result = validateDesign(file, designDir, errors, warnings);
    tokenCount += result.tokens;
  }

  if (options.strict) {
    for (const warning of warnings) {
      errors.push({ ...warning, rule: `${warning.rule} (strict)` });
    }
  }

  const report = {
    type: 'design-check',
    ok: errors.length === 0,
    designDir,
    summary: {
      designFiles: files.length,
      tokens: tokenCount,
      errors: errors.length,
      warnings: warnings.length
    },
    errors,
    warnings
  };

  process.stdout.write(JSON.stringify(report, null, options.pretty ? 2 : 0) + '\n');
  process.exitCode = errors.length === 0 ? 0 : 1;
}

main();
