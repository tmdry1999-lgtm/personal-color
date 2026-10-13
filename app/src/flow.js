// 부스 화면 흐름의 규칙 (app.js가 쓰고, Node에서 테스트한다)

// 무조작 시 대기 화면으로 돌아가는 화면. 시작 화면도 포함해 다음 관람객이 이전 선택을 물려받지 않게 한다.
export const IDLE_RESET_SCREENS = ['start', 'result'];

// 설정·팔레트·AI 모델·카메라가 모두 준비돼야 [시작]을 누를 수 있다
export function canStart({ config, palettes, detectors, stream }) {
  return Boolean(config && palettes && detectors && stream);
}

// 촬영·분석 중 어떤 오류가 나도 busy를 풀어, 무인 부스가 "분석 중"에 멈추지 않게 한다
export async function guardCapture(state, work, onError) {
  state.busy = true;
  try {
    return await work();
  } catch (e) {
    onError(e);
    return null;
  } finally {
    state.busy = false;
    state.holdStart = null;
    state.lastFaceAt = Date.now();
  }
}
