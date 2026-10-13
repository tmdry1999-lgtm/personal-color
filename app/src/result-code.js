// URL 형식: 스펙 7.4. 사진·좌표·원본 색값은 넣지 않는다.
import { SEASONS, TONES } from './constants.js';

export function encodeResult({ gender, season, tone, pct, axes, borderline }) {
  const q = new URLSearchParams({
    v: '1',
    g: gender,
    s: season,
    t: tone,
    p: SEASONS.map((s) => Math.round(pct[s])).join(','),
    x: axes.map((a) => Math.round(a)).join(','),
  });
  if (borderline) q.set('b', borderline);
  return q.toString();
}

function fourInts(str) {
  if (!str) return null;
  const parts = str.split(',');
  if (parts.length !== 4) return null;
  const n = parts.map((v) => (/^\d+$/.test(v) ? Number(v) : NaN));
  return n.every((v) => Number.isInteger(v) && v >= 0 && v <= 100) ? n : null;
}

export function decodeResult(search) {
  const q = new URLSearchParams(search);
  if (q.get('v') !== '1') return null;
  const gender = q.get('g');
  const season = q.get('s');
  const tone = q.get('t');
  const borderline = q.get('b');
  if (!['f', 'm'].includes(gender) || !SEASONS.includes(season)) return null;
  if (!TONES.includes(tone) || !tone.startsWith(`${season}-`)) return null;
  const p = fourInts(q.get('p'));
  const axes = fourInts(q.get('x'));
  if (!p || !axes) return null;
  if (borderline !== null && (!SEASONS.includes(borderline) || borderline === season)) return null;
  return { gender, season, tone, pct: Object.fromEntries(SEASONS.map((s, i) => [s, p[i]])), axes, borderline };
}
