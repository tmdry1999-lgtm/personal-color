import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEASONS, AXES, TONES, validateSeasons, validatePalettes, hexToHueDeg,
} from '../tools/validate-data.js';

const c = (hex) => ({ name: `색 ${hex}`, hex });

function validSeasons() {
  return {
    version: 1, status: '가설', source: 'wiki/scoring/season-prototypes.md',
    axisMapping: {
      warmth: { skinHueDeg: [50, 75], skinB: [12, 22], lipHueDeg: [15, 40], irisHueDeg: [40, 70] },
      value: { skinL: [55, 75], hairL: [10, 45] },
      chroma: { skinC: [14, 28] },
      contrast: { deltaL: [30, 65] },
    },
    featureWeights: {
      warmth: { skinHueDeg: 0.35, skinB: 0.35, lipHueDeg: 0.15, irisHueDeg: 0.15 },
      value: { skinL: 0.8, hairL: 0.2 },
      chroma: { skinC: 1 },
      contrast: { deltaL: 1 },
    },
    seasons: {
      spring: { prototype: [70, 70, 70, 45] }, summer: { prototype: [30, 70, 35, 40] },
      autumn: { prototype: [70, 35, 35, 55] }, winter: { prototype: [30, 35, 70, 75] },
    },
    axisWeights: [1.5, 1, 1, 0.7],
    toneRules: Object.fromEntries(TONES.map((t) => [t, { season: t.split('-')[0], axis: 'value', direction: 1 }])),
    thresholds: {
      borderlineGapPct: 10, minFaceWidthRatio: 0.25, maxYawDeg: 15, holdSeconds: 3, framesPerCapture: 10,
      trimPct: 10, minSkinL: 25, scleraMaxChroma: 12, hairDyeMinChroma: 18, lipProductMinChroma: 45, idleResetSeconds: 60,
    },
  };
}

function validPalettes() {
  const season = {
    makeup: { lip: [c('#D46A8C')], blush: [c('#F0A6B8')], shadow: [c('#A78BA3')] },
    tops: [c('#C8B6E2')], glasses: [c('#C0C0C0')], metals: ['실버'], hair: [c('#6E5E54')],
    keywords: ['부드러운', '청량한', '우아한'],
  };
  return {
    version: 1, status: '가설', source: 'wiki/palettes/tone-palettes.md',
    tones: Object.fromEntries(TONES.map((t) => [t, {
      name: t, pccsTones: ['lt'],
      best: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'].map(c),
      worst: ['#777777', '#888888', '#999999', '#AAAAAA'].map(c),
    }])),
    seasons: Object.fromEntries(SEASONS.map((s) => [s, structuredClone(season)])),
  };
}

test('상수: 4계절, 4축, 12톤', () => {
  assert.deepEqual(SEASONS, ['spring', 'summer', 'autumn', 'winter']);
  assert.deepEqual(AXES, ['warmth', 'value', 'chroma', 'contrast']);
  assert.equal(TONES.length, 12);
});

test('validateSeasons: 올바른 데이터는 오류 없음', () => {
  assert.deepEqual(validateSeasons(validSeasons()), []);
});

test('validateSeasons: prototype 범위·길이 오류', () => {
  const s = validSeasons();
  s.seasons.spring.prototype = [70, 70, 120];
  assert.ok(validateSeasons(s).some((e) => e.includes('spring')));
});

test('validateSeasons: 가중치 합이 1이 아니면 오류', () => {
  const s = validSeasons();
  s.featureWeights.value.skinL = 0.5;
  assert.ok(validateSeasons(s).some((e) => e.includes('value') && e.includes('합')));
});

test('validateSeasons: 매핑 범위 min >= max면 오류', () => {
  const s = validSeasons();
  s.axisMapping.chroma.skinC = [28, 14];
  assert.ok(validateSeasons(s).some((e) => e.includes('skinC')));
});

