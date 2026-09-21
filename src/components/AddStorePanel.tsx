"use client";
import { useState } from "react";
import { api, type StorePoint } from "@/lib/client";

const initial = { code: "", name: "", address: "", city: "", region: "", status: "Активен", openingHours: "", latitude: "", longitude: "" };
export default function AddStorePanel({ close, onCreated }: { close: () => void; onCreated: (store: StorePoint) => void }) {
  const [form, setForm] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const change = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  const payload = () => ({ ...form, latitude: form.latitude === "" ? undefined : Number(form.latitude), longitude: form.longitude === "" ? undefined : Number(form.longitude), openingHours: form.openingHours || null });
  return <aside className="detail" aria-label="Добавление магазина"><div className="detail-top"><p className="eyebrow">НОВЫЙ МАГАЗИН</p><button aria-label="Закрыть" onClick={close}>✕</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    <form className="store-edit" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(""); try { const store = await api<StorePoint>("/api/stores", { method: "POST", body: JSON.stringify(payload()) }); onCreated(store); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
      <label>Код<input value={form.code} onChange={e => change("code", e.target.value)} required maxLength={80}/></label>
      <label>Название<input value={form.name} onChange={e => change("name", e.target.value)} required maxLength={200}/></label>
      <label>Регион<input value={form.region} onChange={e => change("region", e.target.value)} required/></label>
      <label>Город<input value={form.city} onChange={e => change("city", e.target.value)} required/></label>
      <label>Адрес<textarea value={form.address} onChange={e => change("address", e.target.value)} required rows={3} placeholder="Индекс, город, улица, дом"/></label>
      <label>Время работы<input value={form.openingHours} onChange={e => change("openingHours", e.target.value)}/></label>
      <div className="coordinate-fields"><label>Широта<input type="number" step="any" value={form.latitude} onChange={e => change("latitude", e.target.value)} placeholder="Автоматически"/></label><label>Долгота<input type="number" step="any" value={form.longitude} onChange={e => change("longitude", e.target.value)} placeholder="Автоматически"/></label></div>
      <button type="button" disabled={busy || !form.address || !form.city || !form.region} onClick={async () => { setBusy(true); setError(""); setNotice(""); try { const point = await api<{ latitude: number; longitude: number; source: string }>("/api/geocode", { method: "POST", body: JSON.stringify(form) }); setForm(current => ({ ...current, latitude: String(point.latitude), longitude: String(point.longitude) })); setNotice(`Определено приблизительно по ${point.source}`); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>Проверить координаты</button>
      {notice && <p className="success">{notice}</p>}
      <p className="muted small">Без интернета координаты определяются по индексу, городу или региону из встроенного каталога. Их можно уточнить вручную.</p>
      <div className="edit-actions"><button type="button" onClick={close}>Отмена</button><button className="primary" disabled={busy}>{busy ? "Сохранение…" : "Добавить магазин"}</button></div>
    </form>
  </aside>;
}
