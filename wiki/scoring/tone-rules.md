---
status: 가설
sources:
  - raw/web/aligned-lover-12-seasons.md
---

# 12톤 규칙

4계절을 판정한 뒤, 그 계절의 3개 톤 중 하나를 고른다. 숫자는 `app/data/seasons.json`의 `toneRules`와 같다.

## 규칙
```
톤 점수 = direction × (해당 축 점수 − 50)
```
판정된 계절의 3개 톤 중 톤 점수가 가장 큰 톤을 고른다. 50은 축의 중간값이다.

## toneRules

| 톤 | 계절 | 축 | direction | 의미 |
|---|---|---|---|---|
| spring-light | spring | value | +1 | 밝을수록 |
| spring-bright | spring | chroma | +1 | 선명할수록 |
| spring-true | spring | warmth | +1 | 따뜻할수록 |
| summer-light | summer | value | +1 | 밝을수록 |
| summer-soft | summer | chroma | −1 | 탁할수록 |
| summer-true | summer | warmth | −1 | 차가울수록 |
| autumn-soft | autumn | chroma | −1 | 탁할수록 |
| autumn-deep | autumn | value | −1 | 어두울수록 |
| autumn-true | autumn | warmth | +1 | 따뜻할수록 |
| winter-bright | winter | chroma | +1 | 선명할수록 |
| winter-deep | winter | value | −1 | 어두울수록 |
| winter-true | winter | warmth | −1 | 차가울수록 |

근거: 트루=온도 지배, 라이트/딥=명도 지배, 소프트/브라이트=채도 지배 ([4계절과 12톤](../theory/seasons-and-tones.md)).

## 예시
여름으로 판정, 점수 warmth 30, value 72, chroma 40:

| 톤 | 계산 | 점수 |
|---|---|---|
| summer-light | +1 × (72 − 50) | 22 |
| summer-soft | −1 × (40 − 50) | 10 |
| summer-true | −1 × (30 − 50) | 20 |

결과: **여름 라이트** (22). 12톤은 화면에 "참고"로 표시한다.

[목차](../index.md)
