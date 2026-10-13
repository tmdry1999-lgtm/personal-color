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
| cardMaxSaturatedRatio | 0.05 | 비율 | 6.6 실패 처리 | A4 영역에서 선형값 0.98 이상 픽셀이 5%를 넘으면 하얗게 날아간 것으로 봄 |
| cardMaxRelStd | 0.15 | 비율 | 6.6 실패 처리 | A4 영역 밝기의 상대 표준편차가 15%를 넘으면 가려진 것으로 봄 |
| minRegionPixels | 20 | 픽셀 | 6.3 부위별 측정 | 이보다 적으면 그 부위는 측정 실패(null) |
| eyeOpenMinRatio | 0.12 | 비율 | 6.3 눈동자 제외 | 눈 높이/눈 폭이 이보다 작으면 감은 눈 |
| glareMinL | 85 | L* | 6.3 눈동자 제외 | 눈동자 영역에서 이보다 밝은 픽셀은 반사광 |
| glareMaxRatio | 0.2 | 비율 | 6.3 눈동자 제외 | 반사광 픽셀이 20%를 넘으면 안경 반사로 보고 눈동자 제외 |

모든 값은 가설이다. 3단계에서 실측으로 조정한다.

[목차](../index.md)
