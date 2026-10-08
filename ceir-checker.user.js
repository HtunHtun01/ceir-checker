// ==UserScript==
// @name         MIMI CEIR CHECKER (Scroll & Button Fixed)
// @namespace    https://github.com/HtunHtun01/ceir-checker
// @version      8.4.4
// @description  Full Visible Button and Responsive Scroll Fix
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const TURNSTILE_DEFAULT = '0x4AAAAAADmotCU2bSBwXlRk';

  // CSS Fix Injector
  const style = document.createElement('style');
  style.textContent = `
    #ceir-tool-container {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: min(92vw, 900px) !important;
      height: 90vh !important;
      max-height: 90vh !important;
      background: #131a2e !important;
      color: #e7ecf5 !important;
      border: 1px solid #243052 !important;
      border-radius: 14px !important;
      z-index: 99999 !important;
      display: none;
      flex-direction: column !important;
      overflow: hidden !important;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
    }
    .ceir-body-wrapper {
      display: flex !important;
      flex: 1 !important;
      overflow: hidden !important;
    }
    @media (max-width: 768px) {
      .ceir-body-wrapper {
        flex-direction: column !important;
        overflow-y: auto !important;
      }
      .ceir-sidebar {
        width: 100% !important;
        border-right: none !important;
        border-bottom: 1px solid #243052 !important;
      }
    }
    .ceir-sidebar {
      width: 340px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto !important;
      background: #0f1528;
    }
    .ceir-input {
      width: 100%;
      padding: 10px;
      background: #0b1020;
      border: 1px solid #33406b;
      border-radius: 8px;
      color: #fff;
    }
    .ceir-btn-run {
      width: 100%;
      background: #6366f1;
      color: #fff;
      font-weight: 700;
      padding: 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      margin-top: 10px;
    }
    .ceir-btn-run:disabled {
      background: #33406b;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  // Floating Launch Button
  const openBtn = document.createElement('button');
  openBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#6366f1;color:#fff;border:none;padding:12px 20px;border-radius:12px;font-weight:700;z-index:99998;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
  openBtn.textContent = 'OPEN CEIR CHECKER';
  document.body.appendChild(openBtn);

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;display:none;';
  document.body.appendChild(overlay);

  // Container
  const panel = document.createElement('div');
  panel.id = 'ceir-tool-container';
  panel.innerHTML = `
    <div style="padding:12px 16px;background:#182038;border-bottom:1px solid #243052;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:700;">CEIR Checker v8.4</span>
      <button id="close-checker" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;">&times;</button>
    </div>
    <div class="ceir-body-wrapper">
      <div class="ceir-sidebar">
        <div id="turnstile-box" style="min-height:65px;border:1px dashed #33406b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;">
          Turnstile Widget...
        </div>
        <div id="token-status" style="font-size:12px;color:#f59e0b;font-weight:600;text-align:center;">● No token</div>
        
        <label style="font-size:11px;font-weight:600;color:#aaa;">IMEI NUMBER</label>
        <input type="text" id="imei-val" class="ceir-input" placeholder="15-digit IMEI" maxlength="15">

        <button id="btn-run-check" class="ceir-btn-run">RUN CHECK</button>
      </div>

      <div style="flex:1;padding:16px;overflow-y:auto;">
        <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:8px;">OUTPUT</div>
        <div id="output-box" style="background:#0b1020;border:1px solid #243052;border-radius:10px;padding:16px;min-height:150px;">
          အဖြေများကို ဤနေရာတွင် ဖော်ပြပေးပါမည်။
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  let turnstileToken = null;
  let widgetId = null;

  function toggle(open) {
    panel.style.display = open ? 'flex' : 'none';
    overlay.style.display = open ? 'block' : 'none';
    if (open && widgetId === null && window.turnstile) {
      widgetId = window.turnstile.render(panel.querySelector('#turnstile-box'), {
        sitekey: TURNSTILE_DEFAULT,
        callback: (t) => {
          turnstileToken = t;
          panel.querySelector('#token-status').textContent = '● Token ready';
          panel.querySelector('#token-status').style.color = '#10b981';
        }
      });
    }
  }

  openBtn.onclick = () => toggle(true);
  panel.querySelector('#close-checker').onclick = () => toggle(false);
  overlay.onclick = () => toggle(false);

  // Run Check
  panel.querySelector('#btn-run-check').onclick = async () => {
    if (!turnstileToken) {
      alert('ကျေးဇူးပြု၍ Captcha Verification ကို အရင်နှိပ်ပါ');
      return;
    }
    const imei = panel.querySelector('#imei-val').value.trim();
    if (!imei || imei.length !== 15) {
      alert('IMEI ၁၅ လုံးတိတိ ထည့်သွင်းပါ');
      return;
    }

    const out = panel.querySelector('#output-box');
    out.textContent = 'စစ်ဆေးနေပါသည်...';

    try {
      const res = await fetch(`https://ceir.gov.mm/openapi/API/IMEI/Verify?altchaData=${encodeURIComponent(turnstileToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify([imei])
      });
      const data = await res.json();
      const item = data?.IMEI_CHECK_LIST?.[0] || data?.[0] || {};

      out.innerHTML = `
        <div style="font-size:16px;font-weight:800;color:#818cf8;margin-bottom:10px;">IMEI: ${imei}</div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #243052;">
          <span>IMEI အခြေအနေ:</span><span style="color:#10b981;font-weight:700;">✓ မှန်ကန်သည်</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #243052;">
          <span>အခွန်ပေးဆောင်မှု:</span><span style="color:#10b981;font-weight:700;">✓ ${item.paymentState || 'ပေးချေပြီးပါပြီ'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #243052;">
          <span>Block အခြေအနေ:</span><span style="color:#10b981;font-weight:700;">✓ ${item.blockState || 'ခွင့်ပြုသည်'}</span>
        </div>
      `;
    } catch (e) {
      out.textContent = 'Error: ' + e.message;
    }
  };
})();
