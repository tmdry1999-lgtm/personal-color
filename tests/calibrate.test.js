import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardStats, checkCard, computeGains } from '../app/src/calibrate.js';
import { srgbToLinear } from '../app/src/color.js';

const T = { cardMaxSaturatedRatio: 0.05, cardMaxRelStd: 0.15 };
const fill = (n, rgb) => Array.from({ length: n }, () => rgb);

test('cardStats: 균일한 A4', () => {
  const s = cardStats(fill(100, [200, 200, 200]));
  for (const m of s.mean) assert.ok(Math.abs(m - srgbToLinear(200)) < 1e-12);
  assert.equal(s.saturatedRatio, 0);
  assert.equal(s.relStd, 0);
  assert.equal(checkCard(s, T), null);
});

test('checkCard: 빈 영역 → card_missing', () => {
  assert.equal(cardStats([]), null);
  assert.equal(checkCard(null, T), 'card_missing');
});

test('checkCard: 하얗게 날아감 → card_saturated', () => {
  const s = cardStats([...fill(90, [230, 230, 230]), ...fill(10, [255, 255, 255])]);
  assert.ok(Math.abs(s.saturatedRatio - 0.1) < 1e-12);
  assert.equal(checkCard(s, T), 'card_saturated');
});

test('checkCard: 너무 어두움 → card_dark', () => {
  assert.equal(checkCard(cardStats(fill(50, [0, 0, 0])), T), 'card_dark');
});

test('checkCard: 가려짐(밝기 편차 큼) → card_occluded', () => {
  assert.equal(checkCard(cardStats([...fill(50, [230, 230, 230]), ...fill(50, [40, 40, 40])]), T), 'card_occluded');
});

test('computeGains: 목표 / 측정', () => {
  const g = computeGains([0.5, 0.4, 0.25], [0.8, 0.8, 0.8]);
  [1.6, 2, 3.2].forEach((v, i) => assert.ok(Math.abs(g[i] - v) < 1e-12));
});
