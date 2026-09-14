import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { endpoint, HttpError, json } from "@/lib/http";
export const GET = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const search = (new URL(request.url).searchParams.get("search") || "").trim();
  if (search.length > 200) throw new HttpError(400, "Слишком длинный запрос");
  return json(await db.store.findMany({
    where: search ? { OR: ["code", "name", "address", "city"].map(field => ({ [field]: { contains: search, mode: "insensitive" } })) } : {},
    select: { id: true, code: true, name: true, latitude: true, longitude: true, city: true, address: true }, orderBy: { code: "asc" }
  }));
});
