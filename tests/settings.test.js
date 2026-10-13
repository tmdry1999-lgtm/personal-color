import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, rectFromDrag, displayRectToRaw } from '../app/src/settings.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

test('loadSettings: 비어 있거나 깨졌거나 접근이 막혀도 기본값', () => {
  assert.deepEqual(loadSettings(memory()), DEFAULT_SETTINGS);
  const s = memory(); s.setItem('pc-booth-settings', '{not json');
  assert.deepEqual(loadSettings(s), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(broken), DEFAULT_SETTINGS);
});

test('saveSettings → loadSettings 왕복, 막히면 false', () => {
  const s = memory();
  const v = { deviceId: 'cam1', cardRect: { x: 0.1, y: 0.2, w: 0.1, h: 0.2 }, cardType: 'gray18' };
  assert.equal(saveSettings(s, v), true);
  assert.deepEqual(loadSettings(s), v);
  assert.equal(saveSettings(broken, v), false);
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
