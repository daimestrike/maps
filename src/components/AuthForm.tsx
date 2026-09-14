"use client";
import { useState } from "react";
import { api } from "@/lib/client";
export default function AuthForm({ registrationOpen }: { registrationOpen: boolean }) {
  const [register, setRegister] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <section className="auth-card"><p className="eyebrow">ДОБРО ПОЖАЛОВАТЬ</p><h2>{register ? "Создать аккаунт" : "Войти в систему"}</h2><p className="muted">Используйте email и пароль вашего аккаунта.</p><form onSubmit={async e => {
    e.preventDefault(); const fields = Object.fromEntries(new FormData(e.currentTarget)); setBusy(true); setError("");
    try { await api(`/api/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(fields) }); window.location.assign("/"); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }}>
    {register && <label>Имя<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label>}
    <label>Email<input name="email" type="email" autoComplete="username" required maxLength={254}/></label>
    <label>Пароль<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={12}/></label>
    {register && <small className="muted">От 12 символов, до 72 байт.</small>}
    {error && <p className="error" role="alert">{error}</p>}
    <button className="primary" disabled={busy}>{busy ? "Подождите…" : register ? "Зарегистрироваться" : "Войти"}</button>
  </form>{registrationOpen && <button className="text-button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }}>{register ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}</button>}</section>;
}
