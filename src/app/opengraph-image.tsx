import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/constants/site";

export const alt =
  "TimeTrack: clock in with one tap and see every hour your team works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated once at build time. ImageResponse renders outside the page, so
// it can't use CSS variables: these hex values mirror the brand tokens in
// globals.css (--brand-mark, --brand-mark-muted, --status-present, --status-overtime).
const BRAND = "#4f46e5";
const BRAND_MUTED = "#e0e7ff";
const PRESENT = "#34d399";
const OVERTIME = "#c084fc";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "72px 88px",
        background: BRAND,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="white" />
            <circle
              cx="16"
              cy="16"
              r="8.5"
              fill="none"
              stroke={BRAND}
              strokeOpacity="0.3"
              strokeWidth="2.6"
            />
            <circle
              cx="16"
              cy="16"
              r="8.5"
              fill="none"
              stroke={BRAND}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="40.06 53.41"
              transform="rotate(-90 16 16)"
            />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700 }}>{SITE_NAME}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: 640,
          }}
        >
          <span>Clock in with one tap.</span>
          <span style={{ color: BRAND_MUTED }}>See every hour.</span>
        </div>
        <span style={{ fontSize: 30, color: BRAND_MUTED }}>
          Attendance, overtime and leave for your team
        </span>
      </div>

      <svg width="300" height="300" viewBox="0 0 220 220">
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="none"
          stroke="white"
          strokeOpacity="0.18"
          strokeWidth="22"
        />
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="none"
          stroke={PRESENT}
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray="578 578"
          transform="rotate(-90 110 110)"
        />
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="none"
          stroke={OVERTIME}
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray="72 578"
          transform="rotate(-90 110 110)"
        />
      </svg>
    </div>,
    size,
  );
}
