import { VisitorStream } from "@/components/visitor-stream";
import { BackLink } from "@/components/page-nav";

export default function StreamPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/dashboard" label="Portfolio" />
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Live stream
        </h1>
        <p className="text-[var(--muted)]">
          Near-realtime visitors across sites you can access.
        </p>
      </div>
      <VisitorStream />
    </div>
  );
}
