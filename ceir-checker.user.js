// ==UserScript==
// @name         MIMI CEIR CHECKER 8.4 (Unlocked / No License)
// @namespace    https://github.com/HtunHtun01/ceir-checker
// @version      8.4.1
// @description  Full UI CEIR checker without license server check. Runs on ceir.gov.mm.
// @author       MIMO (Unlocked)
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__ceirCheckerLoaded) return;
  window.__ceirCheckerLoaded = true;

  // Turnstile Keys
  const TURNSTILE_DEFAULT = '0x4AAAAAADmotCU2bSBwXlRk';
  const TURNSTILE_ACTION = '0x4AAAAAADmoQuDsFEizt-Hn';

  const SITEKEYS = {
    'verify-imei': TURNSTILE_DEFAULT,
    'device-data': TURNSTILE_ACTION,
    'application': TURNSTILE_ACTION,
    'applicant': TURNSTILE_ACTION,
    'register-request': TURNSTILE_ACTION,
    'check-unpaid': TURNSTILE_ACTION,
    'same-device': TURNSTILE_ACTION,
    'payment-hub': TURNSTILE_ACTION,
    'payment-result': TURNSTILE_ACTION,
    'update-applicant': TURNSTILE_ACTION,
    'update-evidence': TURNSTILE_ACTION
  };

  // Profile Decrypt Secret Key
  const PROFILE_DECRYPT_KEY = 'CEIR_PVT_2024_xK9mP2qR7wN4jL8hT5vB3cF6';

  // Inject Tailwind & Custom CSS
  const tailwindScript = document.createElement('script');
  tailwindScript.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
  tailwindScript.async = true;
  document.head.appendChild(tailwindScript);

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :root, .dark-host {
      --primary: #818cf8; --primary-foreground: #0b1020;
      --secondary: #1a2340; --secondary-foreground: #aab6d4;
      --card: #131a2e; --card-foreground: #e7ecf5;
      --border: #243052; --input: #33406b; --ring: #818cf8;
      --muted: #1a2340; --muted-foreground: #8792ad;
      --accent: #1a2340; --accent-foreground: #e7ecf5;
      --ceir-bg: #0b1020; --ceir-surface: #131a2e;
      --ceir-border: #243052; --ceir-text: #e7ecf5; --ceir-muted: #8792ad;
      --ceir-accent: #818cf8; --ceir-accent-hover: #a5b4fc; --ceir-accent-light: rgba(129,140,248,.14);
      --ceir-green: #6ee7b7; --ceir-green-bg: rgba(52,211,153,.15);
      --ceir-red: #fca5a5; --ceir-red-bg: rgba(248,113,113,.14);
      --ceir-amber: #fcd34d; --ceir-amber-bg: rgba(252,211,77,.12);
      --ceir-row-hover: #182038; --ceir-sidebar-bg: #0f1528;
      --radius: 0.625rem;
      --ceir-w: 90vw; --ceir-h: 88vh; --ceir-header-h: 48px; --ceir-sidebar-w: 336px;
      --ceir-gap: 8px; --ceir-gap-sm: 4px; --ceir-badge-pad: 2px 8px; --ceir-badge-font: 11px;
      --ceir-font-2xs: 9px; --ceir-font-xs: 10.5px; --ceir-font-sm: 11.5px; --ceir-font-base: 12.5px;
      --ceir-pad-xs: 4px; --ceir-pad-sm: 6px; --ceir-pad-md: 10px; --ceir-pad-lg: 14px; --ceir-pad-xl: 16px;
      --ceir-table-font: 12.5px; --ceir-table-th: 11px; --ceir-input-pad: 10px 14px; --ceir-btn-pad: 9px 20px;
      --ceir-radius-sm: calc(var(--radius) - 2px); --ceir-radius: var(--radius); --ceir-card-radius: calc(var(--radius) + 4px);
    }
    .ceir-light {
      --primary: #4f46e5; --primary-foreground: #ffffff;
      --card: #ffffff; --card-foreground: #0f172a;
      --border: #e2e8f0; --input: #cbd5e1; --ring: #4f46e5;
      --muted: #eef2f7; --muted-foreground: #64748b;
      --accent: #eef2ff; --accent-foreground: #3730a3;
      --ceir-bg: #f8fafc; --ceir-surface: #ffffff;
      --ceir-border: #e2e8f0; --ceir-text: #0f172a; --ceir-muted: #64748b;
      --ceir-accent: #4f46e5; --ceir-accent-hover: #4338ca; --ceir-accent-light: rgba(79,70,229,.1);
      --ceir-green: #16a34a; --ceir-green-bg: rgba(22,163,74,.1);
      --ceir-red: #dc2626; --ceir-red-bg: rgba(220,38,38,.08);
      --ceir-amber: #b45309; --ceir-amber-bg: rgba(180,83,9,.1);
      --ceir-row-hover: #f1f5f9; --ceir-sidebar-bg: #f1f5f9;
    }
    .hero-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .hero-tbl th { text-align: left; padding: 9px 16px; font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: var(--muted-foreground); background: var(--secondary); border-bottom: 1px solid var(--border); }
    .hero-tbl td { padding: 9px 16px; border-top: 1px solid var(--border); vertical-align: top; word-break: break-word; }
    .hero-tbl tbody tr:hover { background: rgba(127,127,127,.07); }
    #ceir-tool-container {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(.96);
      width: var(--ceir-w); height: var(--ceir-h);
      background: var(--card); color: var(--card-foreground);
      border: 1px solid var(--border); border-radius: calc(var(--radius) + 8px);
      z-index: 99999; display: none; flex-direction: column; overflow: hidden;
      box-shadow: 0 24px 48px -12px rgba(0,0,0,0.35); transition: opacity .2s, transform .2s; opacity: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    }
    .ceir-input { width: 100%; background: transparent; border: 1px solid var(--input); border-radius: var(--radius); padding: var(--ceir-input-pad); font-size: var(--ceir-font-base); color: var(--foreground); outline: none; }
    .ceir-input:focus { border-color: var(--ring); }
    .ceir-btn-primary { width: 100%; background: var(--primary); color: var(--primary-foreground); border: none; border-radius: var(--radius); padding: var(--ceir-btn-pad); min-height: 40px; font-size: var(--ceir-font-base); font-weight: 600; cursor: pointer; }
    .ceir-btn-primary:disabled { background: var(--muted); color: var(--muted-foreground); cursor: not-allowed; }
    .ceir-tab { flex: 1; padding: 7px 12px; text-align: center; font-size: var(--ceir-font-xs); font-weight: 500; border-radius: calc(var(--radius) - 2px); cursor: pointer; border: none; background: transparent; color: var(--muted-foreground); }
    .ceir-tab:hover { background: var(--accent); color: var(--accent-foreground); }
    .ceir-tgl { position: relative; display: inline-block; width: 40px; height: 24px; cursor: pointer; }
    .ceir-tgl input { opacity: 0; width: 0; height: 0; }
    .ceir-tgl span { position: absolute; inset: 0; background: var(--input); border-radius: 9999px; transition: background .2s; }
    .ceir-tgl span::after { content: ""; position: absolute; width: 16px; height: 16px; left: 4px; top: 4px; background: #fff; border-radius: 50%; transition: transform .2s; }
    .ceir-tgl input:checked + span { background: var(--primary); }
    .ceir-tgl input:checked + span::after { transform: translateX(16px); }
    .ceir-table { width: 100%; border-collapse: collapse; font-size: var(--ceir-table-font); }
    .ceir-table th { padding: 12px 14px; text-align: left; font-weight: 500; color: var(--muted-foreground); background: var(--muted); border-bottom: 1px solid var(--border); }
    .ceir-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); }
    .ceir-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--ceir-card-radius); padding: var(--ceir-pad-lg); }
    .ceir-b { display: inline-flex; align-items: center; padding: var(--ceir-badge-pad); border-radius: var(--radius); font-size: var(--ceir-badge-font); font-weight: 500; }
  `;
  document.head.appendChild(styleEl);

  // Floating Trigger Button
  const triggerBtn = document.createElement('button');
  triggerBtn.id = 'ceir-floating-trigger';
  triggerBtn.style.cssText = 'position:fixed;bottom:16px;right:16px;background:var(--primary,#818cf8);color:var(--primary-foreground,#0b1020);border:none;padding:10px 18px;border-radius:12px;font-weight:600;font-size:12.5px;cursor:pointer;z-index:99997;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);';
  triggerBtn.innerHTML = '<span style="width:7px;height:7px;background:#10b981;border-radius:50%;display:inline-block"></span>OPEN CEIR CHECKER';
  document.body.appendChild(triggerBtn);

  // Overlay Backdrop
  const overlay = document.createElement('div');
  overlay.id = 'ceir-tool-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.32);backdrop-filter:blur(6px);z-index:99998;transition:opacity .25s;opacity:0;pointer-events:none;';
  document.body.appendChild(overlay);

  // Main UI Modal
  const modal = document.createElement('div');
  modal.id = 'ceir-tool-container';
  modal.innerHTML = `
    <!-- HEADER -->
    <div style="height:var(--ceir-header-h);display:flex;align-items:center;justify-content:space-between;padding:0 var(--ceir-pad-xl);border-bottom:1px solid var(--ceir-border);background:var(--ceir-surface);">
      <div style="display:flex;align-items:center;gap:var(--ceir-gap)">
        <div style="width:24px;height:24px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:900;">CI</div>
        <span style="font-size:var(--ceir-font-base);font-weight:700;">CEIR Checker</span>
        <span style="font-size:var(--ceir-font-2xs);color:var(--ceir-muted);">v8.4 Unlocked</span>
        <span id="ceir-result-count" style="font-size:var(--ceir-font-2xs);color:var(--ceir-accent);font-weight:700;display:none;"></span>
      </div>
      <div style="display:flex;align-items:center;gap:var(--ceir-gap)">
        <button id="btn-export-csv" style="font-size:var(--ceir-font-2xs);background:var(--ceir-surface);border:1px solid var(--ceir-border);color:var(--ceir-muted);padding:var(--ceir-pad-xs) var(--ceir-pad-md);border-radius:20px;cursor:pointer;display:none;">Export CSV</button>
        <button id="ceir-close-btn" style="background:none;border:none;color:var(--ceir-muted);cursor:pointer;font-size:20px;">&times;</button>
      </div>
    </div>
    <!-- BODY -->
    <div style="display:flex;flex:1;overflow:hidden">
      <!-- SIDEBAR -->
      <div style="width:var(--ceir-sidebar-w);border-right:1px solid var(--ceir-border);display:flex;flex-direction:column;padding:var(--ceir-pad-md);gap:var(--ceir-gap);overflow-y:auto;background:var(--ceir-sidebar-bg);">
        <div id="ceir-turnstile-status" style="padding:var(--ceir-pad-sm);border-radius:var(--ceir-radius);border:1px solid var(--ceir-amber);background:var(--ceir-amber-bg);font-size:var(--ceir-font-sm);text-align:center;">
          <span style="color:var(--ceir-amber);font-weight:600">● No token</span> <span style="color:var(--ceir-muted);font-size:10px">— click verify</span>
        </div>
        <div id="ceir-turnstile-slot" style="width:100%;min-height:65px;border:1px dashed var(--ceir-border);border-radius:var(--ceir-radius);display:flex;align-items:center;justify-content:center;font-size:var(--ceir-font-xs);color:var(--ceir-muted);">
          Loading Turnstile…
        </div>
        <button id="ceir-turnstile-reset" style="padding:var(--ceir-pad-xs) var(--ceir-pad-sm);font-size:var(--ceir-font-xs);border:1px solid var(--ceir-border);background:var(--ceir-bg);border-radius:var(--ceir-radius-sm);cursor:pointer;display:none;">↻ Reset verification</button>
        
        <!-- TABS -->
        <div style="display:flex;background:var(--ceir-bg);padding:3px;border-radius:var(--ceir-radius);gap:2px;">
          <button id="btn-single-tab" class="ceir-tab" style="background:var(--ceir-surface);color:var(--ceir-accent);">Single</button>
          <button id="btn-batch-tab" class="ceir-tab">Batch</button>
          <button id="btn-appid-tab" class="ceir-tab">App ID</button>
          <button id="btn-paytax-tab" class="ceir-tab">Pay Tax</button>
        </div>

        <!-- INPUT WRAPPERS -->
        <div id="single-input-wrapper" style="display:flex;flex-direction:column;gap:var(--ceir-gap-sm)">
          <label style="font-size:var(--ceir-font-2xs);font-weight:600;color:var(--ceir-muted);">IMEI NUMBER</label>
          <input type="text" id="imei-single-input" class="ceir-input" placeholder="15-digit IMEI" maxlength="15">
        </div>

        <div id="batch-input-wrapper" style="display:none;flex-direction:column;gap:var(--ceir-gap-sm)">
          <label style="font-size:var(--ceir-font-2xs);font-weight:600;color:var(--ceir-muted);">BATCH IMEIS</label>
          <textarea id="imei-batch-input" rows="8" class="ceir-input" style="resize:none" placeholder="One IMEI per line..."></textarea>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:var(--ceir-font-xs);color:var(--ceir-muted);font-weight:600;">One-by-One</span>
            <label class="ceir-tgl"><input type="checkbox" id="switch-one-by-one"><span></span></label>
          </div>
        </div>

        <div id="appid-input-wrapper" style="display:none;flex-direction:column;gap:var(--ceir-gap-sm)">
          <label style="font-size:var(--ceir-font-2xs);font-weight:600;color:var(--ceir-muted);">DECLARATION ID</label>
          <input type="text" id="appid-input" class="ceir-input" placeholder="e.g. MM-CR-AABBCCDD">
        </div>

        <div id="paytax-input-wrapper" style="display:none;flex-direction:column;gap:var(--ceir-gap-sm)">
          <label style="font-size:var(--ceir-font-2xs);font-weight:600;color:var(--ceir-muted);">IMEI NUMBERS (UP TO 2)</label>
          <input type="text" id="paytax-imei1" class="ceir-input" placeholder="IMEI 1 (required)" maxlength="15">
          <input type="text" id="paytax-imei2" class="ceir-input" placeholder="IMEI 2 (optional)" maxlength="15">
          <input type="file" id="paytax-file-input" accept=".ceir" style="display:none">
          <button id="paytax-load-btn" style="padding:var(--ceir-pad-sm);background:var(--ceir-bg);border:2px dashed var(--ceir-border);border-radius:var(--ceir-radius);font-size:var(--ceir-font-xs);cursor:pointer;">Load Profile (.ceir)</button>
          <div id="paytax-applicant-preview" style="display:none;background:var(--ceir-accent-light);border:1px solid var(--ceir-border);padding:6px;border-radius:6px;">
            <span id="paytax-applicant-name" style="font-weight:700;color:var(--ceir-accent)">-</span>
            <button id="paytax-clear-btn" style="float:right;background:none;border:none;color:var(--ceir-red);cursor:pointer;">Clear</button>
          </div>
        </div>

        <div id="tool-status" style="font-size:var(--ceir-font-xs);font-weight:600;color:var(--ceir-accent);background:var(--ceir-accent-light);border:1px solid var(--ceir-border);border-radius:var(--ceir-radius);padding:var(--ceir-pad-sm) var(--ceir-pad-md);min-height:24px;display:flex;align-items:center;">
          Standing By
        </div>

        <button id="btn-check-start" class="ceir-btn-primary">RUN CHECK</button>
        <button id="btn-check-stop" class="ceir-btn-primary" style="display:none;background:var(--ceir-red);">STOP</button>

        <!-- FOOTER TOGGLES -->
        <div style="margin-top:auto;padding-top:var(--ceir-pad-md);border-top:1px solid var(--ceir-border);display:flex;flex-direction:column;gap:var(--ceir-gap-sm)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:var(--ceir-font-2xs);font-weight:600;color:var(--ceir-muted)">Dark Mode</span>
            <label class="ceir-tgl"><input type="checkbox" id="switch-theme-mode"><span></span></label>
          </div>
        </div>
      </div>

      <!-- RESULTS -->
      <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:var(--ceir-pad-sm) var(--ceir-pad-xl);border-bottom:1px solid var(--ceir-border);background:var(--ceir-surface);font-size:var(--ceir-font-2xs);font-weight:600;color:var(--ceir-muted);">OUTPUT</div>
        <div id="tool-results" style="flex:1;overflow-y:auto;padding:var(--ceir-pad-lg);display:flex;flex-direction:column;gap:var(--ceir-gap);background:var(--ceir-bg);">
          <div style="color:var(--ceir-muted);font-size:var(--ceir-font-base);text-align:center;padding-top:120px;font-style:italic">No results yet. Enter an IMEI or App ID and click Run Check.</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // References
  const singleTab = modal.querySelector('#btn-single-tab');
  const batchTab = modal.querySelector('#btn-batch-tab');
  const appidTab = modal.querySelector('#btn-appid-tab');
  const paytaxTab = modal.querySelector('#btn-paytax-tab');
  const singleWrap = modal.querySelector('#single-input-wrapper');
  const batchWrap = modal.querySelector('#batch-input-wrapper');
  const appidWrap = modal.querySelector('#appid-input-wrapper');
  const paytaxWrap = modal.querySelector('#paytax-input-wrapper');

  const imeiSingle = modal.querySelector('#imei-single-input');
  const imeiBatch = modal.querySelector('#imei-batch-input');
  const appidInput = modal.querySelector('#appid-input');
  const paytaxImei1 = modal.querySelector('#paytax-imei1');
  const paytaxImei2 = modal.querySelector('#paytax-imei2');

  const btnRun = modal.querySelector('#btn-check-start');
  const btnStop = modal.querySelector('#btn-check-stop');
  const statusEl = modal.querySelector('#tool-status');
  const resultsEl = modal.querySelector('#tool-results');
  const turnstileSlot = modal.querySelector('#ceir-turnstile-slot');
  const turnstileStatus = modal.querySelector('#ceir-turnstile-status');
  const turnstileResetBtn = modal.querySelector('#ceir-turnstile-reset');
  const themeSwitch = modal.querySelector('#switch-theme-mode');

  let activeTab = 'single';
  let isChecking = false;
  let turnstileToken = null;
  let turnstileWidgetId = null;

  // Tab Switch Handler
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

  // Toggle Visibility
  function toggleUI(show) {
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

  triggerBtn.onclick = () => toggleUI(true);
  modal.querySelector('#ceir-close-btn').onclick = () => toggleUI(false);
  overlay.onclick = () => toggleUI(false);

  // Turnstile Widget Loader
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

  // API Call - Verify Single / Batch
  async function runVerify(imeiList) {
    const res = await fetch(`https://ceir.gov.mm/openapi/API/IMEI/Verify?altchaData=${encodeURIComponent(turnstileToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(imeiList)
    });
    return await res.json();
  }

  // API Call - Device Info
  async function runDeviceInfo(imei) {
    const res = await fetch(`https://ceir.gov.mm/openapi/API/Device/personal-device-info?altchaData=${encodeURIComponent(turnstileToken)}&imei=${encodeURIComponent(imei)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    return await res.json();
  }

  // API Call - Registration Status
  async function runRegStatus(declId) {
    const res = await fetch(`https://ceir.gov.mm/openapi/API/IMEI/RegistrationStatus?DeclarationID=${encodeURIComponent(declId)}&altchaData=${encodeURIComponent(turnstileToken)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    return await res.json();
  }

  // Check Action Trigger
  btnRun.onclick = async () => {
    if (!turnstileToken) {
      alert('ကျေးဇူးပြု၍ Turnstile Captcha Checkbox ကို အရင်နှိပ်ပါ');
      return;
    }

    btnRun.disabled = true;
    statusEl.textContent = 'Running check...';
    resultsEl.innerHTML = '<div style="text-align:center;padding-top:100px;color:var(--ceir-muted)">Checking CEIR database...</div>';

    try {
      if (activeTab === 'single') {
        const imei = imeiSingle.value.trim();
        if (!imei || imei.length !== 15) throw new Error('IMEI ၁၅ လုံးတိတိ ရိုက်ထည့်ပေးပါ');

        const [verifyRes, devRes] = await Promise.all([
          runVerify([imei]),
          runDeviceInfo(imei).catch(() => null)
        ]);

        const item = verifyRes?.IMEI_CHECK_LIST?.[0] || {};
        resultsEl.innerHTML = `
          <div class="ceir-card">
            <h3 style="font-weight:700;font-size:16px;color:var(--ceir-accent);margin-bottom:8px">IMEI: ${imei}</h3>
            <p><b>Block State:</b> ${item.blockState || 'N/A'}</p>
            <p><b>Payment State:</b> ${item.paymentState || 'N/A'}</p>
            <p><b>Can Pay:</b> ${item.canPay ? 'Yes' : 'No'}</p>
            <p><b>Grace Period:</b> ${item.endOfGracePeriod || 'N/A'}</p>
            ${devRes?.gsmaBrandName ? `<hr style="margin:10px 0;border-color:var(--ceir-border)"><p><b>Brand:</b> ${devRes.gsmaBrandName} \vert{} <b>Model:</b>${devRes.gsmaModelName || 'N/A'}</p>` : ''}
          </div>
        `;
      } else if (activeTab === 'appid') {
        const declId = appidInput.value.trim();
        if (!declId) throw new Error('Declaration ID ရိုက်ထည့်ပေးပါ');

        const statusRes = await runRegStatus(declId);
        resultsEl.innerHTML = `
          <div class="ceir-card">
            <pre style="font-family:monospace;font-size:11px;white-space:pre-wrap;word-break:break-all">${JSON.stringify(statusRes, null, 2)}</pre>
          </div>
        `;
      } else if (activeTab === 'batch') {
        const lines = imeiBatch.value.split('\n').map(l => l.trim()).filter(l => l.length === 15);
        if (!lines.length) throw new Error('မှန်ကန်သော ၁၅ လုံးပါ IMEI တစ်ခုမှ မတွေ့ပါ');

        const batchRes = await runVerify(lines);
        const list = batchRes?.IMEI_CHECK_LIST || [];
        let rows = list.map(it => `
          <tr>
            <td style="font-family:monospace;font-weight:700">${it.IMEI}</td>
            <td>${it.blockState}</td>
            <td>${it.paymentState}</td>
            <td>${it.canPay ? 'Yes' : 'No'}</td>
          </tr>
        `).join('');

        resultsEl.innerHTML = `
          <table class="ceir-table">
            <thead>
              <tr><th>IMEI</th><th>Block State</th><th>Payment State</th><th>Can Pay</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }
      statusEl.textContent = 'Done';
    } catch (err) {
      statusEl.textContent = 'Error';
      resultsEl.innerHTML = `<div class="ceir-card" style="border-color:var(--ceir-red);color:var(--ceir-red)">${err.message}</div>`;
    } finally {
      btnRun.disabled = false;
    }
  };

  // Dark/Light Mode Switch
  themeSwitch.onchange = () => {
    if (themeSwitch.checked) {
      modal.classList.add('ceir-light');
    } else {
      modal.classList.remove('ceir-light');
    }
  };

  console.log('[CEIR Checker] Injected successfully without license lock.');
})();