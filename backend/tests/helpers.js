// Shared test bootstrap: in-memory MongoDB + an app instance on an ephemeral port.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { createApp } = require('../app');

async function start() {
  process.env.JWT_SECRET = 'test-secret';
  process.env.PAYU_MERCHANT_KEY = 'test-key';
  process.env.PAYU_MERCHANT_SALT = 'test-salt';
  process.env.PAYU_ENV = 'test';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.ORDER_LIMIT_MAX = '1000';

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  return {
    base,
    mongo,
    server,
    async stop() {
      await server.close();
      await mongoose.disconnect();
      await mongo.stop();
    },
    async reset() {
      await mongoose.connection.dropDatabase();
    },
  };
}

function json(method, url, base, body, headers = {}) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function form(url, params, headers = {}) {
  return fetch(url, {
    method: 'POST',
    redirect: 'manual', // payu callbacks redirect to the frontend; the tests only care about side effects
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(params).toString(),
  });
}

module.exports = { start, json, form };