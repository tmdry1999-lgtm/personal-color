// 운영자 설정만 저장한다 (사진·측정값은 저장하지 않음)
const KEY = 'pc-booth-settings';
export const DEFAULT_SETTINGS = { deviceId: null, cardRect: null, cardType: 'white', camera: null };

export function browserStorage(kind = 'localStorage') {
  try {
    const s = globalThis[kind];
    s.getItem(KEY);
    return s;
  } catch {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  }
}

export function loadSettings(storage) {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(storage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage, settings) {
  try {
    storage.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function rectFromDrag(a, b) {
  const x0 = clamp01(Math.min(a.x, b.x));
  const y0 = clamp01(Math.min(a.y, b.y));
  const x1 = clamp01(Math.max(a.x, b.x));
  const y1 = clamp01(Math.max(a.y, b.y));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// 화면은 거울처럼 좌우 반전해서 보여준다. 화면 좌표 ↔ 원본 프레임 좌표
export function displayRectToRaw({ x, y, w, h }) {
  return { x: 1 - x - w, y, w, h };
}
