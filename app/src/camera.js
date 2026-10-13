// 웹캠 열기, 프레임 캡처, 화이트밸런스·노출 고정 시도 (wiki/measurement/webcam-limits.md)
export async function openCamera(video, deviceId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } },
  });
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

// 지원되면 현재 값으로 고정한다. 무엇이 지원되는지 운영자 화면에 보여준다.
export async function tryLockCamera(stream) {
  const track = stream.getVideoTracks()[0];
  const caps = track.getCapabilities ? track.getCapabilities() : {};
  const report = {
    whiteBalanceMode: caps.whiteBalanceMode ?? '지원 안 함',
    exposureMode: caps.exposureMode ?? '지원 안 함',
    colorTemperature: caps.colorTemperature ?? '지원 안 함',
    locked: [],
  };
  for (const key of ['whiteBalanceMode', 'exposureMode']) {
    if (Array.isArray(caps[key]) && caps[key].includes('manual')) {
      try {
        await track.applyConstraints({ advanced: [{ [key]: 'manual' }] });
        report.locked.push(key);
      } catch (e) {
        report[`${key}Error`] = String(e);
      }
    }
  }
  return report;
}

export function grabFrame(video, canvas) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
