import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MODES, modeBadgeText, leftoverLogNotice } from '../app/src/modes.js';

test('DEFAULT_MODES: 두 모드 모두 꺼짐 (방문객 모드가 기본)', () => {
  assert.deepEqual(DEFAULT_MODES, { dataCollection: false, chinLift: false });
  assert.ok(Object.isFrozen(DEFAULT_MODES));
});

test('modeBadgeText: 모두 꺼져 있으면 null', () => {
  assert.equal(modeBadgeText(DEFAULT_MODES, 'P3'), null);
});

test('modeBadgeText: 켜진 모드와 참가자 번호를 보여준다', () => {
  assert.equal(modeBadgeText({ dataCollection: true, chinLift: false }, ' P3 '), '기록 중 · P3');
  assert.equal(modeBadgeText({ dataCollection: false, chinLift: true }, 'P3'), '턱 들기');
  assert.equal(modeBadgeText({ dataCollection: true, chinLift: true }, 'P3'), '기록 중 · P3 · 턱 들기');
});

test('modeBadgeText: 참가자 번호가 비면 "P?" (makeLogEntry와 같은 규칙)', () => {
  assert.equal(modeBadgeText({ dataCollection: true, chinLift: false }, '  '), '기록 중 · P?');
});

test('leftoverLogNotice: 수집 모드가 꺼져 있고 기록이 남아 있을 때만 안내', () => {
  assert.equal(leftoverLogNotice({ dataCollection: false, chinLift: false }, 3), '기록 3건이 남아 있습니다. [모두 복사] 후 [비우기] 해 주세요.');
  assert.equal(leftoverLogNotice({ dataCollection: false, chinLift: false }, 0), '');
  assert.equal(leftoverLogNotice({ dataCollection: true, chinLift: false }, 3), '');
});
