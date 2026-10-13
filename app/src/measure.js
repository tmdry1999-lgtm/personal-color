// 절차: wiki/measurement/regions.md
import { srgbToLinear, linearToLab, withLch, rgbToLch } from './color.js';

export function measureRegion(pixels, gains, trimPct, minPixels) {
  if (!pixels || pixels.length < minPixels) return null;
  const labs = pixels.map((p) => linearToLab(p.map((v, i) => Math.min(1, srgbToLinear(v) * gains[i]))));
  labs.sort((x, y) => x.L - y.L);
  const k = Math.floor((labs.length * trimPct) / 100);
  const kept = labs.slice(k, labs.length - k);
  const avg = (key) => kept.reduce((s, c) => s + c[key], 0) / kept.length;
  return withLch({ L: avg('L'), a: avg('a'), b: avg('b') });
}

export function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function combineFrames(measures) {
  const ok = measures.filter(Boolean);
  if (ok.length === 0 || ok.length * 2 < measures.length) return null;
  return withLch({
    L: median(ok.map((m) => m.L)),
    a: median(ok.map((m) => m.a)),
    b: median(ok.map((m) => m.b)),
  });
}

export function hasGlare(pixels, minL, maxRatio) {
  if (!pixels || pixels.length === 0) return false;
  return pixels.filter((p) => rgbToLch(p).L > minL).length / pixels.length > maxRatio;
}
