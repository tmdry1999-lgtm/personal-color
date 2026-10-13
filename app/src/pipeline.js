// 흐름: 스펙 6장. 프레임 → A4 보정 → 부위 측정 → 프레임 중앙값 → 특징 → 4축 → 판정
import { sampleRect, extractRegions } from './regions.js';
import { cardStats, checkCard, computeGains } from './calibrate.js';
import { measureRegion, measureLitRegion, combineFrames, hasGlare } from './measure.js';
import { buildFeatures, computeAxes } from './axes.js';
import { classify } from './classify.js';

const REGIONS = ['skin', 'iris', 'sclera', 'lip', 'brow', 'hair', 'neck'];
const NO_GAIN = [1, 1, 1];

function mostCommon(codes) {
  const counts = new Map();
  for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// 턱을 든 목 사진에서 목만 측정한다. 실패해도 얼굴 결과는 그대로 낸다.
function measureLiftedNeck(neckFrames, settings, target, t) {
  if (!neckFrames || neckFrames.length === 0) return { neck: null, lit: null, warning: null };
  const measures = [];
  const litMeasures = [];
  let cardFails = 0;
  for (const f of neckFrames) {
    const stats = cardStats(sampleRect(f.image, settings.cardRect));
    if (checkCard(stats, t)) { cardFails += 1; measures.push(null); litMeasures.push(null); continue; }
    const px = extractRegions(f.image, f.landmarks, f.hairMask, t);
    const gains = computeGains(stats.mean, target);
    measures.push(measureRegion(px.neck, gains, t.trimPct, t.minRegionPixels));
    litMeasures.push(measureLitRegion(px.neck, gains, t.minRegionPixels));
  }
  const neck = combineFrames(measures);
  return { neck, lit: combineFrames(litMeasures), warning: neck ? null : `neck_failed:${cardFails > 0 ? 'card' : 'no_neck'}` };
}

export function analyze({ frames, neckFrames = [], settings, flags, config }) {
  if (!frames || frames.length === 0) return { ok: false, error: 'not_enough_frames' };
  const t = config.thresholds;
  const target = config.calibration.targets[settings.cardType ?? config.calibration.card];

  const perFrame = [];
  const cardErrors = [];
  for (const f of frames) {
    const stats = cardStats(sampleRect(f.image, settings.cardRect));
    const err = checkCard(stats, t);
    if (err) { cardErrors.push(err); continue; }
    const gains = computeGains(stats.mean, target);
    const px = extractRegions(f.image, f.landmarks, f.hairMask, t);
    if (hasGlare(px.iris, t.glareMinL, t.glareMaxRatio)) px.iris = [];
    const measured = { rawSkin: measureRegion(px.skin, NO_GAIN, t.trimPct, t.minRegionPixels) };
    for (const r of REGIONS) measured[r] = measureRegion(px[r], gains, t.trimPct, t.minRegionPixels);
    measured.neckLit = measureLitRegion(px.neck, gains, t.minRegionPixels);
    perFrame.push(measured);
  }
  if (perFrame.length * 2 < frames.length) return { ok: false, error: mostCommon(cardErrors) };

  const m = Object.fromEntries(REGIONS.map((r) => [r, combineFrames(perFrame.map((p) => p[r]))]));
  const rawSkin = combineFrames(perFrame.map((p) => p.rawSkin));
  if (!m.skin || !rawSkin) return { ok: false, error: 'no_skin' };
  if (rawSkin.L < t.minSkinL) return { ok: false, error: 'too_dark' };

  const lifted = measureLiftedNeck(neckFrames, settings, target, t);
  m.neckLit = combineFrames(perFrame.map((p) => p.neckLit));
  m.liftedNeck = lifted.neck;
  m.liftedNeckLit = lifted.lit;

  const warnings = [];
  if (lifted.warning) warnings.push(lifted.warning);
  if (m.sclera && m.sclera.C > t.scleraMaxChroma) warnings.push('sclera_chroma');
  if (cardErrors.length > 0) warnings.push(`card_frames_skipped:${cardErrors.length}`);

  const { features, excluded } = buildFeatures(m, flags, t);
  const axes = computeAxes(features, config);
  return { ok: true, result: { ...classify(axes, config), axes }, measurements: m, features, warnings, excluded };
}
