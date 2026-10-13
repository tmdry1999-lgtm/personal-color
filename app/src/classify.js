// 판정: wiki/scoring/season-prototypes.md, wiki/scoring/tone-rules.md
import { SEASONS, AXES } from './constants.js';

export function classify(axes, config) {
  const w = config.axisWeights;
  const d = SEASONS.map((s) => Math.sqrt(
    config.seasons[s].prototype.reduce((acc, p, i) => acc + w[i] * (axes[i] - p) ** 2, 0),
  ));
  const zero = d.findIndex((v) => v === 0);
  let pct;
  if (zero >= 0) {
    pct = d.map((_, i) => (i === zero ? 100 : 0));
  } else {
    const inv = d.map((v) => 1 / v);
    const sum = inv.reduce((a, b) => a + b, 0);
    pct = inv.map((v) => (v / sum) * 100);
  }

  // 정렬이 안정적이라 % 동점이면 SEASONS 순서가 앞선다
  const ranked = SEASONS.map((s, i) => ({ s, p: pct[i] })).sort((a, b) => b.p - a.p);
  const season = ranked[0].s;
  const borderline = ranked[0].p - ranked[1].p < config.thresholds.borderlineGapPct ? ranked[1].s : null;

  const proto = config.seasons[season].prototype;
  const tones = Object.entries(config.toneRules)
    .filter(([, r]) => r.season === season)
    .map(([id, r], idx) => {
      const ai = AXES.indexOf(r.axis);
      return { id, idx, score: r.direction * (axes[ai] - proto[ai]), isTrue: id.endsWith('-true') };
    });
  // 점수 큰 순 → 동점이면 트루 → 그래도 같으면 toneRules 순서
  tones.sort((a, b) => b.score - a.score || Number(b.isTrue) - Number(a.isTrue) || a.idx - b.idx);

  return {
    season,
    tone: tones[0].id,
    borderline,
    pct: Object.fromEntries(SEASONS.map((s, i) => [s, pct[i]])),
  };
}
