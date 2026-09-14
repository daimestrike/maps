import { z } from "zod";
export const credentials = z.object({
  email: z.email("Введите корректный email").max(254).transform(s => s.toLowerCase()),
  password: z.string().min(12, "Пароль: минимум 12 символов").refine(s => new TextEncoder().encode(s).length <= 72, "Пароль: максимум 72 байта")
});
export const registration = credentials.extend({ name: z.string().trim().min(2, "Имя: минимум 2 символа").max(80) });
export const commentInput = z.object({ text: z.string().trim().min(1, "Введите комментарий").max(2000, "Максимум 2000 символов") });
