// 결과 화면·QR 결과 페이지가 함께 쓰는 결과 HTML. 이미 있는 숫자만 보여준다 (사진 없음)
import { SEASONS, SEASON_NAMES, AXES, AXIS_NAMES } from './constants.js';

// 4축 값은 0~100, 높을수록 오른쪽 이름 (wiki/scoring/axis-formulas.md)
const AXIS_ENDS = {
  warmth: ['쿨', '웜'],
  value: ['어두움', '밝음'],
  chroma: ['부드러움', '선명함'],
  contrast: ['낮음', '높음'],
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isHex = (h) => /^#[0-9a-f]{6}$/i.test(h);
const clamp = (v) => Math.min(100, Math.max(0, Math.round(v)));
const shortName = (s) => SEASON_NAMES[s].split(' ')[0];

function swatch(c) {
  const ok = isHex(c.hex);
  return `<li class="swatch"><span class="swatch-color" style="--c:${ok ? c.hex : '#cfc8d2'}"></span>`
    + `<span class="swatch-name">${esc(c.name)}</span>${ok ? `<span class="swatch-hex">${c.hex}</span>` : ''}</li>`;
}

export function renderResultHtml(result, palettes) {
  const tone = palettes.tones[result.tone];
  const keywords = palettes.seasons?.[result.season]?.keywords ?? [];
  const pct = (s) => clamp(result.pct[s]);
  const borderline = result.borderline
    ? `<p class="r-borderline">${shortName(result.season)}-${shortName(result.borderline)} 경계형이에요. 두 계절의 색을 함께 참고해 보세요.</p>`
    : '';

  const bars = SEASONS.map((s) => `<li class="bar${s === result.season ? ' is-top' : ''}" style="--w:${pct(s)}%">`
    + `<span class="bar-name">${SEASON_NAMES[s]}</span><span class="bar-track"><span class="bar-fill"></span></span>`
    + `<span class="bar-value">${pct(s)}%</span></li>`).join('');

  const axes = AXES.map((a, i) => {
    const [lo, hi] = AXIS_ENDS[a];
    const x = clamp(result.axes[i]);
    return `<li class="axis" style="--x:${x}%"><span class="axis-name">${AXIS_NAMES[a]}</span>`
      + `<span class="axis-end">${lo}</span><span class="axis-track"><span class="axis-mark"></span></span>`
      + `<span class="axis-end">${hi}</span><span class="axis-value">${x}</span></li>`;
  }).join('');

  return `
<header class="r-head">
  <p class="r-lead">당신에게 어울리는 계절은</p>
  <h2 class="r-season">${SEASON_NAMES[result.season]} <span class="r-pct">${pct(result.season)}%</span></h2>
  <p class="r-tone">12톤으로 보면 <strong>${esc(tone.name)}</strong>에 가까워요 (참고)</p>
  ${borderline}
  <ul class="r-keywords">${keywords.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
</header>
<section class="r-best">
  <h3>잘 어울리는 색</h3>
  <ul class="swatches is-best">${tone.best.map(swatch).join('')}</ul>
</section>
<section class="r-worst">
  <h3>피하면 좋은 색</h3>
  <ul class="swatches is-worst">${tone.worst.map(swatch).join('')}</ul>
</section>
<section class="r-why">
  <h3>이렇게 판단했어요</h3>
  <ul class="bars">${bars}</ul>
  <ul class="axes">${axes}</ul>
</section>`;
}
