import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srgbToLinear, linearToSrgb, linearToLab, withLch, rgbToLch, hexToRgb } from '../app/src/color.js';
import { SEASONS, AXES, TONES, SEASON_NAMES } from '../app/src/constants.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('상수', () => {
  assert.deepEqual(SEASONS, ['spring', 'summer', 'autumn', 'winter']);
  assert.deepEqual(AXES, ['warmth', 'value', 'chroma', 'contrast']);
  assert.equal(TONES.length, 12);
  assert.equal(SEASON_NAMES.summer, '여름 쿨');
});

test('srgbToLinear ↔ linearToSrgb 왕복', () => {
  for (const v of [0, 1, 10, 128, 200, 255]) assert.equal(linearToSrgb(srgbToLinear(v)), v);
  assert.equal(srgbToLinear(0), 0);
  assert.equal(srgbToLinear(255), 1);
  assert.equal(linearToSrgb(1.5), 255);
});

test('rgbToLch: 흰색·검정 (위키 color-conversion.md 검증값)', () => {
  const w = rgbToLch([255, 255, 255]);
  near(w.L, 100, 0.01, 'L'); assert.ok(w.C < 0.01); assert.ok(Number.isNaN(w.h));
  near(rgbToLch([0, 0, 0]).L, 0, 1e-9, 'L');
});

test('rgbToLch: 빨강 L≈53.24 a≈80.09 b≈67.20 h≈40.0, 파랑 h≈306.3', () => {
  const r = rgbToLch([255, 0, 0]);
  near(r.L, 53.24, 0.05, 'L'); near(r.a, 80.09, 0.05, 'a'); near(r.b, 67.20, 0.05, 'b'); near(r.h, 40.0, 0.1, 'h');
  near(rgbToLch([0, 0, 255]).h, 306.3, 0.2, 'h');
});

test('linearToLab + withLch = rgbToLch', () => {
  const rgb = [220, 180, 150];
  assert.deepEqual(withLch(linearToLab(rgb.map(srgbToLinear))), rgbToLch(rgb));
});

test('hexToRgb', () => {
  assert.deepEqual(hexToRgb('#C8102E'), [200, 16, 46]);
});

test('D65 기준이다 (culori 기본 lab은 D50이라 a*가 11.81로 나옴)', () => {
  const skin = rgbToLch([0xdc, 0xb4, 0x96]);
  near(skin.L, 76.11, 0.02, 'L'); near(skin.a, 10.19, 0.02, 'a'); near(skin.b, 20.76, 0.02, 'b');
});
