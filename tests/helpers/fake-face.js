// 테스트 전용: 합성 이미지와 가짜 얼굴 점 (MediaPipe 478점 형식)
export function makeImage(w, h, rgb) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...rgb, 255], i * 4);
  return { data, width: w, height: h };
}

export function paintRect(img, rect, rgb) {
  const x0 = Math.floor(rect.x * img.width);
  const y0 = Math.floor(rect.y * img.height);
  const x1 = Math.ceil((rect.x + rect.w) * img.width);
  const y1 = Math.ceil((rect.y + rect.h) * img.height);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.data.set(rgb, (y * img.width + x) * 4);
}

// 정면 얼굴: 얼굴 폭 0.4, 눈 뜸. 입술·눈썹 점은 한 점에 모여 면적 0 (측정 실패로 처리됨)
export function fakeLandmarks() {
  const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  const set = (i, x, y) => { lm[i] = { x, y }; };
  set(234, 0.3, 0.5); set(454, 0.7, 0.5); set(1, 0.5, 0.55);
  set(205, 0.4, 0.6); set(425, 0.6, 0.6); set(9, 0.5, 0.3); set(199, 0.5, 0.8); set(152, 0.5, 0.85);
  set(468, 0.4, 0.4); set(469, 0.42, 0.4); set(33, 0.34, 0.4); set(133, 0.46, 0.4); set(159, 0.4, 0.39); set(145, 0.4, 0.41);
  set(473, 0.6, 0.4); set(474, 0.62, 0.4); set(362, 0.54, 0.4); set(263, 0.66, 0.4); set(386, 0.6, 0.39); set(374, 0.6, 0.41);
  return lm;
}
