import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
export const COOKIE = "x5_session";
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { select: { id: true, name: true, email: true } } } });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function createSession(userId: string) {
  const jar = await cookies();
  const old = jar.get(COOKIE)?.value;
  if (old) await db.session.deleteMany({ where: { tokenHash: tokenHash(old) } });
  await db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await db.session.create({ data: { tokenHash: tokenHash(token), userId, expiresAt: expires } });
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true", path: "/", expires });
}
