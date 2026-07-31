// ==UserScript==
// @name         Wolfy.net - Wolfy Skin Slots Unlocker
// @namespace    wolfy-skin-slots-unlocker
// @version      20.2
// @description  Unlocks 6 skin slots on Wolfy.net with local cache and instant hover previews. Saves hover preview on "Valider".
// @author       go-lover
// @match        *://wolfy.net/*/skin*
// @match        *://*.wolfy.net/*/skin*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  function main() {
    // ==========================================
    // 1. CONSTANTS & STORAGE
    // ==========================================
    const KEYS = {
      REAL_UUID: 'wolfy_real_slot_uuid',
      ACTIVE_INDEX: 'wolfy_virtual_active_index',
      VIRTUAL_SKINS: 'wolfy_virtual_skins',
      BASE_SKIN: 'wolfy_base_skin_full',
      PAGE_CACHE: 'wolfy_virtual_page_cache'
    };

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const DEFAULT_SKIN = {
      eyes: { id: 'E1', color: 1 },
      face: { id: 'J3', color: 3 },
      hair: { id: 'H1', color: 4 },
      nose: { id: 'N5', color: 0 },
      top: { id: '142', color: 0 },
      bottom: null,
      shoes: null,
      tombstone: { id: 'T1', color: 0 },
      glasses: null
    };

    const Storage = {
      get(key, fallback = null) {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch {
          return fallback;
        }
      },
      set(key, val) {
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch {}
      },
      getString(key) {
        return localStorage.getItem(key);
      },
      setString(key, val) {
        try {
          localStorage.setItem(key, val);
        } catch {}
      }
    };

    const SlotState = {
      getActiveIndex() {
        const val = parseInt(Storage.getString(KEYS.ACTIVE_INDEX) || '1', 10);
        return val >= 1 && val <= 6 ? val : 1;
      },
      setActiveIndex(idx) {
        Storage.setString(KEYS.ACTIVE_INDEX, String(idx));
      },
      getRealUuid() {
        return Storage.getString(KEYS.REAL_UUID);
      },
      setRealUuid(uuid) {
        Storage.setString(KEYS.REAL_UUID, uuid);
      },
      getSkins() {
        return Storage.get(KEYS.VIRTUAL_SKINS, {});
      },
      setSkins(skins) {
        Storage.set(KEYS.VIRTUAL_SKINS, skins);
      },
      getBaseSkin() {
        return Storage.get(KEYS.BASE_SKIN, null);
      },
      setBaseSkin(skin) {
        Storage.set(KEYS.BASE_SKIN, skin);
      },
      getFallbackSkin() {
        return this.getBaseSkin() || DEFAULT_SKIN;
      }
    };

    // ==========================================
    // 2. STYLES INJECTION
    // ==========================================
    function injectStyles() {
      if (document.getElementById('wolfy-unlocker-styles')) return;
      const style = document.createElement('style');
      style.id = 'wolfy-unlocker-styles';
      style.textContent = `
        #wolfy-slot-preview {
          position: fixed;
          z-index: 2147483646;
          width: 170px;
          height: 220px;
          background: rgba(22, 22, 32, 0.72);
          backdrop-filter: blur(14px) saturate(1.2);
          -webkit-backdrop-filter: blur(14px) saturate(1.2);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          display: none;
          pointer-events: none;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-6px) scale(0.98);
          transition: opacity 0.18s ease, transform 0.18s ease;
        }
        #wolfy-slot-preview.visible {
          display: block;
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        #wolfy-slot-preview .preview-arrow {
          position: absolute;
          top: 50%;
          width: 12px;
          height: 12px;
          background: rgba(22, 22, 32, 0.72);
          backdrop-filter: blur(14px);
          transform: translateY(-50%) rotate(45deg);
        }
        #wolfy-slot-preview .preview-arrow.left {
          left: -6px;
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        #wolfy-slot-preview .preview-arrow.right {
          right: -6px;
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        #wolfy-slot-preview-label {
          position: absolute;
          top: 8px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }
        #wolfy-slot-preview-label span:first-child {
          font: 700 11px Montserrat, sans-serif;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.75);
          text-transform: uppercase;
        }
        #wolfy-slot-preview-num {
          font: 800 12px Montserrat, sans-serif;
          color: #fff;
          background: rgba(255, 70, 85, 0.9);
          padding: 2px 7px;
          border-radius: 20px;
          min-width: 18px;
          text-align: center;
        }
        #wolfy-slot-preview-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 8px 8px 8px;
          box-sizing: border-box;
        }
        .preview-empty-text {
          color: rgba(255, 255, 255, 0.55);
          font: 600 11px Montserrat, sans-serif;
          text-align: center;
          line-height: 1.4;
        }
        .preview-empty-text span {
          font-weight: 400;
          color: rgba(255, 255, 255, 0.35);
          font-size: 10px;
          display: block;
        }
        .preview-empty-icon {
          margin-top: 10px;
          font-size: 22px;
          opacity: 0.3;
        }
        .preview-overlay-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 36px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.45), transparent);
          pointer-events: none;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    // ==========================================
    // 3. TOOLTIP MANAGER
    // ==========================================
    class TooltipManager {
      constructor() {
        this.el = null;
        this.hideTimer = null;
      }

      init() {
        if (this.el) return this.el;
        const tip = document.createElement('div');
        tip.id = 'wolfy-slot-preview';
        tip.innerHTML = `
          <div class="preview-arrow left"></div>
          <div id="wolfy-slot-preview-label">
            <span>Slot</span>
            <span id="wolfy-slot-preview-num">1</span>
          </div>
          <div id="wolfy-slot-preview-inner"></div>
          <div class="preview-overlay-gradient"></div>
        `;
        document.body.appendChild(tip);
        this.el = tip;
        return tip;
      }

      show(slotIndex, anchor) {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }
        const tip = this.init();
        const inner = tip.querySelector('#wolfy-slot-preview-inner');
        const num = tip.querySelector('#wolfy-slot-preview-num');

        if (num) num.textContent = String(slotIndex);

        const svgHtml = getSvgForSlot(slotIndex);
        if (!svgHtml) {
          inner.innerHTML = `
            <div class="preview-empty-text">
              No preview yet<br>
              <span>Switch to slot ${slotIndex} once to cache</span>
              <div class="preview-empty-icon">👁️</div>
            </div>`;
        } else {
          inner.innerHTML = svgHtml;
        }

        tip.classList.add('visible');
        this.position(anchor);
      }

      hide() {
        if (!this.el) return;
        this.el.classList.remove('visible');
        this.hideTimer = setTimeout(() => {
          if (this.el) this.el.style.display = 'none';
        }, 180);
      }

      position(anchor) {
        if (!this.el || !anchor) return;
        this.el.style.display = 'block';

        const rect = anchor.getBoundingClientRect();
        const tipW = 170;
        const tipH = 220;
        const arrow = this.el.querySelector('.preview-arrow');

        let left = rect.right + 16;
        let top = rect.top + rect.height / 2 - tipH / 2;

        if (left + tipW > window.innerWidth - 12) {
          left = rect.left - tipW - 16;
          if (arrow) {
            arrow.classList.remove('left');
            arrow.classList.add('right');
          }
        } else {
          if (arrow) {
            arrow.classList.remove('right');
            arrow.classList.add('left');
          }
        }

        top = Math.max(10, Math.min(top, window.innerHeight - tipH - 10));

        this.el.style.left = `${left}px`;
        this.el.style.top = `${top}px`;
      }
    }

    const tooltip = new TooltipManager();

    // ==========================================
    // 4. DATA EXTRACTION & CACHING
    // ==========================================
    function extractUuid(data) {
      if (!data || typeof data !== 'object') return SlotState.getRealUuid();

      const candidates = [];
      if (data.slotId) candidates.push(data.slotId);
      if (data.user?.slotId) candidates.push(data.user.slotId);
      if (Array.isArray(data.slots)) data.slots.forEach(s => s?.id && candidates.push(s.id));
      if (Array.isArray(data.user?.slots)) data.user.slots.forEach(s => s?.id && candidates.push(s.id));

      for (const cand of candidates) {
        if (typeof cand === 'string' && UUID_REGEX.test(cand)) {
          SlotState.setRealUuid(cand);
          return cand;
        }
      }
      return SlotState.getRealUuid();
    }

    function extractFullSkin(data) {
      if (!data || typeof data !== 'object') return SlotState.getBaseSkin();

      const skin =
        data.skin ||
        data.user?.skin ||
        data.slots?.[0]?.skin ||
        data.user?.slots?.[0]?.skin ||
        null;

      if (skin && typeof skin === 'object' && Object.keys(skin).length > 2) {
        SlotState.setBaseSkin(skin);
        const skins = SlotState.getSkins();
        if (!skins['1']) {
          skins['1'] = skin;
          SlotState.setSkins(skins);
        }
        if (!Storage.getString(KEYS.ACTIVE_INDEX)) {
          SlotState.setActiveIndex(1);
        }
        return skin;
      }
      return SlotState.getBaseSkin();
    }

    function cacheCurrentPage() {
      try {
        const active = SlotState.getActiveIndex();
        const mainEl = document.querySelector('div[class*="mainInteraction"]');
        const leftEl = document.querySelector('div[class*="leftContent"]');
        if (!mainEl && !leftEl) return;

        const cache = Storage.get(KEYS.PAGE_CACHE, {});
        cache[active] = {
          main: mainEl ? mainEl.innerHTML : null,
          left: leftEl ? leftEl.innerHTML : null,
          ts: Date.now()
        };
        Storage.set(KEYS.PAGE_CACHE, cache);
      } catch {}
    }

    // Schedules multiple recache attempts to reliably catch DOM updates after clicking Valider
    function triggerPageRecache() {
      cacheCurrentPage();
      setTimeout(cacheCurrentPage, 100);
      setTimeout(cacheCurrentPage, 300);
      setTimeout(cacheCurrentPage, 700);
      setTimeout(cacheCurrentPage, 1500);
    }

    function applyCachedPage(idx) {
      try {
        const entry = Storage.get(KEYS.PAGE_CACHE, {})[idx];
        if (!entry) return false;

        const mainEl = document.querySelector('div[class*="mainInteraction"]');
        const leftEl = document.querySelector('div[class*="leftContent"]');
        let applied = false;

        if (entry.main && mainEl) {
          mainEl.innerHTML = entry.main;
          applied = true;
        }
        if (entry.left && leftEl) {
          leftEl.innerHTML = entry.left;
          applied = true;
        }

        if (applied) {
          const nativeSlots = document.querySelector('div[class*="skinSlots"]:not(#wolfy_virtual_bar)');
          if (nativeSlots) {
            nativeSlots.setAttribute('data-wolfy-fixed', 'true');
            nativeSlots.style.setProperty('display', 'none', 'important');
          }
          setTimeout(() => {
            injectBar(true);
            updateBarActive(idx);
          }, 20);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    function getSvgForSlot(idx) {
      try {
        const cache = Storage.get(KEYS.PAGE_CACHE, {})[idx];
        if (!cache?.main) return null;

        const doc = new DOMParser().parseFromString(`<div>${cache.main}</div>`, 'text/html');
        const svg = doc.querySelector('svg');
        if (!svg) return null;

        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.filter = 'drop-shadow(0 6px 18px rgba(0,0,0,.45))';
        return svg.outerHTML;
      } catch {
        return null;
      }
    }

    // ==========================================
    // 5. SLOT BAR UI INJECTION
    // ==========================================
    function getNativeInfo(orig) {
      const slotSample = orig.querySelector('div[class*="skinSlot"]');
      const activeSample = orig.querySelector('div[class*="active"]') || slotSample;
      const pinSample = orig.querySelector('div[class*="pin"]');
      const checkImg = orig.querySelector('img[alt="Équipé"]');

      let skinSlotsClass = orig.className;
      let slotBaseClass = 'skinSlot';
      let activeClass = 'active';
      let pinBaseClass = 'pin';
      let iconClass = 'icon';
      let checkSrc = '/static/img/icons/check.svg';

      if (slotSample) {
        const f = Array.from(slotSample.classList).find(c => c.includes('skinSlot') && !c.includes('Slots'));
        if (f) slotBaseClass = f;
      }
      if (activeSample) {
        const f = Array.from(activeSample.classList).find(c => c.includes('active'));
        if (f) activeClass = f;
      }
      if (pinSample) {
        const f = Array.from(pinSample.classList).find(c => c.includes('pin') && !c.includes('premium'));
        if (f) pinBaseClass = f;
      }
      if (checkImg) {
        const f = Array.from(checkImg.classList).find(c => c.includes('icon'));
        if (f) iconClass = f;
        if (checkImg.src) checkSrc = checkImg.src;
      }

      return { skinSlotsClass, slotBaseClass, activeClass, pinBaseClass, iconClass, checkSrc };
    }

    function updateBarActive(newIdx) {
      const bar = document.getElementById('wolfy_virtual_bar');
      if (!bar) return;

      const orig = document.querySelector('div[class*="skinSlots"][data-wolfy-fixed]');
      const info = orig ? getNativeInfo(orig) : null;
      const activeClass = info?.activeClass || 'active';
      const pinBase = info?.pinBaseClass || 'pin';
      const iconCls = info?.iconClass || 'icon';
      const checkSrc = info?.checkSrc || '/static/img/icons/check.svg';

      bar.querySelectorAll('div[data-virtual-index]').forEach(el => {
        const idx = parseInt(el.dataset.virtualIndex, 10);
        el.style.opacity = '1';
        el.style.pointerEvents = '';

        if (idx === newIdx) {
          el.classList.add(activeClass);
          if (!el.querySelector('div[class*="pin"]')) {
            const pin = document.createElement('div');
            pin.className = pinBase;
            pin.innerHTML = `<img alt="Équipé" class="${iconCls}" src="${checkSrc}">`;
            el.appendChild(pin);
          }
        } else {
          el.classList.remove(activeClass);
          const pin = el.querySelector('div[class*="pin"]');
          if (pin) pin.remove();
        }
      });
    }

    function injectBar(force = false) {
      const orig = document.querySelector('div[class*="skinSlots"]:not([data-wolfy-fixed])');
      if (!orig && !force) {
        if (document.getElementById('wolfy_virtual_bar')) {
          updateBarActive(SlotState.getActiveIndex());
        }
        return;
      }

      if (orig) {
        orig.setAttribute('data-wolfy-fixed', 'true');
        orig.style.setProperty('display', 'none', 'important');
      }

      const refOrig = orig || document.querySelector('div[class*="skinSlots"][data-wolfy-fixed]');
      if (!refOrig) return;

      const oldBar = document.getElementById('wolfy_virtual_bar');
      if (oldBar) oldBar.remove();

      const info = getNativeInfo(refOrig);
      const parent = refOrig.parentNode;
      if (!parent) return;

      const bar = document.createElement('div');
      bar.id = 'wolfy_virtual_bar';
      bar.className = info.skinSlotsClass;
      bar.setAttribute('data-wolfy-fixed', 'true');

      const activeIdx = SlotState.getActiveIndex();

      for (let i = 1; i <= 6; i++) {
        const slot = document.createElement('div');
        slot.className = `${info.slotBaseClass}${i === activeIdx ? ' ' + info.activeClass : ''}`;
        slot.dataset.virtualIndex = String(i);
        slot.innerHTML = `<span>${i}</span>${
          i === activeIdx
            ? `<div class="${info.pinBaseClass}"><img alt="Équipé" class="${info.iconClass}" src="${info.checkSrc}"></div>`
            : ''
        }`;

        slot.addEventListener('mouseenter', () => tooltip.show(i, slot));
        slot.addEventListener('mouseleave', () => tooltip.hide());
        slot.addEventListener('mousemove', () => tooltip.position(slot));

        slot.addEventListener('click', async () => {
          tooltip.hide();
          const current = SlotState.getActiveIndex();
          if (i === current) return;

          const realUuid = SlotState.getRealUuid();
          if (!realUuid) {
            alert('First edit an item and click Validate to register your slot UUID.');
            return;
          }

          const skins = SlotState.getSkins();
          const base = SlotState.getFallbackSkin();
          let target = skins[i];

          if (!target) {
            target = skins[current] || base;
            skins[i] = target;
            SlotState.setSkins(skins);
          }

          applyCachedPage(i);
          SlotState.setActiveIndex(i);
          updateBarActive(i);

          try {
            await fetch(`https://wolfy.net/api/slot/${realUuid}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(target)
            });
            setTimeout(() => window.location.reload(), 80);
          } catch {
            SlotState.setActiveIndex(current);
            updateBarActive(current);
          }
        });

        bar.appendChild(slot);
      }

      parent.insertBefore(bar, refOrig.nextSibling);
    }

    // ==========================================
    // 6. EVENT LISTENERS (Valider Click)
    // ==========================================
    function setupValiderListener() {
      document.addEventListener(
        'click',
        evt => {
          const target = evt.target;
          if (!target) return;
          const clickable = target.closest('button, div, a, span');
          if (clickable && clickable.textContent && clickable.textContent.trim().toLowerCase().includes('valider')) {
            triggerPageRecache();
          }
        },
        true
      );
    }

    // ==========================================
    // 7. NETWORK INTERCEPTORS (Fetch & XHR)
    // ==========================================
    function setupNetworkInterceptors() {
      const origFetch = window.fetch;

      window.fetch = async function (...args) {
        let reqInput = args[0];
        let reqInit = args[1] || {};
        const url = typeof reqInput === 'string' ? reqInput : (reqInput?.url || '');
        const method = (reqInit.method || (reqInput instanceof Request ? reqInput.method : 'GET') || 'GET').toUpperCase();

        if (method === 'PUT' && url.includes('/api/slot/')) {
          const realUuid = SlotState.getRealUuid();
          const activeIdx = SlotState.getActiveIndex();
          let bodyText = null;

          if (typeof reqInit.body === 'string') {
            bodyText = reqInit.body;
          } else if (reqInput instanceof Request) {
            try { bodyText = await reqInput.clone().text(); } catch {}
          }

          if (bodyText) {
            let parsed = null;
            try { parsed = JSON.parse(bodyText); } catch {}

            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              const skins = SlotState.getSkins();
              const base = SlotState.getFallbackSkin();
              const current = skins[activeIdx] || base;
              const merged = { ...current, ...parsed };

              skins[activeIdx] = merged;
              SlotState.setSkins(skins);
              SlotState.setBaseSkin(merged);

              const fullBody = JSON.stringify(merged);
              const finalUrl = realUuid ? url.replace(/\/api\/slot\/[^\/\?]+/, `/api/slot/${realUuid}`) : url;

              if (reqInput instanceof Request) {
                args[0] = new Request(finalUrl, {
                  method: 'PUT',
                  headers: reqInput.headers,
                  body: fullBody,
                  credentials: reqInput.credentials || 'include',
                  mode: reqInput.mode
                });
                args[1] = undefined;
              } else {
                args[0] = finalUrl;
                args[1] = {
                  ...reqInit,
                  method: 'PUT',
                  body: fullBody,
                  credentials: reqInit.credentials || 'include',
                  headers: {
                    ...(reqInit.headers || {}),
                    'Content-Type': 'application/json'
                  }
                };
              }
            }
          }
        }

        const resp = await origFetch.apply(this, args);

        if (resp?.ok && (url.includes('/api/user') || url.includes('/leaderboard/player/self') || url.includes('/api/slot/'))) {
          try {
            const data = await resp.clone().json();
            extractUuid(data);
            extractFullSkin(data);
            triggerPageRecache();
          } catch {}
        }

        return resp;
      };

      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._m = method;
        this._u = url;
        return origOpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function (body) {
        if (this._m?.toUpperCase() === 'PUT' && this._u?.includes('/api/slot/')) {
          const realUuid = SlotState.getRealUuid();
          if (realUuid) {
            const newUrl = this._u.replace(/\/api\/slot\/[^\/\?]+/, `/api/slot/${realUuid}`);
            if (newUrl !== this._u) {
              try { origOpen.call(this, 'PUT', newUrl, true); } catch {}
            }
          }

          if (body) {
            try {
              const parsed = typeof body === 'string' ? JSON.parse(body) : null;
              if (parsed && typeof parsed === 'object') {
                const idx = SlotState.getActiveIndex();
                const skins = SlotState.getSkins();
                const base = SlotState.getFallbackSkin();
                const merged = { ...(skins[idx] || base), ...parsed };

                skins[idx] = merged;
                SlotState.setSkins(skins);
                SlotState.setBaseSkin(merged);
                body = JSON.stringify(merged);
              }
            } catch {}
          }

          this.addEventListener('load', () => {
            triggerPageRecache();
          });
        }
        return origSend.apply(this, [body]);
      };
    }

    // ==========================================
    // 8. INITIALIZATION & OBSERVER
    // ==========================================
    injectStyles();
    setupValiderListener();
    setupNetworkInterceptors();

    function throttle(fn, wait) {
      let time = Date.now();
      return function (...args) {
        if (time + wait - Date.now() < 0) {
          fn.apply(this, args);
          time = Date.now();
        }
      };
    }

    const throttledInject = throttle(() => injectBar(false), 150);

    const observer = new MutationObserver(() => throttledInject());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('load', () => {
      triggerPageRecache();
    });
  }

  // Inject into main execution context to reach global fetch & XHR cleanly
  function injectContext() {
    const script = document.createElement('script');
    script.textContent = `(${main.toString()})();`;
    (document.documentElement || document.head).appendChild(script);
    script.remove();
  }

  if (document.documentElement) {
    injectContext();
  } else {
    const timer = setInterval(() => {
      if (document.documentElement) {
        clearInterval(timer);
        injectContext();
      }
    }, 5);
  }
})();
