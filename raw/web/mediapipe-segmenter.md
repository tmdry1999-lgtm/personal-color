# MediaPipe Image Segmenter (멀티클래스 셀피 분리)

- URL: https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter
- 확인일: 2026-10-12
- 종류: 라이브러리
- 열람 수준: 검색 요약

## 핵심 내용
- 모델: SelfieMulticlass, 입력 256×256, float32
- 클래스: 0 배경, 1 머리카락, 2 몸 피부, 3 얼굴 피부, 4 옷, 5 기타(액세서리)
- 출력: 클래스별 확률 마스크(confidence mask) + 픽셀별 최고 확률 클래스(category mask)
- 라이선스: Apache 2.0
