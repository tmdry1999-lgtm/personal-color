import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classify } from '../app/src/classify.js';
import { SEASONS } from '../app/src/constants.js';

const config = JSON.parse(readFileSync(new URL('../app/data/seasons.json', import.meta.url), 'utf8'));

test('대표값 그대로 → 그 계절 100%, 트루 톤, 경계형 아님', () => {
  for (const s of SEASONS) {
    const r = classify(config.seasons[s].prototype, config);
    assert.equal(r.season, s);
    assert.equal(r.pct[s], 100);
    assert.equal(r.tone, `${s}-true`);
    assert.equal(r.borderline, null);
  }
});

test('위키 예시 (65, 60, 60, 50) → 봄 48.9%, 가을 21.6%, 여름 15.2%, 겨울 14.3%', () => {
  const r = classify([65, 60, 60, 50], config);
  assert.equal(r.season, 'spring');
  const expect = { spring: 48.9, autumn: 21.6, summer: 15.2, winter: 14.3 };
  for (const [s, v] of Object.entries(expect)) assert.ok(Math.abs(r.pct[s] - v) < 0.05, `${s}: ${r.pct[s]}`);
  assert.equal(r.borderline, null);
});

test('% 합은 100', () => {
  const r = classify([40, 55, 45, 60], config);
  const sum = Object.values(r.pct).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 100) < 1e-9);
});

test('위키 12톤 예시: 여름 + value 72, chroma 40, warmth 30 → 여름 라이트', () => {
  const r = classify([30, 72, 40, 40], config);
  assert.equal(r.season, 'summer');
  assert.equal(r.tone, 'summer-light');
});

test('여름과 겨울의 정중앙 → 여름-겨울 경계형', () => {
  const r = classify([30, 52.5, 52.5, 57.5], config);
  assert.equal(r.season, 'summer');
  assert.equal(r.borderline, 'winter');
});
