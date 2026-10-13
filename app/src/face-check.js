// 촬영 조건: wiki/measurement/regions.md "촬영 조건"
import { LM } from './regions.js';

export function faceCheck(faces, aspect, t) {
  if (!faces || faces.length === 0) return { ok: false, reason: 'no_face' };
  if (faces.length > 1) return { ok: false, reason: 'multiple_faces' };
  const lm = faces[0];
  const widthRatio = Math.abs(lm[LM.faceEdges[0]].x - lm[LM.faceEdges[1]].x);
  if (widthRatio < t.minFaceWidthRatio) return { ok: false, reason: 'too_small', widthRatio };
  // 화면 비율을 반영한 좌표에서 코끝 ↔ 양쪽 얼굴 끝 거리 비대칭으로 고개 각도를 추정
  const P = (i) => ({ x: lm[i].x * aspect, y: lm[i].y });
  const nose = P(LM.noseTip);
  const dl = Math.hypot(nose.x - P(LM.faceEdges[0]).x, nose.y - P(LM.faceEdges[0]).y);
  const dr = Math.hypot(nose.x - P(LM.faceEdges[1]).x, nose.y - P(LM.faceEdges[1]).y);
  const yawDeg = (Math.asin(Math.min(1, Math.abs(dl - dr) / (dl + dr))) * 180) / Math.PI;
  if (yawDeg > t.maxYawDeg) return { ok: false, reason: 'turned', yawDeg, widthRatio };
  return { ok: true, reason: null, yawDeg, widthRatio };
}
