import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pointInPolygon, sampleCircle, samplePolygon, sampleRect, sampleMask, extractRegions,
} from '../app/src/regions.js';
import { makeImage, paintRect, fakeLandmarks } from './helpers/fake-face.js';

const T = { eyeOpenMinRatio: 0.12 };
const square = (x0, y0, s) => [{ x: x0, y: y0 }, { x: x0 + s, y: y0 }, { x: x0 + s, y: y0 + s }, { x: x0, y: y0 + s }];

test('pointInPolygon', () => {
  assert.equal(pointInPolygon(5, 5, square(0, 0, 10)), true);
  assert.equal(pointInPolygon(15, 5, square(0, 0, 10)), false);
});

test('sampleCircle: 원 안 픽셀 수와 도넛 모양', () => {
  const img = makeImage(40, 40, [10, 20, 30]);
  const full = sampleCircle(img, 20, 20, 5);
  assert.ok(full.length > 70 && full.length < 90, `${full.length}`);
  assert.deepEqual(full[0], [10, 20, 30]);
  const ring = sampleCircle(img, 20, 20, 5, 3);
  assert.ok(ring.length < full.length - 20);
});

test('sampleCircle: 이미지 밖으로 나가도 안전', () => {
  const img = makeImage(10, 10, [1, 2, 3]);
  assert.ok(sampleCircle(img, 0, 0, 5).length > 0);
});

test('samplePolygon: 구멍 제외', () => {
  const img = makeImage(20, 20, [1, 2, 3]);
  const all = samplePolygon(img, square(2, 2, 10));
  const holed = samplePolygon(img, square(2, 2, 10), square(5, 5, 4));
  assert.ok(all.length >= 100 && all.length <= 121, `${all.length}`);
  assert.ok(all.length - holed.length >= 9);
});

test('sampleRect: 정규화 좌표, null이면 빈 배열', () => {
  const img = makeImage(10, 10, [0, 0, 0]);
  paintRect(img, { x: 0, y: 0, w: 0.5, h: 0.5 }, [255, 0, 0]);
  const px = sampleRect(img, { x: 0, y: 0, w: 0.5, h: 0.5 }, 1);
  assert.equal(px.length, 25);
  assert.ok(px.every((p) => p[0] === 255));
  assert.deepEqual(sampleRect(img, null), []);
});

test('sampleMask: 마스크 크기가 달라도 위치를 맞춘다', () => {
  const img = makeImage(8, 8, [5, 5, 5]);
  const mask = { data: new Uint8Array([1, 0, 0, 0]), width: 2, height: 2 };
  assert.equal(sampleMask(img, mask, 1, 1).length, 16);
  assert.deepEqual(sampleMask(img, null, 1), []);
});

test('extractRegions: 피부·눈동자·흰자는 채워지고, 면적 0인 입술·눈썹은 비어 있다', () => {
  const img = makeImage(200, 200, [220, 180, 150]);
  const r = extractRegions(img, fakeLandmarks(), null, T);
  assert.ok(r.skin.length > 150, `${r.skin.length}`);
  assert.ok(r.skin.every((p) => p[0] === 220));
  assert.ok(r.iris.length > 0);
  assert.ok(r.sclera.length > 0);
  assert.equal(r.lip.length, 0);
  assert.equal(r.brow.length, 0);
  assert.equal(r.hair.length, 0);
});

test('extractRegions: 눈을 감으면 눈동자·흰자 제외', () => {
  const img = makeImage(200, 200, [220, 180, 150]);
  const lm = fakeLandmarks();
  for (const [up, down] of [[159, 145], [386, 374]]) lm[down] = { ...lm[up] };
  const r = extractRegions(img, lm, null, T);
  assert.equal(r.iris.length, 0);
  assert.equal(r.sclera.length, 0);
});
