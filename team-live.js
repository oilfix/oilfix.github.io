(() => {
  const config = window.OILFIX_CONFIG || {};
  const endpoint = String(config.teamApiUrl || '').replace(/\/$/, '');
  if (!endpoint) return;

  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const tierOrder = ['EXECUTIVE','TEAM LEAD','MANAGER','OPEN POSITION'];

  function render(team) {
    if (!team) return;
    const current = Number(team.current || 0), capacity = Math.max(1, Number(team.capacity || 25));

    const total = document.querySelector('#team .team-total strong');
    if (total) total.textContent = `${current} / ${capacity}`;
    const heroTotal = document.querySelector('.hero-side-card .meter-label strong');
    if (heroTotal) heroTotal.textContent = `${current} / ${capacity}`;
    const meter = document.querySelector('.hero-side-card .meter i');
    if (meter) meter.style.width = `${Math.max(0, Math.min(100, current / capacity * 100))}%`;

    const board = document.querySelector('#team .org-board');
    if (!board || !Array.isArray(team.rows)) return;

    const groups = {};
    tierOrder.forEach(t => groups[t] = []);
    team.rows.forEach(row => { if (!groups[row.tier]) groups[row.tier] = []; groups[row.tier].push(row); });

    board.innerHTML = tierOrder.filter(t => groups[t] && groups[t].length).map(tier => {
      const rows = groups[tier];
      const classes = ['org-tier'];
      if (tier === 'EXECUTIVE') classes.push('executive');
      if (tier === 'OPEN POSITION') classes.push('bottom-tier');
      const peopleClass = tier === 'MANAGER' ? 'people managers' : 'people';
      const people = rows.map(x => {
        const vacant = !!x.vacant;
        const name = x.name || (vacant ? '공석' : '');
        const code = vacant ? (name === '모집중' ? 'JOIN US' : 'OPEN') : `#${x.gameId || ''}`;
        return `<div class="person${vacant?' vacant':''}"><span>${esc(x.position)}</span><strong>${esc(name)}</strong><small>${esc(code)}</small></div>`;
      }).join('');
      return `<div class="${classes.join(' ')}"><div class="tier-label">${esc(tier)}</div><div class="${peopleClass}">${people}</div></div>`;
    }).join('');
  }

  async function load() {
    try {
      const res = await fetch(`${endpoint}/?public=team&_=${Date.now()}`, {cache:'no-store'});
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || '직급표 조회 실패');
      const payload = data.result || data;
      render(payload.team || payload);
    } catch (err) {
      console.warn('[OILFIX] live team board fallback:', err);
      // 통신 실패 시 index.html의 기존 직급표를 그대로 유지합니다.
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, {once:true});
  else load();
})();
