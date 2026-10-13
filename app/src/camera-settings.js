// 웹캠 설정값을 숫자로 저장하고 매번 똑같이 다시 적용한다 (wiki/decisions/phase3-backlog.md 1·4번)
export const CAMERA_KEYS = ['saturation', 'colorTemperature', 'exposureTime'];

const isRange = (r) => r && typeof r.min === 'number' && typeof r.max === 'number';

export function describeControls(caps, current) {
  return Object.fromEntries(CAMERA_KEYS.map((key) => {
    const r = caps?.[key];
    if (!isRange(r)) return [key, null];
    return [key, { min: r.min, max: r.max, step: r.step || 1, value: current?.[key] ?? r.min }];
  }));
}

export function clampToCaps(values, caps) {
  const out = {};
  for (const key of CAMERA_KEYS) {
    const r = caps?.[key];
    const v = values?.[key];
    if (!isRange(r) || typeof v !== 'number' || !Number.isFinite(v)) continue;
    const step = r.step || 1;
    const snapped = r.min + Math.round((v - r.min) / step) * step;
    out[key] = Math.min(r.max, Math.max(r.min, snapped));
  }
  return out;
}

// 수동 모드를 먼저 켠 뒤 값을 하나씩 적용해야 한다 (raw/web/webcam-constraints.md)
export function buildConstraintSteps(values, caps) {
  const v = clampToCaps(values, caps);
  const steps = [];
  if (caps?.whiteBalanceMode?.includes?.('manual')) steps.push({ whiteBalanceMode: 'manual' });
  if ('colorTemperature' in v) steps.push({ colorTemperature: v.colorTemperature });
  if (caps?.exposureMode?.includes?.('manual')) steps.push({ exposureMode: 'manual' });
  if ('exposureTime' in v) steps.push({ exposureTime: v.exposureTime });
  if ('saturation' in v) steps.push({ saturation: v.saturation });
  return steps;
}
