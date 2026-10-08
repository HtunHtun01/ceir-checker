// ==UserScript==
// @name         CEIR Checker v3.1.1 (No License)
// @namespace    https://github.com/
// @version      3.1.1
// @description  License-free read-only CEIR checker. Original UI style, manual altchaData token.
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__ceirCheckerV311) return;
  window.__ceirCheckerV311 = true;

  const BASE = 'https://ceir.gov.mm/openapi/API';
  const PANEL_ID = 'ceir-checker-v311';

  // ============================================================
  // STYLES — Original MIMI style (dark, compact)
  // ============================================================
  const styles = `
    #${PANEL_ID} {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      width: min(380px, calc(100vw - 32px));
      background: #131a2e;
      color: #e7ecf5;
      border: 1px solid #243052;
      border-radius: 14px;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.35);
      font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      overflow: hidden;
    }
    #${PANEL_ID} * { box-sizing: border-box; }

    #${PANEL_ID} .ceir-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 14px;
      background: #0f1528;
      border-bottom: 1px solid #243052;
      height: 48px;
      flex-shrink: 0;
    }
    #${PANEL_ID} .ceir-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #${PANEL_ID} .ceir-logo {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 9px;
      font-weight: 900;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
    }
    #${PANEL_ID} .ceir-title {
      font-size: 13px;
      font-weight: 700;
      color: #e7ecf5;
    }
    #${PANEL_ID} .ceir-ver {
      font-size: 10px;
      color: #8792ad;
      font-weight: 500;
    }
    #${PANEL_ID} .ceir-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(129, 140, 248, 0.14);
      font-size: 10px;
      font-weight: 600;
      color: #a5b4fc;
    }
    #${PANEL_ID} .ceir-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fcd34d;
    }
    #${PANEL_ID} .ceir-dot.ready { background: #6ee7b7; }
    #${PANEL_ID} .ceir-dot.error { background: #fca5a5; }

    #${PANEL_ID} .ceir-body {
      display: grid;
      gap: 10px;
      padding: 14px;
      max-height: 700px;
      overflow-y: auto;
    }
    #${PANEL_ID}.collapsed .ceir-body {
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      overflow: hidden;
    }

    #${PANEL_ID} .ceir-help {
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(129, 140, 248, 0.1);
      border-left: 3px solid #818cf8;
      font-size: 10.5px;
      line-height: 1.5;
      color: #c7d2fe;
    }
    #${PANEL_ID} .ceir-help strong { color: #e0e7ff; }
    #${PANEL_ID} .ceir-help code {
      background: rgba(129, 140, 248, 0.2);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      color: #c7d2fe;
    }

    #${PANEL_ID} .ceir-tabs {
      display: flex;
      gap: 2px;
      padding: 3px;
      background: #0b1020;
      border-radius: 8px;
    }
    #${PANEL_ID} .ceir-tab {
      flex: 1;
      padding: 6px 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #8792ad;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }
    #${PANEL_ID} .ceir-tab:hover { color: #e7ecf5; }
    #${PANEL_ID} .ceir-tab.active {
      background: #131a2e;
      color: #818cf8;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    #${PANEL_ID} label {
      display: grid;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: #aab6d4;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    #${PANEL_ID} label .optional {
      text-transform: none;
      color: #64748b;
      font-weight: 400;
      letter-spacing: 0;
    }
    #${PANEL_ID} input, #${PANEL_ID} textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #33406b;
      border-radius: 8px;
      background: #0b1020;
      color: #e7ecf5;
      font: 13px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    #${PANEL_ID} input:focus, #${PANEL_ID} textarea:focus {
      border-color: #818cf8;
      box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2);
    }
    #${PANEL_ID} input.token-ready { border-color: #6ee7b7; background: rgba(52, 211, 153, 0.1); }
    #${PANEL_ID} input.token-error { border-color: #fca5a5; background: rgba(248, 113, 113, 0.1); }
    #${PANEL_ID} input.token-manual { border-color: #fcd34d; background: rgba(252, 211, 77, 0.08); }

    #${PANEL_ID} .input-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    #${PANEL_ID} .input-row input { flex: 1; }
    #${PANEL_ID} .input-status {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
      min-width: 60px;
      text-align: right;
    }
    #${PANEL_ID} .input-status.ready { color: #6ee7b7; }
    #${PANEL_ID} .input-status.error { color: #fca5a5; }

    #${PANEL_ID} .ceir-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }
    #${PANEL_ID} .ceir-btn {
      appearance: none;
      min-height: 36px;
      padding: 8px 12px;
      border: 1px solid #33406b;
      border-radius: 8px;
      background: #1a2340;
      color: #e7ecf5;
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.15s;
    }
    #${PANEL_ID} .ceir-btn:hover { background: #243052; }
    #${PANEL_ID} .ceir-btn:disabled { cursor: wait; opacity: 0.6; }
    #${PANEL_ID} .ceir-btn-primary {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      border: none;
      color: #fff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    #${PANEL_ID} .ceir-btn-primary:hover {
      background: linear-gradient(135deg, #4338ca, #4f46e5);
    }
    #${PANEL_ID} .ceir-btn-danger {
      background: rgba(248, 113, 113, 0.14);
      border-color: #7f1d1d;
      color: #fca5a5;
    }
    #${PANEL_ID} .ceir-btn-danger:hover { background: rgba(248, 113, 113, 0.22); }

    #${PANEL_ID} .ceir-note {
      margin: 0;
      color: #64748b;
      font-size: 10.5px;
      line-height: 1.5;
    }
    #${PANEL_ID} .ceir-output {
      min-height: 120px;
      max-height: 280px;
      margin: 0;
      padding: 10px;
      overflow: auto;
      border: 1px solid #243052;
      border-radius: 8px;
      background: #0b1020;
      color: #aab6d4;
      font: 11px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media (prefers-color-scheme: light) {
      #${PANEL_ID} {
        background: #ffffff;
        color: #18212f;
        border-color: #d5dae3;
      }
      #${PANEL_ID} .ceir-header { background: #101828; }
      #${PANEL_ID} .ceir-title { color: #ffffff; }
      #${PANEL_ID} .ceir-tabs { background: #f1f5f9; }
      #${PANEL_ID} .ceir-tab { color: #64748b; }
      #${PANEL_ID} .ceir-tab.active { background: #ffffff; color: #4f46e5; }
      #${PANEL_ID} label { color: #465066; }
      #${PANEL_ID} input, #${PANEL_ID} textarea {
        background: #f8fafc;
        color: #18212f;
        border-color: #cbd2dc;
      }
      #${PANEL_ID} .ceir-btn {
        background: #f8fafc;
        color: #18212f;
        border-color: #cbd2dc;
      }
      #${PANEL_ID} .ceir-btn:hover { background: #eef2f7; }
      #${PANEL_ID} .ceir-output {
        background: #f5f7fa;
        color: #27364a;
        border-color: #e1e6ed;
      }
    }
  `;

  // ============================================================
  // PANEL HTML — Original MIMI style
  // ============================================================
  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <style>${styles}</style>

    <div class="ceir-header">
      <div class="ceir-brand">
        <div class="ceir-logo">CI</div>
        <span class="ceir-title">CEIR Checker</span>
        <span class="ceir-ver">v3.1.1</span>
      </div>
      <span class="ceir-status">
        <span class="ceir-dot" id="ceir-status-dot"></span>
        <span id="ceir-status-text">Idle</span>
      </span>
      <button type="button" class="ceir-btn" data-action="toggle" style="min-height:26px;padding:3px 8px;font-size:11px">Hide</button>
    </div>

    <div class="ceir-body">

      <div class="ceir-help">
        <strong>How to get altchaData:</strong><br>
        1. Click <strong>"Verify you are human"</strong> on the CEIR page<br>
        2. Press <code>F12</code> → <strong>Network</strong> → filter <code>altchaData</code><br>
        3. Click the <code>Verify</code> request → <strong>Headers</strong> → <strong>Query String Parameters</strong><br>
        4. Copy the <code>altchaData</code> value (starts with <code>0.</code>) and paste below
      </div>

      <div class="ceir-tabs">
        <button type="button" class="ceir-tab active" data-tab="single">Single</button>
        <button type="button" class="ceir-tab" data-tab="batch">Batch</button>
        <button type="button" class="ceir-tab" data-tab="appid">App ID</button>
      </div>

      <!-- Token input (all tabs) -->
      <label>
        altchaData (manual)
        <div class="input-row">
          <input id="ceir-token" type="text" autocomplete="off" spellcheck="false"
            placeholder="Paste token from an official CEIR request">
          <span class="input-status" id="ceir-token-status">—</span>
        </div>
      </label>

      <!-- Single tab -->
      <div data-panel="single">
        <label>
          IMEI (15 digits)
          <input id="ceir-imei" type="text" inputmode="numeric" autocomplete="off"
            maxlength="15" placeholder="e.g. 490154203237518">
        </label>
        <div class="ceir-actions" style="margin-top:8px">
          <button type="button" class="ceir-btn ceir-btn-primary" data-endpoint="verify">Verify IMEI</button>
          <button type="button" class="ceir-btn" data-endpoint="device">Device Info</button>
        </div>
      </div>

      <!-- Batch tab -->
      <div data-panel="batch" style="display:none">
        <label>
          IMEI list (one per line)
          <textarea id="ceir-batch" rows="6" placeholder="490154203237518&#10;352099001761481&#10;..."></textarea>
        </label>
        <div class="ceir-actions" style="margin-top:8px">
          <button type="button" class="ceir-btn ceir-btn-primary" data-endpoint="batch-verify">Verify Batch</button>
          <button type="button" class="ceir-btn" data-action="clear-batch">Clear List</button>
        </div>
      </div>

      <!-- App ID tab -->
      <div data-panel="appid" style="display:none">
        <label>
          Declaration ID <span class="optional">(App ID)</span>
          <input id="ceir-decl-id" type="text" autocomplete="off" spellcheck="false"
            placeholder="e.g. MM-CR-AABBCCDD">
        </label>
        <label style="margin-top:8px">
          Declaration Hash <span class="optional">(optional)</span>
          <input id="ceir-decl-hash" type="text" autocomplete="off" spellcheck="false"
            placeholder="Required for applicant info">
        </label>
        <div class="ceir-actions" style="margin-top:8px">
          <button type="button" class="ceir-btn ceir-btn-primary" data-endpoint="status">Registration Status</button>
          <button type="button" class="ceir-btn" data-endpoint="applicant">Applicant Info</button>
        </div>
      </div>

      <div class="ceir-actions">
        <button type="button" class="ceir-btn" data-action="clear-token">Clear Token</button>
        <button type="button" class="ceir-btn ceir-btn-danger" data-action="clear-all">Clear All</button>
      </div>

      <p class="ceir-note">
        License-free · Read-only · No fingerprint · No cache · Token in memory only
      </p>

      <pre class="ceir-output" id="ceir-output" role="status" aria-live="polite">Ready.

