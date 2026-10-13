// 원리: wiki/measurement/reference-card.md
import { srgbToLinear } from './color.js';

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function cardStats(pixels) {
  if (!pixels || pixels.length === 0) return null;
  const lin = pixels.map((p) => p.map(srgbToLinear));
  const mean = [0, 1, 2].map((i) => lin.reduce((s, p) => s + p[i], 0) / lin.length);
  const saturatedRatio = lin.filter((p) => Math.max(...p) >= 0.98).length / lin.length;
  const lum = lin.map(luminance);
  const lumMean = lum.reduce((s, v) => s + v, 0) / lum.length;
  const sd = Math.sqrt(lum.reduce((s, v) => s + (v - lumMean) ** 2, 0) / lum.length);
  return { mean, saturatedRatio, relStd: lumMean > 0 ? sd / lumMean : Infinity };
}

export function checkCard(stats, t) {
  if (!stats) return 'card_missing';
  if (stats.saturatedRatio > t.cardMaxSaturatedRatio) return 'card_saturated';
  if (Math.min(...stats.mean) <= 0.01) return 'card_dark';
  if (stats.relStd > t.cardMaxRelStd) return 'card_occluded';
  return null;
}

export function computeGains(mean, target) {
  return target.map((t, i) => t / mean[i]);
}
