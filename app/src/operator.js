// 운영자 대화상자 (Ctrl+Shift+S): 웹캠 선택, 카드 종류, A4 영역 드래그, 진단 정보
import { listCameras } from './camera.js';
import { rectFromDrag, displayRectToRaw } from './settings.js';

const $ = (id) => document.getElementById(id);

export function setupOperator({ overlay, getSettings, setSettings, onCameraChange }) {
  const dialog = $('operator');
  let drag = null;

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
      e.preventDefault();
      if (dialog.open) dialog.close(); else open();
    }
  });
  $('op-close').addEventListener('click', () => dialog.close());

  async function open() {
    const cams = await listCameras();
    $('op-camera').innerHTML = cams
      .map((c, i) => `<option value="${c.deviceId}">${c.label || `카메라 ${i + 1}`}</option>`)
      .join('');
    $('op-camera').value = getSettings().deviceId ?? cams[0]?.deviceId ?? '';
    $('op-card').value = getSettings().cardType;
    dialog.showModal();
  }

  $('op-camera').addEventListener('change', (e) => {
    setSettings({ ...getSettings(), deviceId: e.target.value });
    onCameraChange(e.target.value);
  });
  $('op-card').addEventListener('change', (e) => setSettings({ ...getSettings(), cardType: e.target.value }));

  // 화면 좌표(0~1, 거울 모드) → 원본 프레임 좌표로 저장
  const pos = (e) => {
    const r = overlay.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  $('op-card-rect').addEventListener('click', () => {
    dialog.close();
    overlay.dataset.mode = 'card';
  });
  overlay.addEventListener('pointerdown', (e) => {
    if (overlay.dataset.mode !== 'card') return;
    drag = { a: pos(e), b: pos(e) };
  });
  overlay.addEventListener('pointermove', (e) => { if (drag) drag.b = pos(e); });
  overlay.addEventListener('pointerup', () => {
    if (!drag) return;
    const rect = rectFromDrag(drag.a, drag.b);
    drag = null;
    delete overlay.dataset.mode;
    if (rect.w > 0.01 && rect.h > 0.01) setSettings({ ...getSettings(), cardRect: displayRectToRaw(rect) });
    open();
  });

  return {
    setCaps: (report) => { $('op-caps').textContent = JSON.stringify(report, null, 2); },
    setLast: (info) => { $('op-last').textContent = JSON.stringify(info, null, 2); },
    dragRect: () => (drag ? rectFromDrag(drag.a, drag.b) : null),
  };
}
