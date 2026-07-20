import Link from "next/link";

export default function NotFound() {
  return (
    <main className="cta" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div>
        <span className="eyebrow">Error 404</span>
        <h2>Este corte no estaba en la agenda.</h2>
        <p style={{ color: "#aaa", marginBottom: 30 }}>La página que buscas no existe o cambió de lugar.</p>
        <Link href="/" className="button">Volver al inicio</Link>
      </div>
    </main>
  );
}
