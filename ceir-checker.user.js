// ==UserScript==
// @name         MIMI CEIR CHECKER (Real API Fixed)
// @namespace    https://github.com/HtunHtun01/ceir-checker
// @version      8.4.5
// @description  Direct Real API Data fetcher
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const TURNSTILE_DEFAULT = '0x4AAAAAADmotCU2bSBwXlRk';

  // Floating Button
  const openBtn = document.createElement('button');
  openBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#4f46e5;color:#fff;border:none;padding:12px 18px;border-radius:12px;font-weight:700;z-index:99998;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
  openBtn.textContent = 'OPEN CEIR CHECKER';
  document.body.appendChild(openBtn);

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:none;';
  document.body.appendChild(overlay);

  // Main UI
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(90vw,550px);max-height:85vh;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:12px;z-index:99999;display:none;flex-direction:column;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,0.5);overflow-y:auto;';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #334155;padding-bottom:8px;">
      <span style="font-weight:700;color:#818cf8;">CEIR Real API Checker</span>
      <button id="close-btn" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">&times;</button>
    </div>

    <!-- Turnstile Box -->
    <div id="t-box" style="min-height:65px;border:1px dashed #475569;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;"></div>
    <div id="t-status" style="font-size:12px;color:#f59e0b;font-weight:600;margin-bottom:10px;text-align:center;">● Please verify Cloudflare above</div>

    <!-- Input Box -->
    <label style="font-size:12px;color:#94a3b8;font-weight:600;">IMEI (15 Digits)</label>
    <input type="text" id="imei-input" maxlength="15" placeholder="863531082118738" style="width:100%;padding:10px;margin-top:4px;margin-bottom:12px;background:#1e293b;border:1px solid #475569;border-radius:6px;color:#fff;font-family:monospace;box-sizing:border-box;">

    <button id="check-btn" style="width:100%;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;">RUN CHECK</button>

    <!-- Output Box -->
    <div style="margin-top:14px;">
      <div style="font-size:12px;color:#94a3b8;font-weight:600;margin-bottom:4px;">REAL SERVER RESPONSE:</div>
      <div id="out-box" style="background:#020617;border:1px solid #334155;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;max-height:250px;overflow-y:auto;color:#38bdf8;">
        အဖြေမရှိသေးပါ။ IMEI ရိုက်ထည့်ပြီး Run Check နှိပ်ပါ။
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  let currentToken = null;
  let widget = null;

  function toggle(open) {
    panel.style.display = open ? 'flex' : 'none';
    overlay.style.display = open ? 'block' : 'none';
    if (open && widget === null && window.turnstile) {
      widget = window.turnstile.render(panel.querySelector('#t-box'), {
        sitekey: TURNSTILE_DEFAULT,
        callback: (t) => {
          currentToken = t;
          panel.querySelector('#t-status').textContent = '● Token Ready (Good for 1 request)';
          panel.querySelector('#t-status').style.color = '#10b981';
        },
        'expired-callback': () => {
          currentToken = null;
          panel.querySelector('#t-status').textContent = '● Token Expired - Click verify again';
          panel.querySelector('#t-status').style.color = '#f59e0b';
        }
      });
    }
  }

  openBtn.onclick = () => toggle(true);
  panel.querySelector('#close-btn').onclick = () => toggle(false);
  overlay.onclick = () => toggle(false);

  // Check Action
  panel.querySelector('#check-btn').onclick = async () => {
    if (!currentToken) {
      alert('ကျေးဇူးပြု၍ Cloudflare Verification ကို အရင်အောင်မြင်အောင် နှိပ်ပါ');
      return;
    }

    const imei = panel.querySelector('#imei-input').value.trim();
    if (imei.length !== 15) {
      alert('IMEI ၁၅ လုံးတိတိ ထည့်ပါ');
      return;
    }

    const out = panel.querySelector('#out-box');
    out.textContent = 'CEIR Server သို့ အချက်အလက် မေးမြန်းနေပါသည်...';
    out.style.color = '#f59e0b';

    try {
      // CEIR တရားဝင် API သို့ တိုက်ရိုက်ခေါ်ဆိုခြင်း
      const res = await fetch(`https://ceir.gov.mm/openapi/API/IMEI/Verify?altchaData=${encodeURIComponent(currentToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify([imei])
      });

      const responseText = await res.text();
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
      } catch (e) {
        jsonData = responseText;
      }

      // တကယ့် Real Server Data အစစ်ကို Print ထုတ်ပြခြင်း
      out.style.color = '#38bdf8';
      out.textContent = typeof jsonData === 'object' ? JSON.stringify(jsonData, null, 2) : jsonData;

      // Token ကို သုံးပြီးပါက Expire လုပ်ပြီး Widget ကို Reset ပြုလုပ်ခြင်း (Next check အတွက်)
      currentToken = null;
      if (window.turnstile && widget !== null) {
        window.turnstile.reset(widget);
        panel.querySelector('#t-status').textContent = '● Token used. Verify again for next check';
        panel.querySelector('#t-status').style.color = '#f59e0b';
      }

    } catch (err) {
      out.style.color = '#ef4444';
      out.textContent = 'Error: ' + err.message;
    }
  };
})();
