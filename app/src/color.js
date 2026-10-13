// culori를 감싼다. 반드시 D65(lab65)를 쓴다 — 기본 lab은 D50. 검증값: wiki/measurement/color-conversion.md
import { converter } from 'culori';

const toLab65 = converter('lab65');
const toLrgb = converter('lrgb');
const toRgb = converter('rgb');

// 픽셀마다 호출되므로 0~255 감마 해제 값을 미리 계산해 둔다
const LINEAR = Array.from({ length: 256 }, (_, v) => toLrgb({ mode: 'rgb', r: v / 255, g: 0, b: 0 }).r);

export function srgbToLinear(v) {
  return LINEAR[v];
}

export function linearToSrgb(c) {
  const v = toRgb({ mode: 'lrgb', r: Math.min(1, Math.max(0, c)), g: 0, b: 0 }).r;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

export function linearToLab([r, g, b]) {
  const lab = toLab65({ mode: 'lrgb', r, g, b });
  return { L: lab.l, a: lab.a, b: lab.b };
}

export function withLch({ L, a, b }) {
  const C = Math.hypot(a, b);
  // 무채색은 색상각이 정의되지 않는다
  const h = C < 1 ? NaN : (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  return { L, a, b, C, h };
}

export function rgbToLch(rgb) {
  return withLch(linearToLab(rgb.map(srgbToLinear)));
}

export function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
