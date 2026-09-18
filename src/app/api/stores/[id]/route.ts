import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { endpoint, HttpError, json, body } from "@/lib/http";
import { storeInput } from "@/lib/validation";
export const GET = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const id = new URL(request.url).pathname.split("/").pop();
  const store = await db.store.findUnique({ where: { id } });
  if (!store) throw new HttpError(404, "Магазин не найден");
  return json(store);
});
export const PATCH = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const id = new URL(request.url).pathname.split("/").pop();
  if (!await db.store.findUnique({ where: { id }, select: { id: true } })) throw new HttpError(404, "Магазин не найден");
  const data = storeInput.parse(await body(request));
  return json(await db.store.update({ where: { id }, data: { ...data, openingHours: data.openingHours || null, coordinatesApproximate: false } }));
});
