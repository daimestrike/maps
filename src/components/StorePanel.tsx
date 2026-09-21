"use client";
import { useEffect, useState } from "react";
import { api, type StoreDetail, type StorePoint, type Comment, type CommentPage } from "@/lib/client";

type EditStore = Pick<StoreDetail, "code" | "name" | "address" | "city" | "region" | "latitude" | "longitude" | "status" | "openingHours">;
export default function StorePanel({ id, close, onUpdated }: { id: string; close: () => void; onUpdated: (store: StorePoint) => void }) {
  const [store, setStore] = useState<StoreDetail | null>(null), [draft, setDraft] = useState<EditStore | null>(null), [editing, setEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(""), [text, setText] = useState(""), [busy, setBusy] = useState(false), [paging, setPaging] = useState(false), [ready, setReady] = useState(false), [attempt, setAttempt] = useState(0), [notice, setNotice] = useState("");
  useEffect(() => {
    setReady(false); const controller = new AbortController();
    Promise.all([api<StoreDetail>(`/api/stores/${id}`, { signal: controller.signal }), api<CommentPage>(`/api/stores/${id}/comments`, { signal: controller.signal })]).then(([s, page]) => { setStore(s); setDraft(s); setComments(page.items); setCursor(page.nextCursor); setReady(true); }).catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [id, attempt]);
  const change = (field: keyof EditStore, value: string | number | null) => setDraft(current => current ? { ...current, [field]: value } : current);
  const metadata = store ? [["Территория", store.territory], ["Макрорегион", store.macroregion], ["Дивизион", store.division], ["Кластер", store.cluster], ["ЦФО", store.cfo], ["МВЗ", store.costCenter], ["Завод SAP", store.sapPlant], ["Формат", store.formatName], ["Юрлицо", store.legalEntity], ["Метро", store.metro]] : [];
  return <aside className="detail" aria-label="Карточка магазина"><div className="detail-top"><p className="eyebrow">КАРТОЧКА МАГАЗИНА</p><button aria-label="Закрыть карточку" onClick={close}>✕</button></div>
    {error && <div className="error" role="alert">{error}{!ready && <button onClick={() => { setError(""); setAttempt(x => x + 1); }}>Повторить</button>}</div>}
    {!store || !draft ? <p className="muted">{error ? "Карточка недоступна" : "Загрузка…"}</p> : <>
      {editing ? <form className="store-edit" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(""); setNotice(""); try { const saved = await api<StoreDetail>(`/api/stores/${id}`, { method: "PATCH", body: JSON.stringify(draft) }); setStore(saved); setDraft(saved); setEditing(false); onUpdated(saved); setNotice("Данные магазина сохранены"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
        <label>Код<input value={draft.code} onChange={e => change("code", e.target.value)} required maxLength={80}/></label>
        <label>Название<input value={draft.name} onChange={e => change("name", e.target.value)} required maxLength={200}/></label>
        <label>Регион<input value={draft.region} onChange={e => change("region", e.target.value)} required/></label>
        <label>Город<input value={draft.city} onChange={e => change("city", e.target.value)} required/></label>
        <label>Адрес<textarea value={draft.address} onChange={e => change("address", e.target.value)} required rows={3}/></label>
        <label>Время работы<input value={draft.openingHours || ""} onChange={e => change("openingHours", e.target.value || null)}/></label>
        <div className="coordinate-fields"><label>Широта<input type="number" step="any" value={draft.latitude} onChange={e => change("latitude", Number(e.target.value))} required/></label><label>Долгота<input type="number" step="any" value={draft.longitude} onChange={e => change("longitude", Number(e.target.value))} required/></label></div>
        <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { const point = await api<{ latitude: number; longitude: number; source: string }>("/api/geocode", { method: "POST", body: JSON.stringify({ address: draft.address, city: draft.city, region: draft.region }) }); change("latitude", point.latitude); setDraft(current => current ? { ...current, latitude: point.latitude, longitude: point.longitude } : current); setNotice(`Координаты определены приблизительно по ${point.source}`); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>Определить координаты по адресу</button>
        <label>Статус<input value={draft.status} onChange={e => change("status", e.target.value)} required/></label>
        <div className="edit-actions"><button type="button" onClick={() => { setDraft(store); setEditing(false); }}>Отмена</button><button className="primary" disabled={busy}>{busy ? "Сохранение…" : "Сохранить"}</button></div>
      </form> : <><div className="store-title-actions"><span className="status">{store.status}</span><button onClick={() => setEditing(true)}>Редактировать</button></div><h2>{store.name}</h2><p className="muted">{store.code}</p>{store.coordinatesApproximate && <p className="coordinate-note">Координаты рассчитаны приблизительно по адресу. Уточните их при необходимости.</p>}<dl><dt>Адрес</dt><dd>{store.city}, {store.address}</dd><dt>Регион</dt><dd>{store.region}</dd>{store.openingHours && <><dt>Время работы</dt><dd>{store.openingHours}</dd></>}{metadata.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></>}
      <p className="success" role="status">{notice}</p>
      {!editing && <><div className="comments-heading"><h3>Комментарии</h3><button disabled={busy || paging || !ready} onClick={() => { setError(""); setAttempt(x => x + 1); }}>Обновить</button></div><p className="muted small">От старых к новым · время вашего устройства</p>
        <div className="comments">{!comments.length && <p className="empty">Пока нет комментариев. Добавьте первое наблюдение.</p>}{comments.map(c => <article key={c.id} className="comment"><strong>{c.user.name}</strong><time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</time><p>{c.text}</p></article>)}</div>
        {cursor && <button disabled={paging || busy} onClick={async () => { setPaging(true); setError(""); try { const page = await api<CommentPage>(`/api/stores/${id}/comments?cursor=${encodeURIComponent(cursor)}`); setComments(prev => [...prev, ...page.items.filter(c => !prev.some(p => p.id === c.id))]); setCursor(page.nextCursor); } catch (e) { setError((e as Error).message); } finally { setPaging(false); } }}>Показать следующие</button>}
        <form className="comment-form" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); setNotice(""); try { const comment = await api<Comment>(`/api/stores/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) }); if (!cursor) setComments(prev => [...prev, comment]); setText(""); setNotice(cursor ? "Комментарий сохранён в конце списка. Загрузите следующие страницы, чтобы увидеть его." : "Комментарий сохранён"); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}><label>Новое наблюдение<textarea value={text} onChange={e => setText(e.target.value)} required maxLength={2000} rows={4} placeholder="Что важно знать коллегам?"/></label><div className="form-bottom"><small className="muted">{text.length}/2000</small><button className="primary" disabled={busy || paging || !ready || !text.trim()}>{busy ? "Сохранение…" : "Отправить"}</button></div></form></>}
    </>}
  </aside>;
}
