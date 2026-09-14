import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { body, endpoint, HttpError, json } from "@/lib/http";
import { commentInput } from "@/lib/validation";
const include = { user: { select: { id: true, name: true } } };
async function context(request: Request) {
  const user = await currentUser(); if (!user) throw new HttpError(401, "Войдите в систему");
  const storeId = new URL(request.url).pathname.split("/").at(-2)!;
  if (!await db.store.findUnique({ where: { id: storeId }, select: { id: true } })) throw new HttpError(404, "Магазин не найден");
  return { user, storeId };
}
export const GET = endpoint(async request => {
  const { storeId } = await context(request);
  const cursor = new URL(request.url).searchParams.get("cursor");
  if (cursor && !await db.comment.findFirst({ where: { id: cursor, storeId } })) throw new HttpError(400, "Некорректная страница");
  const items = await db.comment.findMany({ where: { storeId }, include, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 51, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
  const more = items.length > 50;
  if (more) items.pop();
  return json({ items, nextCursor: more ? items.at(-1)!.id : null });
});
export const POST = endpoint(async request => {
  const { user, storeId } = await context(request);
  const { text } = commentInput.parse(await body(request));
  return json(await db.comment.create({ data: { storeId, userId: user.id, text }, include }), 201);
});
