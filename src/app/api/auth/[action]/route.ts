import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { COOKIE, createSession, currentUser, tokenHash } from "@/lib/auth";
import { body, endpoint, HttpError, json } from "@/lib/http";
import { credentials, registration } from "@/lib/validation";
export const runtime = "nodejs";
export const GET = endpoint(async request => {
  if (new URL(request.url).pathname.split("/").pop() !== "me") throw new HttpError(404, "Не найдено");
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Войдите в систему");
  return json(user);
});
export const POST = endpoint(async request => {
  const action = new URL(request.url).pathname.split("/").pop();
  if (action === "logout") {
    const jar = await cookies(); const token = jar.get(COOKIE)?.value;
    if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
    jar.delete(COOKIE); return json({ ok: true });
  }
  if (action !== "login" && action !== "register") throw new HttpError(404, "Не найдено");
  if (action === "register" && process.env.ALLOW_REGISTRATION === "false") throw new HttpError(403, "Регистрация закрыта");
  const input = (action === "register" ? registration : credentials).parse(await body(request));
  // Shared PostgreSQL limit: 10 attempts/email/15 minutes, independent of app replicas.
  const key = tokenHash(input.email);
  await db.authAttempt.deleteMany({ where: { resetsAt: { lte: new Date() } } });
  const attempt = await db.authAttempt.upsert({ where: { key }, create: { key, resetsAt: new Date(Date.now() + 900000) }, update: { count: { increment: 1 } } });
  if (attempt.count > 10) throw new HttpError(429, "Слишком много попыток. Подождите 15 минут.");
  let user;
  if (action === "register") {
    const data = registration.parse(input);
    user = await db.user.create({ data: { email: data.email, name: data.name, passwordHash: await hash(data.password, 12) } });
  } else {
    user = await db.user.findUnique({ where: { email: input.email } });
    const valid = await compare(input.password, user?.passwordHash ?? "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW");
    if (!user || !valid) throw new HttpError(401, "Неверный email или пароль");
  }
  await createSession(user.id);
  return json({ id: user.id, name: user.name, email: user.email }, action === "register" ? 201 : 200);
});
