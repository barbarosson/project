/**
 * SitePulse tracking snippet (M1–M4)
 * Install:
 *   <script defer src="https://YOUR_HOST/t.js" data-site="YOUR_SITE_KEY"></script>
 *
 * Custom events:
 *   sitepulse.track('signup_complete');
 *   sitepulse.pageview();
 *
 * Consent (when site.requireConsent = true):
 *   sitepulse.consent(true);  // start tracking
 *   sitepulse.consent(false); // stop (does not delete prior events)
 *
 * Identity mode from /api/config?k=KEY
 */
(function () {
  "use strict";
  var script =
    document.currentScript ||
    (function () {
      var list = document.getElementsByTagName("script");
      return list[list.length - 1];
    })();
  if (!script) return;

  var siteKey = script.getAttribute("data-site");
  if (!siteKey) return;

  var src = script.src || "";
  var base = src.replace(/\/t\.js(\?.*)?$/, "");
  if (!base) {
    base = window.location.origin;
  }

  var COOKIE_VID = "_sp_vid";
  var COOKIE_SID = "_sp_sid";
  var SESSION_MS = 30 * 60 * 1000;
  var identityMode = "first_party_cookie";
  var requireConsent = false;
  var consentGranted = false;
  var booted = false;
  var ready = false;
  var queue = [];
  var historyHooked = false;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxxyxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function readCookie(name) {
    var m = document.cookie.match(
      new RegExp(
        "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"
      )
    );
    return m ? decodeURIComponent(m[1]) : null;
  }

  function writeCookie(name, value, maxAgeSec) {
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; Path=/; SameSite=Lax; Max-Age=" +
      maxAgeSec +
      secure;
  }

  function getCookieIds() {
    var vid = readCookie(COOKIE_VID);
    if (!vid) {
      vid = uuid();
      writeCookie(COOKIE_VID, vid, 365 * 24 * 60 * 60);
    }
    var sid = readCookie(COOKIE_SID);
    if (!sid) {
      sid = uuid();
    }
    writeCookie(COOKIE_SID, sid, Math.floor(SESSION_MS / 1000));
    return { visitorId: vid, sessionId: sid };
  }

  var memSession = null;
  function getCookielessIds() {
    if (!memSession) memSession = uuid();
    return { visitorId: null, sessionId: memSession };
  }

  function ids() {
    return identityMode === "cookieless" ? getCookielessIds() : getCookieIds();
  }

  function canTrack() {
    return ready && (!requireConsent || consentGranted);
  }

  function send(payload) {
    if (!canTrack()) return;
    var body = JSON.stringify(payload);
    var url = base + "/api/ingest";
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(url, blob)) return;
      } catch (e) {}
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      mode: "cors",
      credentials: "omit",
    }).catch(function () {});
  }

  function trackPageview() {
    if (!canTrack()) {
      queue.push({ kind: "pageview" });
      return;
    }
    var id = ids();
    send({
      k: siteKey,
      type: "pageview",
      path: location.pathname + location.search,
      title: document.title || null,
      referrer: document.referrer || null,
      url: location.href,
      visitorId: id.visitorId,
      sessionId: id.sessionId,
    });
  }

  function trackEvent(name) {
    if (!name || typeof name !== "string") return;
    if (!canTrack()) {
      queue.push({ kind: "event", name: name });
      return;
    }
    var id = ids();
    send({
      k: siteKey,
      type: "event",
      eventName: name.slice(0, 120),
      path: location.pathname + location.search,
      title: document.title || null,
      referrer: document.referrer || null,
      url: location.href,
      visitorId: id.visitorId,
      sessionId: id.sessionId,
    });
  }

  function runQueued() {
    if (!canTrack()) return;
    while (queue.length) {
      var item = queue.shift();
      if (item.kind === "pageview") trackPageview();
      else if (item.kind === "event") trackEvent(item.name);
    }
  }

  function hookHistory() {
    if (historyHooked) return;
    historyHooked = true;
    var push = history.pushState;
    history.pushState = function () {
      push.apply(history, arguments);
      setTimeout(trackPageview, 0);
    };
    window.addEventListener("popstate", trackPageview);
  }

  function startTracking() {
    if (booted) {
      runQueued();
      return;
    }
    booted = true;
    ready = true;
    trackPageview();
    runQueued();
    hookHistory();
  }

  function boot(cfg) {
    identityMode = (cfg && cfg.identityMode) || "first_party_cookie";
    requireConsent = !!(cfg && cfg.requireConsent);
    ready = true;

    // data-require-consent attribute can force wait even if config lags
    if (script.getAttribute("data-require-consent") === "true") {
      requireConsent = true;
    }

    if (requireConsent && !consentGranted) {
      // Wait for sitepulse.consent(true)
      return;
    }
    startTracking();
  }

  fetch(base + "/api/config?k=" + encodeURIComponent(siteKey), {
    mode: "cors",
    credentials: "omit",
  })
    .then(function (r) {
      return r.ok
        ? r.json()
        : { identityMode: "first_party_cookie", requireConsent: false };
    })
    .then(boot)
    .catch(function () {
      boot({ identityMode: "first_party_cookie", requireConsent: false });
    });

  window.sitepulse = {
    track: function (name) {
      if (typeof name === "string" && name.length) {
        trackEvent(name);
        return;
      }
      trackPageview();
    },
    pageview: function () {
      trackPageview();
    },
    event: function (name) {
      trackEvent(name);
    },
    /** Grant or revoke analytics consent when requireConsent is enabled. */
    consent: function (granted) {
      consentGranted = !!granted;
      if (consentGranted) startTracking();
    },
    hasConsent: function () {
      return !requireConsent || consentGranted;
    },
  };
})();
