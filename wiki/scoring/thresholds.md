---
status: 가설
sources:
  - raw/web/github-seasonal-color-analysis.md
  - raw/web/cielab-chroma-ranges.md
---

# 임계값

숫자는 `app/data/seasons.json`의 `thresholds`와 같다.

| 키 | 값 | 단위 | 쓰이는 곳 (스펙) | 근거 |
|---|---|---|---|---|
| borderlineGapPct | 10 | %p | 6.5 경계형 | 1·2위 차이가 이보다 작으면 판정이 흔들리기 쉬움 |
| minFaceWidthRatio | 0.25 | 비율 | 6.1 촬영 조건 | 얼굴이 작으면 볼·홍채 픽셀이 너무 적음 |
| maxYawDeg | 15 | 도 | 6.1 촬영 조건 | 고개를 돌리면 한쪽 볼이 그림자에 들어감 |
| holdSeconds | 3 | 초 | 6.1 촬영 조건 | 조건 유지 후 카운트다운 |
| framesPerCapture | 10 | 장 | 6.1 촬영 | 1초간 10장 중앙값으로 흔들림 감소 |
| trimPct | 10 | % | 6.3 이상치 제거 | 영역별 L* 상하위 10% 제거 (그림자·반사광) |
| minSkinL | 25 | L* | 6.6 실패 처리 | 보정 전 피부가 이보다 어두우면 조명 부족 |
| scleraMaxChroma | 12 | C* | 6.2 흰자 교차 확인 | 보정 후 흰자가 이보다 색을 띠면 보정 의심 |
| hairDyeMinChroma | 18 | C* | 6.3 머리카락 제외 | 자연 흑발·흑갈색은 채도가 낮음. CIELAB "탁함" 경계(18)를 넘으면 염색 의심 |
| lipProductMinChroma | 45 | C* | 6.3 입술 제외 | 립 제품은 맨 입술보다 채도가 높음 (추정) |
| idleResetSeconds | 60 | 초 | 7.1 결과 화면 | 무조작 시 대기 화면 복귀 |

## 아직 없는 임계값 (2단계에서 추가)
- A4 포화 비율, A4 영역 밝기 편차 ([기준 카드](../measurement/reference-card.md))

모든 값은 가설이다. 3단계에서 실측으로 조정한다.

[목차](../index.md)
