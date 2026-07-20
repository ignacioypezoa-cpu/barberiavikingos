"use client";

import Link from "next/link";
import { Menu, Scissors, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

export function Header({ businessName, logo }: { businessName: string; logo?: string | null }) {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const cart = JSON.parse(localStorage.getItem("vikingos-cart") || "[]");
      setCartCount(cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
    };
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label={businessName}>
        {logo ? <img className="brand-logo" src={logo} alt={businessName} /> : <span className="brand-mark"><Scissors size={18} /></span>}
        <span>{businessName}<small>BARBER CLUB</small></span>
      </Link>
      <nav className={open ? "nav open" : "nav"}>
        <Link href="/#servicios" onClick={() => setOpen(false)}>Servicios</Link>
        <Link href="/#barberos" onClick={() => setOpen(false)}>Barberos</Link>
        <Link href="/#sucursales" onClick={() => setOpen(false)}>Sucursales</Link>
        <Link href="/productos" onClick={() => setOpen(false)}>Tienda</Link>
        <Link href="/contacto" onClick={() => setOpen(false)}>Contacto</Link>
        <Link href="/mis-reservas" onClick={() => setOpen(false)}>Mis reservas</Link>
        <Link href="/reservar" className="button button-small" onClick={() => setOpen(false)}>Reservar</Link>
      </nav>
      <div className="header-actions">
        <Link href="/carrito" className="cart-link" aria-label={`Carrito con ${cartCount} productos`}>
          <ShoppingBag size={20} />
          {cartCount > 0 && <span>{cartCount}</span>}
        </Link>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menú">
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
