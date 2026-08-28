/** OILFIX 사이트 설정 */
window.OILFIX_CONFIG = {
  applicationUrl: "apply.html",
  applicationEndpoint: "https://script.google.com/macros/s/AKfycbwFFvXUxiWlf4wdtmUKQbYMXEyfqrARZk2NvJ1zHvkQaod1rYGWf83zDE_-zboq0yDq/exec",
  discordUrl: "",
  enableBgm: true
};

// 공식 홈페이지에 장부 페이지 링크만 추가합니다. 포털/iframe은 삽입하지 않습니다.
(() => {
  const addLedgerLinks = () => {
    const desktop = document.querySelector('.desktop-nav');
    if (desktop && !desktop.querySelector('[data-ledger-link]')) {
      const a=document.createElement('a'); a.href='ledger.html'; a.textContent='LEDGER'; a.dataset.ledgerLink='1'; desktop.appendChild(a);
    }
    const mobile = document.querySelector('.mobile-menu-inner');
    if (mobile && !mobile.querySelector('[data-ledger-link]')) {
      const a=document.createElement('a'); a.href='ledger.html'; a.dataset.ledgerLink='1'; a.innerHTML='LEDGER <span>08</span>'; mobile.appendChild(a);
    }
    const hero=document.querySelector('.hero-cta');
    if (hero && !hero.querySelector('[data-ledger-link]')) {
      const a=document.createElement('a'); a.className='btn btn-ghost'; a.href='ledger.html'; a.dataset.ledgerLink='1'; a.innerHTML='<span>직원 장부</span><b>↗</b>'; hero.appendChild(a);
    }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addLedgerLinks,{once:true});
  else addLedgerLinks();
})();
