import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { CartView } from "@/components/CartView";
import { getPublicCatalog } from "@/lib/public-data";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const { products, config } = await getPublicCatalog();
  return (
    <PublicShell>
      <section className="page-hero"><span className="eyebrow">Tienda Vikingos</span><h1>Tu carrito.</h1></section>
      <section className="page-content"><CartView products={products} taxRate={config?.taxRate ?? 19} /></section>
    </PublicShell>
  );
}
