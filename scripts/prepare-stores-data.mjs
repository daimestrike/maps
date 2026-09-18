import fs from "node:fs";
import path from "node:path";

const [source, geonames, output = "prisma/data/stores.csv"] = process.argv.slice(2);
if (!source || !geonames) {
  console.error("Usage: node scripts/prepare-stores-data.mjs <stores.csv> <RU.txt> [output.csv]");
  process.exit(1);
}
function parse(line) {
  const cells = []; let value = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (char === ";" && !quoted) { cells.push(value); value = ""; }
    else value += char;
  }
  cells.push(value); return cells;
}
function encode(value) { const text = String(value ?? ""); return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function normalize(value) { return value.toLowerCase().replaceAll("ё", "е").replace(/\s+(г\.?|город|пгт\.?|рп\.?|с\.?|д\.?)$/u, "").replace(/[^a-zа-я0-9]+/gu, " ").trim(); }
function jitter(code, scale) {
  let hash = 2166136261;
  for (const char of code) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return [(((hash >>> 0) % 2001) - 1000) / 1000 * scale, ((((hash >>> 11) >>> 0) % 2001) - 1000) / 1000 * scale];
}
const geoRows = fs.readFileSync(geonames, "utf8").trim().split(/\r?\n/).map(line => line.split("\t"));
const byPostcode = new Map(), byPlace = new Map(), byRegion = new Map();
const territoryCenters = new Map([
  ["центр", [55.75, 37.62]], ["северо запад", [59.94, 30.31]], ["юг", [47.23, 39.72]],
  ["волга", [55.79, 49.12]], ["восток", [56.84, 60.61]]
]);
for (const row of geoRows) {
  const point = [Number(row[9]), Number(row[10])];
  if (Number.isFinite(point[0]) && Number.isFinite(point[1])) {
    byPostcode.set(row[1], point);
    if (!byPlace.has(normalize(row[2]))) byPlace.set(normalize(row[2]), point);
    if (!byRegion.has(normalize(row[3]))) byRegion.set(normalize(row[3]), point);
  }
}
const lines = fs.readFileSync(source, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
const header = parse(lines[0]), index = Object.fromEntries(header.map((name, i) => [name, i]));
for (const column of ["№ завода SAP", "Наименование магазина", "Регион", "Город", "Адрес"]) if (!(column in index)) throw new Error(`Нет колонки «${column}»`);
const stats = { postcode: 0, locality: 0, region: 0, fallback: 0 };
const outputLines = [[...header, "Широта", "Долгота", "Источник координат"].map(encode).join(";")];
for (const line of lines.slice(1)) {
  const row = parse(line), address = row[index["Адрес"]], postcode = address.match(/^\s*(\d{6})/)?.[1];
  let point = postcode ? byPostcode.get(postcode) : undefined, sourceType = "postcode";
  if (!point) { point = [row[index["Город"]], ...address.split(",")].map(normalize).filter(Boolean).map(value => byPlace.get(value)).find(Boolean); sourceType = "locality"; }
  if (!point) { point = byRegion.get(normalize(row[index["Регион"]])); sourceType = "region"; }
  if (!point) { point = territoryCenters.get(normalize(row[index["Территория"]])) || [55.751244, 37.618423]; sourceType = "fallback"; }
  stats[sourceType]++;
  const scale = sourceType === "postcode" ? 0.004 : sourceType === "locality" ? 0.012 : 0.08;
  const [dy, dx] = jitter(row[index["№ завода SAP"]], scale);
  outputLines.push([...row, (point[0] + dy).toFixed(6), (point[1] + dx).toFixed(6), sourceType].map(encode).join(";"));
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `\uFEFF${outputLines.join("\n")}\n`);
console.log(`Prepared ${lines.length - 1} stores:`, stats);
