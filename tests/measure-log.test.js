import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeLogEntry, formatLog, shouldLog, loadLog, saveLog } from '../app/src/measure-log.js';

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

test('shouldLog: 데이터 수집 모드가 켜져 있고 성공한 측정만 기록한다', () => {
  const on = { dataCollection: true, chinLift: false };
  assert.equal(shouldLog(okOut, on), true);
  for (const error of ['card_saturated', 'card_occluded', 'card_missing', 'too_dark', 'no_skin', 'not_enough_frames']) {
    assert.equal(shouldLog({ ok: false, error }, on), false, error);
  }
});

test('shouldLog: 데이터 수집 모드가 꺼져 있거나 모드를 모르면 기록하지 않는다 (방문객 개인정보)', () => {
  assert.equal(shouldLog(okOut, { dataCollection: false, chinLift: true }), false);
  assert.equal(shouldLog(okOut, undefined), false);
  assert.equal(shouldLog(okOut), false);
});

test('makeLogEntry: 어떤 기준 카드로 쟀는지 남긴다 (A4 → 회색 카드 환산용)', () => {
  const e = makeLogEntry({ participant: 'P2', gender: 'f', flags: {}, camera, cardType: 'white', out: okOut, now });
  assert.equal(e.cardType, 'white');
  const g = makeLogEntry({ participant: 'P2', gender: 'f', flags: {}, camera, out: okOut, now });
  assert.equal(g.cardType, null);
});

test('환경 메모(예: 반사판)를 기록에 남긴다', () => {
  const e = makeLogEntry({ participant: 'P1', gender: 'm', flags: {}, camera, cardType: 'white', envNote: ' 반사판 ', out: okOut, now });
  assert.equal(e.envNote, '반사판');
  assert.equal(makeLogEntry({ participant: 'P1', gender: 'm', flags: {}, camera, out: okOut, now }).envNote, '');
});

test('베이스 화장 여부를 기록하고 양식에 보여준다', () => {
  const e = makeLogEntry({ participant: 'P7', gender: 'f', flags: { baseMakeup: true }, camera, cardType: 'white', out: okOut, now });
  assert.equal(e.baseMakeup, true);
  assert.ok(formatLog([e]).includes('베이스 화장: 예'));
});

test('loadLog/saveLog: 새로고침해도 기록이 남고, 저장소가 막혀도 오류 없이 빈 기록', () => {
  const m = new Map();
  const store = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  const e = makeLogEntry({ participant: 'P7', gender: 'f', flags: {}, camera, out: okOut, now });
  assert.deepEqual(loadLog(store), []);
  assert.equal(saveLog(store, [e]), true);
  assert.deepEqual(loadLog(store), [e]);
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepEqual(loadLog(broken), []);
  assert.equal(saveLog(broken, [e]), false);
  m.set('pc-booth-log', '{bad');
  assert.deepEqual(loadLog(store), []);
});
