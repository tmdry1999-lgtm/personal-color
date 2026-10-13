---
status: 가설
sources:
  - raw/web/aligned-lover-12-seasons.md
---

# 12톤 규칙

4계절을 판정한 뒤, 그 계절의 3개 톤 중 하나를 고른다. 숫자는 `app/data/seasons.json`의 `toneRules`와 같다.

## 규칙 (스펙 6.5: 대표값 대비 가장 두드러진 축)
```
톤 점수 = direction × (해당 축 점수 − 판정된 계절의 대표값 중 그 축 값)
```
판정된 계절의 3개 톤 중 톤 점수가 가장 큰 톤을 고른다. 대표값은 [계절 대표값](season-prototypes.md) 참고.

**동점 처리**: 점수가 같으면 트루를 고른다. 트루가 동점에 없으면 `toneRules`에 적힌 순서(라이트/소프트 → 브라이트/딥)로 앞선 톤을 고른다. 대표값과 정확히 같은 사람은 세 톤 모두 0점이라 트루가 된다.

**왜 50이 아니라 대표값인가**: 대표값이 축마다 30·35·70 등으로 달라서, 50을 기준으로 하면 대표값에 가까운 사람도 특정 톤으로 쏠린다(리뷰에서 가을 딥 쏠림 확인).

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
여름으로 판정(대표값 warmth 30, value 70, chroma 35), 점수 warmth 30, value 72, chroma 40:

| 톤 | 계산 | 점수 |
|---|---|---|
| summer-light | +1 × (72 − 70) | 2 |
| summer-soft | −1 × (40 − 35) | −5 |
| summer-true | −1 × (30 − 30) | 0 |

결과: **여름 라이트** (2). 12톤은 화면에 "참고"로 표시한다.

[목차](../index.md)
