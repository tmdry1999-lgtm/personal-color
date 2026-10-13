import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SEASONS, AXES, TONES } from '../app/src/constants.js';
import { rgbToLch, hexToRgb } from '../app/src/color.js';

export { SEASONS, AXES, TONES };
const THRESHOLD_KEYS = [
  'borderlineGapPct', 'minFaceWidthRatio', 'maxYawDeg', 'holdSeconds', 'framesPerCapture',
  'trimPct', 'minSkinL', 'scleraMaxChroma', 'hairDyeMinChroma', 'lipProductMinChroma', 'idleResetSeconds',
  'cardMaxSaturatedRatio', 'cardMaxRelStd', 'minRegionPixels', 'eyeOpenMinRatio', 'glareMinL', 'glareMaxRatio',
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
    for (const key of Object.keys(mapping)) {
      if (!(key in weights)) errors.push(`${axis}.${key}: 가중치 없는 매핑 키`);
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
  const targets = s.calibration?.targets ?? {};
  for (const card of ['white', 'gray18']) {
    const t = targets[card];
    if (!Array.isArray(t) || t.length !== 3 || !t.every((v) => isNum(v) && v > 0 && v <= 1)) {
      errors.push(`calibration.targets.${card}: 0보다 크고 1 이하인 숫자 3개`);
    }
  }
  if (!(s.calibration?.card in targets)) errors.push('calibration.card: targets에 있는 카드 종류여야 함');
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
  for (const tone of Object.keys(p.tones ?? {})) if (!TONES.includes(tone)) errors.push(`${tone}: 알 수 없는 톤`);
  for (const season of Object.keys(p.seasons ?? {})) if (!SEASONS.includes(season)) errors.push(`${season}: 알 수 없는 계절`);
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
    if (!Array.isArray(s.metals) || s.metals.length === 0 || !s.metals.every((m) => typeof m === 'string' && m !== '')) {
      errors.push(`${season}.metals: 빈 문자열이 아닌 문자열 목록이어야 함`);
    }
    if (!Array.isArray(s.keywords) || s.keywords.length !== 3) errors.push(`${season}.keywords: 정확히 3개여야 함`);
  }
  errors.push(...checkNameHexConsistency(p));
  return errors;
}

// 같은 hex에 다른 이름, 같은 이름에 다른 hex가 붙으면 화면 라벨이 헷갈린다.
// 안경테는 이름이 제품 설명(예: 블랙 뿔테)이라 제외한다.
function checkNameHexConsistency(p) {
  const all = [];
  for (const t of Object.values(p.tones ?? {})) all.push(...(t.best ?? []), ...(t.worst ?? []));
  for (const s of Object.values(p.seasons ?? {})) {
    all.push(...Object.values(s.makeup ?? {}).flat(), ...(s.tops ?? []), ...(s.hair ?? []));
  }
  const nameByHex = new Map();
  const hexByName = new Map();
  const errors = new Set();
  for (const { name, hex } of all) {
    if (nameByHex.has(hex) && nameByHex.get(hex) !== name) errors.add(`${hex}: 이름이 여러 개 (${nameByHex.get(hex)}, ${name})`);
    if (hexByName.has(name) && hexByName.get(name) !== hex) errors.add(`${name}: hex가 여러 개 (${hexByName.get(name)}, ${hex})`);
    if (!nameByHex.has(hex)) nameByHex.set(hex, name);
    if (!hexByName.has(name)) hexByName.set(name, hex);
  }
  return [...errors];
}

export function hexToHueDeg(hex) {
  return rgbToLch(hexToRgb(hex)).h;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [seasonsPath, palettesPath] = process.argv.slice(2);
  if (!seasonsPath || !palettesPath) {
    console.error('사용법: node tools/validate-data.js <seasons.json> <palettes.json>');
    process.exit(1);
  }
  const errors = [
    ...validateSeasons(JSON.parse(readFileSync(seasonsPath, 'utf8'))).map((e) => `seasons: ${e}`),
    ...validatePalettes(JSON.parse(readFileSync(palettesPath, 'utf8'))).map((e) => `palettes: ${e}`),
  ];
  for (const e of errors) console.error(e);
  console.log(errors.length === 0 ? '데이터 검사 통과' : `오류 ${errors.length}개`);
  process.exit(errors.length === 0 ? 0 : 1);
}
