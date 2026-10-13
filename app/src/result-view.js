// 디자인 없는 MVP 결과 표시. 5단계에서 디자인을 입힌다.
import { SEASONS, SEASON_NAMES, AXES, AXIS_NAMES } from './constants.js';

const chip = (c) =>
  `<span class="chip"><span class="swatch" style="background:${c.hex}"></span>${c.name} ${c.hex}</span>`;

export function renderResultHtml(result, palettes) {
  const tone = palettes.tones[result.tone];
  const pct = (s) => `${Math.round(result.pct[s])}%`;
  const borderline = result.borderline
    ? `<p class="borderline">${SEASON_NAMES[result.season].split(' ')[0]}-${SEASON_NAMES[result.borderline].split(' ')[0]} 경계형</p>`
    : '';
  return [
    `<h2>${SEASON_NAMES[result.season]} ${pct(result.season)}</h2>`,
    borderline,
    `<p>12톤 (참고): ${tone.name}</p>`,
    `<ul class="pct">${SEASONS.map((s) => `<li>${SEASON_NAMES[s]} ${pct(s)}</li>`).join('')}</ul>`,
    `<ul class="axes">${AXES.map((a, i) => `<li>${AXIS_NAMES[a]} ${Math.round(result.axes[i])}</li>`).join('')}</ul>`,
    `<h3>어울리는 색</h3><div class="chips">${tone.best.map(chip).join('')}</div>`,
    `<h3>피해야 할 색</h3><div class="chips">${tone.worst.map(chip).join('')}</div>`,
  ].join('\n');
}
