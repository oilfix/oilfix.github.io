(() => {
  const cfg = window.OILFIX_CONFIG || {};
  const form = document.getElementById('oilfixApplication');
  const btn = document.getElementById('submitBtn');
  const modal = document.getElementById('resultModal');
  const modalTitle = document.getElementById('resultTitle');
  const modalMsg = document.getElementById('resultMessage');
  const modalIcon = document.getElementById('resultIcon');
  const close = document.getElementById('resultClose');
  const progress = document.getElementById('pageProgress');
  const destination = document.getElementById('submitDestination');

  function updateProgress(){
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
  }
  addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  const navLinks = [...document.querySelectorAll('.side-nav a')];
  const targets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, {rootMargin:'-35% 0px -55% 0px'});
  targets.forEach(t => spy.observe(t));

  function showResult(ok, title, message){
    modalIcon.textContent = ok ? '✓' : '!';
    modalIcon.style.background = ok ? 'var(--accent)' : 'var(--danger)';
    modalTitle.textContent = title;
    modalMsg.innerHTML = message;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }
  function hideResult(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }
  close.addEventListener('click', hideResult);

  function firstInvalid(){
    const fields = [...form.querySelectorAll('input, textarea')];
    fields.forEach(el => el.classList.remove('invalid'));
    if(form.checkValidity()) return null;
    const bad = fields.find(el => !el.checkValidity());
    if(bad){
      bad.classList.add('invalid');
      const holder = bad.closest('.field, .agree');
      holder?.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(()=>bad.focus({preventScroll:true}),450);
    }
    return bad;
  }

  const endpoint = (cfg.applicationEndpoint || '').trim();
  if(!endpoint){
    destination.textContent = '현재 저장 주소가 연결되지 않았습니다. 관리자 설정 후 실제 접수가 가능합니다.';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if(firstInvalid()){
      showResult(false,'작성 항목을 확인해주세요.','필수 항목 중 작성되지 않았거나<br>조건에 맞지 않는 내용이 있습니다.');
      return;
    }

    if(!endpoint){
      showResult(false,'아직 접수 저장소가 연결되지 않았습니다.','사이트 디자인은 정상 작동 중입니다.<br><b>site-config.js</b>에 Google Apps Script 주소를 연결해주세요.');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.submittedAt = new Date().toISOString();
    data.source = 'OILFIX Recruitment Website';
    data.userAgent = navigator.userAgent;

    btn.disabled = true;
    btn.querySelector('span').textContent = '전송 중...';

    try{
      // Apps Script Web App은 no-cors 방식으로 전송합니다.
      await fetch(endpoint,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify(data)
      });

      form.reset();
      showResult(true,'지원서 접수 완료','오일픽스에 지원해주셔서 감사합니다.<br>지원서 검토 후 면접 대상자에게 안내드리겠습니다.');
    }catch(err){
      showResult(false,'전송에 실패했습니다.','네트워크 상태를 확인한 뒤 다시 제출해주세요.<br>문제가 반복되면 관리자에게 문의해주세요.');
    }finally{
      btn.disabled = false;
      btn.querySelector('span').textContent = '지원서 제출';
    }
  });
})();