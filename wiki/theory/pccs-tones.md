---
status: 참고
sources:
  - raw/web/pccs-tone-system.md
---

# PCCS 톤 체계

PCCS(Practical Color Coordinate System)는 일본색채연구소의 색 체계다. 색을 명도·채도가 비슷한 **톤**으로 묶는다. 아시아 퍼스널컬러 진단의 기반이다.

## PCCS 12톤

| 기호 | 이름 | 채도 그룹 | 섞은 것 |
|---|---|---|---|
| v | vivid (비비드) | 고채도 | 순색 |
| b | bright (브라이트) | 고채도 | 흰색 |
| s | strong (스트롱) | 고채도 | 흰색 + 검정 |
| dp | deep (딥) | 고채도 | 검정 |
| lt | light (라이트) | 중채도 | 흰색 |
| sf | soft (소프트) | 중채도 | 흰색 + 검정 |
| d | dull (덜) | 중채도 | 흰색 + 검정 |
| dk | dark (다크) | 중채도 | 검정 |
| p | pale (페일) | 저채도 | 흰색 |
| ltg | light grayish (라이트 그레이시) | 저채도 | 흰색 + 검정 |
| g | grayish (그레이시) | 저채도 | 흰색 + 검정 |
| dkg | dark grayish (다크 그레이시) | 저채도 | 검정 |

## 12톤 ↔ PCCS 톤 대응 (가설)

팔레트를 만들 때 쓴다. 규칙은 [팔레트 규칙](../palettes/palette-rules.md) 참고.

| 12톤 | PCCS 톤 |
|---|---|
| spring-light | p, lt |
| spring-bright | v, b |
| spring-true | b, s |
| summer-light | p, lt |
| summer-soft | ltg, sf, g |
| summer-true | lt, sf |
| autumn-soft | sf, d, ltg |
| autumn-deep | dp, dk |
| autumn-true | s, d, dp |
| winter-bright | v, b |
| winter-deep | dk, dkg, dp |
| winter-true | v, dp, p(아이시) |

## 계절별 색상 방향
- **봄·가을(웜)**: 노란 기가 있는 색상 (PCCS 색상환의 YR ~ Y 쪽)
- **여름·겨울(쿨)**: 푸른 기가 있는 색상 (RP ~ B 쪽)

같은 PCCS 톤이라도 색상 방향이 다르면 다른 계절의 색이 된다. 예: 봄 라이트와 여름 라이트는 둘 다 p·lt 톤이지만, 봄은 피치·코랄, 여름은 파우더 핑크·라벤더.

[목차](../index.md)
