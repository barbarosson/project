/**
 * Example Next.js rewrites for a first-party SitePulse proxy.
 * Paste into the *customer* site's next.config (not required in SitePulse itself).
 *
 * See /docs/proxy for full install notes.
 */
module.exports = {
  async rewrites() {
    const host = process.env.SITEPULSE_HOST || "https://sitespulse.netlify.app";
    return [
      { source: "/sp.js", destination: `${host}/api/script` },
      { source: "/api/sp/ingest", destination: `${host}/api/ingest` },
      { source: "/api/sp/config", destination: `${host}/api/config` },
    ];
  },
};
