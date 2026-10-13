// 흐름: 스펙 6장. 프레임 → A4 보정 → 부위 측정 → 프레임 중앙값 → 특징 → 4축 → 판정
import { sampleRect, extractRegions } from './regions.js';
import { cardStats, checkCard, computeGains } from './calibrate.js';
import { measureRegion, combineFrames, hasGlare } from './measure.js';
import { buildFeatures, computeAxes } from './axes.js';
import { classify } from './classify.js';

const REGIONS = ['skin', 'iris', 'sclera', 'lip', 'brow', 'hair'];
const NO_GAIN = [1, 1, 1];

function mostCommon(codes) {
  const counts = new Map();
  for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function analyze({ frames, settings, flags, config }) {
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
    perFrame.push(measured);
  }
  if (perFrame.length * 2 < frames.length) return { ok: false, error: mostCommon(cardErrors) };

  const m = Object.fromEntries(REGIONS.map((r) => [r, combineFrames(perFrame.map((p) => p[r]))]));
  const rawSkin = combineFrames(perFrame.map((p) => p.rawSkin));
  if (!m.skin || !rawSkin) return { ok: false, error: 'no_skin' };
  if (rawSkin.L < t.minSkinL) return { ok: false, error: 'too_dark' };

  const warnings = [];
  if (m.sclera && m.sclera.C > t.scleraMaxChroma) warnings.push('sclera_chroma');
  if (cardErrors.length > 0) warnings.push(`card_frames_skipped:${cardErrors.length}`);

  const { features, excluded } = buildFeatures(m, flags, t);
  const axes = computeAxes(features, config);
  return { ok: true, result: { ...classify(axes, config), axes }, measurements: m, features, warnings, excluded };
}
