/**
 * OILFIX 사이트 설정
 * 기존 공식 홈페이지 / 지원서 시스템은 그대로 유지합니다.
 */
window.OILFIX_CONFIG = {
  // 메인 홈페이지의 지원하기 버튼은 OILFIX 자체 지원서 페이지로 연결됩니다.
  applicationUrl: "apply.html",

  // 기존 지원서 저장용 Google Apps Script
  applicationEndpoint: "https://script.google.com/macros/s/AKfycbwFFvXUxiWlf4wdtmUKQbYMXEyfqrARZk2NvJ1zHvkQaod1rYGWf83zDE_-zboq0yDq/exec",

  discordUrl: "",
  enableBgm: true
};

/**
 * OILFIX 직원 장부 통합 설정
 * portal.html은 기존 장부 전체 기능을 유지하고,
 * index.html 안에서는 STAFF LEDGER 섹션으로 임베드됩니다.
 */
window.OILFIX_LEDGER_CONFIG = {
  portalUrl: "portal.html?embedded=1",
  standaloneUrl: "portal.html"
};

// index.html 자체를 바꾸지 않아도 공식 홈페이지 안에 장부를 자동으로 삽입합니다.
(() => {
  const addCss = () => {
    if (document.querySelector('link[data-oilfix-ledger-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'ledger-integrated.css';
    link.dataset.oilfixLedgerStyle = '1';
    document.head.appendChild(link);
  };

  const addScript = () => {
    if (document.querySelector('script[data-oilfix-ledger-script]')) return;
    const script = document.createElement('script');
    script.src = 'ledger-integrated.js';
    script.dataset.oilfixLedgerScript = '1';
    document.body.appendChild(script);
  };

  addCss();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addScript, { once: true });
  } else {
    addScript();
  }
})();
