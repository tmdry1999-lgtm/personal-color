import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeLogEntry, formatLog, shouldLog } from '../app/src/measure-log.js';

const camera = { saturation: 100, colorTemperature: 5000, exposureTime: 300 };
const okOut = {
  ok: true,
  result: { season: 'winter', tone: 'winter-bright', borderline: null, pct: { spring: 20, summer: 20, autumn: 20, winter: 40 }, axes: [40, 50, 60, 70] },
  measurements: { skin: { L: 60 } }, features: { skinL: 60 }, warnings: [], excluded: [],
};
const now = new Date('2026-10-13T05:00:00Z');

test('makeLogEntry: 성공한 측정은 숫자 결과와 그때의 웹캠 설정을 담는다', () => {
  const e = makeLogEntry({ participant: ' P1 ', gender: 'f', flags: { dyed: true, lipProduct: false }, camera, out: okOut, now });
  assert.equal(e.participant, 'P1');
  assert.equal(e.gender, 'f');
  assert.equal(e.dyed, true);
  assert.equal(e.lipProduct, false);
  assert.equal(e.time, '2026-10-13T05:00:00.000Z');
  assert.deepEqual(e.camera, camera);
  assert.equal(e.result.season, 'winter');
  assert.deepEqual(e.measurements, okOut.measurements);
  assert.equal(e.error, undefined);
});

test('makeLogEntry: 실패한 측정은 오류 코드만, 참가자 번호가 비면 "P?"', () => {
  const e = makeLogEntry({ participant: '', gender: 'm', flags: { dyed: false, lipProduct: false }, camera: null, out: { ok: false, error: 'card_occluded' }, now });
  assert.equal(e.participant, 'P?');
  assert.equal(e.error, 'card_occluded');
  assert.equal(e.result, undefined);
});

test('formatLog: 참가자별로 묶고 회차 번호를 붙인다 (양식: 성별·염색·립·전문가 진단)', () => {
  const a1 = makeLogEntry({ participant: 'P1', gender: 'f', flags: { dyed: false, lipProduct: true }, camera, out: okOut, now });
  const b1 = makeLogEntry({ participant: 'P2', gender: 'm', flags: { dyed: true, lipProduct: false }, camera, out: okOut, now });
  const a2 = makeLogEntry({ participant: 'P1', gender: 'f', flags: { dyed: false, lipProduct: true }, camera, out: { ok: false, error: 'turned' }, now });
  const text = formatLog([a1, b1, a2]);
  const p1 = text.indexOf('참가자: P1');
  const p2 = text.indexOf('참가자: P2');
  assert.ok(p1 >= 0 && p2 > p1);
  assert.ok(text.includes('성별: 여'));
  assert.ok(text.includes('성별: 남'));
  assert.ok(text.includes('염색: 예'));
  assert.ok(text.includes('립 제품: 예'));
  assert.ok(text.includes('전문가 진단: '));
  const p1Block = text.slice(p1, p2);
  assert.ok(p1Block.includes('1회차: ') && p1Block.includes('2회차: '));
  assert.ok(p1Block.includes('"error":"turned"'));
  assert.equal(formatLog([]), '기록 없음');
});

test('shouldLog: 성공한 측정만 기록한다 (조명·A4 등으로 실패한 것은 제외)', () => {
  assert.equal(shouldLog(okOut), true);
  for (const error of ['card_saturated', 'card_occluded', 'card_missing', 'too_dark', 'no_skin', 'not_enough_frames']) {
    assert.equal(shouldLog({ ok: false, error }), false, error);
  }
});
