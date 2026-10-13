---
status: 참고
sources:
  - raw/measurements/2026-10-13-camera-capabilities.md
  - raw/web/webcam-constraints.md
  - raw/web/tonemoa-personal-color.md
---

# 웹캠 한계와 대응

## 문제
- **자동 화이트밸런스**: 웹캠은 화면 전체 색을 보고 스스로 색을 바꾼다. 관람객 옷 색만 달라져도 피부색이 달라질 수 있다.
- **자동 노출**: 밝기도 스스로 바꾼다.
- **사진 진단의 공통 한계**: 조명, 화이트밸런스, 화장, 필터의 영향을 받는다(톤모아).

## 브라우저에서 고정할 수 있나
- 표준에는 `whiteBalanceMode`, `exposureMode`, `colorTemperature` 속성이 있다.
- 참고 글 기준으로 수동 제어는 Linux Chrome에서만 동작했고, Firefox는 지원하지 않는다.
- **실측 결과 (2026-10-13, 개발 PC 웹캠):** Windows Chrome에서 화이트밸런스·노출 모두 수동 모드를 지원했고, 앱이 둘 다 고정하는 데 성공했다. 색온도는 2800~6500K 지정 가능. 부스 웹캠이 다른 모델이면 다시 확인한다. 원문: `raw/measurements/2026-10-13-camera-capabilities.md`

## 대응
1. **A4 보정**: 매 촬영마다 카드 색으로 화이트밸런스와 노출을 되돌린다([기준 카드](reference-card.md)).
2. **10장 중앙값**: 순간적인 자동 보정 흔들림을 줄인다.
3. **고정 조명**: 조명이 일정하면 자동 보정도 덜 움직인다([조명 조건](lighting.md)).

## 남는 오차
- 파운데이션·립 등 화장 (립은 자기 신고 + 자동 감지로 일부 대응)
- 컬러렌즈, 염색 (염색은 자기 신고 + 자동 감지)
- 그림자, 고개 각도 (촬영 조건으로 일부 대응)

[목차](../index.md)
