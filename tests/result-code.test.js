import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeResult, decodeResult } from '../app/src/result-code.js';
import { MESSAGES, messageFor } from '../app/src/messages.js';

const result = {
  gender: 'f', season: 'summer', tone: 'summer-light',
  pct: { spring: 21.4, summer: 62.2, autumn: 8.6, winter: 7.8 },
  axes: [38.2, 71.4, 30.1, 55.5], borderline: 'winter',
};

test('encodeResult: 스펙 7.4 형식', () => {
  assert.equal(encodeResult(result), 'v=1&g=f&s=summer&t=summer-light&p=21%2C62%2C9%2C8&x=38%2C71%2C30%2C56&b=winter');
});

test('왕복: 정수로 반올림된 값', () => {
  const back = decodeResult('?' + encodeResult(result));
  assert.deepEqual(back, {
    gender: 'f', season: 'summer', tone: 'summer-light',
    pct: { spring: 21, summer: 62, autumn: 9, winter: 8 }, axes: [38, 71, 30, 56], borderline: 'winter',
  });
});

test('경계형이 아니면 b 없음', () => {
  const q = encodeResult({ ...result, borderline: null });
  assert.ok(!q.includes('b='));
  assert.equal(decodeResult(q).borderline, null);
});

test('decodeResult: 잘못된 링크는 null', () => {
  const good = new URLSearchParams(encodeResult(result));
  const bad = (k, v) => { const q = new URLSearchParams(good); if (v === null) q.delete(k); else q.set(k, v); return q.toString(); };
  for (const q of [
    '', bad('v', '2'), bad('g', 'x'), bad('s', 'monsoon'), bad('t', 'winter-deep'),
    bad('p', '1,2,3'), bad('p', '1,2,3,abc'), bad('x', '1,2,3,101'), bad('b', 'summer'), bad('t', null),
  ]) assert.equal(decodeResult(q), null, q);
});

test('모든 오류 코드에 안내 문구가 있다', () => {
  const codes = ['no_face', 'multiple_faces', 'too_small', 'turned', 'card_missing', 'card_saturated',
    'card_dark', 'card_occluded', 'too_dark', 'no_skin', 'not_enough_frames', 'camera_denied', 'model_failed'];
  for (const c of codes) assert.ok(MESSAGES[c], c);
  assert.equal(messageFor('???'), '다시 시도해 주세요.');
});
