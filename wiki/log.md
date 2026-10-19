# 위키 변경 기록

| 날짜 | 문서 | 내용 |
|---|---|---|
| 2026-10-13 | 전체 | 1단계 위키 최초 작성 |
| 2026-10-13 | theory/ | 이론 문서 3개 작성 |
| 2026-10-13 | measurement/ | 측정 문서 5개 작성 |
| 2026-10-13 | scoring/ + app/data/seasons.json | 판정 문서 4개, seasons.json 초안 |
| 2026-10-13 | palettes/ + app/data/palettes.json | 팔레트 문서 3개, palettes.json 초안 |
| 2026-10-13 | scoring/ | 리뷰 반영: 12톤 규칙을 대표값 기준으로 수정(스펙 6.5), 동점 처리 추가, 알려진 위험 기록 |
| 2026-10-13 | palettes/ + app/data/palettes.json | 리뷰 반영: 같은 hex·이름 충돌 15건 정리, 팔레트 표를 생성 스크립트로 전환 |
| 2026-10-13 | scoring/, measurement/, palettes/ | 리뷰 반영: 대비를 부위별 가중 평균으로(눈썹 0.1), 무채색 규칙·특허 설명·기준 카드 상태 정정 |
| 2026-10-13 | measurement/color-conversion.md | culori lab65 사용 명시 |
| 2026-10-13 | scoring/thresholds.md, measurement/reference-card.md, seasons.json | 2단계: 임계값 6개와 보정 목표값 추가 |
| 2026-10-13 | scoring/axis-formulas.md | 2단계: 빈 축 50, 입술 색상각 펼치기 규칙 추가 |
| 2026-10-13 | raw/measurements/2026-10-13-first-capture.md | 첫 실측 1회 기록 (채도·b* 포화, 흰자 어두움 관찰) |
| 2026-10-13 | measurement/webcam-limits.md | Windows Chrome 화이트밸런스·노출 고정 지원 실측 기록 |
| 2026-10-13 | raw/measurements/2026-10-13-repeat-runs.md, decisions/phase3-backlog.md | 반복 측정 2·3회차 기록, 3단계 할 일 목록 작성 |
| 2026-10-13 | decisions/phase3-backlog.md | MVP 수동 점검 결과와 남은 점검 항목 추가, 반복성 2/3 기준 미달 기록 |
| 2026-10-13 | decisions/phase3-backlog.md | 2단계 최종 리뷰에서 미룬 코드 정리 6건 추가 |
| 2026-10-13 | measurement/webcam-limits.md | 3단계-A: 웹캠 설정값 저장·재적용, 측정 기록 모드 추가 |
| 2026-10-13 | raw/measurements/2026-10-13-p1-locked-settings.md | 웹캠 설정 고정 후 P1 2회: 겨울 딥 2/2, 경계형 아님 |
| 2026-10-13 | raw/measurements/2026-10-13-participants.md | 참가자 목록: 지금까지 측정 1~5회 모두 P1 |
| 2026-10-13 | measurement/lighting.md, raw/web/diagnosis-environment.md | 전문 진단 환경 조사 반영: CRI 95·R9, 정면 확산광, 다른 빛 차단, A4 위치, 클리핑 원리 |
| 2026-10-13 | decisions/phase3-backlog.md | 데이터 수집 메모: 현 환경 유지, 회색 카드 도착 후 A4 환산 세션 |
| 2026-10-13 | raw/measurements/2026-10-13-p1-p3-session.md, measurement/participants.md | P1~P3 세션 8회 기록, 참가자 목록 위키 페이지 |
| 2026-10-13 | measurement/participants.md, raw/measurements/2026-10-13-participant-notes.md | P2 전문가 진단 가을 웜(앱 겨울, 불일치), P2 화장·P3 안경 기록 |
| 2026-10-13 | decisions/phase3-backlog.md | 화장·안경 대응 4항목 기록 (데이터 먼저 모은 뒤 구현) |
| 2026-10-13 | raw/measurements/2026-10-13-p4-p6-session.md, measurement/participants.md | P4~P6 기록, 전문가 진단 대비 웜/쿨 0/3 |
| 2026-10-13 | measurement/regions.md, scoring/thresholds.md, decisions/ | 목 피부 측정(기록만), 베이스 화장 체크, 안경 안내·눈동자 이상색 제외, 측정 기록 sessionStorage 보관 |
| 2026-10-13 | measurement/regions.md | 베이스 화장 시 턱 든 목 사진 단계 추가 (그림자 회피, 기록만) |
| 2026-10-13 | scoring/thresholds.md | 턱 들기 인식 임계값 2개 (neckLiftMinDeg 12°, neckTimeoutSeconds 10) |
| 2026-10-13 | raw/measurements/2026-10-13-neck-session.md, measurement/participants.md | 목 측정 세션: P1 5회, P7(여름/가을 뮤트) 2회, 미확인 남성 2회. 목 색상각이 얼굴보다 5~8° 높음, 그림자가 색상각을 낮춤 |
| 2026-10-13 | raw/measurements/2026-10-13-neck-session-correction.md | 미확인 남성 2회 = P1, 턱 각도 부호 정상(최대 약 55°), 턱 들어도 목 그림자 남음 |
| 2026-10-13 | measurement/regions.md, measurement/lighting.md | 목 빛 받은 부분만 측정(추가 기록), 반사판·환경 메모. 복구 지점: git tag before-neck-lit |
| 2026-10-13 | raw/measurements/2026-10-13-reflector-session.md | 반사판 실험: 목 그림자 크게 줄지만 얼굴도 밝혀 A4 가정이 깨짐(1회 여름 라이트), 07:31 이후 머리·눈동자 밝아짐 |
| 2026-10-13 | raw/measurements/2026-10-13-reflector-session-correction.md | 남성 측정은 모두 P1, 기록상 P2 여성은 P7 |
| 2026-10-13 | decisions/status-2026-10-13.md | 오늘 마감: 상태, 결정, 다음 할 일 8단계, 고쳐야 할 문제 16개 |
| 2026-10-15 | measurement/regions.md, measurement/webcam-limits.md, decisions/* | 운영자 모드(데이터 수집·턱 들기, 기본 꺼짐), 웹캠별 설정, 리뷰에서 미룬 항목 |
| 2026-10-15 | (배포) | phase3a-camera master 병합(0c89398), Pages 배포. 수동 점검 8항목은 배포 후 사용자 확인 필요 |
| 2026-10-19 | (배포) | 발표용 디자인(드레이프 룸, Cloud Dancer + 딥퍼플, 결과 그래프, 개인정보 처리방침 팝업) master 병합·배포 |
