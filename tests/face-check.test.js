import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faceCheck } from '../app/src/face-check.js';
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
