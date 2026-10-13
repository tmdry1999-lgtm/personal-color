import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDLE_RESET_SCREENS, canStart, guardCapture, needsNeckCapture } from '../app/src/flow.js';
import { MESSAGES } from '../app/src/messages.js';

test('guardCapture: 촬영·분석 중 오류가 나도 busy가 풀리고 오류 처리가 불린다 (화면 멈춤 방지)', async () => {
  const state = { busy: false, holdStart: 123, lastFaceAt: 0 };
  let seen = null;
  const out = await guardCapture(state, async () => {
    assert.equal(state.busy, true);
    throw new Error('GPU context lost');
  }, (e) => { seen = e.message; });
  assert.equal(out, null);
  assert.equal(seen, 'GPU context lost');
  assert.equal(state.busy, false);
  assert.equal(state.holdStart, null);
  assert.ok(state.lastFaceAt > 0);
});

test('guardCapture: 성공하면 결과를 돌려주고 busy를 푼다', async () => {
  const state = { busy: false, holdStart: 5, lastFaceAt: 0 };
  assert.equal(await guardCapture(state, async () => 42, () => assert.fail('no error')), 42);
  assert.equal(state.busy, false);
  assert.equal(state.holdStart, null);
});

test('canStart: 설정·팔레트·AI 모델·카메라가 모두 준비돼야 시작 가능', () => {
  const ready = { config: {}, palettes: {}, detectors: {}, stream: {} };
  assert.equal(canStart(ready), true);
  for (const k of Object.keys(ready)) assert.equal(canStart({ ...ready, [k]: null }), false, k);
});

test('시작 화면과 결과 화면은 무조작 시 대기 화면으로 돌아간다', () => {
  assert.deepEqual([...IDLE_RESET_SCREENS].sort(), ['result', 'start']);
});

test('촬영 실패·로딩 실패 안내 문구가 있다', () => {
  assert.ok(MESSAGES.capture_failed);
  assert.ok(MESSAGES.load_failed);
});

test('needsNeckCapture: 베이스 화장을 체크한 사람만 목을 따로 찍는다', () => {
  assert.equal(needsNeckCapture({ baseMakeup: true }), true);
  assert.equal(needsNeckCapture({ baseMakeup: false }), false);
  assert.equal(needsNeckCapture({}), false);
});
