import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFrontMatter, lintWiki } from '../tools/wiki-lint.js';

function makeRepo(files) {
  const root = mkdtempSync(join(tmpdir(), 'wiki-'));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return { root, wiki: join(root, 'wiki') };
}

const page = (sources, status = '가설') =>
  `---\nstatus: ${status}\nsources:\n${sources.map((s) => `  - ${s}`).join('\n')}\n---\n\n# 제목\n`;

test('parseFrontMatter: status와 sources 목록을 읽는다', () => {
  const fm = parseFrontMatter(page(['raw/a.md', 'https://x.org']));
  assert.equal(fm.status, '가설');
  assert.deepEqual(fm.sources, ['raw/a.md', 'https://x.org']);
});

test('parseFrontMatter: CRLF 줄바꿈도 읽는다', () => {
  const fm = parseFrontMatter(page(['raw/a.md']).replaceAll('\n', '\r\n'));
  assert.deepEqual(fm.sources, ['raw/a.md']);
});

test('parseFrontMatter: front matter가 없으면 null', () => {
  assert.equal(parseFrontMatter('# 제목만'), null);
});

test('lintWiki: 올바른 위키는 오류 없음 (하위 폴더 링크 포함)', () => {
  const { wiki } = makeRepo({
    'raw/a.md': '# 원본',
    'wiki/index.md': '- [축](theory/axes.md)\n- [로그](log.md)\n',
    'wiki/log.md': '# 로그\n',
    'wiki/theory/axes.md': page(['raw/a.md']) + '\n[목차](../index.md)\n',
  });
  assert.deepEqual(lintWiki(wiki), []);
});

test('lintWiki: sources가 비었거나 status가 잘못되면 오류', () => {
  const { wiki } = makeRepo({
    'wiki/index.md': '- [a](a.md)\n- [b](b.md)\n',
    'wiki/log.md': '',
    'wiki/a.md': '---\nstatus: 가설\nsources:\n---\n# a\n',
    'wiki/b.md': page(['https://x.org'], '모름'),
  });
  const errors = lintWiki(wiki);
  assert.ok(errors.some((e) => e.includes('a.md') && e.includes('sources')));
  assert.ok(errors.some((e) => e.includes('b.md') && e.includes('status')));
});

test('lintWiki: 없는 raw 파일을 출처로 쓰면 오류', () => {
  const { wiki } = makeRepo({
    'wiki/index.md': '- [a](a.md)\n',
    'wiki/log.md': '',
    'wiki/a.md': page(['raw/없음.md']),
  });
  assert.ok(lintWiki(wiki).some((e) => e.includes('raw/없음.md')));
});

test('lintWiki: 깨진 링크와 목차 누락을 잡는다', () => {
  const { wiki } = makeRepo({
    'wiki/index.md': '- [a](a.md)\n',
    'wiki/log.md': '',
    'wiki/a.md': page(['https://x.org']) + '[없는 문서](nope.md)\n',
    'wiki/orphan.md': page(['https://x.org']),
  });
  const errors = lintWiki(wiki);
  assert.ok(errors.some((e) => e.includes('nope.md')));
  assert.ok(errors.some((e) => e.includes('orphan.md') && e.includes('index.md')));
});
