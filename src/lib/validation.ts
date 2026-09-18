import { z } from "zod";
export const credentials = z.object({
  email: z.email("Введите корректный email").max(254).transform(s => s.toLowerCase()),
  password: z.string().min(12, "Пароль: минимум 12 символов").refine(s => new TextEncoder().encode(s).length <= 72, "Пароль: максимум 72 байта")
});
export const registration = credentials.extend({ name: z.string().trim().min(2, "Имя: минимум 2 символа").max(80) });
export const commentInput = z.object({ text: z.string().trim().min(1, "Введите комментарий").max(2000, "Максимум 2000 символов") });
export const storeInput = z.object({
  code: z.string().trim().min(1, "Введите код").max(80),
  name: z.string().trim().min(1, "Введите название").max(200),
  address: z.string().trim().min(1, "Введите адрес").max(1000),
  city: z.string().trim().min(1, "Введите город").max(200),
  region: z.string().trim().min(1, "Введите регион").max(200),
  latitude: z.coerce.number().min(-90, "Широта от −90 до 90").max(90, "Широта от −90 до 90"),
  longitude: z.coerce.number().min(-180, "Долгота от −180 до 180").max(180, "Долгота от −180 до 180"),
  status: z.string().trim().min(1).max(80),
  openingHours: z.string().trim().max(200).nullable().optional()
});
