/*!
 * Live Chat Widget  v2.0.0
 * Drop-in plugin — works on any website or mobile WebView
 *
 * Web embed:
 *   <script>window.LiveChat = { apiBase: 'https://your-server.com' };</script>
 *   <script src="https://your-server.com/widget.js" async></script>
 *
 * Mobile (React Native WebView — injectedJavaScript or src):
 *   window.LiveChat = { apiBase: '...', mode: 'inline' };
 *
 * Config keys:
 *   apiBase       – FastAPI server URL (required)
 *   mode          – 'widget' (floating bubble, default) | 'inline' (fill the view, for mobile)
 *   autoOpen      – true to open panel on load (default: true when mode=inline)
 *   primaryColor  – hex, default '#1e8a44'
 *   darkColor     – hex, default '#16703a'
 *   botName       – default 'Bally'
 *   brandName     – default 'Live Support'
 *   whatsapp      – full wa.me URL
 *   telegram      – full t.me URL
 *   messenger     – full m.me URL
 *   whatsappNum   – display label
 *   telegramNum   – display label
 *   fbHandle          – display label
 *   vapiKey           – Vapi public key (enables Voice AI tab)
 *   vapiAssistantId   – Vapi assistant ID to call
 */
(function (w, d) {
  'use strict';

  if (w.__lvChatLoaded) return;
  w.__lvChatLoaded = true;

  // ── Config ──────────────────────────────────────────────────────────────────
  const cfg    = w.LiveChat || {};
  const API    = cfg.apiBase       || 'https://livechat-5u7e.onrender.com';
  const COLOR  = cfg.primaryColor  || '#1e8a44';
  const COLORD = cfg.darkColor     || '#16703a';
  const BOT    = cfg.botName       || 'Bally';
  const BRAND  = cfg.brandName     || 'Live Support';
  const MODE   = cfg.mode          || 'widget';
  const AOPEN  = cfg.autoOpen      !== undefined ? cfg.autoOpen : MODE === 'inline';
  const WA     = cfg.whatsapp      || 'https://wa.me/46737765168';
  const TG     = cfg.telegram      || 'https://t.me/+46737765168';
  const FB     = cfg.messenger     || 'https://m.me/luxlinnaY';
  const WA_N   = cfg.whatsappNum   || '+46 73 776 5168';
  const TG_N   = cfg.telegramNum   || '+46 73 776 5168';
  const FB_L   = cfg.fbHandle      || 'facebook.com/luxlinnaY';
  const VAPI_KEY = cfg.vapiKey          || '';
  const VAPI_AID = cfg.vapiAssistantId  || '';

  // ── Session ID ───────────────────────────────────────────────────────────────
  let sid = '';
  try {
    sid = sessionStorage.getItem('lv_sid');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('lv_sid', sid);
    }
  } catch (_) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // ── CSS ──────────────────────────────────────────────────────────────────────
  const styleEl = d.createElement('style');
  styleEl.textContent = `
    #lvchat * { box-sizing: border-box; margin: 0; padding: 0; }
    #lvchat { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    #lvchat-launcher {
      position: fixed; bottom: 24px; right: 20px; z-index: 9999;
      width: 62px; height: 62px; border-radius: 50%;
      background: linear-gradient(135deg, ${COLOR}, ${COLORD});
      box-shadow: 0 6px 24px rgba(30,138,68,.45);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: transform .2s, box-shadow .2s;
    }
    #lvchat-launcher:hover { transform: scale(1.08); box-shadow: 0 8px 30px rgba(30,138,68,.55); }
    #lvchat-launcher svg { width: 28px; height: 28px; fill: #fff; }
    #lvchat-launcher .ico-close { display: none; }
    #lvchat-badge {
      position: absolute; top: -2px; right: -2px;
      background: #e53935; color: #fff; font-size: 11px; font-weight: 700;
      width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }

    #lvchat-panel {
      position: fixed; bottom: 104px; right: 20px; z-index: 9998;
      width: 360px; height: 520px;
      background: #fff; border-radius: 20px;
      box-shadow: 0 16px 60px rgba(0,0,0,.18);
      display: none; flex-direction: column; overflow: hidden;
      animation: lvSlideUp .25s ease;
    }
    #lvchat-panel.open { display: flex; }
    #lvchat-panel.lv-inline {
      position: relative; bottom: auto; right: auto;
      width: 100%; height: 100vh; min-height: 100dvh;
      border-radius: 0; box-shadow: none;
    }

    @media (max-width: 480px) {
      #lvchat-launcher { bottom: 16px; right: 16px; }
      #lvchat-panel {
        bottom: 0; right: 0; width: 100vw;
        height: 100dvh; height: 100vh;
        border-radius: 0;
        border-top-left-radius: 18px; border-top-right-radius: 18px;
      }
      .lv-input-bar input { font-size: 16px; }
    }
    @keyframes lvSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .lv-header {
      background: linear-gradient(135deg, ${COLOR}, ${COLORD});
      padding: 14px 16px 12px; color: #fff; flex-shrink: 0;
    }
    @supports (padding-top: env(safe-area-inset-top)) {
      @media (max-width: 480px) {
        .lv-header { padding-top: calc(14px + env(safe-area-inset-top)); }
      }
    }
    .lv-header-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .lv-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .lv-header-info .lv-name { font-size: 15px; font-weight: 700; }
    .lv-header-info .lv-status { font-size: 11.5px; opacity: .85; display: flex; align-items: center; gap: 4px; }
    .lv-online-dot { width: 7px; height: 7px; background: #69f0ae; border-radius: 50%; }
    .lv-tabs { display: flex; gap: 6px; }
    .lv-tab {
      flex: 1; padding: 7px 4px; border-radius: 20px; border: none;
      background: rgba(255,255,255,.15); color: #fff;
      font-size: 12px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 4px;
      transition: background .15s; touch-action: manipulation;
    }
    .lv-tab.active { background: rgba(255,255,255,.35); }
    .lv-tab:hover  { background: rgba(255,255,255,.28); }

    .lv-pane { display: none; flex: 1; flex-direction: column; overflow: hidden; }
    .lv-pane.active { display: flex; }

    .lv-messages {
      flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
      padding: 14px 14px 8px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f7f9f7;
    }
    .lv-messages::-webkit-scrollbar { width: 3px; }
    .lv-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
    .lv-msg { display: flex; align-items: flex-end; gap: 7px; }
    .lv-msg.bot  { justify-content: flex-start; }
    .lv-msg.user { justify-content: flex-end; }
    .lv-bot-icon {
      width: 28px; height: 28px; border-radius: 50%;
      background: ${COLOR}; color: #fff; font-size: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .lv-bubble {
      max-width: 78%; padding: 9px 12px; border-radius: 16px;
      font-size: 13px; line-height: 1.5; color: #1a1a1a;
    }
    .lv-msg.bot  .lv-bubble { background: #fff; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .lv-msg.user .lv-bubble { background: ${COLOR}; color: #fff; border-bottom-right-radius: 4px; }
    .lv-typing { display: flex; align-items: center; gap: 4px; padding: 10px 12px; }
    .lv-dot { width: 7px; height: 7px; border-radius: 50%; background: #aaa; animation: lvBounce 1.2s infinite; }
    .lv-dot:nth-child(2) { animation-delay: .2s; }
    .lv-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes lvBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    .lv-quick-wrap { padding: 6px 14px 4px; display: flex; flex-wrap: wrap; gap: 6px; background: #f7f9f7; }
    .lv-quick {
      padding: 6px 12px; border-radius: 20px;
      border: 1.5px solid ${COLOR}; background: #fff;
      color: ${COLOR}; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: background .15s, color .15s; touch-action: manipulation;
    }
    .lv-quick:hover, .lv-quick:active { background: ${COLOR}; color: #fff; }

    .lv-input-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-top: 1px solid #ebebeb; background: #fff;
      padding-bottom: max(10px, env(safe-area-inset-bottom));
    }
    .lv-input-bar input {
      flex: 1; border: 1.5px solid #e0e0e0; border-radius: 20px;
      padding: 9px 14px; font-size: 13px; outline: none;
      transition: border-color .15s; -webkit-appearance: none; appearance: none;
    }
    .lv-input-bar input:focus { border-color: ${COLOR}; }
    .lv-send-btn {
      width: 38px; height: 38px; border-radius: 50%; border: none;
      background: ${COLOR}; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background .15s; touch-action: manipulation;
    }
    .lv-send-btn:hover, .lv-send-btn:active { background: ${COLORD}; }
    .lv-send-btn svg { width: 16px; height: 16px; fill: #fff; }

    .lv-connect-pane { display: flex; flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; background: #f4f6f9; }
    .lv-connect-hero {
      background: linear-gradient(160deg, ${COLOR} 0%, ${COLORD} 100%);
      padding: 20px 20px 28px; text-align: center; position: relative; overflow: hidden;
    }
    .lv-connect-hero::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,.06); }
    .lv-connect-hero::after  { content: ''; position: absolute; bottom: -20px; left: -20px; width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,.05); }
    .lv-hero-icon { width: 54px; height: 54px; background: rgba(255,255,255,.18); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 10px; backdrop-filter: blur(4px); border: 1.5px solid rgba(255,255,255,.25); }
    .lv-hero-title { color: #fff; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .lv-hero-sub   { color: rgba(255,255,255,.78); font-size: 12px; line-height: 1.5; }
    .lv-channels-wrap { padding: 18px 16px; display: flex; flex-direction: column; gap: 10px; }
    .lv-channel-btn {
      display: flex; align-items: center;
      border-radius: 16px; border: none; cursor: pointer;
      text-decoration: none; width: 100%; overflow: hidden;
      transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
      box-shadow: 0 3px 14px rgba(0,0,0,.10); touch-action: manipulation;
    }
    .lv-channel-btn:hover, .lv-channel-btn:active { transform: translateY(-3px) scale(1.01); box-shadow: 0 10px 30px rgba(0,0,0,.17); }
    .lv-ch-bar { width: 6px; flex-shrink: 0; min-height: 74px; }
    .lv-ch-wa { background: linear-gradient(120deg, #e9fdf1 0%, #d2f5e3 100%); }
    .lv-ch-tg { background: linear-gradient(120deg, #e8f4fd 0%, #cce8fa 100%); }
    .lv-ch-fb { background: linear-gradient(120deg, #eef3ff 0%, #d8e5ff 100%); }
    .lv-ch-wa .lv-ch-bar { background: #25d366; }
    .lv-ch-tg .lv-ch-bar { background: #2aabee; }
    .lv-ch-fb .lv-ch-bar { background: #0084ff; }
    .lv-ch-icon { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin: 0 14px 0 16px; box-shadow: 0 3px 10px rgba(0,0,0,.13); }
    .lv-ch-wa .lv-ch-icon { background: linear-gradient(135deg, #25d366, #1aad53); }
    .lv-ch-tg .lv-ch-icon { background: linear-gradient(135deg, #2aabee, #1a8bcc); }
    .lv-ch-fb .lv-ch-icon { background: linear-gradient(135deg, #0084ff, #0052cc); }
    .lv-ch-info { flex: 1; text-align: left; padding: 14px 0; }
    .lv-ch-name { font-size: 14.5px; font-weight: 800; letter-spacing: .2px; margin-bottom: 3px; }
    .lv-ch-wa .lv-ch-name { color: #0a6632; }
    .lv-ch-tg .lv-ch-name { color: #0a5a8a; }
    .lv-ch-fb .lv-ch-name { color: #003d99; }
    .lv-ch-sub { font-size: 11.5px; color: #666; }
    .lv-ch-tag { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; margin-left: auto; margin-right: 14px; white-space: nowrap; flex-shrink: 0; }
    .lv-ch-wa .lv-ch-tag { background: #d4f5e4; color: #0a6632; }
    .lv-ch-tg .lv-ch-tag { background: #d0ebfb; color: #0a5a8a; }
    .lv-ch-fb .lv-ch-tag { background: #d8e5ff; color: #003d99; }
    .lv-ch-arrow { font-size: 20px; margin-right: 14px; flex-shrink: 0; opacity: .4; }
    .lv-ch-wa .lv-ch-arrow { color: #0a6632; }
    .lv-ch-tg .lv-ch-arrow { color: #0a5a8a; }
    .lv-ch-fb .lv-ch-arrow { color: #003d99; }
    .lv-hours-wrap { padding: 0 16px 18px; }
    .lv-hours { background: #fff; border-radius: 14px; padding: 14px 16px; font-size: 12.5px; color: #555; line-height: 1.8; box-shadow: 0 1px 6px rgba(0,0,0,.06); border-left: 4px solid ${COLOR}; }
    .lv-hours-heading { font-size: 11px; font-weight: 700; color: ${COLOR}; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
    .lv-hours-row { display: flex; justify-content: space-between; align-items: center; }
    .lv-hours-row span:first-child { color: #333; font-weight: 600; font-size: 12px; }
    .lv-hours-row span:last-child  { color: #888; font-size: 12px; }
    .lv-hours-divider { height: 1px; background: #f0f0f0; margin: 6px 0; }
    .lv-avg-response { display: flex; align-items: center; gap: 6px; margin-top: 8px; background: #e9f9ee; border-radius: 8px; padding: 7px 10px; font-size: 12px; color: ${COLOR}; font-weight: 600; }

    #lv-toast { position: fixed; bottom: 100px; right: 20px; z-index: 10000; background: #333; color: #fff; font-size: 12px; padding: 6px 14px; border-radius: 20px; opacity: 0; transition: opacity .3s; pointer-events: none; }
    #lv-toast.show { opacity: 1; }

    /* ── Vapi Voice AI pane ── */
    .lv-voice-pane {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: linear-gradient(160deg, #f0fdf4 0%, #e8f5ff 100%);
      padding: 24px 20px; gap: 20px;
    }
    .lv-voice-orb {
      width: 110px; height: 110px; border-radius: 50%;
      background: linear-gradient(135deg, ${COLOR}, ${COLORD});
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(30,138,68,.35);
      cursor: pointer; transition: transform .2s, box-shadow .2s;
      position: relative;
    }
    .lv-voice-orb:hover { transform: scale(1.06); box-shadow: 0 12px 40px rgba(30,138,68,.45); }
    .lv-voice-orb svg { width: 44px; height: 44px; fill: #fff; }
    .lv-voice-orb.active { background: linear-gradient(135deg, #e53935, #b71c1c); box-shadow: 0 8px 32px rgba(229,57,53,.4); }
    .lv-voice-orb.active:hover { box-shadow: 0 12px 40px rgba(229,57,53,.5); }
    .lv-voice-orb.connecting { animation: lvOrbPulse 1.4s ease-in-out infinite; }
    @keyframes lvOrbPulse {
      0%, 100% { box-shadow: 0 8px 32px rgba(30,138,68,.35); }
      50%       { box-shadow: 0 8px 48px rgba(30,138,68,.7), 0 0 0 16px rgba(30,138,68,.12); }
    }
    .lv-voice-orb.active { animation: lvOrbActive 1.2s ease-in-out infinite; }
    @keyframes lvOrbActive {
      0%, 100% { box-shadow: 0 8px 32px rgba(229,57,53,.4); }
      50%       { box-shadow: 0 8px 48px rgba(229,57,53,.7), 0 0 0 14px rgba(229,57,53,.12); }
    }
    .lv-voice-status {
      font-size: 15px; font-weight: 700; color: #1a1a1a; text-align: center;
    }
    .lv-voice-sub {
      font-size: 12px; color: #666; text-align: center; line-height: 1.5; margin-top: -12px;
    }
    .lv-voice-bars {
      display: flex; align-items: center; gap: 4px; height: 32px;
      opacity: 0; transition: opacity .3s;
    }
    .lv-voice-bars.speaking { opacity: 1; }
    .lv-voice-bar {
      width: 4px; border-radius: 2px; background: ${COLOR};
      animation: lvBarWave 1s ease-in-out infinite;
    }
    .lv-voice-bar:nth-child(1) { height: 14px; animation-delay: 0s; }
    .lv-voice-bar:nth-child(2) { height: 24px; animation-delay: .1s; }
    .lv-voice-bar:nth-child(3) { height: 32px; animation-delay: .2s; }
    .lv-voice-bar:nth-child(4) { height: 20px; animation-delay: .3s; }
    .lv-voice-bar:nth-child(5) { height: 14px; animation-delay: .4s; }
    @keyframes lvBarWave {
      0%, 100% { transform: scaleY(1); }
      50%       { transform: scaleY(.4); }
    }
    .lv-voice-hint {
      font-size: 11px; color: #999; text-align: center; line-height: 1.6;
    }
    .lv-voice-badge {
      display: flex; align-items: center; gap: 5px;
      background: #fff; border-radius: 20px; padding: 5px 12px;
      font-size: 11px; font-weight: 600; color: #555;
      box-shadow: 0 1px 6px rgba(0,0,0,.08);
    }
    .lv-voice-badge svg { width: 14px; height: 14px; }
  `;
  d.head.appendChild(styleEl);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const root = d.createElement('div');
  root.innerHTML = `
    <div id="lvchat">
      ${MODE !== 'inline' ? `
      <div id="lvchat-launcher">
        <span id="lvchat-badge">1</span>
        <svg class="ico-chat" viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/></svg>
        <svg class="ico-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </div>` : ''}

      <div id="lvchat-panel"${MODE === 'inline' ? ' class="lv-inline"' : ''}>
        <div class="lv-header">
          <div class="lv-header-top">
            <div class="lv-avatar">&#x1F6CD;&#xFE0F;</div>
            <div class="lv-header-info">
              <div class="lv-name">${BRAND}</div>
              <div class="lv-status"><span class="lv-online-dot"></span> We're online — here to help!</div>
            </div>
          </div>
          <div class="lv-tabs">
            <button class="lv-tab active" data-tab="ai">&#x1F916; AI Chat</button>
            ${VAPI_KEY ? '<button class="lv-tab" data-tab="voice">&#x1F399; Voice AI</button>' : ''}
            <button class="lv-tab" data-tab="connect">&#x1F4AC; Live Agent</button>
          </div>
        </div>

        <div class="lv-pane active" id="lv-pane-ai">
          <div class="lv-messages" id="lv-msg-list">
            <div class="lv-msg bot">
              <div class="lv-bot-icon">&#x1F916;</div>
              <div class="lv-bubble">Hi there! &#x1F44B; I'm <b>${BOT}</b>, ${BRAND}'s AI assistant.<br>How can I help you today?</div>
            </div>
          </div>
          <div class="lv-quick-wrap" id="lv-quick-wrap">
            <button class="lv-quick" data-quick="Track my order">&#x1F4E6; Track my order</button>
            <button class="lv-quick" data-quick="Return &amp; refund">&#x21A9;&#xFE0F; Return &amp; refund</button>
            <button class="lv-quick" data-quick="Promotions &amp; deals">&#x1F3F7;&#xFE0F; Deals</button>
            <button class="lv-quick" data-quick="Talk to a human">&#x1F64B; Talk to a human</button>
          </div>
          <div class="lv-input-bar">
            <input id="lv-input" type="text" placeholder="Type a message&#x2026;" autocomplete="off"/>
            <button class="lv-send-btn" id="lv-send-btn">
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>

        <div class="lv-pane" id="lv-pane-connect">
          <div class="lv-connect-pane">
            <div class="lv-connect-hero">
              <div class="lv-hero-icon">&#x1F3A7;</div>
              <div class="lv-hero-title">Talk to a Real Person</div>
              <div class="lv-hero-sub">Pick your favourite app — our team is ready<br>and typically replies in under 5 minutes.</div>
            </div>
            <div class="lv-channels-wrap">
              <div class="lv-channel-btn lv-ch-wa" data-url="${WA}">
                <div class="lv-ch-bar"></div>
                <div class="lv-ch-icon">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="white"><path d="M16 3C9.37 3 4 8.37 4 15c0 2.39.67 4.63 1.84 6.54L4 29l7.72-1.8A12.93 12.93 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 3 16 3zm6.27 17.27c-.26.73-1.52 1.4-2.09 1.48-.54.08-1.22.11-1.97-.12-.45-.14-1.04-.33-1.78-.64-3.13-1.35-5.18-4.5-5.34-4.71-.16-.21-1.3-1.73-1.3-3.3 0-1.57.82-2.34 1.11-2.66.29-.32.63-.4.84-.4l.6.01c.19 0 .45-.07.7.54.26.63.88 2.16.96 2.32.08.16.13.35.03.56-.1.21-.15.34-.3.52-.15.18-.31.4-.45.54-.14.14-.29.29-.12.57.17.28.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.29 1.41.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.64-.14.26.09 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.19 1.41z"/></svg>
                </div>
                <div class="lv-ch-info">
                  <div class="lv-ch-name">WhatsApp</div>
                  <div class="lv-ch-sub">${WA_N}</div>
                </div>
                <div class="lv-ch-tag">&#x26A1; Instant</div>
                <div class="lv-ch-arrow">&#x203A;</div>
              </div>
              <div class="lv-channel-btn lv-ch-tg" data-url="${TG}">
                <div class="lv-ch-bar"></div>
                <div class="lv-ch-icon">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="white"><path d="M16 3C9.37 3 4 8.37 4 15c0 2.39.67 4.63 1.84 6.54L4 29l7.72-1.8A12.93 12.93 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 3 16 3zm5.94 8.08l-2.02 9.52c-.15.67-.54.83-1.09.52l-3-2.21-1.45 1.4c-.16.16-.29.29-.6.29l.21-3.01 5.48-4.95c.24-.21-.05-.33-.37-.12l-6.77 4.26-2.92-.91c-.63-.2-.65-.63.13-.93l11.4-4.4c.53-.19.99.13.99.54z"/></svg>
                </div>
                <div class="lv-ch-info">
                  <div class="lv-ch-name">Telegram</div>
                  <div class="lv-ch-sub">${TG_N}</div>
                </div>
                <div class="lv-ch-tag">&#x2708;&#xFE0F; Fast</div>
                <div class="lv-ch-arrow">&#x203A;</div>
              </div>
              <div class="lv-channel-btn lv-ch-fb" data-url="${FB}">
                <div class="lv-ch-bar"></div>
                <div class="lv-ch-icon">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="white"><path d="M16 4C9.37 4 4 9.06 4 15.25c0 3.49 1.74 6.6 4.47 8.64V28l4.08-2.24A12.96 12.96 0 0 0 16 26.5c6.63 0 12-5.06 12-11.25S22.63 4 16 4zm1.2 15.15l-3.05-3.26-5.95 3.26 6.55-6.96 3.12 3.26 5.88-3.26-6.55 6.96z"/></svg>
                </div>
                <div class="lv-ch-info">
                  <div class="lv-ch-name">Messenger</div>
                  <div class="lv-ch-sub">${FB_L}</div>
                </div>
                <div class="lv-ch-tag">&#x1F4AC; Chat</div>
                <div class="lv-ch-arrow">&#x203A;</div>
              </div>
            </div>
            <div class="lv-hours-wrap">
              <div class="lv-hours">
                <div class="lv-hours-heading">&#x1F550; Support Hours</div>
                <div class="lv-hours-row"><span>Monday &#x2013; Friday</span><span>9:00 AM &#x2013; 8:00 PM</span></div>
                <div class="lv-hours-divider"></div>
                <div class="lv-hours-row"><span>Saturday &#x2013; Sunday</span><span>10:00 AM &#x2013; 6:00 PM</span></div>
                <div class="lv-avg-response"><span>&#x1F7E2;</span> Average response time: <b>under 5 minutes</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${VAPI_KEY ? `
      <div class="lv-pane" id="lv-pane-voice">
        <div class="lv-voice-pane">
          <div class="lv-voice-bars" id="lv-voice-bars">
            <div class="lv-voice-bar"></div>
            <div class="lv-voice-bar"></div>
            <div class="lv-voice-bar"></div>
            <div class="lv-voice-bar"></div>
            <div class="lv-voice-bar"></div>
          </div>
          <div class="lv-voice-orb" id="lv-voice-orb">
            <svg id="lv-mic-icon" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3zm-1 17.93A8 8 0 0 1 4.07 12H2a10 10 0 0 0 9 9.93V23h2v-1.07A10 10 0 0 0 22 12h-2.07A8 8 0 0 1 13 18.93V18h-2v.93z"/></svg>
            <svg id="lv-end-icon" style="display:none" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
          </div>
          <div class="lv-voice-status" id="lv-voice-status">Tap to call AI Agent</div>
          <div class="lv-voice-sub" id="lv-voice-sub">Speak naturally — the AI will answer</div>
          <div class="lv-voice-hint">Make sure your microphone is allowed in the browser</div>
          <div class="lv-voice-badge">
            <svg viewBox="0 0 24 24" fill="#1a1a1a"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/></svg>
            Powered by Vapi AI
          </div>
        </div>
      </div>` : ''}

    </div>
    <div id="lv-toast"></div>
  `;
  d.body.appendChild(root);

  // ── Bot replies ──────────────────────────────────────────────────────────────
  const REPLIES = {
    track:    { text: `To track your order, go to <b>My Orders</b> in the app, or reply with your <b>Order ID</b> (e.g. ORD-1234) and I'll look it up! &#x1F4E6;`, quick: ['Check order status', 'Talk to a human'] },
    return:   { text: `You can request a return within <b>7 days</b> of delivery. Go to <b>My Orders &#x2192; Return Item</b>. Refunds within <b>3&#x2013;5 business days</b>. &#x1F4B8;`, quick: ['Refund status', 'Talk to a human'] },
    refund:   { text: `Refunds go to your <b>Live Wallet</b> or original payment within <b>3&#x2013;5 business days</b> after return is approved. &#x2705;`, quick: ['Track my order', 'Talk to a human'] },
    promo:    { text: `&#x1F3F7;&#xFE0F; Current deals:<br>&#x2022; Use <b>LIVE10</b> &#x2014; save $10 on orders over $50<br>&#x2022; <b>Buy 2 Get 1 Free</b> on Dairy &amp; Desserts<br>&#x2022; <b>Free shipping</b> on orders over $25`, quick: ['How to apply a code', 'Talk to a human'] },
    code:     { text: `Apply a promo code: <b>Cart &#x2192; Checkout &#x2192; Promo Code</b> field, enter &amp; tap <b>Apply</b>. Discount applied instantly! &#x1F389;`, quick: ['Promotions &amp; deals', 'Track my order'] },
    human:    { text: `Our live agents are on <b>WhatsApp</b>, <b>Telegram</b>, and <b>Messenger</b>. Tap <b>&#x1F4AC; Live Agent</b> above &#x2014; we reply in under 5 minutes! &#x1F64B;`, quick: [] },
    shipping: { text: `Live offers <b>same-day delivery</b> on orders before 2:00 PM. Standard: <b>1&#x2013;3 business days</b>. Free shipping over $25! &#x1F69A;`, quick: ['Track my order', 'Talk to a human'] },
    payment:  { text: `We accept <b>Credit/Debit Cards</b>, <b>Live Wallet</b>, and popular online payments. Top up your wallet anytime in the app. &#x1F4B3;`, quick: ['Wallet top-up', 'Talk to a human'] },
    wallet:   { text: `Top up: <b>Profile &#x2192; My Wallet &#x2192; Top Up</b>, choose payment method. It's instant! &#x1F4B0;`, quick: ['Check balance', 'Talk to a human'] },
    default:  { text: `I'm not sure I fully understood that. Here's what I can help with &#x2014; or tap <b>&#x1F4AC; Live Agent</b> to chat with our team! &#x1F60A;`, quick: ['Track my order', 'Return & refund', 'Promotions & deals', 'Talk to a human'] },
  };

  function getReply(msg) {
    const m = msg.toLowerCase();
    if (/track|order|status|where.*my/.test(m))       return REPLIES.track;
    if (/refund|money.?back/.test(m))                 return REPLIES.refund;
    if (/return/.test(m))                             return REPLIES.return;
    if (/apply|how.*code/.test(m))                    return REPLIES.code;
    if (/promo|deal|discount|coupon|code/.test(m))    return REPLIES.promo;
    if (/ship|deliver/.test(m))                       return REPLIES.shipping;
    if (/pay|payment|card/.test(m))                   return REPLIES.payment;
    if (/wallet|top.?up|balance/.test(m))             return REPLIES.wallet;
    if (/human|agent|person|support|help me/.test(m)) return REPLIES.human;
    return REPLIES.default;
  }

  // ── DOM refs ──────────────────────────────────────────────────────────────────
  const panel    = d.getElementById('lvchat-panel');
  const msgList  = d.getElementById('lv-msg-list');
  const inputEl  = d.getElementById('lv-input');
  const qWrap    = d.getElementById('lv-quick-wrap');
  const toastEl  = d.getElementById('lv-toast');
  const launcher = d.getElementById('lvchat-launcher');
  const badge    = d.getElementById('lvchat-badge');

  // ── Core helpers ──────────────────────────────────────────────────────────────
  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (badge) badge.style.display = isOpen ? 'none' : 'flex';
    const icoChat  = launcher && launcher.querySelector('.ico-chat');
    const icoClose = launcher && launcher.querySelector('.ico-close');
    if (icoChat)  icoChat.style.display  = isOpen ? 'none'  : 'block';
    if (icoClose) icoClose.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
      if (inputEl) inputEl.focus();
      if (w.innerWidth <= 480) d.body.style.overflow = 'hidden';
    } else {
      d.body.style.overflow = '';
    }
  }

  function switchTab(id) {
    d.querySelectorAll('.lv-pane').forEach(p => p.classList.remove('active'));
    d.querySelectorAll('.lv-tab').forEach(b => b.classList.remove('active'));
    const pane = d.getElementById('lv-pane-' + id);
    const tab  = d.querySelector(`.lv-tab[data-tab="${id}"]`);
    if (pane) pane.classList.add('active');
    if (tab)  tab.classList.add('active');
  }

  function addMsg(who, html) {
    const div = d.createElement('div');
    div.className = 'lv-msg ' + who;
    div.innerHTML = who === 'bot'
      ? `<div class="lv-bot-icon">&#x1F916;</div><div class="lv-bubble">${html}</div>`
      : `<div class="lv-bubble">${html}</div>`;
    msgList.appendChild(div);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function showTyping() {
    const div = d.createElement('div');
    div.className = 'lv-msg bot'; div.id = 'lv-typing';
    div.innerHTML = `<div class="lv-bot-icon">&#x1F916;</div><div class="lv-bubble lv-typing"><span class="lv-dot"></span><span class="lv-dot"></span><span class="lv-dot"></span></div>`;
    msgList.appendChild(div);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function removeTyping() {
    const t = d.getElementById('lv-typing');
    if (t) t.remove();
  }

  function setQuickReplies(items) {
    qWrap.innerHTML = '';
    items.forEach(item => {
      const btn = d.createElement('button');
      btn.className = 'lv-quick';
      btn.textContent = item;
      btn.addEventListener('click', () => send(item));
      qWrap.appendChild(btn);
    });
  }

  function openExternal(url) {
    if (w.ReactNativeWebView) {
      w.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open_url', url }));
      return;
    }
    const win = w.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') w.location.href = url;
  }

  async function saveMessage(role, text) {
    try {
      await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid, role, message: text, page: location.href })
      });
    } catch (_) { /* silent — never break chat UX */ }
  }

  function send(text) {
    const msg = (text || (inputEl && inputEl.value) || '').trim();
    if (!msg) return;
    if (inputEl) inputEl.value = '';
    addMsg('user', msg);
    saveMessage('user', msg);
    setQuickReplies([]);
    setTimeout(showTyping, 300);
    setTimeout(() => {
      removeTyping();
      const reply = getReply(msg);
      addMsg('bot', reply.text);
      saveMessage('bot', reply.text.replace(/<[^>]+>/g, '').replace(/&#x[\dA-Fa-f]+;|&\w+;/g, ' '));
      if (reply.quick.length) setQuickReplies(reply.quick);
    }, 1200);
    if (w.ReactNativeWebView) {
      w.ReactNativeWebView.postMessage(JSON.stringify({ type: 'message_sent', text: msg }));
    }
  }

  // ── Event bindings ────────────────────────────────────────────────────────────
  if (launcher) launcher.addEventListener('click', toggle);
  if (inputEl)  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  const sendBtn = d.getElementById('lv-send-btn');
  if (sendBtn) sendBtn.addEventListener('click', () => send());

  d.querySelectorAll('.lv-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  d.querySelectorAll('.lv-quick[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => send(btn.dataset.quick));
  });
  d.querySelectorAll('.lv-channel-btn[data-url]').forEach(btn => {
    btn.addEventListener('click', () => openExternal(btn.dataset.url));
  });

  // ── Auto-open ─────────────────────────────────────────────────────────────────
  if (MODE === 'inline') {
    panel.classList.add('open');
    isOpen = true;
  } else if (AOPEN) {
    setTimeout(toggle, 600);
  }

  // ── Vapi Voice AI ─────────────────────────────────────────────────────────────
  if (VAPI_KEY) {
    let vapiInst    = null;
    let callActive  = false;

    const orbEl     = d.getElementById('lv-voice-orb');
    const statusEl  = d.getElementById('lv-voice-status');
    const subEl     = d.getElementById('lv-voice-sub');
    const barsEl    = d.getElementById('lv-voice-bars');
    const micIcon   = d.getElementById('lv-mic-icon');
    const endIcon   = d.getElementById('lv-end-icon');

    function setVoiceUI(state) {
      orbEl.className  = 'lv-voice-orb';
      barsEl.className = 'lv-voice-bars';
      micIcon.style.display = 'block';
      endIcon.style.display = 'none';

      if (state === 'idle') {
        statusEl.textContent = 'Tap to call AI Agent';
        subEl.textContent    = 'Speak naturally — the AI will answer';
      } else if (state === 'connecting') {
        orbEl.classList.add('connecting');
        statusEl.textContent = 'Connecting…';
        subEl.textContent    = 'Please wait';
      } else if (state === 'active') {
        orbEl.classList.add('active');
        micIcon.style.display = 'none';
        endIcon.style.display = 'block';
        statusEl.textContent  = 'Call active — tap to end';
        subEl.textContent     = 'AI Agent is listening';
      } else if (state === 'speaking') {
        orbEl.classList.add('active');
        barsEl.classList.add('speaking');
        micIcon.style.display = 'none';
        endIcon.style.display = 'block';
        statusEl.textContent  = 'AI Agent is speaking…';
        subEl.textContent     = 'Tap orb to end call';
      } else if (state === 'error') {
        statusEl.textContent = 'Connection failed';
        subEl.textContent    = 'Check mic permissions and try again';
      }
    }

    function loadVapiSDK(cb) {
      if (w.Vapi) { cb(); return; }
      const s  = d.createElement('script');
      s.src    = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.umd.js';
      s.onload = cb;
      s.onerror = () => setVoiceUI('error');
      d.head.appendChild(s);
    }

    function initVapi() {
      loadVapiSDK(() => {
        vapiInst = new w.Vapi(VAPI_KEY);

        vapiInst.on('call-start',   () => { callActive = true;  setVoiceUI('active'); });
        vapiInst.on('call-end',     () => { callActive = false; setVoiceUI('idle'); });
        vapiInst.on('speech-start', () => setVoiceUI('speaking'));
        vapiInst.on('speech-end',   () => setVoiceUI('active'));
        vapiInst.on('error',        () => { callActive = false; setVoiceUI('error'); });

        orbEl.addEventListener('click', () => {
          if (!callActive) {
            setVoiceUI('connecting');
            vapiInst.start(VAPI_AID);
          } else {
            vapiInst.stop();
          }
        });
      });
    }

    initVapi();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  const pub = w.LiveChat = w.LiveChat || {};
  pub.open   = () => { if (!isOpen) toggle(); };
  pub.close  = () => { if (isOpen)  toggle(); };
  pub.toggle = toggle;
  pub.send   = send;

})(window, document);
