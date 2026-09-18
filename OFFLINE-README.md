# Автономное развёртывание

Архив предназначен для Linux x86_64 с Docker Engine 24+ и Docker Compose v2. Доступ к интернету на сервере не требуется.

```sh
tar -xzf maps-offline-linux-amd64.tar.gz
sudo ./deploy.sh
```

Скрипт загрузит готовые контейнеры, создаст случайные пароли, поднимет PostgreSQL, применит миграции и импортирует 25 680 магазинов. Первый запуск может занять несколько минут. Адрес приложения будет напечатан в конце.

Если сервер открывается по домену или другому IP, измените `APP_URL` в `.env` до запуска. Для HTTPS установите `COOKIE_SECURE=true`. После создания нужных пользователей рекомендуется установить `ALLOW_REGISTRATION=false` и повторно запустить `./deploy.sh`.

Данные PostgreSQL сохраняются в Docker volume `postgres_data` и переживают перезапуск или обновление контейнеров.

Карта автономно показывает границы регионов и все маркеры. Для локального сервера тайлов можно добавить `NEXT_PUBLIC_TILE_URL` при сборке образа.

Полезные команды:

```sh
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f app
docker compose -f compose.prod.yaml restart
docker compose -f compose.prod.yaml down
```
