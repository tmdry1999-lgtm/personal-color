// 운영자 설정만 저장한다 (사진·측정값은 저장하지 않음)
const KEY = 'pc-booth-settings';
// cameras: 웹캠 deviceId별 채도·색온도·노출 값. 저장값이 없는 웹캠은 켤 때의 자기 기본값으로 고정한다
export const DEFAULT_SETTINGS = Object.freeze({ deviceId: null, cardRect: null, cardType: 'white', cameras: Object.freeze({}), envNote: '' });
// 옛 형식(웹캠 구분 없는 camera 하나)을 잠시 담아 두는 자리. 처음 열리는 웹캠이 넘겨받는다
export const LEGACY_CAMERA = '*legacy';

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
    const { camera, ...saved } = JSON.parse(storage.getItem(KEY) ?? '{}');
    const cameras = { ...(saved.cameras ?? {}) };
    if (camera && typeof camera === 'object' && Object.keys(cameras).length === 0) cameras[LEGACY_CAMERA] = camera;
    return { ...DEFAULT_SETTINGS, ...saved, cameras };
  } catch {
    return { ...DEFAULT_SETTINGS, cameras: {} };
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

// 실제로 열린 웹캠의 저장값. 없으면 옛 형식 값, 그것도 없으면 null(웹캠 기본값으로 고정)
export function cameraValuesFor(settings, deviceId) {
  return settings.cameras?.[deviceId] ?? settings.cameras?.[LEGACY_CAMERA] ?? null;
}

// 그 웹캠의 값을 바꾼 새 설정. values가 null이면 지운다. 옛 형식 값은 여기서 정리한다
export function withCameraValues(settings, deviceId, values) {
  const { [LEGACY_CAMERA]: _legacy, ...cameras } = settings.cameras ?? {};
  if (values) cameras[deviceId] = values;
  else delete cameras[deviceId];
  return { ...settings, cameras };
}

const clamp01 =(v) => Math.min(1, Math.max(0, v));

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
