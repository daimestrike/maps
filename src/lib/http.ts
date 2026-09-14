import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
export function endpoint(fn: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      if (request.method !== "GET") {
        if (request.headers.get("origin") !== new URL(process.env.APP_URL || "http://localhost:3000").origin) throw new HttpError(403, "Недопустимый источник запроса");
      }
      return await fn(request);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError) return json({ error: e.issues[0]?.message || "Проверьте данные" }, 400);
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return json({ error: "Такая запись уже существует" }, 409);
      console.error(e);
      return json({ error: "Не удалось выполнить запрос. Попробуйте позже." }, 500);
    }
  };
}
export async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Ожидается JSON");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Пустой запрос");
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new HttpError(413, "Слишком большой запрос"); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "Некорректный JSON"); }
}
