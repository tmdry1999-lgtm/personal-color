# Seasonal Skin Tone Classification Using a Hierarchical Deep Learning Framework

- URL: https://www.jicce.org/journal/view.html?uid=1349&vmd=Full
- 확인일: 2026-10-12
- 종류: 논문
- 열람 수준: 원문

## 핵심 내용
- 데이터: Deep Armocromia 전문가 라벨 5,000장 + StyleGAN3 합성 8,869장. 테스트 2,081장
- 전처리: BiSeNet으로 얼굴 피부만 분리, 나머지는 피부 중앙값 색으로 채움
- 모델: ConvNeXt 2단계 (4계절 분류 → 계절별 3톤 분류)
- 4계절 정확도 70.01% (봄 64.0%, 여름 66.9%, 가을 68.8%, 겨울 73.2%). 기존 방법 55.4% 대비 향상
- 톤 중 가장 어려운 것: 봄 라이트 (F1 0.60). 가장 쉬운 것: 겨울 브라이트 (F1 0.80)
- 주요 혼동: 봄↔가을(둘 다 웜), 여름↔겨울(둘 다 쿨), 겨울↔가을(깊고 진한 인상 공유)
- 저자 의견: 같은 혼동이 전문가 진단에서도 생길 수 있음
