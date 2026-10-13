export const MESSAGES = {
  no_face: '얼굴이 보이지 않아요. 화면 가운데에 서 주세요.',
  multiple_faces: '한 명만 화면에 들어와 주세요.',
  too_small: '조금 더 가까이 와 주세요.',
  turned: '정면을 봐 주세요.',
  card_missing: '운영자: A4 위치를 지정해 주세요 (Ctrl+Shift+S).',
  card_saturated: '조명이 너무 밝아요. 운영자를 불러 주세요.',
  card_dark: '조명이 너무 어두워요. 운영자를 불러 주세요.',
  card_occluded: 'A4 용지가 가려졌어요. 용지 앞을 비워 주세요.',
  too_dark: '얼굴이 너무 어둡게 찍혀요. 조명 쪽을 봐 주세요.',
  no_skin: '피부를 찾지 못했어요. 다시 찍을게요.',
  not_enough_frames: '움직임이 많았어요. 다시 찍을게요.',
  camera_denied: '카메라를 사용할 수 없어요. 운영자를 불러 주세요.',
  model_failed: 'AI 모델을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.',
  capture_failed: '문제가 생겨서 다시 찍을게요.',
  load_failed: '설정 파일을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.',
};

export function messageFor(code) {
  return MESSAGES[code] ?? '다시 시도해 주세요.';
}
