(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  const flashEl = $('#flash');
  const toastEl = $('#toast');
  const termsEl = $('.terms');
  const reflectText = $('#reflectText');
  const sReflect = $('#s-reflect');
  const sKycc = $('#s-kycc');
  const sMatch = $('#s-match');
  const dialogLayer = $('#dialogLayer');
  const modePill = $('#modePill');

  const state = { plan: null, product: null, terms: false, score: 100 };

  const API_BASE = ''; // 本地同源 API 地址

  const REFLECT_PRESET =
    '总结：通过锁定远期汇率对冲跨境风险，组合兼顾收益与安全。反思：需保持长期定投心态，增强避险敏感度，防止市场波动导致单边亏损。';

  const PLAN_PILL = {
    STOCK: '沙盒演练模式，已锁定风险调仓',
    AIP: '沙盒演练模式，已锁定自动定投',
    SAVINGS: '沙盒演练模式，已锁定定活储蓄',
    FX: '沙盒演练模式，已锁定外汇锁定',
  };

  function flash(color = '#fff') {
    flashEl.style.background = color;
    flashEl.classList.remove('go');
    void flashEl.offsetWidth;
    flashEl.classList.add('go');
  }

  function go(id, flashColor) {
    const next = document.getElementById(id);
    document.querySelectorAll('.screen.active').forEach((s) => s.classList.remove('active'));
    next.classList.add('active');
    toastEl.classList.remove('show');
    if (flashColor) flash(flashColor);
  }

  function setScore(v) {
    state.score = v;
    document.querySelectorAll('[data-score]').forEach((n) => {
      n.textContent = String(v);
    });
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  // 后端 API 交互封装
  async function apiTrack(eventName, details = {}) {
    try {
      await fetch(`${API_BASE}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: eventName, details })
      });
    } catch (e) {
      console.warn('Track event failed:', e);
    }
  }

  /* ---------- 场景 1 : 02 资产演练 ---------- */
  document.querySelectorAll('.asset-card').forEach((card) => {
    card.addEventListener('click', () => selectPlan(card.dataset.plan));
  });

  function selectPlan(plan) {
    state.plan = plan;
    document.querySelectorAll('.asset-card').forEach((c) => c.classList.remove('selected', 'expanded'));
    const card = document.querySelector(`.asset-card[data-plan="${plan}"]`);
    if (!card) return;
    card.classList.add('selected');
    if (plan === 'STOCK') requestAnimationFrame(() => card.classList.add('expanded'));
    modePill.textContent = PLAN_PILL[plan] || '';
    modePill.classList.add('show');

    apiTrack('SELECT_ASSET_PLAN', { plan: plan });
  }

  $('[data-tap="start-practice"]').addEventListener('click', () => {
    apiTrack('START_PRACTICE', { source: 'HOME_BANNER' });
    go('s-asset', '#ffffff');
  });

  $('[data-tap="confirm-assets"]').addEventListener('click', function () {
    if (!state.plan) {
      toast('请先确认资产方案！！！');
      shake(this);
      apiTrack('VALIDATION_FAILED', { scene: 'SCENE_1', reason: 'MISSING_PLAN' });
      return;
    }
    apiTrack('CONFIRM_ASSET_PLAN', { plan: state.plan });
    enterReflect();
  });

  /* ---------- 场景 2 : 03 防诈与启发打字 ---------- */
  function enterReflect() {
    go('s-reflect', '#0b0e14');
    sReflect.classList.remove('warn-on', 'sheet-up', 'kb-open');

    // 重置预警横幅位置与动画
    const warnCard = $('#warnCard');
    if (warnCard) {
      warnCard.style.transform = '';
      warnCard.style.opacity = '';
      warnCard.style.transition = '';
    }

    setTimeout(() => sReflect.classList.add('warn-on'), 400);
    setTimeout(() => sReflect.classList.add('sheet-up'), 1000);
  }

  reflectText.addEventListener('focus', () => {
    sReflect.classList.add('kb-open');
  });

  $('#suggestFill').addEventListener('click', () => {
    reflectText.value = REFLECT_PRESET;
    sReflect.classList.add('kb-open');
    reflectText.focus();
    reflectText.setSelectionRange(reflectText.value.length, reflectText.value.length);
    apiTrack('CLICK_PRESET_REFLECTION', { text: REFLECT_PRESET });
  });

  $('[data-tap="submit-reflection"]').addEventListener('click', function () {
    const val = reflectText.value.trim();
    if (!val) {
      toast('请不要不反思自己走过的每一步路！！！');
      shake(this);
      reflectText.focus();
      sReflect.classList.add('kb-open');
      apiTrack('VALIDATION_FAILED', { scene: 'SCENE_2', reason: 'EMPTY_REFLECTION' });
      return;
    }
    state.reflection = val;
    sReflect.classList.remove('kb-open');
    apiTrack('SUBMIT_REFLECTION', { text: val, hesitation_sec: 18.0 });
    enterKycc();
  });

  /* ---------- 场景 3 : 04 智判定诊断 ---------- */
  let kyccToken = 0;
  async function enterKycc() {
    const my = ++kyccToken;
    go('s-kycc', '#0b0e14');
    sKycc.classList.remove('ready', 'aha');

    try {
      const res = await fetch(`${API_BASE}/api/kycc/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hesitation_time: 18.0, reflection_text: state.reflection })
      });
      await res.json();
    } catch (e) {
      console.warn('KYCC API offline, falling back to UI animation.');
    }

    setTimeout(() => {
      if (my === kyccToken) sKycc.classList.add('ready');
    }, 2800);
    setTimeout(() => {
      if (my === kyccToken) sKycc.classList.add('aha');
    }, 4100);
  }

  $('[data-tap="aha-cta"]').addEventListener('click', () => {
    apiTrack('CLICK_AHA_MOMENT_CTA', {});
    enterMatch();
  });

  /* ---------- 场景 4-A : 智能匹配成果 ---------- */
  let matchToken = 0;
  async function enterMatch() {
    const my = ++matchToken;
    state.product = null;
    dialogLayer.classList.remove('show');
    document.querySelectorAll('.product').forEach((p) => p.classList.remove('selected'));
    go('s-match', '#ffffff');
    sMatch.classList.remove('ready');

    try {
      await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (e) {}

    setTimeout(() => {
      if (my === matchToken) sMatch.classList.add('ready');
    }, 2400);
  }

  document.querySelectorAll('.product').forEach((p) => {
    p.addEventListener('click', () => {
      if (!sMatch.classList.contains('ready')) return;
      state.product = Number(p.dataset.product);
      document.querySelectorAll('.product').forEach((x) => x.classList.remove('selected'));
      p.classList.add('selected');
      apiTrack('SELECT_RECOMMENDED_PRODUCT', { product_id: state.product });
    });
  });

  $('[data-tap="match-cta"]').addEventListener('click', function () {
    if (!state.product) {
      toast('请先选择产品！！！');
      shake(this);
      apiTrack('VALIDATION_FAILED', { scene: 'SCENE_4_A', reason: 'MISSING_PRODUCT' });
      return;
    }
    dialogLayer.classList.add('show');
  });

  $('[data-tap="dialog-cancel"]').addEventListener('click', () => {
    dialogLayer.classList.remove('show');
    apiTrack('CANCEL_OAUTH_DIALOG', {});
  });

  $('[data-tap="dialog-confirm"]').addEventListener('click', () => {
    dialogLayer.classList.remove('show');
    apiTrack('CONFIRM_OAUTH_DIALOG', {});
    enterPurchase();
  });

  /* ---------- 场景 4-C : 真实理财购买页 ---------- */
  function applyProductCopy() {
    const p1 = state.product === 1;
    $('#pRate').textContent = p1 ? '3.85%' : '2.15%';
    $('#pRatePill').textContent = p1 ? '湾区理财通专享' : '青年定投专享';
    $('#pRateSub').textContent = p1 ? '参考年化收益率（港币/人民币双币对冲）' : '7日年化收益率 · 随时申购，低风险 PR1';
    $('#pAmountLabel').textContent = p1 ? '认购金额（港币 HKD）' : '买入金额（元）';
    $('#pAmount').textContent = p1 ? '20,000.00' : '2,000.00';
    $('#pHint').textContent = p1 ? '*已由沙盒外汇策略预填' : '*已由沙盒策略自动预填';
    $('#pSecondLabel').textContent = p1 ? '锁定远期汇率' : '自动定投计划';
    $('#pSecondValue').textContent = p1 ? '1 HKD ≈ 0.8650 CNY（自动锁定）' : '每月 500.00 元（15日自动扣款）';
    $('#pAcct').textContent = p1 ? '工银亚洲 跨境理财通多币种账户（尾号 6688）' : '中国工商银行 储蓄卡（尾号 8888）';
    $('#pTerms').textContent = p1 ? '我已确认《粤港澳跨境理财通投资者协议》及《汇率风险排查书》' : '我已确认《投资者适当性评估（KYC）》及《工银理财产品协议》';
    termsEl.classList.toggle('checked', state.terms);
  }

  function enterPurchase() {
    applyProductCopy();
    go('s-purchase', '#ffffff');
  }

  termsEl.addEventListener('click', () => {
    state.terms = !state.terms;
    termsEl.classList.toggle('checked', state.terms);
  });

  $('[data-tap="purchase-cta"]').addEventListener('click', async function () {
    if (!state.terms) {
      toast('请先确认协议！！！');
      shake(this);
      apiTrack('VALIDATION_FAILED', { scene: 'SCENE_4_C', reason: 'TERMS_NOT_AGREED' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: state.product })
      });
      const data = await res.json();
      if (data.new_score) setScore(data.new_score);
    } catch (e) {
      setScore(600);
    }

    enterSuccess();
  });

  /* ---------- 场景 4-D : 交易成功结算 ---------- */
  function applySuccessCopy() {
    const p1 = state.product === 1;
    $('#sSub').textContent = p1 ? '预计 1 个工作日内确认份额，已生成工银亚洲跨境持仓' : '预计 1 个工作日内确认份额，已生成工行真实持仓';
    $('#sName').textContent = p1 ? '工银亚洲·粤港澳跨境双币稳健理财' : '工银理财·天添益（青年专属版）';
    $('#sLine1').textContent = p1 ? '20,000.00 HKD（折合约 17,200 CNY）' : '2,000.00 元';
    $('#sLine2').textContent = p1 ? '已锁定远期汇率：1 HKD ≈ 0.8650 CNY' : '每月 500.00 元（每月15日扣款）';
    $('#sLine3').textContent = p1 ? '工银亚洲 跨境理财通账户（尾号 6688）' : '中国工商银行 储蓄卡（尾号 8888）';
    $('#sRewardTitle').textContent = p1 ? '恭喜完成“湾区智汇”跨境避险演练！' : '恭喜完成“湾区智汇”全闭环演练！';
    $('#sRewardLine').textContent = p1 ? '获得【湾区外汇避险达人】勋章！财商积分 +500' : '获得【湾区防诈防冲动达人】勋章！财商积分 +500';
    $('#sRewardFoot').textContent = p1 ? '您已成功掌握粤港澳大湾区多币种对冲及跨境理财能力' : '您已熟练掌握大湾区外汇避险、基金定投及反诈识别能力';
  }

  function enterSuccess() {
    applySuccessCopy();
    go('s-success', '#ffffff');
  }

  $('[data-tap="view-holdings"]').addEventListener('click', () => {
    applyHoldingsCopy();
    go('s-holdings', '#ffffff');
  });

  /* ---------- 场景 4-E : 真实持仓查看 ---------- */
  function applyHoldingsCopy() {
    const p1 = state.product === 1;
    $('#hHeroLabel').textContent = p1 ? '跨境理财总资产（港币折算）' : '理财总资产（元）';
    $('#hAmount').textContent = p1 ? '20,000.00' : '2,000.00';
    $('#hSub').textContent = p1 ? '折合约 17,300.00 CNY ｜ 已锁定锁定汇率 0.8650' : '昨日收益 +0.00 元 ｜ 份额确认中';
    $('#hName').textContent = p1 ? '工银亚洲·粤港澳跨境双币稳健理财' : '工银理财·天添益（青年专属版）';
    $('#hHoldAmount').textContent = p1 ? '20,000.00' : '2,000.00';
    $('#hUnit').textContent = p1 ? 'HKD' : '元';
    $('#hMeta').textContent = p1 ? '参考年化 3.85% ｜ 1年期封闭90天' : '自动定投中：每月15日扣款 500.00 元';
    $('#hLock').textContent = p1 ? '已锁定远期保值汇率：1 HKD ≈ 0.8650 CNY' : '购买账户：中国工商银行 储蓄卡（尾号 8888）';
  }

  $('[data-tap="view-detail"]').addEventListener('click', () => enterPurchase());

  /* ---------- 重置与返回控制 ---------- */
  function resetAll() {
    kyccToken++;
    matchToken++;
    state.plan = null;
    state.product = null;
    state.terms = false;
    document.querySelectorAll('.asset-card').forEach((c) => c.classList.remove('selected', 'expanded'));
    modePill.classList.remove('show');
    reflectText.value = '';
    reflectText.blur();
    sReflect.classList.remove('warn-on', 'sheet-up', 'kb-open');
    sKycc.classList.remove('ready', 'aha');
    sMatch.classList.remove('ready');
    document.querySelectorAll('.product').forEach((p) => p.classList.remove('selected'));
    dialogLayer.classList.remove('show');
    termsEl.classList.remove('checked');
    setScore(100);
    go('s-home', '#ffffff');
  }

  document.querySelectorAll('[data-tap="go-home"]').forEach((btn) => {
    btn.addEventListener('click', resetAll);
  });

  /* ---------- 顶部返回箭头导航路由 ---------- */
  document.querySelectorAll('[data-back]').forEach((el) => {
    el.addEventListener('click', () => {
      const dest = el.dataset.back;
      if (dest === 'home') go('s-home', '#ffffff');
      else if (dest === 'asset') go('s-asset', '#ffffff');
      else if (dest === 'reflect') {
        kyccToken++;
        sReflect.classList.add('warn-on', 'sheet-up');
        sReflect.classList.remove('kb-open');
        go('s-reflect', '#0b0e14');
      } else if (dest === 'kycc') {
        matchToken++;
        dialogLayer.classList.remove('show');
        sKycc.classList.add('ready', 'aha');
        go('s-kycc', '#0b0e14');
      } else if (dest === 'match') {
        go('s-match', '#ffffff');
      } else if (dest === 'success') {
        go('s-success', '#ffffff');
      } else if (dest === 'reset') {
        resetAll();
      }
    });
  });

  /* ---------- 虚拟软键盘打字与删除逻辑 ---------- */
  function insertAtCursor(ch) {
    const ta = reflectText;
    const s = ta.selectionStart ?? ta.value.length;
    const e = ta.selectionEnd ?? s;
    ta.value = ta.value.slice(0, s) + ch + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + ch.length;
  }

  function deleteAtCursor() {
    const ta = reflectText;
    const s = ta.selectionStart ?? ta.value.length;
    const e = ta.selectionEnd ?? s;
    if (s !== e) {
      ta.value = ta.value.slice(0, s) + ta.value.slice(e);
      ta.selectionStart = ta.selectionEnd = s;
    } else if (s > 0) {
      ta.value = ta.value.slice(0, s - 1) + ta.value.slice(s);
      ta.selectionStart = ta.selectionEnd = s - 1;
    }
  }

  document.querySelectorAll('.keyboard .kb-row span').forEach((key) => {
    key.addEventListener('click', () => {
      const t = key.textContent.trim();
      if (key.classList.contains('mic') || t === '⇧' || t === '123' || t === '☺') return;
      if (key.classList.contains('ret')) insertAtCursor('\n');
      else if (t === '⌫') deleteAtCursor();
      else if (key.classList.contains('space')) insertAtCursor(' ');
      else insertAtCursor(t);
      reflectText.focus();
    });
  });

  /* ---------- 预警横幅点击/上滑隐藏逻辑 ---------- */
  const warnCard = $('#warnCard');
  if (warnCard) {
    let startY = 0;

    // 1. 点击直接向上滑出隐藏
    warnCard.addEventListener('click', () => {
      dismissWarnCard();
    });

    // 2. 监听手势/鼠标向上拖动
    warnCard.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    warnCard.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      if (startY - endY > 20) { // 向上滑动超过 20px 触发隐藏
        dismissWarnCard();
      }
    });

    function dismissWarnCard() {
      warnCard.style.transform = 'translateY(-180%)';
      warnCard.style.opacity = '0';
      warnCard.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
    }
  }
})();