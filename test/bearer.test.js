import test from 'ava'
import path from 'path'
import caller from 'grpc-caller'
import Mali from 'mali'
import grpc from 'grpc'
import pMap from 'p-map'
import create from 'create-grpc-error'

import bearer from '../'

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getHostport (port) {
  return '0.0.0.0:'.concat(port || getRandomInt(1000, 60000))
}

const PROTO_PATH = path.resolve(__dirname, './bearer.proto')
const DYNAMIC_HOST = getHostport()
const apps = []
let client

test.before('should dynamically create service', t => {
  function handler (ctx) {
    ctx.res = { message: ctx.req.message.toUpperCase() }
  }

  async function auth1 (token, ctx, next) {
    if (token !== '1111') throw new Error('Invalid token')
    await next()
  }

  async function auth2 (token, ctx, next) {
    if (token !== '2222') throw new Error('Invalid token')
    await next()
  }

  const errMetadata = { code: 'INVALID_TOKEN' }
  async function auth3 (key, ctx, next) {
    if (key !== '3333') throw create('Not Authorized', errMetadata)
    await next()
  }

  async function auth4 (key, ctx, next) {
    if (key !== '4444') throw create('Unauthorized', 400, errMetadata)
    await next()
  }

  const app = new Mali(PROTO_PATH, 'BearerService')
  apps.push(app)

  app.use('fn1', bearer(auth1), handler)
  app.use('fn2', bearer({ error: 'Unauthorized' }, auth2), handler)
  app.use('fn3', bearer({ error: { metadata: errMetadata } }, auth3), handler)
  app.use('fn4', bearer({ error: () => create('Unauthorized', 400, errMetadata) }, auth4), handler)
  app.start(DYNAMIC_HOST)

  client = caller(DYNAMIC_HOST, PROTO_PATH, 'BearerService')
})

test('Should fail with fn1 withouth metadata', async t => {
  t.plan(2)
  const error = await t.throws(client.fn1({ message: 'hello' }))
  t.is(error.message, 'Not Authorized')
})

test('Should fail with fn1 without authorization', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const error = await t.throws(client.fn1({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
})

test('Should fail with fn1 without correct authorization', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'bar')
  const error = await t.throws(client.fn1({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
})

test('Should fail with fn1 without correct bearer authorization', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer')
  const error = await t.throws(client.fn1({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
})

test('Should fail with fn1 without correct bearer authorization 2', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer ')
  const error = await t.throws(client.fn1({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
})

test('Should fail with fn1 without correct bearer authorization 3', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer foo')
  const error = await t.throws(client.fn1({ message: 'hello' }, meta))
  t.is(error.message, 'Invalid token')
})

test('Should fail with fn1 without correct bearer authorization 4', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer1111')
  const error = await t.throws(client.fn1({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
})

test('Should work with fn1 with correct authorization', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer 1111')
  const response = await client.fn1({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

test('Should work with fn1 with correct authorization 2', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('authoRiZaTion', 'bEArer 1111')
  const response = await client.fn1({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

// fn2 ----

test('Should fail with fn2 withouth metadata', async t => {
  t.plan(2)
  const error = await t.throws(client.fn2({ message: 'hello' }))
  t.is(error.message, 'Unauthorized')
})

test('Should fail with fn2 without authorization', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const error = await t.throws(client.fn2({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
})

test('Should fail with fn2 without correct authorization', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'bar')
  const error = await t.throws(client.fn2({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
})

test('Should fail with fn2 without correct authorization 2', async t => {
  t.plan(2)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer foobar')
  const error = await t.throws(client.fn2({ message: 'hello' }, meta))
  t.is(error.message, 'Invalid token')
})

test('Should work with fn2 with correct authorization', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer 2222')
  const response = await client.fn2({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

test('Should work with fn2 with correct authorization 2', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('authoRiZaTion', 'bearER 2222')
  const response = await client.fn2({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

// fn3 ----

test('Should fail with fn3 withouth metadata', async t => {
  t.plan(4)
  const error = await t.throws(client.fn3({ message: 'hello' }))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn3 without authorization', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const error = await t.throws(client.fn3({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn3 without correct authorization', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'bar')
  const error = await t.throws(client.fn3({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn3 without correct bearer authorization', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer')
  const error = await t.throws(client.fn3({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn3 without correct bearer authorization 2', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer ')
  const error = await t.throws(client.fn3({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn3 without correct bearer authorization 3', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer foo')
  const error = await t.throws(client.fn3({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn3 without correct bearer authorization 4', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer1111')
  const error = await t.throws(client.fn3({ message: 'hello' }, meta))
  t.is(error.message, 'Not Authorized')
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should work with fn3 with correct authorization', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer 3333')
  const response = await client.fn3({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

test('Should work with fn3 with correct authorization 2', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('authoRiZaTion', 'bEArer 3333')
  const response = await client.fn3({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

// fn4 ----

test('Should fail with fn4 withouth metadata', async t => {
  t.plan(5)
  const error = await t.throws(client.fn4({ message: 'hello' }))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn4 without authorization', async t => {
  t.plan(5)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const error = await t.throws(client.fn4({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn4 without correct authorization', async t => {
  t.plan(5)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'bar')
  const error = await t.throws(client.fn4({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn4 without correct bearer authorization', async t => {
  t.plan(5)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer')
  const error = await t.throws(client.fn4({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn4 without correct bearer authorization 2', async t => {
  t.plan(5)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer ')
  const error = await t.throws(client.fn4({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn4 without correct bearer authorization 3', async t => {
  t.plan(5)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer foo')
  const error = await t.throws(client.fn4({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should fail with fn4 without correct bearer authorization 4', async t => {
  t.plan(5)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer4444')
  const error = await t.throws(client.fn4({ message: 'hello' }, meta))
  t.is(error.message, 'Unauthorized')
  t.is(error.code, 400)
  t.true(error.metadata instanceof grpc.Metadata)
  const md = error.metadata.getMap()
  t.is(md.code, 'INVALID_TOKEN')
})

test('Should work with fn4 with correct authorization', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('Authorization', 'Bearer 4444')
  const response = await client.fn4({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

test('Should work with fn4 with correct authorization 2', async t => {
  t.plan(1)
  const meta = new grpc.Metadata()
  meta.add('authoRiZaTion', 'bEArer 4444')
  const response = await client.fn4({ message: 'hello' }, meta)
  t.is(response.message, 'HELLO')
})

test.after.always('cleanup', async t => {
  await pMap(apps, app => app.close())
})
