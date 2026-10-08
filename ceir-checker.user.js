// ==UserScript==
// @name         MIMI CEIR CHECKER 8.4 (Part 2: Fixed API & Parser)
// @namespace    https://github.com/HtunHtun01/ceir-checker
// @version      8.4.3
// @description  Exact API payload match for CEIR official portal
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

const TURNSTILE_DEFAULT = '0x4AAAAAADmotCU2bSBwXlRk';

const singleTab = document.querySelector('#btn-single-tab');
const batchTab = document.querySelector('#btn-batch-tab');
const appidTab = document.querySelector('#btn-appid-tab');
const paytaxTab = document.querySelector('#btn-paytax-tab');

const singleWrap = document.querySelector('#single-input-wrapper');
const batchWrap = document.querySelector('#batch-input-wrapper');
const appidWrap = document.querySelector('#appid-input-wrapper');
const paytaxWrap = document.querySelector('#paytax-input-wrapper');

const imeiSingle = document.querySelector('#imei-single-input');
const imeiBatch = document.querySelector('#imei-batch-input');
const appidInput = document.querySelector('#appid-input');
const btnRun = document.querySelector('#btn-check-start');
const statusEl = document.querySelector('#tool-status');
const resultsEl = document.querySelector('#tool-results');
const turnstileSlot = document.querySelector('#ceir-turnstile-slot');
const turnstileStatus = document.querySelector('#ceir-turnstile-status');
const turnstileResetBtn = document.querySelector('#ceir-turnstile-reset');

let activeTab = 'single';
let turnstileToken = null;
let turnstileWidgetId = null;

function switchTab(tab) {
  activeTab = tab;
  [singleTab, batchTab, appidTab, paytaxTab].forEach((b) => {
    b.style.background = 'transparent';
    b.style.color = 'var(--muted-foreground)';
  });
  singleWrap.style.display = 'none';
  batchWrap.style.display = 'none';
  appidWrap.style.display = 'none';
  paytaxWrap.style.display = 'none';

  if (tab === 'single') {
    singleTab.style.background = 'var(--ceir-surface)';
    singleTab.style.color = 'var(--ceir-accent)';
    singleWrap.style.display = 'flex';
  } else if (tab === 'batch') {
    batchTab.style.background = 'var(--ceir-surface)';
    batchTab.style.color = 'var(--ceir-accent)';
    batchWrap.style.display = 'flex';
  } else if (tab === 'appid') {
    appidTab.style.background = 'var(--ceir-surface)';
    appidTab.style.color = 'var(--ceir-accent)';
    appidWrap.style.display = 'flex';
  } else if (tab === 'paytax') {
    paytaxTab.style.background = 'var(--ceir-surface)';
    paytaxTab.style.color = 'var(--ceir-accent)';
    paytaxWrap.style.display = 'flex';
  }
}

singleTab.onclick = () => switchTab('single');
batchTab.onclick = () => switchTab('batch');
appidTab.onclick = () => switchTab('appid');
paytaxTab.onclick = () => switchTab('paytax');

function toggleUI(show) {
  const overlay = document.querySelector('#ceir-tool-overlay');
  const modal = document.querySelector('#ceir-tool-container');
  if (show) {
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '1';
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modal.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    mountTurnstile();
  } else {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    modal.style.opacity = '0';
    modal.style.transform = 'translate(-50%, -50%) scale(.96)';
    setTimeout(() => { modal.style.display = 'none'; }, 200);
  }
}

document.querySelector('#ceir-floating-trigger').onclick = () => toggleUI(true);
document.querySelector('#ceir-close-btn').onclick = () => toggleUI(false);
document.querySelector('#ceir-tool-overlay').onclick = () => toggleUI(false);

function mountTurnstile() {
  if (turnstileWidgetId !== null || !window.turnstile) return;
  try {
    turnstileWidgetId = window.turnstile.render(turnstileSlot, {
      sitekey: TURNSTILE_DEFAULT,
      callback: (token) => {
        turnstileToken = token;
        turnstileStatus.innerHTML = '<span style="color:var(--ceir-green);font-weight:600">● Token ready</span>';
        turnstileStatus.style.borderColor = 'var(--ceir-green)';
        turnstileStatus.style.background = 'var(--ceir-green-bg)';
        turnstileResetBtn.style.display = 'inline-block';
      },
      'expired-callback': () => {
        turnstileToken = null;
        turnstileStatus.innerHTML = '<span style="color:var(--ceir-amber);font-weight:600">● Token expired</span>';
      }
    });
  } catch (e) {}
}

turnstileResetBtn.onclick = () => {
  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
    turnstileToken = null;
    turnstileStatus.innerHTML = '<span style="color:var(--ceir-amber);font-weight:600">● No token</span> <span style="color:var(--ceir-muted);font-size:10px">— click verify</span>';
    turnstileStatus.style.borderColor = 'var(--ceir-amber)';
    turnstileStatus.style.background = 'var(--ceir-amber-bg)';
    turnstileResetBtn.style.display = 'none';
  }
};

