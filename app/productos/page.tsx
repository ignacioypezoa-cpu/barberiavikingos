import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { ProductCatalog } from "@/components/ProductCatalog";
import { getPublicCatalog } from "@/lib/public-data";

export const metadata: Metadata = { title: "Tienda", description: "Productos profesionales para mantener tu estilo en casa." };

export default async function ProductsPage() {
  const { products } = await getPublicCatalog();
  return (
    <PublicShell>
      <section className="page-hero">
        <span className="eyebrow">Selección Vikingos</span>
        <h1>El ritual continúa en casa.</h1>
        <p>Productos probados por nuestros barberos, elegidos por su desempeño y formulación.</p>
      </section>
      <section className="page-content"><ProductCatalog products={products} /></section>
    </PublicShell>
  );
}
