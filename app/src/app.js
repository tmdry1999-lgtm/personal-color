// 부스 화면 흐름: 대기 → 시작 → 촬영 → 분석 중 → 결과 (스펙 7.1)
import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.mjs';
import { openCamera, stopCamera, tryLockCamera, grabFrame } from './camera.js';
import { createDetectors } from './face.js';
import { faceCheck } from './face-check.js';
import { analyze } from './pipeline.js';
import { encodeResult } from './result-code.js';
import { messageFor } from './messages.js';
import { renderResultHtml } from './result-view.js';
import { browserStorage, loadSettings, saveSettings, displayRectToRaw } from './settings.js';
import { setupOperator } from './operator.js';
import { IDLE_RESET_SCREENS, canStart, guardCapture } from './flow.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['idle', 'start', 'capture', 'analyzing', 'result'];
const storage = browserStorage();
const video = $('video');
const overlay = $('overlay');

const state = {
  screen: 'idle', gender: null, settings: loadSettings(storage),
  config: null, palettes: null, detectors: null, stream: null,
  holdStart: null, lastFaceAt: Date.now(), busy: false, idleTimer: null,
};

const operator = setupOperator({
  overlay,
  getSettings: () => state.settings,
  setSettings: (s) => { state.settings = s; saveSettings(storage, s); },
  onCameraChange: (id) => startCamera(id),
});

function show(screen) {
  state.screen = screen;
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== screen;
  $('stage').hidden = !(screen === 'idle' || screen === 'capture');
  clearTimeout(state.idleTimer);
  if (IDLE_RESET_SCREENS.includes(screen)) armIdleReset();
}

// sticky: 카메라·모델 오류처럼 운영자가 봐야 하는 것은 사라지지 않게 둔다
function showError(code, sticky = false) {
  $('error').textContent = messageFor(code);
  $('error').hidden = false;
  if (!sticky) setTimeout(() => { $('error').hidden = true; }, 3000);
}

function armIdleReset() {
  clearTimeout(state.idleTimer);
  state.idleTimer = setTimeout(goHome, state.config.thresholds.idleResetSeconds * 1000);
}

function goHome() {
  state.gender = null;
  state.holdStart = null;
  document.querySelectorAll('.gender').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  $('flag-dyed').checked = false;
  $('flag-lip').checked = false;
  $('btn-begin').disabled = true;
  $('result-body').innerHTML = '';
  $('qr').innerHTML = '';
  show('idle');
}

async function startCamera(deviceId) {
  stopCamera(state.stream);
  try {
    state.stream = await openCamera(video, deviceId);
    $('error').hidden = true;
  } catch (e) {
    console.error('카메라 열기 실패:', e.name, e.message);
    showError('camera_denied', true);
    return;
  }
  // 화면 밝기가 자리잡은 뒤(2초) 화이트밸런스·노출 고정을 시도한다
  setTimeout(async () => operator.setCaps(await tryLockCamera(state.stream)), 2000);
}

function drawOverlay(faces) {
  overlay.width = overlay.clientWidth;
  overlay.height = overlay.clientHeight;
  const ctx = overlay.getContext('2d');
  const W = overlay.width;
  const H = overlay.height;
  ctx.clearRect(0, 0, W, H);
  ctx.lineWidth = 3;
  // 얼굴 가이드 (화면 가운데 타원)
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, W * 0.16, H * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  // A4 영역 (원본 좌표 → 거울 화면 좌표)
  const card = state.settings.cardRect ? displayRectToRaw(state.settings.cardRect) : null;
  const drag = operator.dragRect();
  for (const [r, color] of [[card, '#00c853'], [drag, '#ffab00']]) {
    if (!r) continue;
    ctx.strokeStyle = color;
    ctx.strokeRect(r.x * W, r.y * H, r.w * W, r.h * H);
  }
  // 얼굴 점 일부 (확인용)
  ctx.fillStyle = 'rgba(0,200,255,0.8)';
  for (const lm of faces) for (const i of [1, 234, 454, 205, 425, 9, 199, 468, 473]) {
    ctx.fillRect((1 - lm[i].x) * W - 2, lm[i].y * H - 2, 4, 4);
  }
}

const CAPTURE_TEXT = {
  no_face: '얼굴을 화면 가운데에 맞춰 주세요',
  multiple_faces: '한 명만 화면에 들어와 주세요',
  too_small: '조금 더 가까이 와 주세요',
  turned: '정면을 봐 주세요',
};

