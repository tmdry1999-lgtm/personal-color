import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureRegion, measureLitRegion, median, combineFrames, hasGlare } from '../app/src/measure.js';
import { rgbToLch, linearToSrgb, srgbToLinear, linearToLab, withLch } from '../app/src/color.js';

const fill = (n, rgb) => Array.from({ length: n }, () => rgb);
const ONE = [1, 1, 1];

test('measureRegion: 균일한 영역 = 그 색의 LCh', () => {
  const m = measureRegion(fill(50, [200, 150, 120]), ONE, 10, 20);
  const e = rgbToLch([200, 150, 120]);
  for (const k of ['L', 'a', 'b', 'C', 'h']) assert.ok(Math.abs(m[k] - e[k]) < 1e-9, k);
});

test('measureRegion: 색이 치우친 조명을 배율로 되돌린다', () => {
  const truth = [0.4, 0.25, 0.18];
  const tint = [1.1, 1.0, 0.7];
  const tinted = truth.map((v, i) => linearToSrgb(v * tint[i]));
  const m = measureRegion(fill(50, tinted), tint.map((t) => 1 / t), 0, 20);
  const e = withLch(linearToLab(truth));
  for (const k of ['L', 'a', 'b']) assert.ok(Math.abs(m[k] - e[k]) < 0.6, `${k}: ${m[k]} vs ${e[k]}`);
});

test('measureRegion: 상하위 10% (반사광·그림자) 제거', () => {
  const pixels = [...fill(80, [200, 150, 120]), ...fill(10, [255, 255, 255]), ...fill(10, [0, 0, 0])];
  const m = measureRegion(pixels, ONE, 10, 20);
  assert.ok(Math.abs(m.L - rgbToLch([200, 150, 120]).L) < 1e-9);
});

test('measureRegion: 픽셀이 너무 적으면 null', () => {
  assert.equal(measureRegion(fill(19, [200, 150, 120]), ONE, 10, 20), null);
  assert.equal(measureRegion(null, ONE, 10, 20), null);
});

test('median', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test('combineFrames: 중앙값, 유효한 프레임이 절반 미만이면 null', () => {
  const m = (L) => withLch({ L, a: 10, b: 15 });
  assert.equal(combineFrames([m(50), m(70), m(60)]).L, 60);
  assert.equal(combineFrames([m(50), null]).L, 50);
  assert.equal(combineFrames([m(50), null, null]), null);
  assert.equal(combineFrames([]), null);
});

test('hasGlare: 밝은 반사 픽셀 비율', () => {
  const pixels = [...fill(7, [60, 40, 30]), ...fill(3, [250, 250, 250])];
  assert.equal(hasGlare(pixels, 85, 0.2), true);
  assert.equal(hasGlare(pixels, 85, 0.5), false);
  assert.equal(hasGlare([], 85, 0.2), false);
});

test('srgbToLinear는 measure가 쓰는 것과 같은 모듈', () => {
  assert.equal(typeof srgbToLinear, 'function');
});

test('measureLitRegion: 그림자 진 어두운 절반을 버리고 밝은 쪽만 (반사광 상위 10%는 제외)', () => {
  const lit = [200, 160, 120];
  const shadow = [90, 60, 40];
  const pixels = [...fill(50, shadow), ...fill(40, lit), ...fill(10, [255, 255, 255])];
  const m = measureLitRegion(pixels, ONE, 20);
  const e = rgbToLch(lit);
  for (const k of ['L', 'a', 'b']) assert.ok(Math.abs(m[k] - e[k]) < 1e-9, k);
  assert.equal(measureLitRegion(fill(19, lit), ONE, 20), null);
});
