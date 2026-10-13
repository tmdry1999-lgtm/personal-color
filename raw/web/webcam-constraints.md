# 웹캠 화이트밸런스·노출 제어 (MediaTrackConstraints)

- URL: https://webrtchacks.com/bad-lighting-fix-with-javascript-webcam-exposure/
- 확인일: 2026-10-12
- 종류: 웹
- 열람 수준: 원문(요약)

## 핵심 내용
- MediaTrackConstraints에 whiteBalanceMode, exposureMode, colorTemperature 속성이 있음 (MDN: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
- whiteBalanceMode/exposureMode 값: none, manual, single-shot, continuous. manual일 때 colorTemperature로 값 지정
- 해당 글 기준: 수동 카메라 제어는 Linux Chrome에서만 동작, Firefox는 미지원
- exposureMode를 manual로 바꾸는 호출과 exposureTime 설정 호출을 분리해야 함
- Windows Chrome 지원 여부는 2단계에서 실측 필요
