import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
function parse(line: string) {
  const cells: string[] = []; let value = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (char === ";" && !quoted) { cells.push(value); value = ""; }
    else value += char;
  }
  cells.push(value); return cells;
}
const empty = (value: string) => value.trim() || null;

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12 || Buffer.byteLength(password) > 72) throw new Error("Set SEED_PASSWORD: 12–72 bytes");
  for (const [email, name] of [["ivan@example.com", "Иван (демо)"], ["anna@example.com", "Анна (демо)"]]) {
    await db.user.upsert({ where: { email }, update: {}, create: { email, name, passwordHash: await hash(password, 12) } });
  }
  const file = path.join(process.cwd(), "prisma/data/stores.csv");
  if (!fs.existsSync(file)) throw new Error("prisma/data/stores.csv not found; run npm run data:prepare");
  const lines = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = parse(lines[0]), ix = Object.fromEntries(header.map((name, i) => [name, i]));
  const rows = lines.slice(1).map(line => {
    const r = parse(line);
    return {
      code: r[ix["№ завода SAP"]].trim(), sapPlant: r[ix["№ завода SAP"]].trim(), name: r[ix["Наименование магазина"]].trim(),
      address: r[ix["Адрес"]].trim(), city: r[ix["Город"]].trim(), region: r[ix["Регион"]].trim(),
      latitude: Number(r[ix["Широта"]]), longitude: Number(r[ix["Долгота"]]), status: "Активен", coordinatesApproximate: true,
      territory: empty(r[ix["Территория"]]), macroregion: empty(r[ix["Макрорегион"]]), division: empty(r[ix["Дивизион"]]),
      cluster: empty(r[ix["Кластер"]]), cfo: empty(r[ix["ЦФО"]]), costCenter: empty(r[ix["МВЗ"]]),
      formatCode: empty(r[ix["Код формата магазина"]]), formatName: empty(r[ix["Наименование формата магазина"]]),
      legalEntity: empty(r[ix["Юридическое лицо"]]), metro: empty(r[ix["Метро"]]), openingHours: empty(r[ix["Время работы"]])
    } satisfies Prisma.StoreUncheckedCreateInput;
  });
  const existing = await db.store.count();
  if (existing < rows.length || process.env.FORCE_STORE_IMPORT === "true") {
    for (let start = 0; start < rows.length; start += 200) {
      const batch = rows.slice(start, start + 200);
      await db.$transaction(batch.map(data => db.store.upsert({ where: { code: data.code }, create: data, update: data })));
      if (start % 2000 === 0) console.log(`Imported ${Math.min(start + batch.length, rows.length)}/${rows.length}`);
    }
  } else {
    console.log(`Store import skipped: database already contains ${existing} stores.`);
  }
  await db.store.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
  console.log(`Seed ready: ${rows.length} stores and 2 demo users.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
