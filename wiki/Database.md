# Модель данных

PostgreSQL 17, доступ через Prisma. Схема — `prisma/schema.prisma`, миграции — `prisma/migrations/`.

## Таблицы

### User

| Поле | Тип | Примечание |
|---|---|---|
| `id` | text, PK | cuid |
| `name` | text | Имя, показывается рядом с комментарием |
| `email` | text, уникально | Приводится к нижнему регистру при валидации |
| `passwordHash` | text | bcrypt, cost 12 |
| `createdAt` / `updatedAt` | timestamp | |

### Session

| Поле | Тип | Примечание |
|---|---|---|
| `tokenHash` | text, PK | SHA-256 от токена из cookie; сам токен в базе не хранится |
| `userId` | text → User | `ON DELETE CASCADE` |
| `expiresAt` | timestamp | Срок 7 дней от входа |

Индексы по `expiresAt` и `userId`.

### Store

Обязательные поля:

| Поле | Тип | Примечание |
|---|---|---|
| `id` | text, PK | cuid; у записей из встроенного каталога — `catalog_<код>` |
| `code` | text, уникально | Код магазина, он же номер завода SAP |
| `name` | text | Например, `13919-Пятерочка` |
| `address` | text | Полная строка с индексом |
| `city`, `region` | text | |
| `latitude`, `longitude` | double | Ограничения на уровне БД: широта −90…90, долгота −180…180 |
| `status` | text | По умолчанию `Активен` |
| `coordinatesApproximate` | boolean | `true` — координаты вычислены, а не подтверждены. Ставится при импорте и при создании магазина без координат; сбрасывается в `false` при любом сохранении карточки |

Справочные поля, все необязательные: `territory`, `macroregion`, `division`, `cluster`, `cfo`, `costCenter`, `sapPlant` (уникально), `formatCode`, `formatName`, `legalEntity`, `metro`, `openingHours`.

### Comment

| Поле | Тип | Примечание |
|---|---|---|
| `id` | text, PK | cuid |
| `storeId` | text → Store | `ON DELETE CASCADE` — удаление магазина уносит комментарии |
| `userId` | text → User | `ON DELETE RESTRICT` — пользователя с комментариями нельзя удалить, авторство не теряется |
| `text` | varchar(2000) | Лимит закреплён и в схеме, и в валидации |
| `createdAt` / `updatedAt` | timestamp | |

Составной индекс `(storeId, createdAt, id)` — под постраничную выдачу по курсору в хронологическом порядке.

### AuthAttempt

Счётчик попыток входа и регистрации, общий для всех экземпляров приложения.

| Поле | Тип | Примечание |
|---|---|---|
| `key` | text, PK | SHA-256 от email — сам адрес в таблице не лежит |
| `count` | int | Попыток в текущем окне |
| `resetsAt` | timestamp | Конец окна, 15 минут |

Лимит — 10 попыток на email за 15 минут. Просроченные записи удаляются при следующей попытке.

## Миграции

| Миграция | Что делает |
|---|---|
| `202609140001_init` | Все пять таблиц, индексы, внешние ключи, CHECK-ограничения на координаты |
| `202609180001_store_import_fields` | 13 справочных полей `Store` и уникальный индекс на `sapPlant` |
| `202609210001_store_catalog` | **Встроенный каталог: INSERT 25 680 магазинов, 16 МБ SQL.** Благодаря ей свежее развёртывание сразу работоспособно, даже если seed не запускали |

Применение: `npm run db:migrate` (это `prisma migrate deploy`). Идемпотентно — повторный запуск ничего не делает. В Docker миграции применяются автоматически при старте контейнера.

Из-за третьей миграции первый `migrate deploy` на пустой базе занимает заметное время — это ожидаемо.

## Импорт каталога

`npm run db:seed` (`prisma/seed.ts`):

1. Создаёт или обновляет трёх пользователей из [[Quick Start|Quick-Start]], хешируя `SEED_PASSWORD`.
2. Читает `prisma/data/stores.csv` (разделитель `;`, свой парсер с поддержкой кавычек).
3. Если магазинов в базе меньше, чем строк в CSV, — импортирует их пачками по 200 через `upsert` по `code` в транзакциях. Иначе печатает, что импорт пропущен. `FORCE_STORE_IMPORT=true` заставляет импортировать всегда.
4. Удаляет записи с кодом, начинающимся на `DEMO-` — чистка от старого демонстрационного набора.

Импорт через `upsert` означает: комментарии и вручную добавленные магазины не страдают, но **ручные правки полей у магазина из каталога будут перезаписаны** при повторном импорте.

Подробнее о происхождении данных и координат — [[Store Catalog|Store-Catalog]].

## Полезные запросы

```sql
-- сколько магазинов и сколько с приблизительными координатами
SELECT count(*) AS total, count(*) FILTER (WHERE "coordinatesApproximate") AS approximate FROM "Store";

-- самые обсуждаемые магазины
SELECT s.code, s.name, count(c.id) AS comments
FROM "Store" s JOIN "Comment" c ON c."storeId" = s.id
GROUP BY s.id ORDER BY comments DESC LIMIT 20;

-- активные сессии
SELECT count(*) FROM "Session" WHERE "expiresAt" > now();

-- магазины, добавленные вручную (не из каталога)
SELECT code, name, city, "createdAt" FROM "Store" WHERE id NOT LIKE 'catalog_%' ORDER BY "createdAt" DESC;
```
