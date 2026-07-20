import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function requireAdmin(allowManager = false) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "No autorizado." }, { status: 401 }) };
  if (session.role !== "ADMIN" && !(allowManager && session.role === "BRANCH_MANAGER")) {
    return { error: NextResponse.json({ error: "No tienes permisos para esta acción." }, { status: 403 }) };
  }
  return { session };
}

export function apiError(error: unknown) {
  console.error(error);
  const message = error instanceof Error && error.message.includes("Unique constraint")
    ? "Ya existe un registro con esos datos."
    : "No fue posible completar la operación.";
  return NextResponse.json({ error: message }, { status: 500 });
}
