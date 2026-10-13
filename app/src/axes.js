// 계산식: wiki/scoring/axis-formulas.md
import { AXES } from './constants.js';

export function featureScore(x, [min, max]) {
  return Math.min(1, Math.max(0, (x - min) / (max - min))) * 100;
}

const usable = (c) => (c && !Number.isNaN(c.h) ? c.h : null);
// 입술은 빨강 근처라 0°/360° 경계를 넘나든다. -180~180으로 펼친다.
const signedHue = (h) => (h === null ? null : h > 180 ? h - 360 : h);

export function buildFeatures(m, flags, t) {
  const excluded = [];
  let hair = m.hair ?? null;
  if (hair && flags.dyed) { excluded.push('hair:self_report'); hair = null; }
  else if (hair && hair.C > t.hairDyeMinChroma) { excluded.push('hair:auto'); hair = null; }
  let lip = m.lip ?? null;
  if (lip && flags.lipProduct) { excluded.push('lip:self_report'); lip = null; }
  else if (lip && lip.C > t.lipProductMinChroma) { excluded.push('lip:auto'); lip = null; }
  const s = m.skin;
  let iris = m.iris ?? null;
  // 안경 렌즈 반사 등으로 눈동자가 초록·파란빛으로 찍히면 쓰지 않는다
  if (iris && !Number.isNaN(iris.h) && iris.h > t.irisMaxHueDeg) { excluded.push('iris:auto'); iris = null; }
  const neck = m.neck ?? null;
  const liftedNeck = m.liftedNeck ?? null;
  const brow = m.brow ?? null;
  return {
    excluded,
    features: {
      skinHueDeg: usable(s),
      skinB: s.b,
      lipHueDeg: signedHue(usable(lip)),
      irisHueDeg: usable(iris),
      skinL: s.L,
      hairL: hair ? hair.L : null,
      skinC: s.C,
      deltaLHair: hair ? s.L - hair.L : null,
      deltaLIris: iris ? s.L - iris.L : null,
      deltaLBrow: brow ? s.L - brow.L : null,
      // 목 피부: 기록만 하고 아직 판정 가중치에는 넣지 않는다
      neckHueDeg: usable(neck),
      neckB: neck ? neck.b : null,
      neckC: neck ? neck.C : null,
      // 턱을 든 목 사진 (베이스 화장한 사람만)
      liftedNeckHueDeg: usable(liftedNeck),
      liftedNeckB: liftedNeck ? liftedNeck.b : null,
      liftedNeckC: liftedNeck ? liftedNeck.C : null,
    },
  };
}

export function computeAxes(features, config) {
  return AXES.map((axis) => {
    const mapping = config.axisMapping[axis];
    let sum = 0;
    let wsum = 0;
    for (const [key, w] of Object.entries(config.featureWeights[axis])) {
      const x = features[key];
      if (x === null || x === undefined || Number.isNaN(x)) continue;
      sum += w * featureScore(x, mapping[key]);
      wsum += w;
    }
    return wsum > 0 ? sum / wsum : 50;
  });
}
