import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#D42B2B",
          fontWeight: 900,
          border: "2px solid #F5F0E8",
        }}
      >
        A
      </div>
    ),
    {
      ...size,
    }
  );
}
