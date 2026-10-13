import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { featureScore, buildFeatures, computeAxes } from '../app/src/axes.js';
import { withLch } from '../app/src/color.js';

const config = JSON.parse(readFileSync(new URL('../app/data/seasons.json', import.meta.url), 'utf8'));
const T = config.thresholds;
const lch = (L, a, b) => withLch({ L, a, b });
const NO_FLAGS = { dyed: false, lipProduct: false };
const base = () => ({ skin: lch(65, 12, 17), iris: lch(25, 5, 8), hair: lch(15, 2, 3), lip: lch(50, 30, 15), brow: lch(30, 3, 5) });

test('featureScore: 범위 안은 비례, 밖은 0/100', () => {
  assert.equal(featureScore(50, [50, 75]), 0);
  assert.equal(featureScore(62.5, [50, 75]), 50);
  assert.equal(featureScore(80, [50, 75]), 100);
  assert.equal(featureScore(10, [50, 75]), 0);
});

test('buildFeatures: 모든 부위 사용', () => {
  const { features, excluded } = buildFeatures(base(), NO_FLAGS, T);
  assert.deepEqual(excluded, []);
  assert.equal(features.skinL, 65);
  assert.equal(features.deltaLHair, 50);
  assert.equal(features.deltaLIris, 40);
  assert.equal(features.deltaLBrow, 35);
});

test('buildFeatures: 염색 체크 → 머리카락 제외 (self_report)', () => {
  const { features, excluded } = buildFeatures(base(), { dyed: true, lipProduct: false }, T);
  assert.deepEqual(excluded, ['hair:self_report']);
  assert.equal(features.hairL, null);
  assert.equal(features.deltaLHair, null);
});

test('buildFeatures: 채도 높은 머리·입술 → 자동 제외 (auto)', () => {
  const m = base();
  m.hair = lch(30, 20, 15); // C = 25 > 18
  m.lip = lch(45, 50, 20); // C ≈ 53.9 > 45
  const { excluded } = buildFeatures(m, NO_FLAGS, T);
  assert.deepEqual(excluded, ['hair:auto', 'lip:auto']);
});

test('buildFeatures: 핑크 쪽 입술 색상각(350°)은 -10°로 다룬다', () => {
  const m = base();
  m.lip = lch(50, 30, -5.3); // h ≈ 350
  const { features } = buildFeatures(m, NO_FLAGS, T);
  assert.ok(features.lipHueDeg < 0 && features.lipHueDeg > -11);
});

test('computeAxes: 제외된 특징은 빼고 가중치를 다시 나눈다 (위키 axis-formulas.md 예)', () => {
  const f = { skinHueDeg: 75, skinB: 12, lipHueDeg: null, irisHueDeg: 70, skinL: null, hairL: null, skinC: null, deltaLHair: null, deltaLIris: null, deltaLBrow: null };
  const [warmth, value, chroma, contrast] = computeAxes(f, config);
  assert.ok(Math.abs(warmth - (0.35 * 100 + 0.35 * 0 + 0.15 * 100) / 0.85) < 1e-9);
  assert.equal(value, 50);
  assert.equal(chroma, 50);
  assert.equal(contrast, 50);
});

test('computeAxes: 모든 특징이 최댓값이면 100', () => {
  const f = { skinHueDeg: 90, skinB: 30, lipHueDeg: 50, irisHueDeg: 80, skinL: 90, hairL: 60, skinC: 40, deltaLHair: 80, deltaLIris: 80, deltaLBrow: 80 };
  for (const v of computeAxes(f, config)) assert.ok(Math.abs(v - 100) < 1e-9, `${v}`);
});

test('buildFeatures: 목 피부 색상각·b*·채도를 기록한다 (판정에는 아직 안 씀)', () => {
  const m = { ...base(), neck: lch(55, 10, 20) };
  const { features } = buildFeatures(m, NO_FLAGS, T);
  assert.ok(Math.abs(features.neckHueDeg - Math.atan2(20, 10) * 180 / Math.PI) < 1e-9);
  assert.equal(features.neckB, 20);
  assert.ok(Math.abs(features.neckC - Math.hypot(10, 20)) < 1e-9);
  assert.equal(buildFeatures(base(), NO_FLAGS, T).features.neckHueDeg, null);
});

test('buildFeatures: 눈동자 색상각이 비정상(안경 반사로 초록빛)이면 눈동자 제외', () => {
  const m = base();
  m.iris = lch(8, -4, 8); // h ≈ 116.6
  const { features, excluded } = buildFeatures(m, NO_FLAGS, T);
  assert.ok(excluded.includes('iris:auto'));
  assert.equal(features.irisHueDeg, null);
  assert.equal(features.deltaLIris, null);
});
