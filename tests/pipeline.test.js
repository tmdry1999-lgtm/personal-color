import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../app/src/pipeline.js';
import { srgbToLinear, linearToSrgb, rgbToLch } from '../app/src/color.js';
import { makeImage, paintRect, fakeLandmarks } from './helpers/fake-face.js';

const config = JSON.parse(readFileSync(new URL('../app/data/seasons.json', import.meta.url), 'utf8'));
const CARD = { x: 0.85, y: 0.05, w: 0.1, h: 0.2 };
const SKIN = [220, 180, 150];
const FLAGS = { dyed: false, lipProduct: false };

// 조명 색(tint)을 곱해 찍힌 장면: 피부와 A4(선형 0.8)가 같은 조명을 받는다
function scene(tint, { skin = SKIN, hair = null } = {}) {
  const lin = skin.map(srgbToLinear);
  const img = makeImage(200, 200, lin.map((v, i) => linearToSrgb(v * tint[i])));
  paintRect(img, CARD, tint.map((t) => linearToSrgb(0.8 * t)));
  let hairMask = null;
  if (hair) {
    // 머리카락은 위쪽 왼편(가로 0~0.8, 세로 0~0.15)에만 칠한다. A4(가로 0.85~0.95)와 겹치지 않게.
    paintRect(img, { x: 0, y: 0, w: 0.8, h: 0.15 }, hair);
    const data = new Uint8Array(200 * 200);
    for (let y = 0; y < 30; y++) data.fill(1, y * 200, y * 200 + 160);
    hairMask = { data, width: 200, height: 200 };
  }
  return Array.from({ length: 10 }, () => ({ image: img, landmarks: fakeLandmarks(), hairMask }));
}

const run = (frames, settings = { cardRect: CARD, cardType: 'white' }, flags = FLAGS) =>
  analyze({ frames, settings, flags, config });

test('흰 조명: 피부 측정값 = 실제 피부색', () => {
  const out = run(scene([1, 1, 1]));
  assert.equal(out.ok, true);
  const e = rgbToLch(SKIN);
  for (const k of ['L', 'a', 'b']) assert.ok(Math.abs(out.measurements.skin[k] - e[k]) < 0.6, k);
});

test('노란 조명이어도 A4 보정 후 결과가 같다', () => {
  const white = run(scene([1, 1, 1]));
  const yellow = run(scene([1.15, 1.0, 0.7]));
  assert.equal(yellow.ok, true);
  assert.equal(yellow.result.season, white.result.season);
  yellow.result.axes.forEach((v, i) => assert.ok(Math.abs(v - white.result.axes[i]) < 2, `axis ${i}`));
});

test('A4 영역이 없으면 card_missing', () => {
  assert.deepEqual(run(scene([1, 1, 1]), { cardRect: null, cardType: 'white' }), { ok: false, error: 'card_missing' });
});

test('얼굴이 너무 어두우면 too_dark', () => {
  const out = run(scene([1, 1, 1], { skin: [40, 30, 25] }));
  assert.deepEqual(out, { ok: false, error: 'too_dark' });
});

test('염색 체크 → 머리카락 제외 기록', () => {
  const out = run(scene([1, 1, 1], { hair: [30, 25, 22] }), undefined, { dyed: true, lipProduct: false });
  assert.equal(out.ok, true);
  assert.ok(out.excluded.includes('hair:self_report'));
  assert.equal(out.features.hairL, null);
});

test('머리카락 마스크가 있으면 대비에 쓰인다', () => {
  const out = run(scene([1, 1, 1], { hair: [30, 25, 22] }));
  assert.ok(out.features.deltaLHair > 30);
});

test('프레임이 비어 있으면 not_enough_frames', () => {
  assert.deepEqual(run([]), { ok: false, error: 'not_enough_frames' });
});

test('결과에 픽셀 배열·이미지가 들어가지 않는다 (개인정보)', () => {
  const out = run(scene([1, 1, 1], { hair: [30, 25, 22] }));
  const walk = (v, path) => {
    assert.ok(!ArrayBuffer.isView(v), `${path} is a typed array`);
    if (Array.isArray(v)) { assert.ok(v.length <= 4, `${path} length ${v.length}`); v.forEach((x, i) => walk(x, `${path}[${i}]`)); }
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(out, 'out');
});

test('몸 피부 마스크가 있으면 목을 측정해 특징으로 남긴다', () => {
  const frames = scene([1, 1, 1]).map((f) => {
    const data = new Uint8Array(200 * 200);
    for (let y = 172; y < 200; y++) data.fill(2, y * 200, y * 200 + 200);
    return { ...f, hairMask: { data, width: 200, height: 200 } };
  });
  const out = run(frames);
  assert.equal(out.ok, true);
  assert.ok(out.measurements.neck);
  assert.equal(typeof out.features.neckHueDeg, 'number');
});

// 턱을 든 목 사진: 목 부분(아래쪽)을 다른 색으로 칠하고 몸 피부 마스크를 준다
function liftedNeckFrames(tint = [1, 1, 1]) {
  return scene(tint).map((f) => {
    const image = { ...f.image, data: new Uint8ClampedArray(f.image.data) };
    paintRect(image, { x: 0.3, y: 0.86, w: 0.4, h: 0.14 }, [205, 165, 120]);
    const data = new Uint8Array(200 * 200);
    for (let y = 172; y < 200; y++) data.fill(2, y * 200, y * 200 + 200);
    return { image, landmarks: f.landmarks, hairMask: { data, width: 200, height: 200 } };
  });
}

test('목 사진(턱 든 사진)이 있으면 그 사진에서 목을 따로 측정한다', () => {
  const out = analyze({ frames: scene([1, 1, 1]), neckFrames: liftedNeckFrames(), settings: { cardRect: CARD, cardType: 'white' }, flags: FLAGS, config });
  assert.equal(out.ok, true);
  const e = rgbToLch([205, 165, 120]);
  assert.ok(Math.abs(out.measurements.liftedNeck.h - e.h) < 0.5);
  assert.ok(Math.abs(out.features.liftedNeckHueDeg - e.h) < 0.5);
  assert.equal(typeof out.features.liftedNeckB, 'number');
  assert.equal(typeof out.features.liftedNeckC, 'number');
});

test('목 사진이 없으면 liftedNeck은 null, 목 사진의 A4가 실패해도 얼굴 결과는 낸다', () => {
  const none = run(scene([1, 1, 1]));
  assert.equal(none.measurements.liftedNeck, null);
  assert.equal(none.features.liftedNeckHueDeg, null);
  const badCard = liftedNeckFrames().map((f) => ({ ...f, image: { ...f.image, data: new Uint8ClampedArray(f.image.data.length) } }));
  const out = analyze({ frames: scene([1, 1, 1]), neckFrames: badCard, settings: { cardRect: CARD, cardType: 'white' }, flags: FLAGS, config });
  assert.equal(out.ok, true);
  assert.equal(out.measurements.liftedNeck, null);
  assert.ok(out.warnings.some((w) => w.startsWith('neck_failed')));
});
