"use client";
import { useEffect, useState } from "react";
import { api, type StoreDetail, type Comment, type CommentPage } from "@/lib/client";
export default function StorePanel({ id, close }: { id: string; close: () => void }) {
  const [store, setStore] = useState<StoreDetail | null>(null), [comments, setComments] = useState<Comment[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(""), [text, setText] = useState(""), [busy, setBusy] = useState(false), [paging, setPaging] = useState(false), [ready, setReady] = useState(false), [attempt, setAttempt] = useState(0), [notice, setNotice] = useState("");
  useEffect(() => {
    setReady(false);
    const controller = new AbortController();
    Promise.all([api<StoreDetail>(`/api/stores/${id}`, { signal: controller.signal }), api<CommentPage>(`/api/stores/${id}/comments`, { signal: controller.signal })]).then(([s, page]) => { setStore(s); setComments(page.items); setCursor(page.nextCursor); setReady(true); }).catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [id, attempt]);
  return <aside className="detail" aria-label="Карточка магазина"><div className="detail-top"><p className="eyebrow">КАРТОЧКА МАГАЗИНА</p><button aria-label="Закрыть карточку" onClick={close}>✕</button></div>
    {error && <div className="error" role="alert">{error}{!ready && <button onClick={() => { setError(""); setAttempt(x => x + 1); }}>Повторить</button>}</div>}
    {!store ? <p className="muted">{error ? "Карточка недоступна" : "Загрузка…"}</p> : <><span className="status">{store.status}</span><h2>{store.name}</h2><p className="muted">{store.code}</p><dl><dt>Адрес</dt><dd>{store.city}, {store.address}</dd><dt>Регион</dt><dd>{store.region}</dd></dl><div className="comments-heading"><h3>Комментарии</h3><button disabled={busy || paging || !ready} onClick={() => { setError(""); setAttempt(x => x + 1); }}>Обновить</button></div><p className="muted small">От старых к новым · время вашего устройства</p>
      <div className="comments">{!comments.length && <p className="empty">Пока нет комментариев. Добавьте первое наблюдение.</p>}{comments.map(c => <article key={c.id} className="comment"><strong>{c.user.name}</strong><time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</time><p>{c.text}</p></article>)}</div>
      {cursor && <button disabled={paging || busy} onClick={async () => { setPaging(true); setError(""); try { const page = await api<CommentPage>(`/api/stores/${id}/comments?cursor=${encodeURIComponent(cursor)}`); setComments(prev => [...prev, ...page.items.filter(c => !prev.some(p => p.id === c.id))]); setCursor(page.nextCursor); } catch (e) { setError((e as Error).message); } finally { setPaging(false); } }}>Показать следующие</button>}
      <form className="comment-form" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError(""); setNotice("");
        try { const comment = await api<Comment>(`/api/stores/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) }); if (!cursor) setComments(prev => [...prev, comment]); setText(""); setNotice(cursor ? "Комментарий сохранён в конце списка. Загрузите следующие страницы, чтобы увидеть его." : "Комментарий сохранён"); }
        catch (e) { setError((e as Error).message); } finally { setBusy(false); }
      }}><label>Новое наблюдение<textarea value={text} onChange={e => setText(e.target.value)} required maxLength={2000} rows={4} placeholder="Что важно знать коллегам?"/></label><div className="form-bottom"><small className="muted">{text.length}/2000</small><button className="primary" disabled={busy || paging || !ready || !text.trim()}>{busy ? "Сохранение…" : "Отправить"}</button></div><p className="success" role="status">{notice}</p></form></>}
  </aside>;
}
