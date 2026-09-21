import { db } from "@/lib/db";

export async function offlineGeocode({ address, city, region }: { address: string; city: string; region: string }) {
  const postcode = address.match(/(?:^|\D)(\d{6})(?:\D|$)/)?.[1];
  let matches = postcode ? await db.store.findMany({ where: { address: { startsWith: postcode } }, select: { latitude: true, longitude: true }, take: 50 }) : [];
  let source = "почтовому индексу";
  if (!matches.length) {
    matches = await db.store.findMany({ where: { city: { equals: city, mode: "insensitive" } }, select: { latitude: true, longitude: true }, take: 100 });
    source = "городу";
  }
  if (!matches.length) {
    matches = await db.store.findMany({ where: { region: { equals: region, mode: "insensitive" } }, select: { latitude: true, longitude: true }, take: 100 });
    source = "региону";
  }
  if (!matches.length) return null;
  return {
    latitude: matches.reduce((sum, item) => sum + item.latitude, 0) / matches.length,
    longitude: matches.reduce((sum, item) => sum + item.longitude, 0) / matches.length,
    source
  };
}
