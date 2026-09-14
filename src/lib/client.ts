export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (response.status === 401 && !url.startsWith("/api/auth")) { window.location.assign("/login"); throw new Error("Сессия истекла"); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить запрос");
  return data;
}
export type StorePoint = { id: string; code: string; name: string; address: string; city: string; latitude: number; longitude: number };
export type StoreDetail = StorePoint & { region: string; status: string };
export type Comment = { id: string; text: string; createdAt: string; user: { id: string; name: string } };
export type CommentPage = { items: Comment[]; nextCursor: string | null };
