import { currentUser } from "@/lib/auth";
import { offlineGeocode } from "@/lib/geocode";
import { body, endpoint, HttpError, json } from "@/lib/http";
import { geocodeInput } from "@/lib/validation";

export const POST = endpoint(async request => {
  if (!await currentUser()) throw new HttpError(401, "Войдите в систему");
  const result = await offlineGeocode(geocodeInput.parse(await body(request)));
  if (!result) throw new HttpError(422, "Не удалось определить координаты. Укажите широту и долготу вручную.");
  return json({ ...result, approximate: true });
});
