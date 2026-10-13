// 운영자 대화상자 (Ctrl+Shift+S): 웹캠 선택, 카드 종류, A4 영역 드래그, 진단 정보
import { listCameras } from './camera.js';
import { rectFromDrag, displayRectToRaw, browserStorage } from './settings.js';
import { formatLog, loadLog, saveLog } from './measure-log.js';
import { parseTypedValue } from './camera-settings.js';

const $ = (id) => document.getElementById(id);
const CONTROL_NAMES = { saturation: '채도', colorTemperature: '색온도 (K)', exposureTime: '노출 시간' };

export function setupOperator({ overlay, getSettings, setSettings, onCameraChange }) {
  const dialog = $('operator');
  let drag = null;
  // 측정 기록: 숫자만. 탭을 닫을 때까지 sessionStorage에 보관해 새로고침해도 남는다
  const logStore = browserStorage('sessionStorage');
  const log = loadLog(logStore);

  function renderLogCount() {
    $('op-log-count').textContent = `${log.length}건`;
  }
  renderLogCount();
  $('op-log-copy').addEventListener('click', async () => {
    const text = formatLog(log);
    try {
      await navigator.clipboard.writeText(text);
      $('op-log-status').textContent = '복사됨';
    } catch {
      // 클립보드가 막히면 텍스트 상자에 띄워 직접 복사하게 한다
      $('op-log-text').hidden = false;
      $('op-log-text').value = text;
      $('op-log-text').select();
      $('op-log-status').textContent = 'Ctrl+C로 복사해 주세요';
    }
  });
  // 잘못 저장된 웹캠 설정을 지우고, 새로고침 후 그 순간 값으로 다시 고정한다
  $('op-camera-reset').addEventListener('click', () => {
    setSettings({ ...getSettings(), camera: null });
    location.reload();
  });
  $('op-log-clear').addEventListener('click', () => {
    log.length = 0;
    saveLog(logStore, log);
    $('op-log-text').hidden = true;
    $('op-log-status').textContent = '';
    renderLogCount();
  });

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
    dialog.show(); // 모달이 아니게: 미리보기를 보면서 조정
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

  // 슬라이더는 웹캠이 알려준 지원 범위로 만든다. 놓는 순간(change) 저장·적용한다.
  function setControls(controls, onChange) {
    const box = $('op-controls');
    box.replaceChildren();
    for (const [key, c] of Object.entries(controls)) {
      const row = document.createElement('label');
      row.append(`${CONTROL_NAMES[key]} `);
      if (!c) {
        row.append('지원 안 함');
      } else {
        // 슬라이더(대략 조정)와 숫자 칸(정밀 입력)이 서로 따라간다. 숫자 칸은 Enter나 칸을 벗어날 때 적용
        const start = c.value ?? (c.min + c.max) / 2;
        const slider = Object.assign(document.createElement('input'), { type: 'range', min: c.min, max: c.max, step: c.step, value: start });
        const number = Object.assign(document.createElement('input'), {
          type: 'number', min: c.min, max: c.max, step: c.step, value: c.value ?? '', placeholder: '모름', style: 'width: 6em',
        });
        const note = Object.assign(document.createElement('span'), { textContent: c.value === null ? ' 현재 값 모름 — 바꾸면 저장' : '' });
        const apply = (v) => {
          slider.value = v;
          number.value = v;
          note.textContent = '';
          onChange(key, v);
        };
        slider.addEventListener('input', () => { number.value = slider.value; });
        slider.addEventListener('change', () => apply(Number(slider.value)));
        number.addEventListener('change', () => {
          const v = parseTypedValue(number.value, c);
          if (v === null) { number.value = slider.value; return; }
          apply(v);
        });
        row.append(slider, ' ', number, note);
      }
      box.append(row);
    }
  }

  return {
    setControls,
    participant: () => $('op-participant').value,
    addLog: (entry) => { log.push(entry); saveLog(logStore, log); renderLogCount(); },
    setCaps: (report) => {
      const { controls, ...rest } = report;
      $('op-caps').textContent = JSON.stringify(rest, null, 2);
    },
    setLast: (info) => { $('op-last').textContent = JSON.stringify(info, null, 2); },
    dragRect: () => (drag ? rectFromDrag(drag.a, drag.b) : null),
  };
}
