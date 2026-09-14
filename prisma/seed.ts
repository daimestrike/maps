import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12 || Buffer.byteLength(password) > 72) throw new Error("Set SEED_PASSWORD: 12–72 bytes");
  for (const [email, name] of [["ivan@example.com", "Иван (демо)"], ["anna@example.com", "Анна (демо)"]]) {
    await db.user.upsert({ where: { email }, update: {}, create: { email, name, passwordHash: await hash(password, 12) } });
  }
  // Synthetic examples; these are not verified X5 store addresses or codes.
  const rows: [string, string, string, string, string, number, number][] = [
    ["DEMO-001", "Пятёрочка · демо", "ул. Тверская, 12", "Москва", "Москва", 55.764, 37.606],
    ["DEMO-002", "Перекрёсток · демо", "ул. Арбат, 24", "Москва", "Москва", 55.75, 37.59],
    ["DEMO-003", "Чижик · демо", "ул. Садовая, 8", "Москва", "Москва", 55.775, 37.62],
    ["DEMO-004", "Пятёрочка · демо", "Невский проспект, 40", "Санкт-Петербург", "Санкт-Петербург", 59.934, 30.334],
    ["DEMO-005", "Перекрёсток · демо", "ул. Баумана, 10", "Казань", "Республика Татарстан", 55.788, 49.12],
    ["DEMO-006", "Чижик · демо", "ул. Красная, 50", "Краснодар", "Краснодарский край", 45.028, 38.971],
    ["DEMO-007", "Пятёрочка · демо", "ул. Ленина, 20", "Екатеринбург", "Свердловская область", 56.838, 60.597],
    ["DEMO-008", "Перекрёсток · демо", "ул. Ленина, 15", "Новосибирск", "Новосибирская область", 55.03, 82.92]
  ];
  for (const [code, name, address, city, region, latitude, longitude] of rows) {
    await db.store.upsert({ where: { code }, update: {}, create: { code, name, address, city, region, latitude, longitude } });
  }
  console.log("Seed ready: 8 demo stores, ivan@example.com and anna@example.com. Existing records unchanged.");
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
