"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus } from "lucide-react";
import { clp } from "@/lib/data";

type ProductItem = { id:string; name:string; description:string; brand:string; price:number; stock:number; image:string|null; category:{name:string} };
export function ProductCatalog({ products }: { products: ProductItem[] }) {
  const [category, setCategory] = useState("Todos");
  const categories = ["Todos", ...Array.from(new Set(products.map((product) => product.category.name)))];
  const filtered = category === "Todos" ? products : products.filter((product) => product.category.name === category);

  function addToCart(productId: string) {
    const cart = JSON.parse(localStorage.getItem("vikingos-cart") || "[]") as { productId: string; quantity: number }[];
    const item = cart.find((current) => current.productId === productId);
    if (item) item.quantity += 1;
    else cart.push({ productId, quantity: 1 });
    localStorage.setItem("vikingos-cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  }

  return (
    <>
      <div className="filters">
        {categories.map((item) => <button key={item} className={`filter ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <div className="product-grid">
        {filtered.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-image">
              {product.image && <Image src={product.image} alt={product.name} fill sizes="(max-width: 720px) 100vw, 25vw" />}
              {product.stock <= 6 && <span className="stock-badge">Últimas unidades</span>}
            </div>
            <div className="product-info">
              <small>{product.brand} · {product.category.name}</small>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-bottom">
                <strong>{clp(product.price)}</strong>
                <button className="icon-button" onClick={() => addToCart(product.id)} aria-label={`Agregar ${product.name} al carrito`}><Plus size={19} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
