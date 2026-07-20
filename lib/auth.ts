import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me-at-least-32-characters"
);

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  branchId?: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const store = await cookies();
  store.set("vikingos_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const token = (await cookies()).get("vikingos_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete("vikingos_session");
}
