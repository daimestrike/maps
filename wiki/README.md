# Как перенести это в вики GitHub

Папка содержит готовые страницы вики для https://github.com/daimestrike/maps. Этот файл — инструкция, в вики его переносить не нужно.

## Способ 1. Скопировать текст (проще)

1. Откройте https://github.com/daimestrike/maps/wiki и нажмите **Create the first page**.
2. Первая страница обязательно должна называться `Home` — вставьте в неё содержимое `Home.md`.
3. Для остальных — **New Page**, имя без расширения `.md`, ровно как у файла (`Quick-Start`, `Architecture`, `Database`, `API`, `Store-Catalog`, `Deployment`, `Environment-Variables`, `Operations`, `Security`, `Testing-and-CI`, `Limitations`).
4. `_Sidebar` создайте так же — он появится как боковое меню на всех страницах.

Имена страниц должны совпадать с именами файлов, иначе перекрёстные ссылки `[[…]]` не найдут цели.

## Способ 2. Залить через git (быстрее для всех сразу)

Вики GitHub — это отдельный git-репозиторий. Он существует только после того, как в веб-интерфейсе создана хотя бы одна страница, поэтому сначала создайте `Home` любым содержимым, затем:

```bash
git clone git@github.com:daimestrike/maps.wiki.git /tmp/maps-wiki && cp wiki/*.md /tmp/maps-wiki/ && rm -f /tmp/maps-wiki/README.md && cd /tmp/maps-wiki && git add -A && git commit -m "Документация проекта" && git push
```

## Состав

| Файл | Страница |
|---|---|
| `Home.md` | Главная: обзор, цифры, навигация |
| `_Sidebar.md` | Боковое меню |
| `Quick-Start.md` | Быстрый старт, учётные данные |
| `Environment-Variables.md` | Все переменные окружения |
| `Architecture.md` | Структура кода, слои, поток данных |
| `Database.md` | Таблицы, индексы, миграции, полезные SQL-запросы |
| `API.md` | Справочник по эндпоинтам с примерами curl |
| `Store-Catalog.md` | Происхождение данных, расчёт координат, офлайн-геокодер |
| `Deployment.md` | Три сценария развёртывания, в том числе без интернета |
| `Operations.md` | Бэкапы, логи, пароли, разбор проблем |
| `Security.md` | Модель безопасности и что донастроить снаружи |
| `Testing-and-CI.md` | Интеграционный тест, GitLab CI, GitHub Actions |
| `Limitations.md` | Границы MVP и следующие шаги |
