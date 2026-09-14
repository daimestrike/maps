"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="auth-shell"><section><h1>Сервис временно недоступен</h1><p>Не удалось загрузить данные. Проверьте подключение к базе и повторите попытку.</p><button onClick={reset}>Попробовать снова</button></section></main>;
}
