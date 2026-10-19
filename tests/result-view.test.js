import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderResultHtml } from '../app/src/result-view.js';

const palettes = JSON.parse(readFileSync(new URL('../app/data/palettes.json', import.meta.url), 'utf8'));
const result = { season: 'summer', tone: 'summer-light', borderline: null, pct: { spring: 21, summer: 62, autumn: 9, winter: 8 }, axes: [38, 71, 30, 56] };

test('계절·%·12톤(참고)·4축·베스트 6·워스트 4를 보여준다', () => {
  const html = renderResultHtml(result, palettes);
  assert.ok(html.includes('여름 쿨'));
  assert.ok(html.includes('62%'));
  assert.ok(html.includes('여름 라이트'));
  assert.ok(html.includes('참고'));
  assert.ok(html.includes('명도') && html.includes('71'));
  for (const c of palettes.tones['summer-light'].best) assert.ok(html.includes(c.hex), c.hex);
  for (const c of palettes.tones['summer-light'].worst) assert.ok(html.includes(c.hex), c.hex);
  assert.ok(!html.includes('경계형'));
});

test('경계형이면 "여름-겨울 경계형"을 보여준다', () => {
  const html = renderResultHtml({ ...result, borderline: 'winter' }, palettes);
  assert.ok(html.includes('여름-겨울 경계형'));
});

test('계절 키워드를 보여준다', () => {
  const html = renderResultHtml(result, palettes);
  for (const k of palettes.seasons.summer.keywords) assert.ok(html.includes(k), k);
});

test('4계절 막대 너비는 % 그대로, 판정 계절 막대만 강조', () => {
  const html = renderResultHtml(result, palettes);
  assert.ok(html.includes('--w:62%'));
  assert.ok(html.includes('--w:8%'));
  assert.equal((html.match(/class="bar is-top"/g) ?? []).length, 1);
});

test('4축 표시 위치는 0~100으로 자르고, 양쪽 끝 이름을 보여준다', () => {
  const html = renderResultHtml({ ...result, axes: [-5, 71, 130, 56] }, palettes);
  assert.ok(html.includes('--x:0%'));
  assert.ok(html.includes('--x:100%'));
  assert.ok(html.includes('--x:71%'));
  for (const w of ['쿨', '웜', '어두움', '밝음', '부드러움', '선명함']) assert.ok(html.includes(w), w);
});

test('팔레트 이름에 HTML이 섞여 있어도 태그로 들어가지 않는다', () => {
  const evil = structuredClone(palettes);
  evil.tones['summer-light'].best[0].name = '<img src=x onerror=alert(1)>';
  const html = renderResultHtml(result, evil);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
});

test('HEX가 색 형식이 아니면 스타일에 넣지 않는다', () => {
  const evil = structuredClone(palettes);
  evil.tones['summer-light'].best[0].hex = 'red;background:url(x)';
  const html = renderResultHtml(result, evil);
  assert.ok(!html.includes('url(x)'));
});
