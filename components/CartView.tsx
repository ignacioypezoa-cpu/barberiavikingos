"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clp } from "@/lib/data";

type CartItem = { productId: string; quantity: number };

type CartProduct={id:string;name:string;brand:string;price:number;image:string|null};
export function CartView({ products, taxRate }: { products:CartProduct[];taxRate:number }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState(0);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => setCart(JSON.parse(localStorage.getItem("vikingos-cart") || "[]")), []);
  const save = (next: CartItem[]) => {
    setCart(next);
    localStorage.setItem("vikingos-cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  };
  const rows = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId)! })).filter((item) => item.product);
  const subtotalWithTax = rows.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const net = Math.round(subtotalWithTax / (1 + taxRate / 100));
  const tax = subtotalWithTax - net;
  const total = subtotalWithTax + shipping;

  function quantity(productId: string, delta: number) {
    save(cart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
  }

  if (ordered) {
    return <div className="success-box"><h2>Pedido recibido.</h2><p>La pasarela está en modo demostración. La arquitectura de pago quedó preparada para Webpay, Mercado Pago o Stripe.</p></div>;
  }

  if (!rows.length) return <div className="success-box"><h2>Tu carrito está esperando.</h2><p>Agrega productos desde nuestra tienda y vuelve por aquí.</p></div>;

  return (
    <div className="cart-layout">
      <div>
        {rows.map(({ product, quantity: amount }) => (
          <article className="cart-item" key={product.id}>
            {product.image && <Image src={product.image} alt={product.name} width={100} height={100} />}
            <div><h3>{product.name}</h3><p>{product.brand} · {clp(product.price)}</p></div>
            <div className="quantity">
              <button onClick={() => quantity(product.id, -1)}>−</button><span>{amount}</span><button onClick={() => quantity(product.id, 1)}>+</button>
            </div>
          </article>
        ))}
      </div>
      <aside className="summary">
        <h2>Resumen</h2>
        <div className="field" style={{ marginBottom: 15 }}>
          <label>Método de entrega</label>
          <select onChange={(e) => setShipping(Number(e.target.value))}>
            <option value="0">Retiro en tienda · Gratis</option>
            <option value="3990">Despacho RM · $3.990</option>
          </select>
        </div>
        <div className="summary-row"><span>Neto</span><span>{clp(net)}</span></div>
        <div className="summary-row"><span>IVA ({taxRate}%)</span><span>{clp(tax)}</span></div>
        <div className="summary-row"><span>Despacho</span><span>{shipping ? clp(shipping) : "Gratis"}</span></div>
        <div className="summary-row summary-total"><span>Total</span><span>{clp(total)}</span></div>
        <button className="button" onClick={() => { save([]); setOrdered(true); }}>Finalizar compra</button>
      </aside>
    </div>
  );
}
