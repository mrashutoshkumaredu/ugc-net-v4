import { ImageResponse } from "next/og";

// The picture shown when a link to the site is shared. Built once at build time.
export const alt = "UGC NET Paper 1 Portal: previous year papers and unit-wise practice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #312e81 0%, #3730a3 55%, #4c1d95 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#fbbf24", letterSpacing: 2 }}>
          PRACTICE · LEARN · TRACK
        </div>
        <div style={{ fontSize: 84, fontWeight: 900, marginTop: 20, lineHeight: 1.05 }}>UGC NET Paper 1</div>
        <div style={{ fontSize: 38, marginTop: 28, color: "#c7d2fe", lineHeight: 1.3, maxWidth: 950 }}>
          Full previous year papers, unit-wise practice, notes and Speed Math games.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48, fontSize: 28, color: "#e0e7ff" }}>
          <div>ugcnetpaper1.vercel.app</div>
          <div style={{ color: "#fbbf24" }}>A Lousing Marup initiative</div>
        </div>
      </div>
    ),
    size,
  );
}
