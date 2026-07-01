/* TrackPass waitlist capture — drop-in modal + handler.
 *
 * Set the endpoint once the Worker is deployed:
 *   window.TRACKPASS_WAITLIST_ENDPOINT = 'https://trackpass-waitlist.<your>.workers.dev';
 * Until then, the form runs in "preview" mode: it validates + thanks the user and
 * logs locally, so the UX is complete and ready to go live by setting one URL.
 */
(function () {
  const ENDPOINT = window.TRACKPASS_WAITLIST_ENDPOINT || null;

  // Capture ?ref= from URL and store in localStorage
  (function() {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) localStorage.setItem('tp_ref', ref);
    } catch(_) {}
  })();

  const css = `
  .tp-wl-overlay{position:fixed;inset:0;background:rgba(8,24,16,.6);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:9999;padding:1rem}
  .tp-wl-overlay.open{display:flex}
  .tp-wl-modal{background:#fff;border-radius:1.75rem;max-width:30rem;width:100%;padding:2rem;box-shadow:0 24px 60px rgba(16,50,35,.35);position:relative;animation:tpwlin .25s ease}
  @keyframes tpwlin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .tp-wl-close{position:absolute;top:1rem;right:1rem;background:transparent;border:0;cursor:pointer;color:#5b6b61;font-size:1.5rem;line-height:1}
  .tp-wl-modal h3{font-family:'Sora',sans-serif;font-size:1.5rem;color:#16412b;margin:0 0 .35rem}
  .tp-wl-modal p.sub{color:#5b6b61;margin:0 0 1.25rem;font-size:.95rem}
  .tp-wl-field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.9rem}
  .tp-wl-field label{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#5b6b61;font-weight:600}
  .tp-wl-field input,.tp-wl-field select{padding:.8rem 1rem;border-radius:.75rem;border:1px solid #dfe6e1;background:#f7faf8;font-size:1rem;font-family:'Manrope',sans-serif}
  .tp-wl-field input:focus,.tp-wl-field select:focus{outline:none;border-color:#16412b;background:#fff}
  .tp-wl-field input:-webkit-autofill,.tp-wl-field input:-webkit-autofill:hover,.tp-wl-field input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0px 1000px #f7faf8 inset;box-shadow:0 0 0px 1000px #f7faf8 inset;-webkit-text-fill-color:#002113}
  .tp-wl-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
  .tp-wl-submit{width:100%;background:#16412b;color:#fff;border:0;border-radius:999px;padding:.95rem;font-weight:700;font-size:1rem;cursor:pointer;transition:background .2s}
  .tp-wl-submit:hover{background:#0c2c1c}
  .tp-wl-submit:disabled{opacity:.6;cursor:default}
  .tp-wl-msg{margin-top:.85rem;font-size:.9rem;min-height:1.1rem}
  .tp-wl-msg.err{color:#b3261e}
  .tp-wl-msg.ok{color:#1f7a4d}
  .tp-wl-done{text-align:center;padding:1rem 0}
  .tp-wl-done .ico{font-size:3rem}
  .tp-wl-foot{font-size:.78rem;color:#8a988f;margin-top:1rem;text-align:center}`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "tp-wl-overlay";
  overlay.innerHTML = `
    <div class="tp-wl-modal" role="dialog" aria-modal="true" aria-labelledby="tpwl-h">
      <button class="tp-wl-close" aria-label="Close">&times;</button>
      <div class="tp-wl-body">
        <h3 id="tpwl-h">Free: The Texas Muni Golf Guide</h3>
        <p class="sub">95 public courses across Austin, San Antonio, DFW &amp; Houston — green fees, the best values, and how to play more golf for less. Straight to your inbox.</p>
        <form class="tp-wl-form" novalidate>
          <div class="tp-wl-field">
            <label for="tpwl-email">Email *</label>
            <input id="tpwl-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          </div>
          <div class="tp-wl-field">
            <label for="tpwl-name">Name</label>
            <input id="tpwl-name" name="name" type="text" autocomplete="name" placeholder="Optional" />
          </div>
          <div class="tp-wl-field">
            <label for="tpwl-region">Where do you play?</label>
            <select id="tpwl-region" name="region">
              <option value="">Pick a region (optional)</option>
              <option>Austin</option>
              <option>San Antonio</option>
              <option>Dallas–Fort Worth</option>
              <option>Houston</option>
              <option>Elsewhere in Texas</option>
            </select>
          </div>
          <div class="tp-wl-hp"><label>Company<input name="company" tabindex="-1" autocomplete="off" /></label></div>
          <button class="tp-wl-submit" type="submit">Send me the guide</button>
          <div class="tp-wl-msg" role="status" aria-live="polite"></div>
        </form>
        <p class="tp-wl-foot">One email with the guide, then the occasional Texas golf tip. Unsubscribe anytime.</p>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const modal = overlay.querySelector(".tp-wl-modal");
  const form = overlay.querySelector(".tp-wl-form");
  const msg = overlay.querySelector(".tp-wl-msg");
  const body = overlay.querySelector(".tp-wl-body");
  let lastFocus = null;
  let formStartFired = false;

  // Fire waitlist_form_started once when the user first touches the email field
  const emailInput = overlay.querySelector("#tpwl-email");
  emailInput && emailInput.addEventListener("focus", function onFirstFocus() {
    if (formStartFired) return;
    formStartFired = true;
    emailInput.removeEventListener("focus", onFirstFocus);
    if (window.posthog) posthog.capture("waitlist_form_started");
  });

  function open(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    overlay.classList.add("open");
    setTimeout(() => overlay.querySelector("#tpwl-email")?.focus(), 50);
  }
  function close() {
    overlay.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  overlay.querySelector(".tp-wl-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("open")) close(); });

  const STRIPE_LINK = "https://buy.stripe.com/5kQ28r7vmbGP0SW11p2Ji00";

  function showDone(emailed) {
    body.innerHTML = `
      <div class="tp-wl-done">
        <div class="ico">⛳️</div>
        <h3>Check your inbox!</h3>
        <p class="sub">The Texas Muni Golf Guide is on its way.${emailed === false ? "<br><small>(Saved — email pending.)</small>" : ""}</p>
        <a href="${STRIPE_LINK}" class="tp-wl-submit" style="display:block;text-align:center;text-decoration:none;margin-bottom:.75rem">Get the pass — $199/year →</a>
        <button class="tp-wl-submit" type="button" style="background:#5b6b61">Maybe later</button>
        <p class="tp-wl-foot">Founding-member rate, 30-day money-back guarantee.</p>
      </div>`;
    body.querySelectorAll("button").forEach(b => b.addEventListener("click", close));
    if (window.posthog) posthog.capture("stripe_cta_shown");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.type = "guide";
    try { const ref = localStorage.getItem('tp_ref'); if (ref) data.ref = ref; } catch(_) {}
    const email = (data.email || "").trim();
    msg.className = "tp-wl-msg";
    msg.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.className = "tp-wl-msg err";
      msg.textContent = "Please enter a valid email address.";
      return;
    }
    const btn = form.querySelector(".tp-wl-submit");
    btn.disabled = true; btn.textContent = "Sending…";

    if (!ENDPOINT) {
      // Preview mode: endpoint not wired yet. Complete the UX, log locally.
      try { console.info("[TrackPass waitlist preview] signup:", data); } catch (_) {}
      try {
        const k = "tp_waitlist_preview";
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        arr.push({ ...data, ts: new Date().toISOString() });
        localStorage.setItem(k, JSON.stringify(arr));
      } catch (_) {}
      setTimeout(() => showDone(true), 400);
      return;
    }

    try {
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        if (window.posthog) {
          posthog.capture("waitlist_form_completed", { region: data.region || null, has_name: !!(data.name || "").trim() });
          posthog.identify(email);
        }
        try {
          localStorage.setItem("tp_member_email", email);
          localStorage.setItem("tp_member_name", (data.name || "").trim());
        } catch (_) {}
        showDone(j.emailed);
        return;
      }
      msg.className = "tp-wl-msg err";
      msg.textContent = j.error || "Something went wrong — please try again.";
    } catch (_) {
      msg.className = "tp-wl-msg err";
      msg.textContent = "Network error — please try again.";
    } finally {
      btn.disabled = false; btn.textContent = "Send me the guide";
    }
  });

  // Open only on explicit triggers — never intercept Join Now / Sign In / plans links.
  function wire() {
    document.querySelectorAll('[data-waitlist], a[href="#guide"]').forEach((el) => el.addEventListener("click", open));
  }

  // One-time soft trigger: exit-intent on desktop, deep-scroll on mobile.
  (function () {
    const SEEN_KEY = "tp_guide_seen";
    try { if (localStorage.getItem(SEEN_KEY)) return; } catch (_) { return; }
    function fireOnce() {
      try { localStorage.setItem(SEEN_KEY, "1"); } catch (_) {}
      open();
    }
    if (matchMedia("(pointer: fine)").matches) {
      document.addEventListener("mouseout", function onOut(e) {
        if (!e.relatedTarget && e.clientY <= 0) {
          document.removeEventListener("mouseout", onOut);
          fireOnce();
        }
      });
    } else {
      let armed = false;
      setTimeout(() => { armed = true; }, 15000);
      window.addEventListener("scroll", function onScroll() {
        if (!armed) return;
        const depth = (window.scrollY + innerHeight) / document.body.scrollHeight;
        if (depth > 0.65) {
          window.removeEventListener("scroll", onScroll);
          fireOnce();
        }
      }, { passive: true });
    }
  })();
  if (document.readyState !== "loading") wire();
  else document.addEventListener("DOMContentLoaded", wire);

  window.TrackPassWaitlist = { open, close };

  // Exit-intent: show modal when cursor exits top of viewport. One shot per session.
  if (!sessionStorage.getItem("tp_exit_shown")) {
    document.addEventListener("mouseleave", function exitIntent(e) {
      if (e.clientY > 0) return;
      sessionStorage.setItem("tp_exit_shown", "1");
      document.removeEventListener("mouseleave", exitIntent);
      if (overlay.classList.contains("open")) return; // already open
      // Personalise heading for exit-intent context
      const h = overlay.querySelector("#tpwl-h");
      if (h) h.textContent = "Wait — grab your founding rate first";
      if (window.posthog) posthog.capture("exit_intent_triggered");
      open();
    });
  }
})();
