import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
const base = process.env.APP_URL || 'http://localhost:3000';
const db = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emails = [`test-a-${suffix}@example.com`, `test-b-${suffix}@example.com`];
const password = 'Integration-password-2026';
let store;
async function request(path, { cookie, body, origin = base, method = body ? 'POST' : 'GET' } = {}) {
  const response = await fetch(base + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
try {
  for (let i = 0; i < 60; i++) {
    try { await fetch(base + '/api/auth/me'); break; } catch { if (i === 59) throw new Error('Server unavailable'); await new Promise(r => setTimeout(r, 1000)); }
  }
  assert.equal((await request('/api/stores')).status, 401);
  assert.equal((await request('/api/auth/register', { body: { email: emails[0], name: 'A', password }, origin: 'https://other.example' })).status, 403);
  const a = await request('/api/auth/register', { body: { email: emails[0], name: 'Тест A', password } });
  const b = await request('/api/auth/register', { body: { email: emails[1], name: 'Тест B', password } });
  assert.equal(a.status, 201); assert.equal(b.status, 201); assert.ok(a.cookie);
  const storedUser = await db.user.findUnique({ where: { id: a.data.id } });
  assert.notEqual(storedUser.passwordHash, password);
  assert.ok(storedUser.passwordHash.startsWith('$2'));
  assert.equal((await request('/api/auth/register', { body: { email: emails[0], name: 'Повтор', password } })).status, 409);
  assert.equal((await request('/api/auth/login', { body: { email: emails[0], password: 'Wrong-password-1234' } })).status, 401);
  const login = await request('/api/auth/login', { body: { email: emails[0], password } });
  assert.equal(login.status, 200);
  const cookie = login.cookie;
  store = await db.store.create({ data: { code: `TEST-${suffix}`, name: 'Тестовый магазин', address: 'Тестовый адрес', city: 'Москва', region: 'Москва', latitude: 55.75, longitude: 37.61 } });
  const search = await request('/api/stores?search=' + encodeURIComponent(store.code), { cookie });
  assert.equal(search.status, 200); assert.equal(search.data[0].id, store.id);
  assert.equal((await request(`/api/stores/${store.id}`, { cookie })).data.region, 'Москва');
  const path = `/api/stores/${store.id}/comments`;
  assert.equal((await request(path, { body: { text: 'unauthorized' } })).status, 401);
  assert.equal((await request(path, { cookie, body: { text: ' ' } })).status, 400);
  assert.equal((await request(path, { cookie, body: { text: 'x'.repeat(2001) } })).status, 400);
  const text = '<script>alert(1)</script> Проверка сохранения';
  const posted = await request(path, { cookie, body: { text, userId: b.data.id } });
  assert.equal(posted.status, 201); assert.equal(posted.data.user.id, a.data.id);
  assert.ok(!('passwordHash' in posted.data.user));
  assert.equal((await db.comment.findUnique({ where: { id: posted.data.id } })).text, text);
  const otherUser = await request(path, { cookie: b.cookie });
  assert.equal(otherUser.data.items[0].text, text); assert.equal(otherUser.data.items[0].user.name, 'Тест A');
  assert.ok(otherUser.data.items[0].createdAt);
  await db.comment.createMany({ data: Array.from({ length: 51 }, (_, i) => ({ storeId: store.id, userId: a.data.id, text: `Pagination ${i}` })) });
  const page1 = await request(path, { cookie });
  const page2 = await request(path + '?cursor=' + page1.data.nextCursor, { cookie });
  assert.equal(page1.data.items.length, 50); assert.equal(page2.data.items.length, 2);
  assert.equal(new Set([...page1.data.items, ...page2.data.items].map(c => c.id)).size, 52);
  assert.equal((await request('/api/auth/logout', { cookie, method: 'POST' })).status, 200);
  assert.equal((await request('/api/auth/me', { cookie })).status, 401);
  await db.session.updateMany({ where: { userId: b.data.id }, data: { expiresAt: new Date(0) } });
  assert.equal((await request('/api/auth/me', { cookie: b.cookie })).status, 401);
  console.log('PASS: registration, login, authorization, origin protection, search, validation, author identity, PostgreSQL persistence, two-user visibility, pagination, logout.');
} finally {
  if (store) await db.store.delete({ where: { id: store.id } });
  await db.user.deleteMany({ where: { email: { in: emails } } });
  await db.$disconnect();
}
