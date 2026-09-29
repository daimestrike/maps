# Быстрый старт

Два способа поднять сервис. Оба разворачивают полный каталог — 25 680 магазинов.

## Вариант 1. Docker Compose (рекомендуется)

Нужен Docker Engine 24+ с Compose v2. Интернет нужен только на сборку образа.

```sh
git clone https://github.com/daimestrike/maps.git
cd maps
cp .env.example .env
docker compose up -d --build
```

Compose поднимает PostgreSQL, собирает образ приложения, применяет миграции и запускает импорт каталога — это делает `docker-entrypoint.sh` при каждом старте контейнера. Первый запуск занимает несколько минут.

Готовность:

```sh
docker compose ps
```

Когда сервис `app` в состоянии `healthy`, откройте http://localhost:3000.

## Вариант 2. Локальная разработка

Нужны Node.js 22+ (проект собран и проверен на 26), npm и PostgreSQL 17 — свой или из Compose.

```sh
git clone https://github.com/daimestrike/maps.git
cd maps
cp .env.example .env
npm ci
docker compose up -d db --wait     # или свой PostgreSQL, тогда поправьте DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev
```

Откройте http://localhost:3000.

`npm ci` тянет ~620 МБ в `node_modules`; `prisma generate` выполняется автоматически в `postinstall`.

## Учётные данные

`npm run db:seed` (и автоматический импорт в Docker) создаёт три учётные записи:

| Логин | Имя |
|---|---|
| `admin@x5.local` | Администратор |
| `ivan@example.com` | Иван (демо) |
| `anna@example.com` | Анна (демо) |

Пароль у всех трёх — значение `SEED_PASSWORD` из `.env`. В `.env.example` это `ChangeMe-Demo-2026!` — смените его перед любым развёртыванием за пределами вашей машины.

Повторный запуск seed перезаписывает пароли этих трёх пользователей текущим `SEED_PASSWORD` — этим можно пользоваться как сбросом пароля. Пароли пользователей, зарегистрированных через форму, seed не трогает.

Свой аккаунт можно создать через форму регистрации: имя от 2 символов, пароль от 12 символов (не длиннее 72 байт).

## Проверка сборки как в продакшене

```sh
npm run build
npm run check      # tsc --noEmit
npm start
```

`COOKIE_SECURE=false` в `.env` нужен, чтобы вход работал по HTTP — включая локальный `npm start`. По HTTPS ставьте `true`.

## Что дальше

- Порт, адрес, пароли и режим регистрации — [[Environment Variables|Environment-Variables]]
- Сервер без интернета — [[Deployment]]
- Как работают координаты и откуда взялся каталог — [[Store Catalog|Store-Catalog]]
