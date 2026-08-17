const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const Product = require('../models/Product');
const { start } = require('./helpers');

let ctx;

before(async () => {
  ctx = await start();
});

after(async () => {
  await ctx.stop();
});

beforeEach(async () => {
  await ctx.reset();
  await Product.create([
    { name: 'Midnight Rose Silk Saree', price: 4999, image: '/a.jpg', category: 'Sarees', description: 'Handloom silk with zari border', countInStock: 100, brand: 'Suki' },
    { name: 'Blush Pink Organza Lehenga', price: 8500, image: '/b.jpg', category: 'Lehengas', description: 'Organza flare lehenga set', countInStock: 100, brand: 'Suki' },
    { name: 'Golden Party Saree (1.5x)', price: 7200, image: '/c.jpg', category: 'Sarees', description: 'Sequinned party wear', countInStock: 0, brand: 'Suki' },
  ]);
});

test('keyword matches name case-insensitively', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?keyword=midnight`)).json();
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].name, 'Midnight Rose Silk Saree');
});

test('keyword matches description too', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?keyword=flare`)).json();
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].name, 'Blush Pink Organza Lehenga');
});

test('regex metacharacters in keyword are treated literally', async () => {
  const dot = await (await fetch(`${ctx.base}/api/products?keyword=${encodeURIComponent('1.5x')}`)).json();
  assert.strictEqual(dot.length, 1, '. should match literally, not as a wildcard');
  assert.strictEqual(dot[0].name, 'Golden Party Saree (1.5x)');
  const parens = await (await fetch(`${ctx.base}/api/products?keyword=${encodeURIComponent('(1.5x)')}`)).json();
  assert.strictEqual(parens.length, 1, '( ) should match literally, not as a group');
});

test('category filters exactly', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?category=sarees`)).json();
  assert.strictEqual(res.length, 2);
});

test('inStock=true excludes countInStock 0', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?inStock=true`)).json();
  assert.strictEqual(res.length, 2);
  assert.ok(res.every((p) => p.countInStock > 0));
});

test('limit caps results', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?limit=2`)).json();
  assert.strictEqual(res.length, 2);
});

test('price range filters', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?minPrice=6000&maxPrice=8000`)).json();
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].name, 'Golden Party Saree (1.5x)');
});

test('sort applies', async () => {
  const res = await (await fetch(`${ctx.base}/api/products?sort=price_desc`)).json();
  assert.strictEqual(res[0].price, 8500);
});