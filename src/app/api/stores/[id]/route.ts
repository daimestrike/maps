import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { endpoint, HttpError, json } from "@/lib/http";
export const GET = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const id = new URL(request.url).pathname.split("/").pop();
  const store = await db.store.findUnique({ where: { id } });
  if (!store) throw new HttpError(404, "Магазин не найден");
  return json(store);
});
