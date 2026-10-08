// ==UserScript==
// @name         CEIR Read-Only Checker (Auto Token)
// @namespace    https://github.com/
// @version      2.0.0
// @description  Read-only CEIR checker with automatic Cloudflare Turnstile token minting.
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Prevent double injection
  if (window.__ceirReadOnlyChecker) {
    return;
  }
  window.__ceirReadOnlyChecker = true;

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const BASE = 'https://ceir.gov.mm/openapi/API';
  const PANEL_ID = 'ceir-read-only-checker';

  // Cloudflare Turnstile sitekeys (from original script)
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

  const TOKEN_TTL = 4 * 60 * 1000; // 4 minutes
  const MINT_TIMEOUT = 30 * 1000;  // 30 seconds

  // ============================================================
  // STYLES
  // ============================================================
  const styles = `
    #${PANEL_ID} {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      width: min(380px, calc(100vw - 32px));
      color: #18212f;
      background: #ffffff;
      border: 1px solid #d5dae3;
      border-radius: 14px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.24);
      font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }
    #${PANEL_ID} * {
      box-sizing: border-box;
    }
    #${PANEL_ID} .checker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      background: #101828;
      color: #ffffff;
    }
    #${PANEL_ID} .checker-title {
      min-width: 0;
      font-weight: 700;
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
    }
    #${PANEL_ID} button:hover {
      background: #eef2f7;
    }
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
    }
    #${PANEL_ID} label {
      display: grid;
      gap: 5px;
      color: #465066;
      font-size: 12px;
      font-weight: 700;
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
    }
    #${PANEL_ID} .checker-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    #${PANEL_ID} .checker-actions + .checker-actions {
      margin-top: 4px;
    }
    #${PANEL_ID} .checker-primary {
      background: #1d4ed8;
      border-color: #1d4ed8;
      color: #ffffff;
    }
    #${PANEL_ID} .checker-primary:hover {
      background: #1e40af;
    }
    #${PANEL_ID} .checker-mint {
      background: #059669;
      border-color: #059669;
      color: #ffffff;
    }
    #${PANEL_ID} .checker-mint:hover {
      background: #047857;
    }
    #${PANEL_ID} .checker-note {
      margin: 0;
      color: #667085;
      font-size: 11px;
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
    #${PANEL_ID}.checker-collapsed .checker-body {
      display: none;
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
    }
    #${PANEL_ID} .checker-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f59e0b;
    }
    #${PANEL_ID} .checker-dot.ready {
      background: #10b981;
    }
    #${PANEL_ID} .checker-dot.error {
      background: #ef4444;
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
      <span class="checker-title">CEIR Read-Only Checker</span>
      <span class="checker-status">
        <span class="checker-dot" id="checker-status-dot"></span>
        <span id="checker-status-text">Idle</span>
      </span>
      <button type="button" data-action="toggle" aria-expanded="true">Hide</button>
    </header>
    <div class="checker-body">
      <div class="checker-actions">
        <button type="button" class="checker-mint" data-action="mint">
          Get Fresh Token
        </button>
        <button type="button" data-action="clear-token">Clear Token</button>
      </div>

      <label>
        altchaData (auto or manual)
        <input id="checker-token" type="text" autocomplete="off" spellcheck="false"
          placeholder="Click 'Get Fresh Token' or paste manually">
      </label>
      <label>
        IMEI (15 digits)
        <input id="checker-imei" type="text" inputmode="numeric" autocomplete="off"
          maxlength="15" placeholder="e.g. 490154203237518">
      </label>
      <label>
        Declaration ID or declaration hash
        <input id="checker-reference" type="text" autocomplete="off" spellcheck="false"
          placeholder="Required for status/applicant">
      </label>

      <div class="checker-actions">
        <button type="button" class="checker-primary" data-endpoint="verify">Verify IMEI</button>
        <button type="button" data-endpoint="device">Device info</button>
        <button type="button" data-endpoint="status">Registration status</button>
        <button type="button" data-endpoint="applicant">Applicant</button>
      </div>

      <p class="checker-note">
        Read-only. Stores no license key or fingerprint. Token is kept in memory only.
        If auto-mint fails, solve verification on the official page and paste altchaData manually.
      </p>
      <pre class="checker-message" role="status" aria-live="polite">Ready.</pre>
    </div>
  `;
  document.body.appendChild(panel);

  // ============================================================
  // ELEMENT REFERENCES
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

  // ============================================================
  // STATE
  // ============================================================
  let cachedToken = null;
  let tokenExpiry = 0;
  let minting = false;

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
      writeMessage(`${label} is required.`);
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

      // Check if script already exists
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existing) {
        const check = setInterval(() => {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            clearInterval(check);
            resolve(window.turnstile);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          reject(new Error('Turnstile load timeout (existing script)'));
        }, 10000);
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
      script.onerror = () => reject(new Error('Failed to load Turnstile script'));
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
        try {
          if (widgetId !== null) turnstile.remove(widgetId);
        } catch (e) { /* ignore */ }
        try { container.remove(); } catch (e) { /* ignore */ }
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

        // Try to execute automatically
        if (turnstile.execute) {
          try { turnstile.execute(widgetId); } catch (e) { /* ignore */ }
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

  function clearToken() {
    cachedToken = null;
    tokenExpiry = 0;
    tokenInput.value = '';
  }

  // ============================================================
  // HTTP REQUEST
  // ============================================================
  async function request(url, options) {
    const buttonsEnabled = buttons.map((button) => !button.disabled);
    buttons.forEach((button) => { button.disabled = true; });
    writeMessage('Requesting CEIR API...');
    setStatus('', 'Requesting');

    try {
      const response = await fetch(url, options);
      const text = await response.text();

      if (!response.ok) {
        const hint = response.status === 403
          ? '\n\nToken may be rejected or Cloudflare may have blocked the request. Click "Get Fresh Token" to mint a new one.'
          : response.status === 401
          ? '\n\nToken expired or invalid. Click "Get Fresh Token" to mint a new one.'
          : '';
        writeMessage(`HTTP ${response.status} ${response.statusText}${hint}\n\n${text.slice(0, 2000)}`);
        setStatus('error', 'HTTP ' + response.status);
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
      buttons.forEach((button, index) => {
        button.disabled = buttonsEnabled[index];
      });
    }
  }

  function getJsonHeaders() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // ============================================================
  // EVENT LISTENERS — UI
  // ============================================================
  toggleButton.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('checker-collapsed');
    toggleButton.textContent = collapsed ? 'Show' : 'Hide';
    toggleButton.setAttribute('aria-expanded', String(!collapsed));
  });

  imeiInput.addEventListener('input', () => {
    imeiInput.value = imeiInput.value.replace(/\D/g, '').slice(0, 15);
  });

  // ============================================================
  // EVENT LISTENERS — TOKEN MINT
  // ============================================================
  mintButton.addEventListener('click', async () => {
    if (minting) return;
    minting = true;
    mintButton.disabled = true;
    setStatus('', 'Minting');
    writeMessage('Minting fresh token via Cloudflare Turnstile...\nThis may take a few seconds.\n\nIf nothing happens, complete the Turnstile checkbox if it appears.');

    try {
      const token = await getToken('verify-imei');
      tokenInput.value = token;
      setStatus('ready', 'Token ready');
      writeMessage(
        'Token ready (expires in 4 min)\n\n' +
        'Action:   verify-imei\n' +
        'Length:   ' + token.length + ' chars\n' +
        'Preview:  ' + token.slice(0, 80) + '...'
      );
    } catch (error) {
      setStatus('error', 'Mint failed');
      writeMessage(
        'Token mint failed.\n\n' +
        (error instanceof Error ? error.message : String(error)) + '\n\n' +
        'Fallback: Open the official CEIR page, solve the Turnstile checkbox manually, ' +
        'then copy altchaData from Network tab (F12 → Network → filter "altchaData").'
      );
    } finally {
      minting = false;
      mintButton.disabled = false;
    }
  });

  clearButton.addEventListener('click', () => {
    clearToken();
    setStatus('', 'Idle');
    writeMessage('Token cleared.');
  });

  // ============================================================
  // EVENT LISTENERS — API ENDPOINTS
  // ============================================================
  panel.querySelector('[data-endpoint="verify"]').addEventListener('click', () => {
    const token = requireToken();
    const imei = requireImei();
    if (!token || !imei) return;
    const url = `${BASE}/IMEI/Verify?altchaData=${encodeURIComponent(token)}`;
    request(url, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ imeis: [imei] })
    });
  });

  panel.querySelector('[data-endpoint="device"]').addEventListener('click', () => {
    const token = requireToken();
    const imei = requireImei();
    if (!token || !imei) return;
    const query = new URLSearchParams({ altchaData: token, imei });
    request(`${BASE}/Device/personal-device-info?${query}`, {
      headers: { Accept: 'application/json' }
    });
  });

  panel.querySelector('[data-endpoint="status"]').addEventListener('click', () => {
    const token = requireToken();
    const reference = requireReference('Declaration ID');
    if (!token || !reference) return;
    const query = new URLSearchParams({ DeclarationID: reference, altchaData: token });
    request(`${BASE}/IMEI/RegistrationStatus?${query}`, {
      headers: { Accept: 'application/json' }
    });
  });

  panel.querySelector('[data-endpoint="applicant"]').addEventListener('click', () => {
    const token = requireToken();
    const reference = requireReference('Declaration hash');
    if (!token || !reference) return;
    const query = new URLSearchParams({ altchaData: token, declarationHash: reference });
    request(`${BASE}/request/applicant?${query}`, {
      headers: { Accept: 'application/json' }
    });
  });

  // ============================================================
  // READY
  // ============================================================
  writeMessage('Ready.\n\n1. Click "Get Fresh Token" to mint automatically\n2. Or paste altchaData manually\n3. Enter IMEI and click an action button');
  setStatus