function tick() {
  requestAnimationFrame(tick);
  if (!state.detectors || state.busy || video.readyState < 2) return;
  if (state.screen !== 'idle' && state.screen !== 'capture') return;
  const faces = state.detectors.detectFaces(video);
  drawOverlay(faces);
  if (state.screen !== 'capture') return;

  const t = state.config.thresholds;
  const check = faceCheck(faces, video.videoWidth / video.videoHeight, t);
  const now = performance.now();
  if (faces.length > 0) state.lastFaceAt = Date.now();
  if (Date.now() - state.lastFaceAt > t.idleResetSeconds * 1000) { goHome(); return; }

  if (!check.ok) {
    state.holdStart = null;
    $('capture-msg').textContent = CAPTURE_TEXT[check.reason];
    $('countdown').textContent = '';
    return;
  }
  state.holdStart ??= now;
  const left = t.holdSeconds - (now - state.holdStart) / 1000;
  $('capture-msg').textContent = '좋아요! 움직이지 마세요';
  $('countdown').textContent = left > 0 ? String(Math.ceil(left)) : '';
  if (left <= 0) captureAndAnalyze();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureAndAnalyze() {
  const t = state.config.thresholds;
  let frames = [];
  await guardCapture(state, async () => {
    for (let i = 0; i < t.framesPerCapture; i++) {
      const canvas = document.createElement('canvas');
      const image = grabFrame(video, canvas);
      const faces = state.detectors.detectFaces(canvas);
      if (faces.length === 1) frames.push({ image, landmarks: faces[0], hairMask: state.detectors.segmentHair(canvas) });
      await sleep(1000 / t.framesPerCapture);
    }
    show('analyzing');
    await sleep(50); // "분석 중" 화면이 그려질 시간을 준다

    const flags = { dyed: $('flag-dyed').checked, lipProduct: $('flag-lip').checked };
    const out = frames.length * 2 < t.framesPerCapture
      ? { ok: false, error: 'not_enough_frames' }
      : analyze({ frames, settings: state.settings, flags, config: state.config });
    frames = null; // 사진 참조를 버린다 (개인정보)

    operator.setLast(out.ok
      ? { result: out.result, measurements: out.measurements, features: out.features, warnings: out.warnings, excluded: out.excluded }
      : out);
    if (!out.ok) {
      showError(out.error);
      show('capture');
      return;
    }
    showResult(out.result);
  }, (e) => {
    frames = null;
    console.error('촬영·분석 오류:', e);
    showError('capture_failed');
    show('capture');
  });
}

function showResult(result) {
  $('result-body').innerHTML = renderResultHtml(result, state.palettes);
  const url = new URL(`result.html?${encodeResult({ ...result, gender: state.gender })}`, location.href).href;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  $('qr').innerHTML = qr.createSvgTag(6, 8);
  show('result');
}

// 버튼 연결
$('btn-start').addEventListener('click', () => show('start'));
document.querySelectorAll('.gender').forEach((b) => b.addEventListener('click', () => {
  state.gender = b.dataset.gender;
  document.querySelectorAll('.gender').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('btn-begin').disabled = false;
}));
$('btn-begin').addEventListener('click', () => {
  state.lastFaceAt = Date.now();
  show('capture');
});
$('btn-home').addEventListener('click', goHome);
for (const ev of ['pointermove', 'pointerdown', 'keydown']) {
  document.addEventListener(ev, () => { if (IDLE_RESET_SCREENS.includes(state.screen)) armIdleReset(); });
}

async function init() {
  show('idle');
  try {
    [state.config, state.palettes] = await Promise.all([
      fetch('data/seasons.json').then((r) => r.json()),
      fetch('data/palettes.json').then((r) => r.json()),
    ]);
  } catch (e) {
    console.error(e);
    showError('load_failed', true);
    return;
  }
  await startCamera(state.settings.deviceId);
  try {
    state.detectors = await createDetectors();
  } catch (e) {
    console.error(e);
    showError('model_failed', true);
    return;
  }
  // 카메라·모델이 모두 준비된 뒤에만 [시작]을 누를 수 있다 (멈춘 촬영 화면 방지)
  $('btn-start').disabled = !canStart(state);
  requestAnimationFrame(tick);
}

init();
