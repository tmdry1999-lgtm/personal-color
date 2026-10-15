// 측정 기록 모드: 숫자만 메모리에 쌓고, 복사용 문자열을 만든다. 저장하지 않는다.
const yesNo = (v) => (v ? '예' : '아니오');
const GENDER = { f: '여', m: '남' };

export function makeLogEntry({ participant, gender, flags, camera, cardType, envNote, out, now }) {
  const entry = {
    participant: participant?.trim() || 'P?',
    gender,
    dyed: Boolean(flags?.dyed),
    lipProduct: Boolean(flags?.lipProduct),
    baseMakeup: Boolean(flags?.baseMakeup),
    time: now.toISOString(),
    camera: camera ?? null,
    cardType: cardType ?? null,
    envNote: envNote?.trim() ?? '',
  };
  if (!out.ok) return { ...entry, error: out.error };
  const { result, measurements, features, warnings, excluded } = out;
  return { ...entry, result, measurements, features, warnings, excluded };
}

export function formatLog(entries) {
  if (entries.length === 0) return '기록 없음';
  const groups = new Map();
  for (const e of entries) {
    if (!groups.has(e.participant)) groups.set(e.participant, []);
    groups.get(e.participant).push(e);
  }
  const blocks = [];
  for (const [participant, list] of groups) {
    const first = list[0];
    const lines = [
      `참가자: ${participant}`,
      `성별: ${GENDER[first.gender] ?? first.gender}`,
      `염색: ${yesNo(first.dyed)}`,
      `립 제품: ${yesNo(first.lipProduct)}`,
      `베이스 화장: ${yesNo(first.baseMakeup)}`,
      '안경: ',
      '전문가 진단: ',
      ...list.map((e, i) => `${i + 1}회차: ${JSON.stringify(e)}`),
    ];
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

// 데이터 수집 모드가 켜져 있을 때, 성공한 측정만 기록한다.
// 실패한 측정은 조명·A4 문제라 범위 재설정 데이터에 쓸 수 없다.
export function shouldLog(out, modes) {
  return modes?.dataCollection === true && out.ok === true;
}

// 탭을 닫을 때까지만 보관 (sessionStorage). 숫자만 있고 사진은 없다. 새로고침으로 기록이 사라지는 것을 막는다.
const LOG_KEY = 'pc-booth-log';

export function loadLog(storage) {
  try {
    const v = JSON.parse(storage.getItem(LOG_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveLog(storage, entries) {
  try {
    storage.setItem(LOG_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}