1. Solve Cloudflare on the official CEIR page
2. Copy altchaData from F12 → Network
3. Paste it above and enter IMEI
4. Click Verify IMEI</pre>

    </div>
  `;
  document.body.appendChild(panel);

  // ============================================================
  // REFS
  // ============================================================
  const tokenInput = panel.querySelector('#ceir-token');
  const imeiInput = panel.querySelector('#ceir-imei');
  const batchInput = panel.querySelector('#ceir-batch');
  const declIdInput = panel.querySelector('#ceir-decl-id');
  const declHashInput = panel.querySelector('#ceir-decl-hash');
  const output = panel.querySelector('#ceir-output');
  const statusDot = panel.querySelector('#ceir-status-dot');
  const statusText = panel.querySelector('#ceir-status-text');
  const tokenStatus = panel.querySelector('#ceir-token-status');
  const toggleBtn = panel.querySelector('[data-action="toggle"]');
  const actionButtons = Array.from(panel.querySelectorAll('button[data-endpoint]'));
  const tabs = Array.from(panel.querySelectorAll('.ceir-tab'));
  const panels = Array.from(panel.querySelectorAll('[data-panel]'));

  // ============================================================
  // UTILITIES
  // ============================================================
  function writeOutput(msg) {
    output.textContent = typeof msg === 'string'
      ? msg
      : JSON.stringify(msg, null, 2);
    output.scrollTop = 0;
  }

  function setStatus(state, text) {
    statusDot.className = 'ceir-dot' + (state ? ' ' + state : '');
    statusText.textContent = text;
  }

  function setTokenStatus(state, text) {
    tokenStatus.className = 'input-status' + (state ? ' ' + state : '');
    tokenStatus.textContent = text;
  }

  function updateTokenUI(state) {
    tokenInput.classList.remove('token-ready', 'token-error', 'token-manual');
    if (state === 'ready') {
      tokenInput.classList.add('token-ready');
      setTokenStatus('ready', '✓ Ready');
    } else if (state === 'error') {
      tokenInput.classList.add('token-error');
      setTokenStatus('error', '⚠ Error');
    } else if (state === 'manual') {
      tokenInput.classList.add('token-manual');
      setTokenStatus('', 'Manual');
    } else {
      setTokenStatus('', '—');
    }
  }

  function requireToken() {
    const token = tokenInput.value.trim();
    if (!token) {
      writeOutput('altchaData is required.\n\nSolve Cloudflare on the official page, then copy the token from F12 → Network.');
      tokenInput.focus();
      return null;
    }
    if (!token.startsWith('0.')) {
      writeOutput('Warning: token usually starts with "0." for Verify actions.\n\nYou pasted: ' + token.slice(0, 20) + '...\n\nContinuing anyway...');
    }
    return token;
  }

  function requireImei() {
    const imei = imeiInput.value.trim();
    if (!/^\d{15}$/.test(imei)) {
      writeOutput('IMEI must contain exactly 15 digits.');
      imeiInput.focus();
      return null;
    }
    return imei;
  }

  function parseBatch(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const valid = [];
    const errors = [];
    const seen = new Set();
    lines.forEach((line, i) => {
      if (!/^\d{15}$/.test(line)) {
        errors.push(`Line ${i + 1}: not 15 digits → ${line}`);
        return;
      }
      if (seen.has(line)) {
        errors.push(`Line ${i + 1}: duplicate → ${line}`);
        return;
      }
      seen.add(line);
      valid.push(line);
    });
    return { valid, errors };
  }

  // ============================================================
  // HTTP
  // ============================================================
  async function api(url, options) {
    const enabled = actionButtons.map((b) => !b.disabled);
    actionButtons.forEach((b) => { b.disabled = true; });
    writeOutput('Requesting CEIR API...');
    setStatus('', 'Requesting');

    try {
      const res = await fetch(url, options);
      const text = await res.text();

      if (!res.ok) {
        let hint = '';
        if (res.status === 401 || res.status === 403 || res.status === 500) {
          hint = '\n\n⚠ Token rejected or expired (4 min limit).\nSolve Cloudflare again and paste a fresh altchaData.';
          updateTokenUI('error');
        }
        writeOutput(`HTTP ${res.status} ${res.statusText}${hint}\n\n${text.slice(0, 2000)}`);
        setStatus('error', 'HTTP ' + res.status);
        return;
      }

      setStatus('ready', 'OK ' + res.status);
      try {
        writeOutput(JSON.parse(text));
      } catch {
        writeOutput(text.slice(0, 8000) || 'Empty response.');
      }
    } catch (err) {
      writeOutput('Network error: ' + (err && err.message ? err.message : String(err)));
      setStatus('error', 'Network error');
    } finally {
      actionButtons.forEach((b, i) => { b.disabled = enabled[i]; });
    }
  }

  function jsonHeaders() {
    return { Accept: 'application/json', 'Content-Type': 'application/json' };
  }

  // ============================================================
  // UI EVENTS
  // ============================================================
  toggleBtn.addEventListener('click', () => {
    const c = panel.classList.toggle('collapsed');
    toggleBtn.textContent = c ? 'Show' : 'Hide';
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      panels.forEach((p) => {
        p.style.display = p.dataset.panel === name ? '' : 'none';
      });
    });
  });

  imeiInput.addEventListener('input', () => {
    imeiInput.value = imeiInput.value.replace(/\D/g, '').slice(0, 15);
  });

  tokenInput.addEventListener('input', () => {
    const v = tokenInput.value.trim();
    if (!v) updateTokenUI('');
    else if (v.startsWith('0.')) updateTokenUI('ready');
    else updateTokenUI('manual');
  });

  tokenInput.addEventListener('paste', () => {
    setTimeout(() => {
      const v = tokenInput.value.trim();
      if (v.startsWith('0.')) {
        updateTokenUI('ready');
        setStatus('ready', 'Token pasted');
        writeOutput('Token pasted.\n\nLength: ' + v.length + ' chars\nPreview: ' + v.slice(0, 60) + '...\n\nNow enter IMEI and click Verify.');
      }
    }, 50);
  });

  panel.querySelector('[data-action="clear-token"]').addEventListener('click', () => {
    tokenInput.value = '';
    updateTokenUI('');
    setStatus('', 'Idle');
    writeOutput('Token cleared.');
  });

  panel.querySelector('[data-action="clear-all"]').addEventListener('click', () => {
    tokenInput.value = '';
    imeiInput.value = '';
    batchInput.value = '';
    declIdInput.value = '';
    declHashInput.value = '';
    updateTokenUI('');
    setStatus('', 'Idle');
    writeOutput('All fields cleared.');
  });

  panel.querySelector('[data-action="clear-batch"]').addEventListener('click', () => {
    batchInput.value = '';
    writeOutput('Batch list cleared.');
  });

  // ============================================================
  // ENDPOINTS
  // ============================================================
  panel.querySelector('[data-endpoint="verify"]').addEventListener('click', () => {
    const token = requireToken();
    const imei = requireImei();
    if (!token || !imei) return;
    api(`${BASE}/IMEI/Verify?altchaData=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ imeis: [imei] })
    });
  });

  panel.querySelector('[data-endpoint="device"]').addEventListener('click', () => {
    const token = requireToken();
    const imei = requireImei();
    if (!token || !imei) return;
    const q = new URLSearchParams({ altchaData: token, imei });
    api(`${BASE}/Device/personal-device-info?${q}`, {
      headers: { Accept: 'application/json' }
    });
  });

  panel.querySelector('[data-endpoint="batch-verify"]').addEventListener('click', () => {
    const token = requireToken();
    if (!token) return;
    const { valid, errors } = parseBatch(batchInput.value);
    if (!valid.length) {
      writeOutput('No valid IMEIs found.\n\n' + errors.join('\n'));
      return;
    }
    if (errors.length) {
      writeOutput('Warning: ' + errors.length + ' invalid line(s)\n' + errors.join('\n') + '\n\nContinuing with ' + valid.length + ' valid IMEI(s)...');
    }
    api(`${BASE}/IMEI/Verify?altchaData=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ imeis: valid })
    });
  });

  panel.querySelector('[data-endpoint="status"]').addEventListener('click', () => {
    const token = requireToken();
    const id = declIdInput.value.trim();
    if (!token) return;
    if (!id) {
      writeOutput('Declaration ID is required.');
      declIdInput.focus();
      return;
    }
    const q = new URLSearchParams({ DeclarationID: id, altchaData: token });
    api(`${BASE}/IMEI/RegistrationStatus?${q}`, {
      headers: { Accept: 'application/json' }
    });
  });

  panel.querySelector('[data-endpoint="applicant"]').addEventListener('click', () => {
    const token = requireToken();
    const hash = declHashInput.value.trim();
    if (!token) return;
    if (!hash) {
      writeOutput('Declaration hash is required for applicant info.');
      declHashInput.focus();
      return;
    }
    const q = new URLSearchParams({ altchaData: token, declarationHash: hash });
    api(`${BASE}/request/applicant?${q}`, {
      headers: { Accept: 'application/json' }
    });
  });

  // ============================================================
  // READY
  // ============================================================
  setStatus('', 'Idle');
  updateTokenUI('');
})();