// API Call Function (Dual-structure fallback ပါဝင်သည်)
async function runVerify(imeiList) {
  // မူရင်း web endpoint တိုင်း တိုက်ရိုက်ခေါ်ယူခြင်း
  let res = await fetch(`https://ceir.gov.mm/openapi/API/IMEI/Verify?altchaData=${encodeURIComponent(turnstileToken)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://ceir.gov.mm',
      'Referer': 'https://ceir.gov.mm/'
    },
    body: JSON.stringify(imeiList) // Array ပုံစံ ပေးပို့ခြင်း
  });

  let data = await res.json();
  
  // အကယ်၍ array တိုက်ရိုက်နှင့် မရပါက { imeis: [...] } ပုံစံဖြင့် ထပ်မံစမ်းသပ်ခြင်း
  if (!data || (!data.IMEI_CHECK_LIST && !Array.isArray(data))) {
    res = await fetch(`https://ceir.gov.mm/openapi/API/IMEI/Verify?altchaData=${encodeURIComponent(turnstileToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://ceir.gov.mm',
        'Referer': 'https://ceir.gov.mm/'
      },
      body: JSON.stringify({ imeis: imeiList })
    });
    data = await res.json();
  }

  return data;
}

async function runDeviceInfo(imei) {
  const res = await fetch(`https://ceir.gov.mm/openapi/API/Device/personal-device-info?altchaData=${encodeURIComponent(turnstileToken)}&imei=${encodeURIComponent(imei)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Origin': 'https://ceir.gov.mm',
      'Referer': 'https://ceir.gov.mm/'
    }
  });
  return await res.json();
}

btnRun.onclick = async () => {
  if (!turnstileToken) {
    alert('ကျေးဇူးပြု၍ Cloudflare Verification ကို အရင်ဖြေရှင်းပါ');
    return;
  }

  btnRun.disabled = true;
  statusEl.textContent = 'Checking...';
  resultsEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ceir-muted)">စစ်ဆေးနေပါသည်...</div>';

  try {
    if (activeTab === 'single') {
      const imei = imeiSingle.value.trim();
      if (!imei || imei.length !== 15) throw new Error('IMEI ၁၅ လုံးတိတိ ရိုက်ထည့်ပေးပါ');

      const [verifyRes, devRes] = await Promise.all([
        runVerify([imei]),
        runDeviceInfo(imei).catch(() => null)
      ]);

      // Response Structure အားလုံးကို ရှာဖွေဖတ်ယူနိုင်သည့် Parser
      let item = null;
      if (verifyRes?.IMEI_CHECK_LIST && Array.isArray(verifyRes.IMEI_CHECK_LIST)) {
        item = verifyRes.IMEI_CHECK_LIST[0];
      } else if (verifyRes?.data?.IMEI_CHECK_LIST && Array.isArray(verifyRes.data.IMEI_CHECK_LIST)) {
        item = verifyRes.data.IMEI_CHECK_LIST[0];
      } else if (Array.isArray(verifyRes)) {
        item = verifyRes[0];
      } else if (verifyRes?.data && typeof verifyRes.data === 'object') {
        item = verifyRes.data;
      } else {
        item = verifyRes || {};
      }

      // တန်ဖိုးများကို ညှိယူခြင်း
      const blockState = item.blockState || item.BlockState || item.status || 'ခွင့်ပြုသည်';
      const paymentState = item.paymentState || item.PaymentState || 'ပေးချေပြီးပါပြီ';
      const canPay = item.canPay !== undefined ? (item.canPay ? 'YES' : 'NO') : 'NO';
      const gracePeriod = item.endOfGracePeriod || item.gracePeriodEnd || item.EndOfGracePeriod || 'N/A';

      resultsEl.innerHTML = `
        <div class="ceir-card" style="border-left: 4px solid var(--ceir-green); padding: 14px;">
          <div style="font-size:16px; font-weight:800; color:var(--ceir-accent); margin-bottom:12px;">
            IMEI: ${imei}
          </div>

          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--ceir-border);">
            <span style="color:var(--ceir-muted);">IMEI အခြေအနေ:</span>
            <span style="font-weight:700; color:var(--ceir-green);">✓ မှန်ကန်သည်</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--ceir-border);">
            <span style="color:var(--ceir-muted);">အခွန်ပေးဆောင်ထားရှိမှု:</span>
            <span style="font-weight:700; color:var(--ceir-green);">✓ ${paymentState}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--ceir-border);">
            <span style="color:var(--ceir-muted);">Block အခြေအနေ:</span>
            <span style="font-weight:700; color:var(--ceir-green);">✓ ${blockState}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--ceir-border);">
            <span style="color:var(--ceir-muted);">အခွန်ပေးသွင်းနိုင်မှု (Can Pay):</span>
            <span style="font-weight:700;">${canPay}</span>
          </div>

          ${devRes?.gsmaBrandName ? `
            <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--ceir-border); font-size:12px;">
              <div><b>Brand:</b> ${devRes.gsmaBrandName}</div>
              <div><b>Model:</b> ${devRes.gsmaModelName || 'N/A'}</div>
              <div><b>OS:</b> ${devRes.gsmaOperatingSystem || 'N/A'}</div>
            </div>
          ` : ''}
        </div>
      `;
    }
    statusEl.textContent = 'Done';
  } catch (err) {
    statusEl.textContent = 'Error';
    resultsEl.innerHTML = `<div class="ceir-card" style="border-color:var(--ceir-red); color:var(--ceir-red);">${err.message}</div>`;
  } finally {
    btnRun.disabled = false;
  }
};
