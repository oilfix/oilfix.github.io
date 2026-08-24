(() => {
  const config = window.OILFIX_CONFIG || {};
  const qs = (s, p = document) => p.querySelector(s);
  const qsa = (s, p = document) => [...p.querySelectorAll(s)];

  const topbar = qs('.topbar');
  const progress = qs('#scrollProgress');
  const mobileMenu = qs('#mobileMenu');
  const menuBtn = qs('#menuBtn');
  const mobileClose = qs('#mobileClose');
  const modal = qs('#applyModal');
  const appLink = qs('#applicationLink');
  const toast = qs('#toast');
  const audio = qs('#bgm');
  const audioBtn = qs('#audioBtn');
  const audioLabel = qs('#audioLabel');

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  const onScroll = () => {
    const y = window.scrollY;
    topbar.classList.toggle('scrolled', y > 25);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  qsa('.reveal').forEach(el => observer.observe(el));

  const openMenu = () => {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };
  menuBtn?.addEventListener('click', openMenu);
  mobileClose?.addEventListener('click', closeMenu);
  qsa('.mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));

  const openModal = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  qsa('[data-open-apply]').forEach(b => b.addEventListener('click', openModal));
  qsa('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeMenu();
    }
  });

  appLink.addEventListener('click', (e) => {
    const url = (config.applicationUrl || '').trim();
    if (!url) {
      e.preventDefault();
      showToast('site-config.js에 지원서 링크를 넣어주세요.');
      return;
    }
    appLink.href = url;
  });

  if (config.enableBgm === false) {
    audioBtn.disabled = true;
    audioBtn.style.opacity = '.4';
    audioLabel.textContent = 'BGM OFF';
  } else {
    audioBtn?.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          audio.volume = 0.28;
          await audio.play();
          audioBtn.classList.add('playing');
          audioBtn.setAttribute('aria-pressed', 'true');
          audioLabel.textContent = 'BGM OFF';
        } else {
          audio.pause();
          audioBtn.classList.remove('playing');
          audioBtn.setAttribute('aria-pressed', 'false');
          audioLabel.textContent = 'BGM ON';
        }
      } catch (err) {
        showToast('브라우저에서 BGM 재생이 차단되었습니다. 다시 눌러주세요.');
      }
    });
  }

  // 아주 약한 패럴랙스 효과
  const hero = qs('.hero');
  if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero?.addEventListener('mousemove', (e) => {
      const x = (e.clientX / innerWidth - .5);
      const y = (e.clientY / innerHeight - .5);
      qs('.hero-grid').style.transform = `perspective(900px) rotateX(65deg) translateY(24%) translate(${x * 8}px,${y * 8}px)`;
      qs('.hero-glow-a').style.transform = `translate(${x * 22}px,${y * 22}px)`;
    });
  }
})();
