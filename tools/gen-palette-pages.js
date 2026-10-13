import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// wiki/palettes/의 표 두 개는 손으로 고치지 않고 palettes.json에서 생성한다.
// 색을 바꿀 때: palettes.json을 고치고 `npm run gen:palettes` 실행.

const chip = (c) => `${c.name} \`${c.hex}\``;
const SEASON_NAMES = { spring: '봄 웜', summer: '여름 쿨', autumn: '가을 웜', winter: '겨울 쿨' };
const GENERATED = '<!-- 자동 생성: app/data/palettes.json → npm run gen:palettes. 직접 고치지 마세요. -->';

export function renderTonePalettes(p) {
  let out = '---\nstatus: 가설\nsources:\n  - raw/web/pccs-tone-system.md\n  - raw/web/aligned-lover-12-seasons.md\n---\n\n';
  out += `# 12톤 팔레트\n\n${GENERATED}\n\n만드는 규칙은 [팔레트 규칙](palette-rules.md) 참고.\n\n`;
  for (const [id, tone] of Object.entries(p.tones)) {
    out += `## ${tone.name} (${id})\n\nPCCS 톤: ${tone.pccsTones.join(', ')}\n\n| 구분 | 색 |\n|---|---|\n`;
    tone.best.forEach((c, i) => { out += `| 베스트 ${i + 1} | ${chip(c)} |\n`; });
    tone.worst.forEach((c, i) => { out += `| 워스트 ${i + 1} | ${chip(c)} |\n`; });
    out += '\n';
  }
  return out + '[목차](../index.md)\n';
}

export function renderSeasonExtras(p) {
  let out = '---\nstatus: 가설\nsources:\n  - raw/web/tonemoa-personal-color.md\n---\n\n';
  out += `# 계절 추가 항목\n\n${GENERATED}\n\n## 표시 규칙\n\n`;
  out += '| 항목 | 여성 | 남성 | 표시 위치 |\n|---|---|---|---|\n';
  out += '| 메이크업 (립·블러셔·섀도우) | ✅ | | 부스 + QR |\n| 상의 | | ✅ | 부스 + QR |\n| 안경테 | | ✅ | 부스 + QR |\n';
  out += '| 금속 | ✅ | ✅ | 부스 + QR |\n| 헤어 | ✅ | ✅ | QR 전용 |\n| 키워드 | ✅ | ✅ | QR 전용 |\n\n';
  out += '범위 메모: 지금은 4계절 단위다. 12톤 단위 세분화는 4단계에서 한다.\n\n';
  for (const [id, s] of Object.entries(p.seasons)) {
    out += `## ${SEASON_NAMES[id]} (${id})\n\n| 항목 | 값 |\n|---|---|\n`;
    out += `| 립 | ${s.makeup.lip.map(chip).join(', ')} |\n`;
    out += `| 블러셔 | ${s.makeup.blush.map(chip).join(', ')} |\n`;
    out += `| 섀도우 | ${s.makeup.shadow.map(chip).join(', ')} |\n`;
    out += `| 상의 | ${s.tops.map(chip).join(', ')} |\n`;
    out += `| 안경테 | ${s.glasses.map(chip).join(', ')} |\n`;
    out += `| 금속 | ${s.metals.join(', ')} |\n`;
    out += `| 헤어 | ${s.hair.map(chip).join(', ')} |\n`;
    out += `| 키워드 | ${s.keywords.join(', ')} |\n\n`;
  }
  return out + '[목차](../index.md)\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const p = JSON.parse(readFileSync('app/data/palettes.json', 'utf8'));
  writeFileSync('wiki/palettes/tone-palettes.md', renderTonePalettes(p));
  writeFileSync('wiki/palettes/season-extras.md', renderSeasonExtras(p));
  console.log('팔레트 위키 페이지 2개 생성');
}
