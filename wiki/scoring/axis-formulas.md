---
status: 가설
sources:
  - raw/web/cielab-chroma-ranges.md
  - raw/papers/kci-four-country-season-skin.md
  - raw/papers/koreascience-female-students-face-color.md
  - raw/web/ita-skin-categories.md
  - raw/web/github-seasonal-color-analysis.md
---

# 축 계산식

측정값(특징값)을 4축 점수(0~100)로 바꾸는 방법. 숫자는 모두 `app/data/seasons.json`의 `axisMapping`, `featureWeights`와 같다.

## 1. 특징값 → 특징 점수
```
특징 점수 = clamp((x − min) / (max − min), 0, 1) × 100
```
범위 밖 값은 0 또는 100으로 자른다.

## 2. 특징 점수 → 축 점수
```
축 점수 = Σ (가중치 × 특징 점수)
```
제외된 특징(염색한 머리카락, 립 제품을 바른 입술, 감지 실패)은 빼고, 남은 가중치를 합이 1이 되도록 다시 나눈다.

예: 웜/쿨 축에서 입술이 제외되면 피부 색상각 0.35, 피부 b* 0.35, 눈동자 0.15 → 합 0.85로 나눠 0.412, 0.412, 0.176.

## 축별 특징·범위·가중치

| 축 | 특징 | 범위 [min, max] | 가중치 | 높을수록 |
|---|---|---|---|---|
| warmth | skinHueDeg (피부 색상각) | [50, 75] | 0.35 | 웜 |
| warmth | skinB (피부 b*) | [12, 22] | 0.35 | 웜 |
| warmth | lipHueDeg (입술 색상각) | [15, 40] | 0.15 | 웜 (코랄 쪽) |
| warmth | irisHueDeg (눈동자 색상각) | [40, 70] | 0.15 | 웜 |
| value | skinL (피부 L*) | [55, 75] | 0.8 | 밝음 |
| value | hairL (머리카락 L*) | [10, 45] | 0.2 | 밝음 |
| chroma | skinC (피부 C*) | [14, 28] | 1.0 | 선명 |
| contrast | deltaL (피부 L* − 가장 어두운 부위 L*) | [30, 65] | 1.0 | 대비 큼 |

대비의 "가장 어두운 부위"는 머리카락·눈동자·눈썹 중 측정된 것의 최솟값이다.

## 범위의 근거

| 특징 | 근거 | 확신도 |
|---|---|---|
| skinHueDeg 50~75 | 한국 여대생 얼굴색은 먼셀 6YR~7.6YR(노랑 섞인 주황). 색상각이 클수록 노란 쪽 → 웜 | 중간 |
| skinB 12~22 | 한국 진단 체계는 b*(황색도)로 계절을 가장 뚜렷이 나눔(KCI 4개국 비교). 구체 수치는 논문 초록에 없어 추정 | 낮음 |
| skinL 55~75 | 한국 진단 체계는 L*로도 계절을 뚜렷이 나눔. ITA "밝음~매우 밝음" 구간과 한국인 피부 밝기를 참고한 추정 | 낮음 |
| skinC 14~28 | CIELAB 채도 구간(18 미만 탁함, 30 초과 선명)을 피부 범위로 좁힘 | 중간 |
| deltaL 30~65 | 피부 L*(55~75)와 검은 머리·짙은 눈 L*(10~30)의 차이 범위 | 중간 |
| lipHueDeg, irisHueDeg | 보조 특징. 근거가 약해서 가중치를 0.15씩으로 낮춤 | 낮음 |

**모든 범위는 가설이다.** 3단계 반복성 테스트(같은 사람 5회)와 팀원 측정값을 보고 조정한다. 조정하면 이 문서와 `seasons.json`을 함께 고치고 [변경 기록](../log.md)에 남긴다.

관련: [4가지 축](../theory/four-axes.md), [측정 부위](../measurement/regions.md)

[목차](../index.md)
