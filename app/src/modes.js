// 운영자 모드: 메모리에만 두고 저장하지 않는다. 새로고침하면 꺼진 상태(방문객 모드)로 돌아간다.
export const DEFAULT_MODES = Object.freeze({ dataCollection: false, chinLift: false });

// 모드가 켜져 있음을 운영자가 화면에서 바로 알 수 있게 하는 작은 표시. 모두 꺼져 있으면 null
export function modeBadgeText(modes, participant) {
  const parts = [];
  if (modes.dataCollection) parts.push(`기록 중 · ${participant?.trim() || 'P?'}`);
  if (modes.chinLift) parts.push('턱 들기');
  return parts.length ? parts.join(' · ') : null;
}

// 수집 모드를 껐는데 복사하지 않은 기록이 남아 있으면 알려준다. 자동으로 지우지 않는다.
export function leftoverLogNotice(modes, count) {
  if (modes.dataCollection || count === 0) return '';
  return `기록 ${count}건이 남아 있습니다. [모두 복사] 후 [비우기] 해 주세요.`;
}
