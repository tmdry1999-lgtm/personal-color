// 부위 정의: wiki/measurement/regions.md. 점 번호는 MediaPipe Face Landmarker 478점.
export const LM = {
  faceEdges: [234, 454],
  noseTip: 1,
  cheeks: [205, 425],
  forehead: 9,
  chin: 199,
  chinBottom: 152,
  foreheadTop: 10,
  eyes: [
    { iris: 468, irisEdge: 469, corners: [33, 133], lids: [159, 145] },
    { iris: 473, irisEdge: 474, corners: [362, 263], lids: [386, 374] },
  ],
  lipsOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  lipsInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
  brows: [
    [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
    [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  ],
};
const HAIR_CATEGORY = 1; // MediaPipe 멀티클래스 분리: 1 = 머리카락
const BODY_SKIN_CATEGORY = 2; // 2 = 몸 피부 (목)

const pixelAt = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
const toPx = (img, p) => ({ x: p.x * img.width, y: p.y * img.height });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function sampleCircle(img, cx, cy, r, rInner = 0) {
  const out = [];
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(img.height - 1, Math.ceil(cy + r));
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(img.width - 1, Math.ceil(cx + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r && d >= rInner) out.push(pixelAt(img, x, y));
    }
  }
  return out;
}

export function samplePolygon(img, poly, hole = null) {
  const out = [];
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)));
  const y1 = Math.min(img.height - 1, Math.ceil(Math.max(...ys)));
  const x0 = Math.max(0, Math.floor(Math.min(...xs)));
  const x1 = Math.min(img.width - 1, Math.ceil(Math.max(...xs)));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (pointInPolygon(x, y, poly) && !(hole && pointInPolygon(x, y, hole))) out.push(pixelAt(img, x, y));
    }
  }
  return out;
}

export function sampleRect(img, rect, step = 2) {
  if (!rect) return [];
  const out = [];
  const x0 = Math.max(0, Math.floor(rect.x * img.width));
  const y0 = Math.max(0, Math.floor(rect.y * img.height));
  const x1 = Math.min(img.width, Math.ceil((rect.x + rect.w) * img.width));
  const y1 = Math.min(img.height, Math.ceil((rect.y + rect.h) * img.height));
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) out.push(pixelAt(img, x, y));
  return out;
}

export function sampleMask(img, mask, category, step = 4) {
  if (!mask) return [];
  const out = [];
  for (let y = 0; y < img.height; y += step) {
    const my = Math.floor((y * mask.height) / img.height);
    for (let x = 0; x < img.width; x += step) {
      const mx = Math.floor((x * mask.width) / img.width);
      if (mask.data[my * mask.width + mx] === category) out.push(pixelAt(img, x, y));
    }
  }
  return out;
}

// 마스크에서 category인 픽셀 중 사각형(픽셀 좌표) 안에 있는 것만
export function sampleMaskInRect(img, mask, category, rect, step = 2) {
  if (!mask) return [];
  const out = [];
  const x0 = Math.max(0, Math.floor(rect.x0));
  const x1 = Math.min(img.width, Math.ceil(rect.x1));
  const y0 = Math.max(0, Math.floor(rect.y0));
  const y1 = Math.min(img.height, Math.ceil(rect.y1));
  for (let y = y0; y < y1; y += step) {
    const my = Math.floor((y * mask.height) / img.height);
    for (let x = x0; x < x1; x += step) {
      const mx = Math.floor((x * mask.width) / img.width);
      if (mask.data[my * mask.width + mx] === category) out.push(pixelAt(img, x, y));
    }
  }
  return out;
}

export function eyeOpenRatio(img, lm, eye) {
  const P = (i) => toPx(img, lm[i]);
  return dist(P(eye.lids[0]), P(eye.lids[1])) / dist(P(eye.corners[0]), P(eye.corners[1]));
}

export function extractRegions(img, lm, hairMask, t) {
  const P = (i) => toPx(img, lm[i]);
  const faceW = dist(P(LM.faceEdges[0]), P(LM.faceEdges[1]));
  const circleAt = (i, r) => sampleCircle(img, P(i).x, P(i).y, r);

  const skin = [
    ...LM.cheeks.flatMap((i) => circleAt(i, 0.06 * faceW)),
    ...circleAt(LM.forehead, 0.04 * faceW),
    ...circleAt(LM.chin, 0.04 * faceW),
  ];

  const iris = [];
  const sclera = [];
  for (const eye of LM.eyes) {
    if (eyeOpenRatio(img, lm, eye) < t.eyeOpenMinRatio) continue;
    const c = P(eye.iris);
    const r = dist(c, P(eye.irisEdge));
    iris.push(...sampleCircle(img, c.x, c.y, 0.85 * r, 0.35 * r)); // 동공 제외
    for (const k of eye.corners) {
      const q = P(k);
      sclera.push(...sampleCircle(img, c.x + 0.65 * (q.x - c.x), c.y + 0.65 * (q.y - c.y), 0.25 * r));
    }
  }

  // 목: 턱 끝 아래, 얼굴 폭 안의 몸 피부. 파운데이션이 덜 닿는 곳 (wiki/decisions/phase3-backlog.md)
  const [edgeA, edgeB] = LM.faceEdges.map(P);
  const chinY = P(LM.chinBottom).y;
  const neck = sampleMaskInRect(img, hairMask, BODY_SKIN_CATEGORY, {
    x0: Math.min(edgeA.x, edgeB.x), x1: Math.max(edgeA.x, edgeB.x), y0: chinY, y1: chinY + 0.4 * faceW,
  });

  const poly = (ids) => ids.map(P);
  return {
    neck,
    skin,
    iris,
    sclera,
    lip: samplePolygon(img, poly(LM.lipsOuter), poly(LM.lipsInner)),
    brow: LM.brows.flatMap((b) => samplePolygon(img, poly(b))),
    hair: sampleMask(img, hairMask, HAIR_CATEGORY),
  };
}
