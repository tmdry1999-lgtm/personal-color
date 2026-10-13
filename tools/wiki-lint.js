import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const STATUSES = new Set(['가설', '확정', '참고']);
const SPECIAL = new Set(['index.md', 'log.md']);

const toPosix = (p) => p.replaceAll('\\', '/');

// Windows는 대소문자를 무시하지만 GitHub Pages는 구분한다. 경로의 각 조각이 정확히 같은 이름으로 있는지 확인한다.
function existsExact(absPath, root) {
  const rel = toPosix(relative(root, absPath));
  if (rel.startsWith('..')) return existsSync(absPath);
  let dir = root;
  for (const part of rel.split('/')) {
    if (!existsSync(dir) || !statSync(dir).isDirectory() || !readdirSync(dir).includes(part)) return false;
    dir = join(dir, part);
  }
  return true;
}

function isRawFile(src, repoRoot) {
  if (!src.startsWith('raw/')) return false;
  const abs = resolve(repoRoot, src);
  return existsExact(abs, repoRoot) && statSync(abs).isFile();
}

function listMarkdown(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

const unquote = (s) => s.trim().replace(/^(["'])(.*)\1$/, '$2');

export function parseFrontMatter(text) {
  const match = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const data = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const value = kv[2].trim();
      if (value === '') data[key] = [];
      else if (value.startsWith('[') && value.endsWith(']')) {
        data[key] = value.slice(1, -1).split(',').map(unquote).filter((v) => v !== '');
      } else data[key] = unquote(value);
      continue;
    }
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item && key && Array.isArray(data[key])) data[key].push(unquote(item[1]));
  }
  return data;
}

export function lintWiki(wikiDir) {
  const errors = [];
  const repoRoot = resolve(wikiDir, '..');
  const files = listMarkdown(wikiDir);
  if (!existsSync(join(wikiDir, 'index.md'))) errors.push('index.md 없음');
  const linkedFromIndex = new Set();

  for (const file of files) {
    const rel = toPosix(relative(wikiDir, file));
    const text = readFileSync(file, 'utf8');

    if (!SPECIAL.has(rel)) {
      const fm = parseFrontMatter(text);
      if (!fm) {
        errors.push(`${rel}: front matter 없음`);
      } else {
        if (!Array.isArray(fm.sources) || fm.sources.length === 0) {
          errors.push(`${rel}: sources 비어 있음`);
        } else {
          for (const src of fm.sources) {
            if (/^https?:\/\//.test(src)) continue;
            if (!isRawFile(src, repoRoot)) errors.push(`${rel}: 출처는 raw/ 안의 파일이어야 함 ${src}`);
          }
        }
        if (!STATUSES.has(fm.status)) errors.push(`${rel}: status는 가설/확정/참고 중 하나여야 함`);
      }
    }

    const withoutCode = text.replace(/^```[\s\S]*?^```/gm, '');
    for (const m of withoutCode.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      const abs = resolve(dirname(file), target);
      if (!existsExact(abs, repoRoot)) errors.push(`${rel}: 깨진 링크 ${target}`);
      else if (rel === 'index.md' && target.endsWith('.md')) linkedFromIndex.add(toPosix(relative(wikiDir, abs)));
    }
  }

  for (const file of files) {
    const rel = toPosix(relative(wikiDir, file));
    if (rel !== 'index.md' && !linkedFromIndex.has(rel)) {
      errors.push(`${rel}: index.md에서 링크되지 않음`);
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = lintWiki(process.argv[2] ?? 'wiki');
  for (const e of errors) console.error(e);
  console.log(errors.length === 0 ? '위키 검사 통과' : `오류 ${errors.length}개`);
  process.exit(errors.length === 0 ? 0 : 1);
}
