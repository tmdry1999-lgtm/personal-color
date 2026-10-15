import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, LEGACY_CAMERA, loadSettings, saveSettings, cameraValuesFor, withCameraValues, rectFromDrag, displayRectToRaw } from '../app/src/settings.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

test('loadSettings: 비어 있거나 깨졌거나 접근이 막혀도 기본값', () => {
  assert.deepEqual(loadSettings(memory()), DEFAULT_SETTINGS);
  const s = memory(); s.setItem('pc-booth-settings', '{not json');
  assert.deepEqual(loadSettings(s), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(broken), DEFAULT_SETTINGS);
});

const camA = { saturation: 100, colorTemperature: 5000, exposureTime: 300 };
const camB = { saturation: 64, colorTemperature: 4600, exposureTime: 156 };

test('saveSettings → loadSettings 왕복, 막히면 false', () => {
  const s = memory();
  const v = { deviceId: 'cam1', cardRect: { x: 0.1, y: 0.2, w: 0.1, h: 0.2 }, cardType: 'gray18', cameras: { cam1: camA }, envNote: '반사판' };
  assert.equal(saveSettings(s, v), true);
  assert.deepEqual(loadSettings(s), v);
  assert.equal(saveSettings(broken, v), false);
});

test('웹캠 설정값은 처음엔 비어 있다 (각 웹캠의 기본값으로 고정 후 저장)', () => {
  assert.deepEqual(DEFAULT_SETTINGS.cameras, {});
  assert.equal('camera' in DEFAULT_SETTINGS, false);
});

test('loadSettings: 옛 형식(camera 하나)은 LEGACY_CAMERA로 옮긴다 (부스 PC에 맞춰 둔 값 보존)', () => {
  const s = memory();
  s.setItem('pc-booth-settings', JSON.stringify({ deviceId: null, camera: camA, cardType: 'white' }));
  const loaded = loadSettings(s);
  assert.equal('camera' in loaded, false);
  assert.deepEqual(loaded.cameras, { [LEGACY_CAMERA]: camA });
});

test('loadSettings: 옛 형식 camera가 null이면 옮길 것이 없다', () => {
  const s = memory();
  s.setItem('pc-booth-settings', JSON.stringify({ camera: null }));
  assert.deepEqual(loadSettings(s).cameras, {});
});

test('loadSettings: 불러온 값을 고쳐도 DEFAULT_SETTINGS는 그대로', () => {
  const loaded = loadSettings(memory());
  loaded.cameras.x = camA;
  assert.deepEqual(DEFAULT_SETTINGS.cameras, {});
});

test('cameraValuesFor: 그 웹캠의 값, 없으면 옛 형식 값, 둘 다 없으면 null', () => {
  const base = { ...DEFAULT_SETTINGS, cameras: { a: camA } };
  assert.deepEqual(cameraValuesFor(base, 'a'), camA);
  assert.equal(cameraValuesFor(base, 'b'), null);
  assert.deepEqual(cameraValuesFor({ ...DEFAULT_SETTINGS, cameras: { [LEGACY_CAMERA]: camB } }, 'b'), camB);
  assert.equal(cameraValuesFor({ ...DEFAULT_SETTINGS, cameras: undefined }, 'a'), null);
});

test('withCameraValues: 웹캠별로 따로 저장하고, 다른 웹캠 값은 건드리지 않는다', () => {
  const s1 = withCameraValues({ ...DEFAULT_SETTINGS, cameras: { a: camA } }, 'b', camB);
  assert.deepEqual(s1.cameras, { a: camA, b: camB });
  assert.deepEqual(cameraValuesFor(s1, 'a'), camA);
});

test('withCameraValues: 저장하면 옛 형식 값은 한 번만 넘겨받고 지운다', () => {
  const s = withCameraValues({ ...DEFAULT_SETTINGS, cameras: { [LEGACY_CAMERA]: camA } }, 'a', camA);
  assert.deepEqual(s.cameras, { a: camA });
  assert.equal(cameraValuesFor(s, 'b'), null);
});

test('withCameraValues: null이면 그 웹캠 값만 지운다 (초기화), 원래 객체는 그대로', () => {
  const before = { ...DEFAULT_SETTINGS, cameras: { a: camA, b: camB } };
  const after = withCameraValues(before, 'a', null);
  assert.deepEqual(after.cameras, { b: camB });
  assert.deepEqual(before.cameras, { a: camA, b: camB });
});

test('환경 메모(envNote)는 처음엔 빈 문자열', () => {
  assert.equal(DEFAULT_SETTINGS.envNote, '');
});

test('rectFromDrag: 어느 방향으로 끌어도 양수 크기, 0~1로 자름', () => {
  assert.deepEqual(rectFromDrag({ x: 0.5, y: 0.6 }, { x: 0.2, y: 0.1 }), { x: 0.2, y: 0.1, w: 0.3, h: 0.5 });
  assert.deepEqual(rectFromDrag({ x: -0.1, y: 0.5 }, { x: 0.3, y: 1.2 }), { x: 0, y: 0.5, w: 0.3, h: 0.5 });
});

test('displayRectToRaw: 거울 모드 좌우 반전, 두 번 하면 원래대로', () => {
  const r = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
  const raw = displayRectToRaw(r);
  assert.ok(Math.abs(raw.x - 0.6) < 1e-12);
  assert.equal(raw.y, 0.2);
  const back = displayRectToRaw(raw);
  assert.ok(Math.abs(back.x - 0.1) < 1e-12);
});
