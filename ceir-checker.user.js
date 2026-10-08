// ==UserScript==
// @name         CEIR Read-Only Checker
// @namespace    https://github.com/
// @version      1.0.0
// @description  Activation-free, read-only helper using a manually obtained altchaData token.
// @match        https://ceir.gov.mm/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  if (window.__ceirReadOnlyChecker) {
    return;
  }
  window.__ceirReadOnlyChecker = true;

  const BASE = 'https://ceir.gov.mm/openapi/API';
  const PANEL_ID = 'ceir-read-only-checker';

  const styles = `
    #${PANEL_ID} {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      width: min(360px, calc(100vw - 32px));
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
    #${PANEL_ID} .checker-primary {
      background: #1d4ed8;
      border-color: #1d4ed8;
      color: #ffffff;
    }
    #${PANEL_ID} .checker-primary:hover {
      background: #1e40af;
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
  `;

  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.setAttribute('aria-label', 'CEIR read-only checker');
  panel.innerHTML = `
    <style>${styles}</style>
    <header class="checker-header">
      <span class="checker-title">CEIR Read-Only Checker</span>
      <button type="button" data-action="toggle" aria-expanded="true">Hide</button>
    </header>
    <div class="checker-body">
      <label>
        altchaData (manual)
        <input id="checker-token" type="text" autocomplete="off" spellcheck="false"
          placeholder="Paste token from an official CEIR request">
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
        Activation-free: this script stores no license key, fingerprint, token or query result.
        Solve CEIR verification on the official page and copy a fresh altchaData manually.
      </p>
      <pre class="checker-message" role="status" aria-live="polite">Ready.</pre>
    </div>
  `;
  document.body.appendChild(panel);

  const tokenInput = panel.querySelector('#checker-token');
  const imeiInput = panel.querySelector('#checker-imei');
  const referenceInput = panel.querySelector('#checker-reference');
  const messageOutput = panel.querySelector('.checker-message');
  const buttons = Array.from(panel.querySelectorAll('button[data-endpoint]'));
  const toggleButton = panel.querySelector('[data-action="toggle"]');

  function writeMessage(message) {
    messageOutput.textContent = typeof message === 'string'
      ? message
      : JSON.stringify(message, null, 2);
    messageOutput.scrollTop = 0;
  }

  function requireToken() {
    const token = tokenInput.value.trim();
    if (!token) {
      writeMessage('altchaData is required. Copy it from an official CEIR network request.');
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

  async function request(url, options) {
    const buttonsEnabled = buttons.map((button) => !button.disabled);
    buttons.forEach((button) => {
      button.disabled = true;
    });
    writeMessage('Requesting CEIR API...');

    try {
      const response = await fetch(url, options);
      const text = await response.text();

      if (!response.ok) {
        const hint = response.status === 403
          ? '\nToken may be rejected or Cloudflare may have blocked the request. Copy a fresh altchaData from an official CEIR request.'
          : '';
        writeMessage(`HTTP ${response.status} ${response.statusText}${hint}\n\n${text.slice(0, 2000)}`);
        return;
      }

      try {
        writeMessage(JSON.parse(text));
      } catch {
        writeMessage(text.slice(0, 8000) || 'Empty response.');
      }
    } catch (error) {
      writeMessage(`Network error: ${error instanceof Error ? error.message : String(error)}`);
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

  toggleButton.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('checker-collapsed');
    toggleButton.textContent = collapsed ? 'Show' : 'Hide';
    toggleButton.setAttribute('aria-expanded', String(!collapsed));
  });

  imeiInput.addEventListener('input', () => {
    imeiInput.value = imeiInput.value.replace(/\D/g, '').slice(0, 15);
  });

  panel.querySelector('[data-endpoint="verify"]').addEventListener('click', () => {
    const token = requireToken();
    const imei = requireImei();
    if (!token || !imei) {
      return;
    }
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
    if (!token || !imei) {
      return;
    }
    const query = new URLSearchParams({
      altchaData: token,
      imei
    });
    request(`${BASE}/Device/personal-device-info?${query}`, { headers: { Accept: 'application/json' } });
  });

  panel.querySelector('[data-endpoint="status"]').addEventListener('click', () => {
    const token = requireToken();
    const reference = requireReference('Declaration ID');
    if (!token || !reference) {
      return;
    }
    const query = new URLSearchParams({
      DeclarationID: reference,
      altchaData: token
    });
    request(`${BASE}/IMEI/RegistrationStatus?${query}`, { headers: { Accept: 'application/json' } });
  });

  panel.querySelector('[data-endpoint="applicant"]').addEventListener('click', () => {
    const token = requireToken();
    const reference = requireReference('Declaration hash');
    if (!token || !reference) {
      return;
    }
    const query = new URLSearchParams({
      altchaData: token,
      declarationHash: reference
    });
    request(`${BASE}/request/applicant?${query}`, { headers: { Accept: 'application/json' } });
  });
})();