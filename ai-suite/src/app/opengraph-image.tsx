import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "isendai | Perfect Your Message Before You Hit Send";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "radial-gradient(1200px 800px at 20% 30%, rgba(124,58,237,0.35), transparent 60%), radial-gradient(1000px 700px at 85% 40%, rgba(99,102,241,0.35), transparent 55%), #020617",
          color: "white",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            color: "rgba(226,232,240,0.9)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "linear-gradient(90deg, #7c3aed, #6366f1)",
              boxShadow: "0 0 24px rgba(124,58,237,0.6)",
            }}
          />
          <span style={{ letterSpacing: 0.2 }}>isendai</span>
        </div>

        <div style={{ marginTop: 22, fontSize: 64, lineHeight: 1.05, fontWeight: 700 }}>
          Perfect Your Message
          <br />
          Before You Hit Send
        </div>

        <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.35, color: "rgba(226,232,240,0.85)", maxWidth: 860 }}>
          Stop overthinking. Transform angry emails, write cover letters, and reduce communication
          stress in seconds. Pay per use, no subscriptions.
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["Corporate Whisperer", "Cover Letter AI", "LinkedIn Headline Smith"].map((x) => (
            <div
              key={x}
              style={{
                fontSize: 20,
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(15,23,42,0.55)",
                color: "rgba(226,232,240,0.9)",
              }}
            >
              {x}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}

