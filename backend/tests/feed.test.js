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
  await Product.create({
    name: 'Silk Saree <Special> & "Festive"', price: 4999, originalPrice: 5999,
    image: '/uploads/saree.jpg', category: 'Sarees', description: 'Handloom saree',
    brand: 'Suki', countInStock: 100,
  });
  await Product.create({
    name: 'Unavailable Lehenga', price: 7999, image: '/uploads/lehenga.jpg',
    category: 'Lehengas', description: 'Bridal lehenga', brand: 'Suki', countInStock: 0,
  });
});

test('feed returns XML with absolute image links, escaped names and availability', async () => {
  const res = await fetch(`${ctx.base}/api/feed/products.xml`);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/xml/);

  const xml = await res.text();
  assert.match(xml, /<rss version="2.0" xmlns:g=/);
  assert.match(xml, /<g:id>/);
  assert.match(xml, /Silk Saree &lt;Special&gt; &amp; &quot;Festive&quot;/);
  assert.match(xml, /<g:availability>in_stock<\/g:availability>/);
  assert.match(xml, /<g:availability>out_of_stock<\/g:availability>/);
  assert.match(xml, /<g:price>INR 4999\.00<\/g:price>/);
  assert.match(xml, /<g:sale_price>INR 4999\.00<\/g:sale_price>/);
  assert.match(xml, /<g:image_link>https:\/\/sukiethnic\.com\/uploads\/saree\.jpg<\/g:image_link>/);
  assert.match(xml, /<g:identifier_exists>FALSE<\/g:identifier_exists>/);
});

test('feed output is stable within the cache window', async () => {
  const first = await (await fetch(`${ctx.base}/api/feed/products.xml`)).text();
  await Product.create({ name: 'New Product', price: 999, image: '/uploads/new.jpg', category: 'Sarees', description: 'New arrival', brand: 'Suki', countInStock: 5 });
  const second = await (await fetch(`${ctx.base}/api/feed/products.xml`)).text();
  assert.strictEqual(first, second);
});