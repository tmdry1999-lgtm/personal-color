import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const AXES = ['warmth', 'value', 'chroma', 'contrast'];
export const TONES = [
  'spring-light', 'spring-bright', 'spring-true',
  'summer-light', 'summer-soft', 'summer-true',
  'autumn-soft', 'autumn-deep', 'autumn-true',
  'winter-bright', 'winter-deep', 'winter-true',
];
const THRESHOLD_KEYS = [
  'borderlineGapPct', 'minFaceWidthRatio', 'maxYawDeg', 'holdSeconds', 'framesPerCapture',
  'trimPct', 'minSkinL', 'scleraMaxChroma', 'hairDyeMinChroma', 'lipProductMinChroma', 'idleResetSeconds',
];
const HEX = /^#[0-9A-F]{6}$/;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function validateSeasons(s) {
  const errors = [];
  for (const axis of AXES) {
    const mapping = s.axisMapping?.[axis];
    const weights = s.featureWeights?.[axis];
    if (!mapping || !weights) { errors.push(`${axis}: axisMapping/featureWeights 없음`); continue; }
    for (const [key, range] of Object.entries(mapping)) {
      if (!Array.isArray(range) || range.length !== 2 || !isNum(range[0]) || !isNum(range[1]) || range[0] >= range[1]) {
        errors.push(`${axis}.${key}: 범위는 [min, max]이고 min < max여야 함`);
      }
    }
    let sum = 0;
    for (const [key, w] of Object.entries(weights)) {
      if (!(key in mapping)) errors.push(`${axis}.${key}: axisMapping에 없는 가중치 키`);
      if (!isNum(w) || w < 0) errors.push(`${axis}.${key}: 가중치는 0 이상 숫자`);
      sum += isNum(w) ? w : 0;
    }
    if (Math.abs(sum - 1) > 0.001) errors.push(`${axis}: 가중치 합이 1이 아님 (${sum})`);
  }
  for (const season of SEASONS) {
    const p = s.seasons?.[season]?.prototype;
    if (!Array.isArray(p) || p.length !== 4 || !p.every((v) => isNum(v) && v >= 0 && v <= 100)) {
      errors.push(`${season}: prototype은 0~100 숫자 4개`);
    }
  }
  if (!Array.isArray(s.axisWeights) || s.axisWeights.length !== 4 || !s.axisWeights.every((v) => isNum(v) && v > 0)) {
    errors.push('axisWeights: 0보다 큰 숫자 4개');
  }
  for (const tone of TONES) {
    const rule = s.toneRules?.[tone];
    if (!rule) { errors.push(`${tone}: toneRules 없음`); continue; }
    if (rule.season !== tone.split('-')[0]) errors.push(`${tone}: season이 id와 다름`);
    if (!AXES.includes(rule.axis)) errors.push(`${tone}: axis가 잘못됨`);
    if (rule.direction !== 1 && rule.direction !== -1) errors.push(`${tone}: direction은 1 또는 -1`);
  }
  for (const key of THRESHOLD_KEYS) {
    if (!isNum(s.thresholds?.[key])) errors.push(`thresholds.${key}: 숫자 없음`);
  }
  return errors;
}

function checkColors(list, label, errors, exactCount) {
  if (!Array.isArray(list) || list.length === 0) { errors.push(`${label}: 색 목록이 비어 있음`); return; }
  if (exactCount !== undefined && list.length !== exactCount) errors.push(`${label}: 정확히 ${exactCount}개여야 함 (${list.length}개)`);
  for (const item of list) {
    if (typeof item?.name !== 'string' || item.name === '') errors.push(`${label}: 색 이름 없음`);
    if (!HEX.test(item?.hex ?? '')) errors.push(`${label}: 잘못된 hex ${item?.hex}`);
  }
}

export function validatePalettes(p) {
  const errors = [];
  for (const tone of TONES) {
    const t = p.tones?.[tone];
    if (!t) { errors.push(`${tone}: 팔레트 없음`); continue; }
    if (typeof t.name !== 'string' || t.name === '') errors.push(`${tone}: name 없음`);
    if (!Array.isArray(t.pccsTones) || t.pccsTones.length === 0) errors.push(`${tone}: pccsTones 없음`);
    checkColors(t.best, `${tone}.best`, errors, 6);
    checkColors(t.worst, `${tone}.worst`, errors, 4);
    const best = new Set((t.best ?? []).map((c) => c.hex));
    for (const c of t.worst ?? []) if (best.has(c.hex)) errors.push(`${tone}: ${c.hex}가 best와 worst에 모두 있음`);
  }
  for (const season of SEASONS) {
    const s = p.seasons?.[season];
    if (!s) { errors.push(`${season}: 계절 추가 항목 없음`); continue; }
    for (const part of ['lip', 'blush', 'shadow']) checkColors(s.makeup?.[part], `${season}.makeup.${part}`, errors);
    for (const part of ['tops', 'glasses', 'hair']) checkColors(s[part], `${season}.${part}`, errors);
    if (!Array.isArray(s.metals) || s.metals.length === 0) errors.push(`${season}.metals: 비어 있음`);
    if (!Array.isArray(s.keywords) || s.keywords.length !== 3) errors.push(`${season}.keywords: 정확히 3개여야 함`);
  }
  return errors;
}

export function hexToHueDeg(hex) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16)));
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const a = 500 * (f(x) - f(y));
  const bb = 200 * (f(y) - f(z));
  return (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [seasonsPath, palettesPath] = process.argv.slice(2);
  const errors = [
    ...validateSeasons(JSON.parse(readFileSync(seasonsPath, 'utf8'))).map((e) => `seasons: ${e}`),
    ...validatePalettes(JSON.parse(readFileSync(palettesPath, 'utf8'))).map((e) => `palettes: ${e}`),
  ];
  for (const e of errors) console.error(e);
  console.log(errors.length === 0 ? '데이터 검사 통과' : `오류 ${errors.length}개`);
  process.exit(errors.length === 0 ? 0 : 1);
}
