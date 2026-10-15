import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faceCheck, headPitchDeg, chinLifted } from '../app/src/face-check.js';
import { fakeLandmarks } from './helpers/fake-face.js';

const T = { minFaceWidthRatio: 0.25, maxYawDeg: 15 };

test('faceCheck: 얼굴 없음 / 두 명', () => {
  assert.equal(faceCheck([], 16 / 9, T).reason, 'no_face');
  assert.equal(faceCheck([fakeLandmarks(), fakeLandmarks()], 16 / 9, T).reason, 'multiple_faces');
});

test('faceCheck: 얼굴이 작음', () => {
  const lm = fakeLandmarks();
  lm[234] = { x: 0.45, y: 0.5 }; lm[454] = { x: 0.55, y: 0.5 };
  assert.equal(faceCheck([lm], 16 / 9, T).reason, 'too_small');
});

test('faceCheck: 고개를 돌림', () => {
  const lm = fakeLandmarks();
  lm[1] = { x: 0.62, y: 0.55 };
  const r = faceCheck([lm], 16 / 9, T);
  assert.equal(r.reason, 'turned');
  assert.ok(r.yawDeg > 15);
});

test('faceCheck: 정면 → 통과', () => {
  const r = faceCheck([fakeLandmarks()], 16 / 9, T);
  assert.equal(r.ok, true);
  assert.equal(r.reason, null);
  assert.ok(r.yawDeg < 1);
  assert.ok(Math.abs(r.widthRatio - 0.4) < 1e-9);
});

// 이마 위(10)와 턱 끝(152)의 깊이(z) 차이로 고개 끄덕임 각도를 구한다. z는 작을수록 카메라에 가깝다
const withDepth = (topZ, chinZ) => {
  const lm = fakeLandmarks();
  lm[10] = { x: 0.5, y: 0.2, z: topZ };
  lm[152] = { x: 0.5, y: 0.85, z: chinZ };
  return lm;
};

test('headPitchDeg: 정면이면 0°, 턱을 들면(턱이 카메라 쪽으로) 양수', () => {
  assert.ok(Math.abs(headPitchDeg(withDepth(0, 0), 16 / 9)) < 1e-9);
  const up = headPitchDeg(withDepth(0.1, -0.1), 16 / 9);
  assert.ok(Math.abs(up - 28.7) < 0.5, `${up}`);
  assert.ok(headPitchDeg(withDepth(-0.1, 0.1), 16 / 9) < 0, '턱을 내리면 음수');
  assert.ok(Math.abs(headPitchDeg(fakeLandmarks(), 16 / 9)) < 1e-9, 'z가 없으면 0으로 본다');
});

test('chinLifted: 얼굴 촬영 때보다 neckLiftMinDeg 이상 들어야 인정', () => {
  const t = { neckLiftMinDeg: 12 };
  assert.equal(chinLifted(20, 5, t), true);
  assert.equal(chinLifted(15, 5, t), false);
  assert.equal(chinLifted(-20, 5, t), false);
});
