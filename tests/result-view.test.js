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
