import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — suivi de coachings sportifs`;
export const size = { width: 1200, height: 630 };
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
          justifyContent: "space-between",
          padding: 64,
          background: "#0b0b0c",
          color: "#ececee",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#c8f135",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(200,241,53,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h4l2-7 4 14 2-7h6"
                stroke="#c8f135"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>
            Coaching sportif,
            <br />
            suivi à distance
          </div>
          <div style={{ fontSize: 24, color: "#8a8a93" }}>
            Programmes, ressentis et charges pour coachs & sportifs
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
