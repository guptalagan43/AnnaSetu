import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AnnaSetu — Real-Time Food Rescue Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#F5F0E8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
          border: "16px solid #0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#0A0A0A",
              padding: "12px 24px",
              color: "#F5F0E8",
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 2,
            }}
          >
            <span>ANNA</span>
            <span style={{ color: "#D42B2B" }}>SETU</span>
          </div>
          <div
            style={{
              background: "#D42B2B",
              color: "#F5F0E8",
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 1,
            }}
          >
            REAL-TIME LOGISTICS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#0A0A0A",
              textTransform: "uppercase",
              maxWidth: 950,
            }}
          >
            Zero Waste. Zero Friction. Zero Hunger.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#1A1A1A",
              maxWidth: 800,
            }}
          >
            Dispatching surplus restaurant food to local shelters within minutes using real-time AI & ERS scoring.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "4px solid #0A0A0A",
            paddingTop: 24,
            fontSize: 22,
            fontWeight: 700,
            color: "#0A0A0A",
          }}
        >
          <div>ANNASATU.IN</div>
          <div style={{ color: "#D42B2B" }}>SECTION 80G COMPLIANT</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
