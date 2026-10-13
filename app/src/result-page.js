// QR로 여는 결과 페이지: URL의 숫자만 읽는다 (스펙 7.2, 7.4)
import { decodeResult } from './result-code.js';
import { renderResultHtml } from './result-view.js';

const body = document.getElementById('result-body');
const result = decodeResult(location.search);

if (!result) {
  body.innerHTML = '<p class="error">결과 링크가 올바르지 않아요. 부스에서 QR을 다시 찍어 주세요.</p>';
} else {
  fetch('data/palettes.json')
    .then((r) => r.json())
    .then((palettes) => { body.innerHTML = renderResultHtml(result, palettes); })
    .catch(() => { body.innerHTML = '<p class="error">결과를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>'; });
}
