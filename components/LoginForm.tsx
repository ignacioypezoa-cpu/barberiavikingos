"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible iniciar sesion.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <span className="eyebrow">Area privada</span>
      <h2>Bienvenido.</h2>
      <p>Ingresa tus credenciales para administrar Vikingos.</p>
      <div className="field"><label>Correo</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <div className="field"><label>Contrasena</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      {error && <p className="error">{error}</p>}
      <button className="button" disabled={loading}>{loading ? "Ingresando..." : "Ingresar al panel"}</button>
    </form>
  );
}
