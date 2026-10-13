import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeControls, clampToCaps, buildConstraintSteps, knownValues, parseTypedValue } from '../app/src/camera-settings.js';

// 개발 PC 웹캠 실측 형식 (raw/measurements/2026-10-13-camera-capabilities.md) + 채도·노출 시간
const caps = {
  whiteBalanceMode: ['continuous', 'manual'],
  exposureMode: ['continuous', 'manual'],
  colorTemperature: { min: 2800, max: 6500, step: 1 },
  exposureTime: { min: 1, max: 10000, step: 1 },
  saturation: { min: 0, max: 255, step: 1 },
};

test('describeControls: 지원 항목은 범위와 현재 값, 지원 안 하면 null', () => {
  const c = describeControls(caps, { saturation: 128, colorTemperature: 4600 });
  assert.deepEqual(c.saturation, { min: 0, max: 255, step: 1, value: 128 });
  assert.deepEqual(c.colorTemperature, { min: 2800, max: 6500, step: 1, value: 4600 });
  // 현재 값을 모르면 null — 최솟값(노출 1)으로 저장하면 화면이 검게 된다 (실측 버그)
  assert.equal(c.exposureTime.value, null);
  assert.equal(describeControls({}, {}).saturation, null);
});

test('clampToCaps: 범위 밖은 자르고, 단계에 맞추고, 지원 안 하는 항목은 버린다', () => {
  const v = clampToCaps({ saturation: 300, colorTemperature: 5000.4, exposureTime: 'x', brightness: 10 }, {
    ...caps, colorTemperature: { min: 2800, max: 6500, step: 10 },
  });
  assert.deepEqual(v, { saturation: 255, colorTemperature: 5000 });
  assert.deepEqual(clampToCaps(null, caps), {});
});

test('buildConstraintSteps: 수동 모드를 먼저 켜고 값을 하나씩 적용한다', () => {
  const steps = buildConstraintSteps({ colorTemperature: 5000, exposureTime: 300, saturation: 100 }, caps);
  assert.deepEqual(steps, [
    { whiteBalanceMode: 'manual' },
    { colorTemperature: 5000 },
    { exposureMode: 'manual' },
    { exposureTime: 300 },
    { saturation: 100 },
  ]);
});

test('buildConstraintSteps: 저장된 값이 없으면 수동 모드만 (현재 값으로 고정)', () => {
  assert.deepEqual(buildConstraintSteps(null, caps), [{ whiteBalanceMode: 'manual' }, { exposureMode: 'manual' }]);
  assert.deepEqual(buildConstraintSteps({ saturation: 100 }, {}), []);
});

test('knownValues: 현재 값을 아는 항목만 저장 대상', () => {
  const c = describeControls(caps, { saturation: 128 });
  assert.deepEqual(knownValues(c), { saturation: 128 });
});

test('parseTypedValue: 타자로 친 값을 범위·단계에 맞추고, 숫자가 아니면 null', () => {
  const c = { min: 1, max: 10000, step: 1, value: 156 };
  assert.equal(parseTypedValue('120', c), 120);
  assert.equal(parseTypedValue(' 120.4 ', c), 120);
  assert.equal(parseTypedValue('99999', c), 10000);
  assert.equal(parseTypedValue('-5', c), 1);
  assert.equal(parseTypedValue('', c), null);
  assert.equal(parseTypedValue('abc', c), null);
  assert.equal(parseTypedValue('4601', { min: 2800, max: 6500, step: 10, value: null }), 4600);
});
