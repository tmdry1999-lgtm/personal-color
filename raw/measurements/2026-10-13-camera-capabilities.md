# 개발 PC 웹캠 제어 지원 (2026-10-13)

- 확인일: 2026-10-13
- 종류: 실측
- 열람 수준: 원문
- 조건: Windows 11, Chrome, 개발 PC 웹캠 (모델 미기록), 부스 앱 운영자 화면의 "카메라 제어 지원"

## 결과 (운영자 화면 원문)
```json
{
  "whiteBalanceMode": ["continuous", "manual"],
  "exposureMode": ["continuous", "manual"],
  "colorTemperature": { "max": 6500, "min": 2800, "step": 1 },
  "locked": ["whiteBalanceMode", "exposureMode"]
}
```

## 관찰
- Windows Chrome에서 이 웹캠은 화이트밸런스·노출 수동 모드를 지원하고, 앱이 둘 다 고정하는 데 성공했다.
- 색온도는 2800~6500K 범위에서 직접 지정 가능하다 (앱은 아직 값을 지정하지 않고, 고정 시점의 값을 유지).
- 부스 웹캠이 다른 모델이면 다시 확인해야 한다.
