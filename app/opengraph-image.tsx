import { ImageResponse } from "next/og";

export const alt = "Vikingos Barber Shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, color: "#f2ede4", background: "#0a0a0a" }}>
      <div style={{ color: "#c49a5a", fontSize: 25, letterSpacing: 8 }}>VIKINGOS BARBER SHOP</div>
      <div style={{ marginTop: 35, display: "flex", flexDirection: "column", fontFamily: "serif", fontSize: 92, lineHeight: 1 }}>
        <span>Tu estilo.</span>
        <span>Nuestro oficio.</span>
      </div>
      <div style={{ marginTop: 35, color: "#aaa", fontSize: 24 }}>Barbería contemporánea · Santiago</div>
    </div>,
    size
  );
}
