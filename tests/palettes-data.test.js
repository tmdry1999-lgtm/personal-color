import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TONES, validatePalettes, hexToHueDeg } from '../tools/validate-data.js';

const palettes = JSON.parse(readFileSync(new URL('../app/data/palettes.json', import.meta.url), 'utf8'));

// 무채색(검정·흰색·회색)은 색상각이 의미 없으므로 제외
function isNeutral(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < 20;
}

// 색상각 30~100°(주황~노랑 쪽)에 있는 유채색의 비율
function warmShare(colors) {
  const chromatic = colors.filter((c) => !isNeutral(c.hex));
  const warm = chromatic.filter((c) => { const h = hexToHueDeg(c.hex); return h >= 30 && h <= 100; });
  return chromatic.length === 0 ? 0 : warm.length / chromatic.length;
}

test('palettes.json은 형식 검사를 통과한다', () => {
  assert.deepEqual(validatePalettes(palettes), []);
});

test('웜 톤(봄·가을) 베스트는 노란 쪽 색이 절반 이상', () => {
  for (const tone of TONES.filter((t) => t.startsWith('spring') || t.startsWith('autumn'))) {
    assert.ok(warmShare(palettes.tones[tone].best) >= 0.5, `${tone} 베스트에 노란 쪽 색이 부족함`);
  }
});

test('쿨 톤(여름·겨울) 베스트는 노란 쪽 색이 1/3 이하', () => {
  for (const tone of TONES.filter((t) => t.startsWith('summer') || t.startsWith('winter'))) {
    assert.ok(warmShare(palettes.tones[tone].best) <= 1 / 3, `${tone} 베스트에 노란 쪽 색이 많음`);
  }
});
