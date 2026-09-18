"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { api, type StorePoint } from "@/lib/client";
import StorePanel from "./StorePanel";
const Map = dynamic(() => import("./Map"), { ssr: false, loading: () => <div className="map-placeholder">Загрузка карты…</div> });
export default function Workspace({ user }: { user: { name: string } }) {
  const [stores, setStores] = useState<StorePoint[]>([]), [search, setSearch] = useState(""), [selected, setSelected] = useState<StorePoint | null>(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<StorePoint[]>("/api/stores", { signal: controller.signal }).then(setStores).catch(e => { if (e.name !== "AbortError") setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const query = search.trim().toLocaleLowerCase("ru");
  const filtered = stores.filter(s => [s.code, s.name, s.address, s.city].some(v => v.toLocaleLowerCase("ru").includes(query)));
  return <main className="workspace"><header><div className="brand">X5<span>Карта магазинов<small>Внутренний сервис</small></span></div><div className="user"><span>{user.name}</span><button onClick={async () => { try { await api("/api/auth/logout", { method: "POST" }); window.location.assign("/login"); } catch (e) { setError((e as Error).message); } }}>Выйти</button></div></header>
    <div className="workspace-body"><aside className="directory"><p className="eyebrow">ТОРГОВАЯ СЕТЬ</p><h1>Магазины <span className="count">{filtered.length}</span></h1><label className="search-label">Поиск по сети<input type="search" placeholder="Код, название, адрес, город" value={search} maxLength={200} onChange={e => setSearch(e.target.value)}/></label>
      {error && <div className="error" role="alert">{error}<button onClick={() => { setError(""); setLoading(true); setAttempt(x => x + 1); }}>Повторить</button></div>}
      <div className="store-list">{loading ? <p className="muted">Загрузка магазинов…</p> : !filtered.length ? <p className="muted">Магазины не найдены. Попробуйте другой запрос.</p> : filtered.slice(0, 100).map(s => <button key={s.id} className={`store-row ${selected?.id === s.id ? "active" : ""}`} onClick={() => setSelected(s)}><span className="store-code">{s.code}</span><strong>{s.name}</strong><span>{s.city}, {s.address}</span><span className="row-arrow">↗</span></button>)}{filtered.length > 100 && <p className="muted">Первые 100 результатов. Уточните поиск; на карте показаны все найденные магазины.</p>}</div><footer>Координаты можно уточнить в карточке</footer></aside>
      <section className="map-area"><Map stores={filtered} selected={selected} onSelect={setSelected}/>{!selected && <div className="map-hint">Выберите магазин на карте или в списке</div>}</section>
      {selected && <StorePanel key={selected.id} id={selected.id} close={() => setSelected(null)} onUpdated={updated => { setStores(current => current.map(store => store.id === updated.id ? updated : store)); setSelected(updated); }}/>}
    </div></main>;
}
