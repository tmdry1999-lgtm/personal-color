// 웹캠 열기, 프레임 캡처, 화이트밸런스·노출·채도 고정 (wiki/measurement/webcam-limits.md)
import { CAMERA_KEYS, describeControls, buildConstraintSteps } from './camera-settings.js';

export async function openCamera(video, deviceId) {
  const request = (id) => navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { deviceId: id ? { exact: id } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } },
  });
  let stream;
  try {
    stream = await request(deviceId);
  } catch (e) {
    // 저장해 둔 웹캠이 빠졌거나 바뀌었으면 기본 웹캠으로 다시 시도한다
    if (!deviceId || !['NotFoundError', 'OverconstrainedError'].includes(e.name)) throw e;
    stream = await request(null);
  }
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

export async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

// 저장된 설정값(없으면 현재 값)으로 화이트밸런스·노출·채도를 고정한다.
// values가 null이면 수동 모드만 켜서 지금 값으로 고정하고, 그 값을 돌려줘 저장하게 한다.
export async function applyCameraSettings(stream, values) {
  const track = stream.getVideoTracks()[0];
  const caps = track.getCapabilities ? track.getCapabilities() : {};
  const applied = [];
  const errors = [];
  for (const step of buildConstraintSteps(values, caps)) {
    const key = Object.keys(step)[0];
    try {
      await track.applyConstraints({ advanced: [step] });
      applied.push(key);
    } catch (e) {
      errors.push(`${key}: ${e.message || e}`);
    }
  }
  const controls = describeControls(caps, track.getSettings ? track.getSettings() : {});
  const current = Object.fromEntries(CAMERA_KEYS.filter((k) => controls[k]).map((k) => [k, controls[k].value]));
  return {
    whiteBalanceMode: caps.whiteBalanceMode ?? '지원 안 함',
    exposureMode: caps.exposureMode ?? '지원 안 함',
    applied,
    errors,
    values: current,
    controls,
  };
}

export function grabFrame(video, canvas) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
