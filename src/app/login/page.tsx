import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (await currentUser()) redirect("/");
  return <main className="auth-shell"><section className="auth-intro"><div className="brand">X5<span>Карта магазинов</span></div><p className="eyebrow">ВНУТРЕННИЙ СЕРВИС · MVP</p><h1>Вся сеть.<br/>На одной карте.</h1><p>Найдите магазин, откройте карточку и поделитесь наблюдениями с коллегами.</p><div className="auth-note">Магазины → Карточки → Комментарии</div></section><AuthForm registrationOpen={process.env.ALLOW_REGISTRATION !== "false"}/></main>;
}
