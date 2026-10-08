// ==UserScript==
// @name         CEIR Read-Only Checker (Auto Token + Modern UI)
// @namespace    https://github.com/
// @version      3.0.0
// @description  Read-only CEIR checker with auto Cloudflare Turnstile minting and modern UI.
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__ceirReadOnlyChecker) return;
  window.__ceirReadOnlyChecker = true;

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const BASE = 'https://ceir.gov.mm/openapi/API';
  const PANEL_ID = 'ceir-read-only-checker';

  const SITEKEYS = {
    'verify-imei': '0x4AAAAAADmotCU2bSBwXlRk',
    'device-data': '0x4AAAAAADmoQuDsFEizt-Hn',
    'application': '0x4AAAAAADmoQuDsFEizt-Hn',
    'applicant': '0x4AAAAAADmoQuDsFEizt-Hn',
    'register-request': '0x4AAAAAADmoQuDsFEizt-Hn',
    'check-unpaid': '0x4AAAAAADmoQuDsFEizt-Hn',
    'same-device': '0x4AAAAAADmoQuDsFEizt-Hn',
    'payment-hub': '0x4AAAAAADmoQuDsFEizt-Hn',
    'payment-result': '0x4AAAAAADmoQuDsFEizt-Hn',
    'update-applicant': '0x4AAAAAADmoQuDsFEizt-Hn',
    'update-evidence': '0x4AAAAAADmoQuDsFEizt-Hn'
  };

  const TOKEN_TTL = 4 * 60 * 1000;   // 4 min
  const MINT_TIMEOUT = 30 * 1000;    // 30 sec

  // ============================================================
  // STYLES
  // ============================================================
  const styles = `
    #${PANEL_ID} {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      width: min(400px, calc(100vw - 32px));
      color: #18212f;
      background: #ffffff;
      border: 1px solid #d5dae3;
      border-radius: 14px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.24);
      font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    #${PANEL_ID} * { box-sizing: border-box; }

    #${PANEL_ID} .checker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 14px;
      background: #101828;
      color: #ffffff;
    }
    #${PANEL_ID} .checker-title {
      font-weight: 700;
      flex: 1;
      min-width: 0;
    }
    #${PANEL_ID} .checker-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    #${PANEL_ID} .checker-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f59e0b;
      animation: cPulse 1.5s infinite;
    }
    #${PANEL_ID} .checker-dot.ready {
      background: #10b981;
      animation: none;
    }
    #${PANEL_ID} .checker-dot.error {
      background: #ef4444;
      animation: none;
    }
    @keyframes cPulse {
      0%, 100% { opacity: 0.5; transform: scale(0.85); }
      50% { opacity: 1; transform: scale(1.15); }
    }

    #${PANEL_ID} button {
      appearance: none;
      min-height: 34px;
      padding: 7px 10px;
      border: 1px solid #cbd2dc;
      border-radius: 8px;
      background: #f8fafc;
      color: #18212f;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      transition: all 0.15s;
    }
    #${PANEL_ID} button:hover { background: #eef2f7; }
    #${PANEL_ID} button:focus-visible,
    #${PANEL_ID} input:focus-visible {
      outline: 3px solid rgba(37, 99, 235, 0.28);
      outline-offset: 1px;
    }
    #${PANEL_ID} button:disabled {
      cursor: wait;
      opacity: 0.6;
    }
    #${PANEL_ID} .checker-header button {
      min-height: 28px;
      padding: 4px 9px;
      border-color: rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    #${PANEL_ID} .checker-body {
      display: grid;
      gap: 10px;
      padding: 14px;
      max-height: 700px;
      overflow-y: auto;
      transition: max-height 0.3s ease, padding 0.3s ease;
    }
    #${PANEL_ID}.checker-collapsed .checker-body {
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      overflow: hidden;
    }

    #${PANEL_ID} label {
      display: grid;
      gap: 5px;
      color: #465066;
      font-size: 12px;
      font-weight: 700;
    }
    #${PANEL_ID} label .optional {
      color: #9ca3af;
      font-weight: 400;
      font-size: 11px;
    }
    #${PANEL_ID} input {
      width: 100%;
      min-height: 36px;
      padding: 8px 10px;
      border: 1px solid #cbd2dc;
      border-radius: 8px;
      background: #ffffff;
      color: #18212f;
      font: 13px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace;
      transition: all 0.2s;
    }
    #${PANEL_ID} input.token-ready {
      background: #f0fdf4;
      border-color: #10b981;
    }
    #${PANEL_ID} input.token-error {
      background: #fef2f2;
      border-color: #ef4444;
    }

    #${PANEL_ID} .input-with-status {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    #${PANEL_ID} .input-with-status input { flex: 1; }
    #${PANEL_ID} .input-status {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      white-space: nowrap;
      min-width: 60px;
      text-align: right;
    }
    #${PANEL_ID} .input-status.ready { color: #10b981; }
    #${PANEL_ID} .input-status.error { color: #ef4444; }

    #${PANEL_ID} .checker-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    #${PANEL_ID} .checker-actions + .checker-actions { margin-top: 4px; }

    #${PANEL_ID} .checker-primary {
      background: #1d4ed8;
      border-color: #1d4ed8;
      color: #ffffff;
    }
    #${PANEL_ID} .checker-primary:hover { background: #1e40af; }

    #${PANEL_ID} .checker-mint {
      background: linear-gradient(135deg, #059669, #10b981);
      border: none;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    #${PANEL_ID} .checker-mint:hover {
      background: linear-gradient(135deg, #047857, #059669);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.45);
    }

    #${PANEL_ID} .checker-note {
      margin: 0;
      color: #667085;
      font-size: 11px;
      line-height: 1.5;
    }
    #${PANEL_ID} .checker-message {
      min-height: 108px;
      max-height: 260px;
      margin: 0;
      padding: 10px;
      overflow: auto;
      border: 1px solid #e1e6ed;
      border-radius: 8px;
      background: #f5f7fa;
      color: #27364a;
      font: 11px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      #${PANEL_ID} {
        background: #131a2e;
        color: #e7ecf5;
        border-color: #243052;
      }
      #${PANEL_ID} .checker-body label { color: #aab6d4; }
      #${PANEL_ID} input {
        background: #0b1020;
        color: #e7ecf5;
        border-color: #33406b;
      }
      #${PANEL_ID} input.token-ready {
        background: rgba(16, 185, 129, 0.15);
      }
      #${PANEL_ID} input.token-error {
        background: rgba(239, 68, 68, 0.15);
      }
      #${PANEL_ID} button {
        background: #1a2340;
        color: #e7ecf5;
        border-color: #33406b;
      }
      #${PANEL_ID} button:hover { background: #243052; }
      #${PANEL_ID} .checker-message {
        background: #0b1020;
        color: #aab6d4;
        border-color: #243052;
      }
      #${PANEL_ID} .checker-note { color: #8792ad; }
    }
  `;

  // ============================================================
  // PANEL HTML
  // ============================================================
  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.setAttribute('aria-label', 'CEIR read-only checker');
  panel.innerHTML = `
    <style>${styles}</style>
    <header class="checker-header">
      <span class="checker-title">CEIR Checker</span>
      <span class="checker-status">
        <span class="checker-dot" id="checker-status-dot"></span>
        <span id="checker-status-text">Idle</span>
      </span>
      <button type="button" data-action="toggle" aria-expanded="true">Hide</button>
    </header>
    <div class="checker-body">

      <div class="checker-actions">
        <button type="button" class="checker-mint" data-action="mint">
          🔄 Get Fresh Token
        </button>
        <button type="button" data-action="clear-token">Clear Token</button>
      </div>

      <label>
        altchaData (auto or manual)
        <div class="input-with-status">
          <input id="checker-token" type="text" autocomplete="off" spellcheck="false"
            placeholder="Click 'Get Fresh Token' or paste manually">
          <span class="input-status" id="token-status">—</span>
        </div>
      </label>

      <label>
        IMEI (15 digits)
        <input id="checker-imei" type="text" inputmode="numeric" autocomplete="off"
          maxlength="15" placeholder="e.g. 490154203237518">
      </label>

      <label>
        Declaration ID / hash <span class="optional">(optional)</span>
        <input id="checker-reference" type="text" autocomplete="off" spellcheck="false"
          placeholder="Required for status / applicant">
      </label>

      <div class="checker-actions">
        <button type="button" class="checker-primary" data-endpoint="verify">Verify IMEI</button>
        <button type="button" data-endpoint="device">Device info</button>
        <button type="button" data-endpoint="status">Registration status</button>
        <button type="button" data-endpoint="applicant">Applicant</button>
      </div>

      <p class="checker-note">
        Read-only. No license key, no fingerprint stored. Token kept in memory only.
        If auto-mint fails, solve verification on the official page and paste manually.
      </p>

      <pre class="checker-message" role="status" aria-live="polite">Ready.

1. Click "Get Fresh Token" to mint automatically
2. Or paste altchaData manually
3. Enter IMEI and click an action button</pre>
    </div>
  `;
  document.body.appendChild(panel);

  // ============================================================
  // REFS
  // ============================================================
  const tokenInput = panel.querySelector('#checker-token');
  const imeiInput = panel.querySelector('#checker-imei');
  const referenceInput = panel.querySelector('#checker-reference');
  const messageOutput = panel.querySelector('.checker-message');
  const buttons = Array.from(panel.querySelectorAll('button[data-endpoint]'));
  const toggleButton = panel.querySelector('[data-action="toggle"]');
  const mintButton = panel.querySelector('[data-action="mint"]');
  const clearButton = panel.querySelector('[data-action="clear-token"]');
  const statusDot = panel.querySelector('#checker-status-dot');
  const statusText = panel.querySelector('#checker-status-text');
  const tokenStatus = panel.querySelector('#token-status');

  // ============================================================
  // STATE
  // ============================================================
  let cachedToken = null;
  let tokenExpiry = 0;
  let minting = false;
  let expiryTimer = null;

  // ============================================================
  // UTILITIES
  // ============================================================
  function writeMessage(message) {
    messageOutput.textContent = typeof message === 'string'
      ? message
      : JSON.stringify(message, null, 2);
    messageOutput.scrollTop = 0;
  }

  function setStatus(state, text) {
    statusDot.className = 'checker-dot' + (state ? ' ' + state : '');
    statusText.textContent = text;
  }

  function setTokenStatus(state, text) {
    tokenStatus.className = 'input-status' + (state ? ' ' + state : '');
    tokenStatus.textContent = text;
  }

  function updateTokenFieldUI(state) {
    tokenInput.classList.remove('token-ready', 'token-error');
    if (state === 'ready') {
      tokenInput.classList.add('token-ready');
      setTokenStatus('ready', '✓ Ready');
    } else if (state === 'error') {
      tokenInput.classList.add('token-error');
      setTokenStatus('error', '⚠ Error');
    } else {
      setTokenStatus('', '—');
    }
  }

  function startExpiryCountdown(expiry) {
    if (expiryTimer) clearInterval(expiryTimer);
    expiryTimer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(expiryTimer);
        expiryTimer = null;
        cachedToken = null;
        tokenExpiry = 0;
        updateTokenFieldUI('error');
        setTokenStatus('error', '⚠ Expired');
        setStatus('error', 'Token expired');
      } else {
        setTokenStatus('ready', `✓ ${remaining}s`);
      }
    }, 1000);
  }

  function requireToken() {
    const token = tokenInput.value.trim();
    if (!token) {
      writeMessage('altchaData is required. Click "Get Fresh Token" or paste manually.');
      tokenInput.focus();
      return null;
    }
    return token;
  }

  function requireImei() {
    const imei = imeiInput.value.trim();
    if (!/^\d{15}$/.test(imei)) {
      writeMessage('IMEI must contain exactly 15 digits.');
      imeiInput.focus();
      return null;
    }
    return imei;
  }

  function requireReference(label) {
    const value = referenceInput.value.trim();
    if (!value) {
      writeMessage(`${label} is required for this endpoint.`);
      referenceInput.focus();
      return null;
    }
    return value;
  }

  // ============================================================
  // TURNSTILE LOADER
  // ============================================================
  function loadTurnstile() {
    return new Promise((resolve, reject) => {
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        resolve(window.turnstile);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const check = setInterval(() => {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            clearInterval(check);
            resolve(window.turnstile);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          reject(new Error('Turnstile load timeout'));
        }, 10000);
      };
      script.onerror = () => reject(new Error('Failed to load Turnstile'));
      document.head.appendChild(script);
    });
  }

  // ============================================================
  // TOKEN MINTING
  // ============================================================
  async function mintToken(action) {
    const turnstile = await loadTurnstile();
    const sitekey = SITEKEYS[action] || SITEKEYS['verify-imei'];

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:300px;height:65px;overflow:hidden;';
    document.body.appendChild(container);

    return new Promise((resolve, reject) => {
      let widgetId = null;
      let settled = false;

      const cleanup = () => {
        try { if (widgetId !== null) turnstile.remove(widgetId); } catch (e) {}
        try { container.remove(); } catch (e) {}
      };

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Token mint timeout (' + (MINT_TIMEOUT / 1000) + 's)'));
      }, MINT_TIMEOUT);

      try {
        widgetId = turnstile.render(container, {
          sitekey: sitekey,
          action: action,
          execution: 'execute',
          appearance: 'interaction-only',
          theme: 'light',
          language: 'en',
          callback: (token) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            cleanup();
            resolve(token);
          },
          'error-callback': (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            cleanup();
            reject(new Error('Turnstile error: ' + String(err)));
          },
          'expired-callback': () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            cleanup();
            reject(new Error('Token expired before use'));
          }
        });

        if (turnstile.execute) {
          try { turnstile.execute(widgetId); } catch (e) {}
        }
      } catch (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        reject(e);
      }
    });
  }

  async function getToken(action) {
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken;
    }
    cachedToken = await mintToken(action);
    tokenExpiry = Date.now() + TOKEN_TTL;
    return cachedToken;
  }

  function clearTokenState() {
    cachedToken = null;
    tokenExpiry = 0;
    if (expiryTimer) {
      clearInterval(expiryTimer);
      expiryTimer = null;
    }
  }

  // ============================================================
  // HTTP REQUEST
  // ============================================================
  async function request(url, options) {
    const buttonsEnabled = buttons.map((b) => !b.disabled);
    buttons.forEach((b) => { b.disabled = true; });
    writeMessage('Requesting CEIR API...');
    setStatus('', 'Requesting');

    try {
      const response = await fetch(url, options);
      const text = await response.text();

      if (!response.ok) {
        let hint = '';
        if (response.status === 403) {
          hint = '\n\n⚠ Token rejected or Cloudflare blocked. Click "Get Fresh Token" to mint a new one.';
        } else if (response.status === 401) {
          hint = '\n\n⚠ Token expired or invalid. Click "Get Fresh Token" to mint a new one.';
        }
        writeMessage(`HTTP ${response.status} ${response.statusText}${hint}\n\n${text.slice(0, 2000)}`);
        setStatus('error', 'HTTP ' + response.status);
        if (response.status === 401 || response.status === 403) {
          updateTokenFieldUI('error');
        }
        return;
      }

      setStatus('ready', 'OK ' + response.status);
      try {
        writeMessage(JSON.parse(text));
      } catch {
        writeMessage(text.slice(0, 8000) || 'Empty response.');
      }
    } catch (error) {
      writeMessage(`Network error: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error', 'Network error');
    } finally {
      buttons.forEach((b, i) => { b.disabled = buttonsEnabled[i]; });
    }
  }

  function getJsonHeaders() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // ============================================================
  // UI EVENTS
  // ============================================================
  toggleButton.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('checker-collapsed');
    toggleButton.textContent = collapsed ? 'Show' : 'Hide';
    toggleButton.setAttribute('aria-expanded', String(!collapsed));
  });

  imeiInput.addEventListener('input', () => {
    imeiInput.value = imeiInput.value.replace(/\D/g, '').slice(0, 15);
  });

  tokenInput.addEventListener('input', () => {
    // Manual edit — reset indicator
    updateTokenFieldUI('');
    if (cachedToken !== tokenInput.value.trim()) {
      clearTokenState();
    }
  });

  // ============================================================
  // MINT TOKEN
  // ===================================