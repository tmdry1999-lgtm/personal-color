import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const appDir = new URL('../app/', import.meta.url);

test('app/의 모든 HTML은 package.json과 같은 culori 버전을 import map으로 쓴다', () => {
  assert.ok(existsSync(new URL('index.html', appDir)), 'app/index.html 없음');
  const htmls = readdirSync(appDir).filter((f) => f.endsWith('.html'));
  for (const file of htmls) {
    const html = readFileSync(new URL(file, appDir), 'utf8');
    const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
    assert.ok(map, `${file}: import map 없음`);
    const url = JSON.parse(map[1]).imports.culori;
    assert.equal(url, `https://cdn.jsdelivr.net/npm/culori@${pkg.dependencies.culori}/bundled/culori.min.mjs`, file);
    assert.ok(html.indexOf('type="importmap"') < html.indexOf('type="module"'), `${file}: import map은 모듈 스크립트보다 앞에 있어야 함`);
  }
});
