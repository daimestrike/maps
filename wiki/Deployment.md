# Развёртывание

Три сценария: Compose со сборкой на месте, автономный архив для сервера без интернета и запуск без Docker.

## Вариант 1. Compose со сборкой на сервере

Нужен интернет на время сборки (npm и базовые образы).

```sh
git clone https://github.com/daimestrike/maps.git
cd maps
cp .env.production.example .env
# отредактируйте .env: пароли, APP_URL, при HTTPS — COOKIE_SECURE=true
docker compose up -d --build
```

`compose.yaml` поднимает два сервиса:

- `db` — `postgres:17-alpine`, данные в именованном томе `postgres_data`, порт публикуется только на `127.0.0.1:5432`;
- `app` — образ из `Dockerfile`, порт `${APP_PORT:-3000}`, healthcheck дёргает `/api/health`.

При каждом старте контейнера `docker-entrypoint.sh` применяет миграции, запускает seed и только потом поднимает `next start`. То есть развёртывание и обновление схемы — одна команда, отдельных шагов не нужно.

## Вариант 2. Сервер без интернета

Архив с образами собирается на машине с интернетом и Docker buildx:

```sh
./build-offline-bundle.sh                        # linux/amd64 по умолчанию
./build-offline-bundle.sh linux/arm64 maps-arm64.tar.gz
```

Внутрь архива попадают: `images.tar.gz` (образ приложения + `postgres:17-alpine`), `compose.prod.yaml`, `deploy.sh`, `.env.production.example`, `OFFLINE-README.md`.

То же самое собирает GitHub Actions — workflow «Build offline server bundle», запускается вручную (`workflow_dispatch`). Перед упаковкой он поднимает стек целиком, ждёт `healthy`, сверяет, что в таблице `Store` ровно 25 680 записей, и проверяет вход. Готовый архив лежит в артефактах сборки 30 дней.

На целевом сервере (Linux x86_64, Docker Engine 24+, Compose v2, интернет не нужен):

```sh
tar -xzf maps-offline-linux-amd64.tar.gz
sudo ./deploy.sh
```

`deploy.sh` сам:

1. проверяет наличие Docker и Compose v2;
2. загружает образы из `images.tar.gz`;
3. если `.env` нет — создаёт его из шаблона с `umask 077`, подставляя IP сервера и **случайные** пароли базы и seed (по 24 и 12 байт из `/dev/urandom`);
4. поднимает `compose.prod.yaml` с `--force-recreate`;
5. ждёт `healthy` до 10 минут, при неудаче печатает последние 100 строк логов и выходит с ошибкой;
6. печатает адрес, логин `admin@x5.local` и сгенерированный пароль.

Пароль остаётся в `.env` — отсюда его можно посмотреть позже:

```sh
grep SEED_PASSWORD .env
```

`compose.prod.yaml` отличается от обычного: `pull_policy: never` (образы только локальные), порт базы наружу не публикуется вовсе, все `POSTGRES_*` обязательны — без `.env` стек не поднимется.

Повторный запуск `./deploy.sh` безопасен: `.env` не перезаписывается, том с данными сохраняется, комментарии и вручную добавленные магазины остаются.

## Вариант 3. Без Docker

```sh
npm ci
# задайте переменные окружения: DATABASE_URL, APP_URL, COOKIE_SECURE, SEED_PASSWORD
npm run db:migrate
npm run build
npm run db:seed        # только при первом развёртывании
npm start
```

Держите процесс под systemd, pm2 или другим супервизором. `next.config.ts` включает `output: "standalone"`, так что при желании можно разворачивать `.next/standalone` отдельно от исходников.

## Обязательные настройки для рабочего сервера

| Настройка | Значение |
|---|---|
| `APP_URL` | Реальный внешний адрес. От него зависит проверка `Origin` — при несовпадении все POST и PATCH получат 403 |
| `COOKIE_SECURE` | `true` за HTTPS. По HTTP оставьте `false`, иначе вход не сработает |
| `POSTGRES_PASSWORD` | Уникальный. Шаблон с `CHANGE_DB_PASSWORD` в продакшен не годится |
| `SEED_PASSWORD` | Уникальный, 12–72 байта. Это пароль `admin@x5.local` |
| `ALLOW_REGISTRATION` | `false` после того, как нужные аккаунты созданы. Открытая регистрация не проверяет, что email корпоративный |
| HTTPS | Через reverse proxy (nginx, Traefik). Сам Next.js TLS не терминирует |
| Доступ | Внутренняя сеть или VPN. Сервис рассчитан на внутренний контур |

## Обновление

Compose со сборкой:

```sh
git pull
docker compose up -d --build
```

Автономный архив: соберите новый, распакуйте рядом и запустите `./deploy.sh` — том `postgres_data` переживает пересоздание контейнеров.

Миграции применяются на старте автоматически. Откат схемы не предусмотрен — перед обновлением с новыми миграциями делайте дамп ([[Operations]]).

## Проверка после развёртывания

```sh
docker compose -f compose.prod.yaml ps                                  # оба сервиса healthy
curl -s http://localhost:3000/api/health                                # {"status":"ok"}
docker compose -f compose.prod.yaml exec -T db \
  psql -U x5 -d x5_map -tAc 'SELECT count(*) FROM "Store"'              # 25680 или больше
```

Затем войдите под `admin@x5.local`, убедитесь, что карта рисует маркеры, откройте карточку и отправьте комментарий.

Учтите: в Docker-образе слой тайлов отключён на сборке, поэтому улиц на подложке не будет — только контуры регионов и маркеры. Это не ошибка развёртывания, см. [[Store Catalog|Store-Catalog]].
