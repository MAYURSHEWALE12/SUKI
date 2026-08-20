const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { start } = require('./helpers');

let ctx;
let adminToken;

function mint(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

before(async () => {
  ctx = await start();
});

after(async () => {
  await ctx.stop();
});

beforeEach(async () => {
  await ctx.reset();
  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'adminpass123', role: 'admin' });
  adminToken = mint(admin);
});

function upload(file, fieldname = 'image') {
  const fd = new FormData();
  fd.append(fieldname, new Blob([file.buffer], { type: file.mimetype }), file.name);
  return fetch(`${ctx.base}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: fd,
  });
}

function fakePng() {
  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
}

function fakeMp4() {
  // MP4 magic: 4 bytes size + 'ftyp' box
  return Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(100)]);
}

function fakeWebm() {
  // EBML magic: 1A 45 DF A3
  return Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(100)]);
}

test('rejects HTML posing as a .mp4 video', async () => {
  const res = await upload({ name: 'fake.mp4', mimetype: 'video/mp4', buffer: Buffer.from('<html><script>alert(1)</script></html>') });
  assert.strictEqual(res.status, 400);
});

test('rejects HTML posing as a .webm video', async () => {
  const res = await upload({ name: 'fake.webm', mimetype: 'video/webm', buffer: Buffer.from('<html></html>') });
  assert.strictEqual(res.status, 400);
});

test('accepts a real MP4 container (ftyp box)', async () => {
  const res = await upload({ name: 'real.mp4', mimetype: 'video/mp4', buffer: fakeMp4() });
  assert.strictEqual(res.status, 200);
  const url = await res.text();
  assert.match(url, /^\/uploads\//);
  const filePath = path.join(__dirname, '..', url);
  assert.ok(fs.existsSync(filePath), 'uploaded file persisted');
  fs.unlinkSync(filePath);
});

test('accepts a real WebM container (EBML magic)', async () => {
  const res = await upload({ name: 'real.webm', mimetype: 'video/webm', buffer: fakeWebm() });
  assert.strictEqual(res.status, 200);
  const url = await res.text();
  fs.unlinkSync(path.join(__dirname, '..', url));
});

test('accepts a real PNG image and still rejects mismatched content', async () => {
  const ok = await upload({ name: 'ok.png', mimetype: 'image/png', buffer: fakePng() });
  assert.strictEqual(ok.status, 200);

  const bad = await upload({ name: 'evil.png', mimetype: 'image/png', buffer: Buffer.from('not a png at all') });
  assert.strictEqual(bad.status, 400);
});