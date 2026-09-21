import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { endpoint, HttpError, json, body } from "@/lib/http";
import { offlineGeocode } from "@/lib/geocode";
import { storeCreateInput } from "@/lib/validation";
export const GET = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const search = (new URL(request.url).searchParams.get("search") || "").trim();
  if (search.length > 200) throw new HttpError(400, "Слишком длинный запрос");
  return json(await db.store.findMany({
    where: search ? { OR: ["code", "name", "address", "city"].map(field => ({ [field]: { contains: search, mode: "insensitive" } })) } : {},
    select: { id: true, code: true, name: true, latitude: true, longitude: true, city: true, address: true }, orderBy: { code: "asc" }
  }));
});
export const POST = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const input = storeCreateInput.parse(await body(request));
  const located = input.latitude == null ? await offlineGeocode(input) : null;
  if (input.latitude == null && !located) throw new HttpError(422, "Не удалось определить координаты. Укажите их вручную.");
  const store = await db.store.create({ data: {
    ...input,
    latitude: input.latitude ?? located!.latitude,
    longitude: input.longitude ?? located!.longitude,
    openingHours: input.openingHours || null,
    coordinatesApproximate: input.latitude == null
  }});
  return json(store, 201);
});
