/**
 * SitePulse tracking snippet (M1 + M2)
 * Install:
 *   <script defer src="https://YOUR_HOST/t.js" data-site="YOUR_SITE_KEY"></script>
 *
 * Custom events:
 *   sitepulse.track('signup_complete');
 *   sitepulse.pageview(); // force pageview
 *
 * Identity mode from /api/config?k=KEY
 * - first_party_cookie: _sp_vid / _sp_sid cookies
 * - cookieless: memory session; visitor derived server-side
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
  var ready = false;
  var queue = [];

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

  function send(payload) {
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
    while (queue.length) {
      var item = queue.shift();
      if (item.kind === "pageview") trackPageview();
      else if (item.kind === "event") trackEvent(item.name);
    }
  }

  function boot(mode) {
    identityMode = mode || "first_party_cookie";
    ready = true;
    trackPageview();
    runQueued();

    var push = history.pushState;
    history.pushState = function () {
      push.apply(history, arguments);
      setTimeout(trackPageview, 0);
    };
    window.addEventListener("popstate", trackPageview);
  }

  fetch(base + "/api/config?k=" + encodeURIComponent(siteKey), {
    mode: "cors",
    credentials: "omit",
  })
    .then(function (r) {
      return r.ok ? r.json() : { identityMode: "first_party_cookie" };
    })
    .then(function (cfg) {
      boot(cfg.identityMode || "first_party_cookie");
    })
    .catch(function () {
      boot("first_party_cookie");
    });

  window.sitepulse = {
    /** Force a pageview, or track a named custom event. */
    track: function (name) {
      if (typeof name === "string" && name.length) {
        if (!ready) queue.push({ kind: "event", name: name });
        else trackEvent(name);
        return;
      }
      if (!ready) queue.push({ kind: "pageview" });
      else trackPageview();
    },
    pageview: function () {
      if (!ready) queue.push({ kind: "pageview" });
      else trackPageview();
    },
    event: function (name) {
      if (!ready) queue.push({ kind: "event", name: name });
      else trackEvent(name);
    },
  };
})();
