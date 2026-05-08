import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "isendai | Perfect Your Message Before You Hit Send";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
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
          background: "radial-gradient(1100px 700px at 25% 35%, rgba(124,58,237,0.35), transparent 60%), radial-gradient(950px 650px at 80% 45%, rgba(99,102,241,0.35), transparent 55%), #020617",
          color: "white",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}
      >
        <div style={{ fontSize: 22, color: "rgba(226,232,240,0.9)" }}>isendai</div>
        <div style={{ marginTop: 18, fontSize: 64, lineHeight: 1.05, fontWeight: 700 }}>
          Perfect Your Message
          <br />
          Before You Hit Send
        </div>
        <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.35, color: "rgba(226,232,240,0.85)", maxWidth: 900 }}>
          Pay per use. No subscriptions.
        </div>
      </div>
    ),
    size
  );
}

