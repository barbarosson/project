export function ExportPanel({ siteId }: { siteId: string }) {
  return (
    <section className="sp-card p-5">
      <h2 className="text-lg font-semibold">Export CSV</h2>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Download the last 30 days of pageviews or conversions (UTF-8 CSV).
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          className="sp-btn sp-btn-ghost"
          href={`/api/sites/${siteId}/export?type=pageviews&days=30`}
        >
          Pageviews CSV
        </a>
        <a
          className="sp-btn sp-btn-ghost"
          href={`/api/sites/${siteId}/export?type=conversions&days=30`}
        >
          Conversions CSV
        </a>
      </div>
    </section>
  );
}
