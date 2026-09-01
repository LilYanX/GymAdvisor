import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          borderRadius: 40,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 40,
            background: "rgba(200, 241, 53, 0.15)",
          }}
        />
        <svg
          width="108"
          height="108"
          viewBox="0 0 24 24"
          fill="none"
          style={{ position: "relative" }}
        >
          <path
            d="M3 12h4l2-7 4 14 2-7h6"
            stroke="#c8f135"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