test('validateSeasons: toneRules 누락·계절 불일치·임계값 누락', () => {
  const s = validSeasons();
  delete s.toneRules['winter-deep'];
  s.toneRules['spring-light'].season = 'summer';
  delete s.thresholds.trimPct;
  const errors = validateSeasons(s);
  assert.ok(errors.some((e) => e.includes('winter-deep')));
  assert.ok(errors.some((e) => e.includes('spring-light')));
  assert.ok(errors.some((e) => e.includes('trimPct')));
});

test('validatePalettes: 올바른 데이터는 오류 없음', () => {
  assert.deepEqual(validatePalettes(validPalettes()), []);
});

test('validatePalettes: 개수·hex 형식 오류', () => {
  const p = validPalettes();
  p.tones['summer-soft'].best.pop();
  p.tones['autumn-deep'].worst[0].hex = '#abc';
  const errors = validatePalettes(p);
  assert.ok(errors.some((e) => e.includes('summer-soft') && e.includes('best')));
  assert.ok(errors.some((e) => e.includes('autumn-deep') && e.includes('#abc')));
});

test('validatePalettes: 같은 색이 best와 worst에 동시에 있으면 오류', () => {
  const p = validPalettes();
  p.tones['winter-true'].worst[0].hex = '#111111';
  assert.ok(validatePalettes(p).some((e) => e.includes('winter-true') && e.includes('#111111')));
});

test('validatePalettes: 계절 키워드는 정확히 3개', () => {
  const p = validPalettes();
  p.seasons.autumn.keywords.push('하나 더');
  assert.ok(validatePalettes(p).some((e) => e.includes('autumn') && e.includes('keywords')));
});

test('validateSeasons: 가중치 없는 매핑 키는 오류', () => {
  const s = validSeasons();
  s.axisMapping.chroma.extraC = [1, 2];
  assert.ok(validateSeasons(s).some((e) => e.includes('extraC') && e.includes('가중치')));
});

test('validatePalettes: metals는 빈 문자열이 아닌 문자열 목록', () => {
  const p = validPalettes();
  p.seasons.winter.metals = ['실버', 3];
  assert.ok(validatePalettes(p).some((e) => e.includes('winter.metals')));
});

test('validatePalettes: 알 수 없는 톤·계절은 오류', () => {
  const p = validPalettes();
  p.tones['spring-soft'] = structuredClone(p.tones['spring-light']);
  p.seasons.monsoon = structuredClone(p.seasons.spring);
  const errors = validatePalettes(p);
  assert.ok(errors.some((e) => e.includes('spring-soft')));
  assert.ok(errors.some((e) => e.includes('monsoon')));
});

test('validatePalettes: 같은 hex는 같은 이름, 같은 이름은 같은 hex', () => {
  const p = validPalettes();
  p.tones['spring-light'].best[0] = { name: '트루 레드', hex: '#C8102E' };
  p.tones['autumn-true'].worst[0] = { name: '블루 레드', hex: '#C8102E' };
  p.seasons.spring.tops = [{ name: '코랄', hex: '#F88379' }];
  p.tones['winter-deep'].worst[0] = { name: '코랄', hex: '#FF7F50' };
  const errors = validatePalettes(p);
  assert.ok(errors.some((e) => e.includes('#C8102E')));
  assert.ok(errors.some((e) => e.includes('코랄')));
});

test('hexToHueDeg: 무채색은 NaN', () => {
  assert.ok(Number.isNaN(hexToHueDeg('#FFFFFF')));
  assert.ok(Number.isNaN(hexToHueDeg('#808080')));
});

test('CLI: 인자가 없으면 사용법을 출력하고 종료 코드 1', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('../tools/validate-data.js', import.meta.url))], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.ok(r.stderr.includes('사용법'));
});

test('hexToHueDeg: 알려진 값 (sRGB 빨강 ≈ 40°, 파랑 ≈ 306°)', () => {
  assert.ok(Math.abs(hexToHueDeg('#FF0000') - 40.0) < 0.5);
  assert.ok(Math.abs(hexToHueDeg('#0000FF') - 306.3) < 0.5);
});
