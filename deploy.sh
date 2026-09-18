#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker не найден. Установите Docker Engine 24+ и запустите ./deploy.sh снова." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Не найден Docker Compose v2 (команда: docker compose)." >&2
  exit 1
fi
if [ -f images.tar.gz ] && ! docker image inspect maps-app:offline >/dev/null 2>&1; then
  echo "Загрузка контейнеров из офлайн-архива..."
  gzip -dc images.tar.gz | docker load
fi
if [ ! -f .env ]; then
  server_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  [ -n "$server_ip" ] || server_ip="localhost"
  random_hex="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
  seed_hex="$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')"
  umask 077
  sed -e "s|CHANGE_DB_PASSWORD|$random_hex|" -e "s|CHANGE_SEED_PASSWORD|X5-$seed_hex|" -e "s|SERVER_ADDRESS|$server_ip|" .env.production.example > .env
  echo "Создан .env для адреса http://$server_ip:3000"
fi
docker compose -f compose.prod.yaml up -d
echo "Ожидание запуска приложения (первый импорт может занять несколько минут)..."
attempt=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose -f compose.prod.yaml ps -q app)" 2>/dev/null || true)" = "healthy" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 120 ]; then
    docker compose -f compose.prod.yaml logs --tail=100 app
    echo "Приложение не успело запуститься. Логи показаны выше." >&2
    exit 1
  fi
  sleep 5
done
app_url="$(sed -n 's/^APP_URL=//p' .env)"
echo "Готово: $app_url"
echo "Проверка: docker compose -f compose.prod.yaml ps"
echo "Логи:    docker compose -f compose.prod.yaml logs -f app"
