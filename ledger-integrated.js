(() => {
  if (document.getElementById('staff-ledger')) return;

  const cfg = window.OILFIX_LEDGER_CONFIG || {};
  const portalUrl = cfg.portalUrl || 'portal.html?embedded=1';
  const standaloneUrl = cfg.standaloneUrl || 'portal.html';

  // Desktop navigation
  const desktopNav = document.querySelector('.desktop-nav');
  if (desktopNav && !desktopNav.querySelector('[data-ledger-nav]')) {
    const link = document.createElement('a');
    link.href = '#staff-ledger';
    link.textContent = 'LEDGER';
    link.dataset.ledgerNav = '1';
    desktopNav.appendChild(link);
  }

  // Mobile navigation
  const mobileInner = document.querySelector('.mobile-menu-inner');
  if (mobileInner && !mobileInner.querySelector('[data-ledger-nav]')) {
    const link = document.createElement('a');
    link.href = '#staff-ledger';
    link.dataset.ledgerNav = '1';
    link.innerHTML = 'LEDGER <span>08</span>';
    link.addEventListener('click', () => {
      const menu = document.getElementById('mobileMenu');
      menu?.classList.remove('open');
      menu?.setAttribute('aria-hidden','true');
      document.body.classList.remove('menu-open');
    });
    mobileInner.appendChild(link);
  }

  // Hero CTA
  const heroCta = document.querySelector('.hero-cta');
  if (heroCta && !heroCta.querySelector('[data-ledger-hero]')) {
    const link = document.createElement('a');
    link.className = 'btn btn-ghost ledger-hero-link';
    link.href = '#staff-ledger';
    link.dataset.ledgerHero = '1';
    link.innerHTML = '<span>직원 장부</span><b>↓</b>';
    heroCta.appendChild(link);
  }

  const section = document.createElement('section');
  section.className = 'section oilfix-ledger-section';
  section.id = 'staff-ledger';
  section.innerHTML = `
    <div class="ledger-official-head">
      <div>
        <p class="section-no">08 / STAFF OPERATIONS</p>
        <h2>STAFF<br><span>LEDGER.</span></h2>
      </div>
      <p class="ledger-official-desc">
        기존 <strong>OILFIX 소개 · 서비스 · 가격 · 조직도 · 공지 · 블랙리스트 · 지원서</strong>는 그대로 유지됩니다.
        아래 직원 전용 장부에서는 판매, 고객조회, 후불정산, 직원통계, 감사로그와 관리자 설정까지 한 번에 관리합니다.
      </p>
    </div>

    <div class="ledger-quick-grid">
      <a class="ledger-quick-card" href="#about">
        <small>01 / COMPANY</small>
        <b>오일픽스 소개 보기</b>
        <span>ABOUT ↑</span>
      </a>
      <a class="ledger-quick-card" href="apply.html">
        <small>02 / RECRUIT</small>
        <b>지원서 포털 열기</b>
        <span>APPLICATION ↗</span>
      </a>
      <a class="ledger-quick-card" href="${standaloneUrl}" target="_blank" rel="noopener">
        <small>03 / STAFF</small>
        <b>장부 전체화면 열기</b>
        <span>NEW WINDOW ↗</span>
      </a>
    </div>

    <div class="ledger-frame-shell">
      <div class="ledger-frame-toolbar">
        <div class="ledger-frame-title">
          <i class="ledger-frame-dot"></i>
          <div>
            <b>OILFIX / STAFF OPERATIONS PORTAL</b>
            <small>개인 직원 로그인 · 판매자 자동기록 · Google Sheets 실시간 연동</small>
          </div>
        </div>
        <div class="ledger-frame-actions">
          <button type="button" id="oilfixLedgerReload">RELOAD</button>
          <a href="${standaloneUrl}" target="_blank" rel="noopener">FULL SCREEN ↗</a>
        </div>
      </div>

      <div class="ledger-loading" id="oilfixLedgerLoading"><span><i></i>STAFF LEDGER LOADING</span></div>
      <iframe
        id="oilfixLedgerFrame"
        src="${portalUrl}"
        title="OILFIX 직원 장부"
        loading="lazy"
        allow="clipboard-read; clipboard-write"
      ></iframe>
    </div>
  `;

  const main = document.querySelector('main');
  if (!main) return;
  main.appendChild(section);

  const frame = document.getElementById('oilfixLedgerFrame');
  const loading = document.getElementById('oilfixLedgerLoading');

  frame?.addEventListener('load', () => {
    loading?.classList.add('hide');

    // Same-origin portal: embedded mode styling.
    try {
      frame.contentDocument?.documentElement.classList.add('embedded');
      frame.contentDocument?.body?.classList.add('embedded');
    } catch (_) {}
  });

  document.getElementById('oilfixLedgerReload')?.addEventListener('click', () => {
    if (!frame) return;
    loading?.classList.remove('hide');
    frame.src = frame.src;
  });
})();
