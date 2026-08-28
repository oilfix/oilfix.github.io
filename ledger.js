// OILFIX_GITHUB_NATIVE_LEDGER_V1
// OILFIX_CLEAN_DIRECT_GOOGLE_SCRIPT_RUN_V1
(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const tokenKey='oilfix_portal_token', ROLE_RANK={STAFF:1,MANAGER:2,ADMIN:3};
  let token=sessionStorage.getItem(tokenKey)||'',me=null,settings=null,staff=[],adminUsers=[],confirmAction=null,confirmNeedsReason=false;

  const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';
  const shortMoney=n=>{n=Number(n||0);if(n>=100000000)return(n/100000000).toLocaleString('ko-KR',{maximumFractionDigits:2})+'억원';if(n>=10000)return(n/10000).toLocaleString('ko-KR',{maximumFractionDigits:0})+'만원';return money(n);};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function gas(fn, ...args) {
    const endpoint = String(window.OILFIX_LEDGER_API_URL || '').trim();
    if (!/^https:\/\/.+/.test(endpoint)) {
      throw new Error('장부 API 주소가 설정되지 않았습니다. ledger-config.js를 확인해주세요.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({fn, args}),
      credentials: 'omit'
    });

    let payload;
    try {
      payload = await response.json();
    } catch (_) {
      throw new Error('장부 서버 응답 형식이 올바르지 않습니다.');
    }

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || '장부 서버 요청에 실패했습니다.');
    }

    return payload.result;
  }

  function toast(msg,error=false){const t=$('#toast');t.textContent=msg;t.className='toast show'+(error?' error':'');clearTimeout(t._timer);t._timer=setTimeout(()=>t.className='toast',2800);}
  function busy(btn,on,text='처리 중...'){if(!btn)return;btn.disabled=on;if(on){btn.dataset.old=btn.innerHTML;btn.innerHTML=text;}else if(btn.dataset.old)btn.innerHTML=btn.dataset.old;}
  function localDate(offset=0){const now=new Date(Date.now()+offset*86400000),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),g=t=>parts.find(p=>p.type===t).value;return`${g('year')}-${g('month')}-${g('day')}`;}
  function handleError(e){const msg=e.message||String(e);if(msg.includes('로그인이 만료')||msg.includes('사용할 수 없는 직원')){token='';sessionStorage.removeItem(tokenKey);$('#loginLayer').classList.remove('hidden');}toast(msg,true);}

  function applyRoleVisibility(){if(!me)return;$$('[data-role-min]').forEach(el=>el.classList.toggle('hidden',(ROLE_RANK[me.role]||0)<(ROLE_RANK[el.dataset.roleMin]||0)));$$('[data-role-only]').forEach(el=>el.classList.toggle('hidden',me.role!==el.dataset.roleOnly));}
  function setIdentity(){$('#sessionUser').textContent=`${me.name} · ${me.role}`;$('#heroUserName').textContent=me.name;$('#heroUserRole').textContent=me.role;$('#sellerAutoName').textContent=me.name;}
  function fillBootstrap(data){me=data.user||me;const b=data.bootstrap||data;settings=b.settings||settings;staff=b.staff||staff;adminUsers=b.adminUsers||adminUsers;setIdentity();applyRoleVisibility();renderDashboard(b.dashboard);renderLimits();populateSelects();if(me.role==='ADMIN'){renderUserList(adminUsers);fillAdminSettings(b.adminSettings||{});}}
  async function resume(){if(!token)return;try{const r=await gas('apiMe',token);$('#loginLayer').classList.add('hidden');fillBootstrap({user:r.user,bootstrap:r.bootstrap});await afterLoginLoads();}catch(e){token='';sessionStorage.removeItem(tokenKey);$('#loginLayer').classList.remove('hidden');}}
  async function afterLoginLoads(){await Promise.allSettled([loadBlacklist(),loadStats(),loadHistory()]);if(me&&ROLE_RANK[me.role]>=ROLE_RANK.MANAGER)await Promise.allSettled([loadSettlement('경찰'),loadSettlement('골드문모터스'),loadAudit()]);}

  function renderDashboard(d){if(!d)return;$('#mTodaySales').textContent=shortMoney(d.todaySales);$('#mTodayTx').textContent=`${d.todayTransactions}건`;$('#mTodayQty').textContent=d.todayQty;$('#mPolice').textContent=shortMoney(d.policeUnpaidTotal);$('#mPoliceCount').textContent=`${d.policeUnpaidCount}건`;$('#mGoldmoon').textContent=shortMoney(d.goldmoonUnpaidTotal);$('#mGoldmoonCount').textContent=`${d.goldmoonUnpaidCount}건`;$('#mBell').textContent=d.todayGoldenBell;$('#mBlack').textContent=d.blacklistCount;}
  function renderLimits(){if(!settings)return;$('#limitStrip').innerHTML=Object.entries(settings.limits||{}).map(([n,l])=>`<div class="limit-item"><span>${esc(n)}</span><b>${l}개 / DAY</b></div>`).join('');syncSaleLimit();}
  function populateSelects(){const types=settings?Object.keys(settings.limits||{}):['일반직','경찰','보안국','골드앤캐쉬','골드문모터스'];$('#histType').innerHTML='<option value="">전체</option>'+types.map(x=>`<option>${esc(x)}</option>`).join('');const opts=staff.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} · ${esc(u.role)}</option>`).join('');$('#histSeller').innerHTML='<option value="">전체</option>'+opts;$('#editDeferredSeller').innerHTML=opts;}
  function syncSaleLimit(){if(!settings)return;const type=$('#saleType').value,limit=Number((settings.limits||{})[type]||1);$('#saleQty').max=String(limit);if(Number($('#saleQty').value)>limit)$('#saleQty').value=String(limit);$('#saleLimitHint').textContent=`${type} · 하루 최대 ${limit}개`;}
  async function refreshDashboard(){try{const r=await gas('apiDashboard',token);settings=r.settings;renderDashboard(r.dashboard);renderLimits();}catch(e){handleError(e);}}

  $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;busy(btn,true);try{const r=await gas('apiLogin',$('#loginId').value.trim(),$('#loginPin').value.trim());token=r.token;sessionStorage.setItem(tokenKey,token);$('#loginLayer').classList.add('hidden');fillBootstrap({user:r.user,bootstrap:r.bootstrap});if(r.mustChangePin){$('#forceOldPin').value=$('#loginPin').value.trim();$('#forcePinLayer').classList.remove('hidden');}await afterLoginLoads();}catch(err){toast(err.message,true);}finally{busy(btn,false);}});
  $('#forcePinBtn').addEventListener('click',async()=>{const btn=$('#forcePinBtn');busy(btn,true);try{await gas('apiChangeMyPin',token,$('#forceOldPin').value,$('#forceNewPin').value);$('#forcePinLayer').classList.add('hidden');toast('PIN 변경 완료');}catch(e){toast(e.message,true);}finally{busy(btn,false);}});
  $('#logoutBtn').addEventListener('click',async()=>{try{if(token)await gas('apiLogout',token);}catch(e){}token='';me=null;sessionStorage.removeItem(tokenKey);$('#loginLayer').classList.remove('hidden');});

  $('#saleType').addEventListener('change',syncSaleLimit);$('#quoteBtn').addEventListener('click',quoteSale);
  function salePayload(){return{gameId:$('#saleGameId').value.trim(),nickname:$('#saleNickname').value.trim(),customerType:$('#saleType').value,quantity:Number($('#saleQty').value),goldenBell:$('#saleGolden').checked};}
  async function quoteSale(){const btn=$('#quoteBtn');busy(btn,true);try{renderQuote(await gas('apiQuoteSale',token,salePayload()));}catch(e){handleError(e);}finally{busy(btn,false);}}
  function renderQuote(q){$('#qUnit').textContent=shortMoney(q.unitPrice);$('#qUsed').textContent=`${q.used}/${q.limit}개`;$('#qRemain').textContent=`${Math.max(0,q.remainingBefore)}개`;$('#qTotal').textContent=shortMoney(q.total);let msg=q.goldenBell?'골든벨 무료 · 0원 · 후불 제외':q.deferred?`${q.customerType} 후불 · ${q.customerType==='경찰'?'월요일':'일요일'} 정산`:'즉시 결제';if(q.blacklist&&!q.goldenBell)msg=`블랙리스트 가격 적용 · ${msg}`;if(!q.allowed)msg=`한도 초과 · 추가 가능 ${q.remainingBefore}개`;if(q.duplicate)msg+=' · ⚠ 최근 동일 거래 감지';$('#qMessage').textContent=msg;$('#qMessage').style.color=q.allowed?'':'var(--danger)';}
  $('#saleForm').addEventListener('submit',async e=>{e.preventDefault();const btn=$('#saleSubmit');busy(btn,true);try{const q=await gas('apiQuoteSale',token,salePayload());renderQuote(q);if(!q.allowed)throw new Error(`구매 한도 초과입니다. 추가 가능 ${q.remainingBefore}개`);openConfirm('이 거래를 등록할까요?',`${me.name} → ${q.nickname}(#${q.gameId}) · ${q.customerType} · ${q.quantity}개 · ${shortMoney(q.total)}${q.goldenBell?' · 골든벨 무료':''}`,false,async()=>createSale(false));}catch(err){handleError(err);}finally{busy(btn,false);}});
  async function createSale(force){try{const r=await gas('apiCreateSale',token,salePayload(),force);if(r.duplicateRequired){closeConfirm();openConfirm('중복 거래가 감지되었습니다.','최근 같은 직원이 같은 고객에게 동일한 수량을 등록한 기록이 있습니다. 그래도 한 번 더 등록할까요?',false,async()=>createSale(true));return;}closeConfirm();toast(r.message);renderDashboard(r.dashboard);$('#saleQty').value=1;$('#saleGolden').checked=false;$('#qMessage').textContent='등록 전에 가격과 일일 한도를 확인해주세요.';await loadHistory();}catch(e){handleError(e);}}

  $('#customerSearchBtn').addEventListener('click',loadCustomer);$('#customerQuery').addEventListener('keydown',e=>{if(e.key==='Enter')loadCustomer();});
  async function loadCustomer(){const q=$('#customerQuery').value.trim();if(!q)return toast('고유번호 또는 이름을 입력해주세요.',true);const btn=$('#customerSearchBtn');busy(btn,true);try{renderCustomers((await gas('apiCustomerLookup',token,q)).results);}catch(e){handleError(e);}finally{busy(btn,false);}}
  function renderCustomers(rows){const box=$('#customerResults');if(!rows.length){box.className='customer-results empty-state';box.innerHTML='검색되는 고객 기록이 없습니다.';return;}box.className='customer-results';box.innerHTML=rows.map(c=>`<article class="customer-card"><div class="customer-top"><div><h3>#${esc(c.gameId)} · ${esc(c.nickname||'이름 미기록')}</h3><small>${esc(c.customerType||'구분 기록 없음')} · 마지막 구매 ${esc(c.lastPurchaseAt||'-')}</small></div><div class="customer-badges">${c.blacklist?'<span class="badge red">BLACKLIST</span>':'<span class="badge">NORMAL</span>'}${c.unpaidCount?`<span class="badge">후불 ${c.unpaidCount}건</span>`:''}</div></div><div class="customer-metrics"><div><span>오늘 구매</span><b>${c.todayUsed}${c.dailyLimit!==null?` / ${c.dailyLimit}`:''}개</b></div><div><span>추가 가능</span><b>${c.remaining===null?'-':c.remaining+'개'}</b></div><div><span>누적 수량</span><b>${c.lifetimeQty}개</b></div><div><span>구매 횟수</span><b>${c.purchaseCount}건</b></div><div><span>누적 결제</span><b>${shortMoney(c.lifetimeSpend)}</b></div><div><span>후불 미결제</span><b>${shortMoney(c.unpaidTotal)}</b></div></div>${c.blacklist?`<p class="admin-warning">블랙리스트 사유: ${esc(c.blacklistReason)}</p>`:''}<div class="recent-mini">${c.recent.slice(0,6).map(r=>`<div><span>${esc(r.createdAt)}</span><b>${esc(r.sellerName)}</b><span>${r.qty}개</span><strong>${shortMoney(r.total)}</strong></div>`).join('')}</div></article>`).join('');}

  $('#historySearchBtn').addEventListener('click',loadHistory);
  async function loadHistory(){if(!token)return;try{const r=await gas('apiSearchTransactions',token,{startDate:$('#histStart').value,endDate:$('#histEnd').value,query:$('#histQuery').value.trim(),sellerId:$('#histSeller').value,customerType:$('#histType').value,paymentStatus:$('#histPayment').value,goldenBell:$('#histGolden').value,status:$('#histStatus').value});$('#historyCount').textContent=`${r.count}건 · ${r.totalQty}개`;$('#historyAmount').textContent=shortMoney(r.totalAmount);renderHistory(r.rows);}catch(e){handleError(e);}}
  function renderHistory(rows){const body=$('#historyBody');if(!rows.length){body.innerHTML='<tr><td colspan="12" class="empty-cell">조건에 맞는 거래가 없습니다.</td></tr>';return;}const can=ROLE_RANK[me.role]>=ROLE_RANK.MANAGER;body.innerHTML=rows.map(r=>`<tr><td>${esc(r.createdAt)}</td><td><b>${esc(r.sellerName)}</b></td><td>${esc(r.nickname)}</td><td>#${esc(r.gameId)}</td><td>${esc(r.customerType)}</td><td>${r.qty}개</td><td>${shortMoney(r.unitPrice)}</td><td><b>${shortMoney(r.total)}</b></td><td>${r.goldenBell?'<span class="status-chip free">FREE</span>':'-'}</td><td><span class="status-chip ${r.paymentStatus==='주간미결제'?'unpaid':''}">${esc(r.paymentStatus)}</span></td><td>${r.status==='CANCELLED'?'<span class="status-chip cancel">CANCELLED</span>':'ACTIVE'}</td><td>${can&&r.status!=='CANCELLED'?`<button class="ghost small" data-cancel-tx="${esc(r.id)}">취소</button>`:''}</td></tr>`).join('');}

  $('#previewPoliceBtn').addEventListener('click',()=>loadSettlement('경찰'));$('#previewGoldmoonBtn').addEventListener('click',()=>loadSettlement('골드문모터스'));$('#settlePoliceBtn').addEventListener('click',()=>confirmSettlement('경찰'));$('#settleGoldmoonBtn').addEventListener('click',()=>confirmSettlement('골드문모터스'));
  async function loadSettlement(type){if(!me||ROLE_RANK[me.role]<ROLE_RANK.MANAGER)return;try{renderSettlement(await gas('apiSettlementPreview',token,type));}catch(e){handleError(e);}}
  function renderSettlement(r){const police=r.customerType==='경찰',prefix=police?'police':'goldmoon';$('#'+prefix+'Outstanding').textContent=shortMoney(r.outstandingTotal);$('#'+prefix+'OutstandingCount').textContent=`${r.outstandingCount}건`;$('#'+prefix+'Eligible').textContent=shortMoney(r.eligibleTotal);$('#'+prefix+'EligibleCount').textContent=`${r.eligibleCount}건`;const sb=police?$('#settlePoliceBtn'):$('#settleGoldmoonBtn');sb.disabled=!r.canSettleToday||r.eligibleCount===0;const box=police?$('#policeDeferredList'):$('#goldmoonDeferredList');if(!r.rows.length){box.innerHTML='<div class="empty-state">미정산 후불 거래가 없습니다.</div>';return;}box.innerHTML=r.rows.map(x=>`<div class="deferred-item"><div class="deferred-info"><b>${esc(x.nickname)} <small>#${esc(x.gameId)}</small></b><span>${esc(x.dateKey)} · 판매 ${esc(x.sellerName)} · ${x.qty}개</span><strong>${shortMoney(x.total)}</strong></div><div class="item-actions"><button data-edit-deferred="${esc(x.id)}" data-json="${encodeURIComponent(JSON.stringify(x))}">수정</button><button class="delete" data-delete-deferred="${esc(x.id)}">삭제</button></div></div>`).join('');}
  async function confirmSettlement(type){try{const p=await gas('apiSettlementPreview',token,type);if(!p.canSettleToday)throw new Error(p.scheduleLabel+'입니다. 오늘은 정산일이 아닙니다.');if(!p.eligibleCount)throw new Error('정산할 거래가 없습니다.');openConfirm(`${type} 후불 정산확정`,`정산 대상 ${p.eligibleCount}건 / 총 ${money(p.eligibleTotal)}입니다. 결제완료 처리할까요?`,false,async()=>{try{const r=await gas('apiConfirmSettlement',token,type);closeConfirm();toast(r.message);renderDashboard(r.dashboard);renderSettlement(r.preview);await loadHistory();}catch(e){handleError(e);}});}catch(e){handleError(e);}}

  $('#statsBtn').addEventListener('click',loadStats);
  async function loadStats(){if(!token)return;try{const r=await gas('apiEmployeeStats',token,$('#statsStart').value,$('#statsEnd').value);$('#statsBody').innerHTML=r.rows.length?r.rows.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.sellerName)}</b></td><td>${x.transactions}건</td><td>${x.qty}개</td><td><b>${shortMoney(x.sales)}</b></td><td>${x.goldenBell}건</td><td>${x.deferred}건</td></tr>`).join(''):'<tr><td colspan="7" class="empty-cell">해당 기간 판매기록이 없습니다.</td></tr>';}catch(e){handleError(e);}}

  $('#blackRefreshBtn').addEventListener('click',loadBlacklist);
  $('#blackForm').addEventListener('submit',async e=>{e.preventDefault();try{const r=await gas('apiBlacklistAdd',token,{gameId:$('#blackGameId').value.trim(),nickname:$('#blackName').value.trim(),reason:$('#blackReason').value.trim()});toast(r.message);$('#blackForm').reset();await loadBlacklist();await refreshDashboard();}catch(e){handleError(e);}});
  async function loadBlacklist(){if(!token)return;try{const r=await gas('apiBlacklistList',token),box=$('#blackList');box.className='black-list';if(!r.rows.length){box.className='black-list empty-state';box.innerHTML='활성 블랙리스트가 없습니다.';return;}const can=me&&ROLE_RANK[me.role]>=ROLE_RANK.MANAGER;box.innerHTML=r.rows.map(x=>`<div class="black-row"><div><b>#${esc(x.gameId)} · ${esc(x.nickname||'이름 미기록')}</b><span>${esc(x.reason)} · ${esc(x.createdAt)}</span></div>${can?`<button class="ghost small" data-remove-black="${esc(x.id)}">해제</button>`:''}</div>`).join('');}catch(e){handleError(e);}}

  $('#auditBtn').addEventListener('click',loadAudit);
  async function loadAudit(){if(!me||ROLE_RANK[me.role]<ROLE_RANK.MANAGER)return;try{const r=await gas('apiAuditSearch',token,{startDate:$('#auditStart').value,endDate:$('#auditEnd').value,query:$('#auditQuery').value.trim(),action:$('#auditAction').value}),box=$('#auditList');box.className='audit-list';if(!r.rows.length){box.className='audit-list empty-state';box.innerHTML='감사기록이 없습니다.';return;}box.innerHTML=r.rows.map(x=>`<div class="audit-row"><span>${esc(x.createdAt)}</span><b>${esc(x.actorName)}</b><span>${esc(x.action)} · ${esc(x.targetType)} ${esc(x.targetId)}</span><span class="audit-reason">${esc(x.reason||'-')}</span></div>`).join('');}catch(e){handleError(e);}}

  $('#userForm').addEventListener('submit',async e=>{e.preventDefault();try{const r=await gas('apiAdminSaveUser',token,{id:$('#userEditId').value,loginId:$('#userLoginId').value.trim(),displayName:$('#userDisplayName').value.trim(),pin:$('#userPin').value.trim(),role:$('#userRole').value,active:$('#userActive').checked});toast(r.message);adminUsers=r.rows;renderUserList(adminUsers);resetUserForm();staff=adminUsers.filter(x=>x.active).map(x=>({id:x.id,name:x.name,role:x.role}));populateSelects();}catch(e){handleError(e);}});
  $('#userFormReset').addEventListener('click',resetUserForm);
  function resetUserForm(){$('#userEditId').value='';$('#userLoginId').value='';$('#userDisplayName').value='';$('#userPin').value='';$('#userRole').value='STAFF';$('#userActive').checked=true;}
  function renderUserList(rows){const box=$('#userList');box.className='user-list';if(!rows||!rows.length){box.className='user-list empty-state';box.innerHTML='직원 계정이 없습니다.';return;}box.innerHTML=rows.map(u=>`<div class="user-row"><div><b>${esc(u.name)} <span class="user-role">${esc(u.role)}</span></b><span>${esc(u.loginId)} · ${u.active?'ACTIVE':'DISABLED'}${u.mustChangePin?' · PIN 변경 필요':''}</span></div><button class="ghost small" data-edit-user="${esc(u.id)}">수정</button></div>`).join('');}

  $('#settingsForm').addEventListener('submit',async e=>{e.preventDefault();try{const r=await gas('apiAdminSaveSettings',token,{BASE_PRICE:$('#setBasePrice').value,BLACKLIST_MULTIPLIER:$('#setBlackMultiplier').value,LIMIT_GENERAL:$('#setLimitGeneral').value,LIMIT_POLICE:$('#setLimitPolice').value,LIMIT_SECURITY:$('#setLimitSecurity').value,LIMIT_GOLDCASH:$('#setLimitGoldcash').value,LIMIT_GOLDMOON:$('#setLimitGoldmoon').value,DUPLICATE_WINDOW_SECONDS:$('#setDuplicateSec').value});settings=r.publicSettings;fillAdminSettings(r.values);renderLimits();toast(r.message);}catch(e){handleError(e);}});
  function fillAdminSettings(v){if(!v||!Object.keys(v).length)return;$('#setBasePrice').value=v.BASE_PRICE||'';$('#setBlackMultiplier').value=v.BLACKLIST_MULTIPLIER||'';$('#setLimitGeneral').value=v.LIMIT_GENERAL||'';$('#setLimitPolice').value=v.LIMIT_POLICE||'';$('#setLimitSecurity').value=v.LIMIT_SECURITY||'';$('#setLimitGoldcash').value=v.LIMIT_GOLDCASH||'';$('#setLimitGoldmoon').value=v.LIMIT_GOLDMOON||'';$('#setDuplicateSec').value=v.DUPLICATE_WINDOW_SECONDS||'';}
  $$('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>{$$('[data-admin-tab]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const users=btn.dataset.adminTab==='users';$('#adminUsersPanel').classList.toggle('hidden',!users);$('#adminSettingsPanel').classList.toggle('hidden',users);}));

  document.addEventListener('click',e=>{
    const c=e.target.closest('[data-cancel-tx]');if(c){openConfirm('거래 취소','이 거래를 취소 처리할까요?',true,async reason=>{try{const r=await gas('apiCancelTransaction',token,c.dataset.cancelTx,reason);closeConfirm();toast(r.message);renderDashboard(r.dashboard);await loadHistory();}catch(err){handleError(err);}});return;}
    const rb=e.target.closest('[data-remove-black]');if(rb){openConfirm('블랙리스트 해제','이 블랙리스트를 해제할까요?',true,async reason=>{try{const r=await gas('apiBlacklistRemove',token,rb.dataset.removeBlack,reason);closeConfirm();toast(r.message);await loadBlacklist();await refreshDashboard();}catch(err){handleError(err);}});return;}
    const ed=e.target.closest('[data-edit-deferred]');if(ed){const r=JSON.parse(decodeURIComponent(ed.dataset.json));$('#editDeferredId').value=r.id;$('#editDeferredSeller').value=r.sellerId||'';$('#editDeferredGameId').value=r.gameId;$('#editDeferredName').value=r.nickname;$('#editDeferredQty').value=r.qty;$('#editDeferredReason').value='';$('#deferredEditModal').classList.remove('hidden');return;}
    const dd=e.target.closest('[data-delete-deferred]');if(dd){openConfirm('후불 거래 삭제','미정산 후불 거래를 삭제할까요? 기록은 취소 상태로 보존됩니다.',true,async reason=>{try{const r=await gas('apiDeleteDeferredTransaction',token,dd.dataset.deleteDeferred,reason);closeConfirm();toast(r.message);await loadSettlement('경찰');await loadSettlement('골드문모터스');await loadHistory();await refreshDashboard();}catch(err){handleError(err);}});return;}
    const eu=e.target.closest('[data-edit-user]');if(eu){const u=adminUsers.find(x=>x.id===eu.dataset.editUser);if(!u)return;$('#userEditId').value=u.id;$('#userLoginId').value=u.loginId;$('#userDisplayName').value=u.name;$('#userPin').value='';$('#userRole').value=u.role;$('#userActive').checked=u.active;document.querySelector('#admin').scrollIntoView({behavior:'smooth'});return;}
    if(e.target.matches('[data-modal-close]'))closeConfirm();if(e.target.matches('[data-edit-close]'))closeDeferredEdit();
  });

  $('#editDeferredCancel').addEventListener('click',closeDeferredEdit);
  $('#editDeferredSave').addEventListener('click',async()=>{const btn=$('#editDeferredSave');busy(btn,true);try{const r=await gas('apiUpdateDeferredTransaction',token,$('#editDeferredId').value,{sellerId:$('#editDeferredSeller').value,gameId:$('#editDeferredGameId').value.trim(),nickname:$('#editDeferredName').value.trim(),quantity:Number($('#editDeferredQty').value),reason:$('#editDeferredReason').value.trim()});closeDeferredEdit();toast(r.message);await loadSettlement('경찰');await loadSettlement('골드문모터스');await loadHistory();await refreshDashboard();}catch(e){handleError(e);}finally{busy(btn,false);}});
  function closeDeferredEdit(){$('#deferredEditModal').classList.add('hidden');}

  function openConfirm(title,text,needsReason,action){$('#confirmTitle').textContent=title;$('#confirmText').textContent=text;$('#confirmReasonWrap').classList.toggle('hidden',!needsReason);$('#confirmReason').value='';confirmNeedsReason=!!needsReason;confirmAction=action;$('#confirmModal').classList.remove('hidden');}
  function closeConfirm(){$('#confirmModal').classList.add('hidden');confirmAction=null;confirmNeedsReason=false;}
  $('#confirmCancel').addEventListener('click',closeConfirm);$('#confirmOk').addEventListener('click',async()=>{if(!confirmAction)return;const reason=$('#confirmReason').value.trim();if(confirmNeedsReason&&!reason)return toast('사유를 입력해주세요.',true);await confirmAction(reason);});


  $('#histStart').value=localDate(0);$('#histEnd').value=localDate(0);$('#statsStart').value=localDate(-6);$('#statsEnd').value=localDate(0);$('#auditStart').value=localDate(-6);$('#auditEnd').value=localDate(0);
  function clock(){$('#liveClock').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());}setInterval(clock,1000);clock();
  let lastDay=localDate(0);setInterval(()=>{const d=localDate(0);if(d!==lastDay&&token){lastDay=d;refreshDashboard();loadHistory();toast('날짜가 변경되어 오늘 구매량이 새로 계산됩니다.');}},15000);

  // 공식 지원서 페이지와 같은 스크롤 진행바 / 좌측 목차 활성 표시
  const progress=$('#pageProgress');
  const navLinks=$$('.side-nav a');
  const navSections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function syncPageUi(){
    const max=document.documentElement.scrollHeight-innerHeight;
    if(progress) progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%';
    let current='';
    navSections.forEach(sec=>{if(sec.getBoundingClientRect().top<=150)current='#'+sec.id;});
    navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===current));
  }
  addEventListener('scroll',syncPageUi,{passive:true});
  addEventListener('resize',syncPageUi);
  syncPageUi();

  resume();
})();