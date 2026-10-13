# 검토했지만 쓰지 않는 자원

- URL: https://github.com/lorenzo-stacchio/Deep-Armocromia
- 확인일: 2026-10-12
- 종류: 데이터셋
- 열람 수준: 원문(요약)

## 핵심 내용
- Deep Armocromia: 전문가 라벨 약 5,000장. 'for scientific purposes only'. 구글 드라이브 + 구글 폼으로 비밀번호 받음. CelebA 기반 이미지 포함. 인종 구성 미공개
- HF armocromia-12-season (https://huggingface.co/datasets/menes000/armocromia-12-season): 4,710장. 'Research and scientific use only. No commercial use.'
- HF armocromia-4-season-effnetv2s (https://huggingface.co/menes000/armocromia-4-season-effnetv2s): 정확도 64.36%, 같은 라이선스, PyTorch·timm 전용
- AI Hub 한국인 피부상태 측정 데이터 (https://www.aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&dataSetSn=71645): 내국인만 신청, IRB 승인·기관 확인 필요, 안심존 열람(다운로드 불가). 수분·탄력·색소침착·모공·주름 측정. 피부색 Lab 값 없음
- Colorinsight (https://github.com/PSY222/Colorinsight): 한국 연예인 750장 웹 수집, 4계절 정확도 약 60%, 라이선스 없음
- YouCam, Face++ 등 피부톤 API: 사진을 외부 서버로 보내야 함 → '개인정보 저장 안 함' 문구와 충돌, 무료 한도 이후 유료
- 사용 가능한 것: FairFace (https://github.com/dchen236/FairFace) — CC BY 4.0, 108,501장, 동아시아인 포함 7개 인종 그룹, YFCC-100M Flickr 출처. 퍼스널컬러 라벨 없음 → 안정성 테스트 전용
