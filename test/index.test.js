import test from 'blue-tape'
import createPool from '../src'

const getState = ({ size, available, pending, max, min }) => {
  const state = { size, available, pending, max, min }
  return state
}

const inUse = ({ size, available }) => size - available

let phantomPool
test('create pool', async () => {
  phantomPool = createPool()
})

test('create pool', async (t) => {
  const instance = await phantomPool.acquire()
  const page = await instance.createPage()
  const viewportSize = await page.property('viewportSize')
  t.deepEqual(viewportSize, { height: 300, width: 400 })
  await phantomPool.release(instance)
})

test('create some pools', async (t) => {
  const instances = await Promise.all([
    phantomPool.acquire(),
    phantomPool.acquire(),
    phantomPool.acquire(),
    phantomPool.acquire(),
  ])
  t.deepEqual(getState(phantomPool), {
    available: 0,
    pending: 0,
    max: 10,
    min: 2,
    size: 4,
  })
  const [firstInstance, ...otherInstances] = instances
  await phantomPool.release(firstInstance)
  t.deepEqual(getState(phantomPool), {
    available: 1,
    pending: 0,
    max: 10,
    min: 2,
    size: 4,
  })
  await Promise.all(otherInstances.map(instance => phantomPool.release(instance)))
  t.deepEqual(getState(phantomPool), {
    available: 4,
    pending: 0,
    max: 10,
    min: 2,
    size: 4,
  })
})

test('use', async (t) => {
  t.equal(inUse(phantomPool), 0)
  const result = await phantomPool.use(async (instance) => {
    t.equal(inUse(phantomPool), 1)
    const page = await instance.createPage()
    return page.setting('javascriptEnabled')
  })
  t.equal(result, true)
  t.equal(inUse(phantomPool), 0)
})

test('use and throw', async (t) => {
  t.equal(inUse(phantomPool), 0)
  try {
    await phantomPool.use(async () => {
      t.equal(inUse(phantomPool), 1)
      throw new Error('some err')
    })
  } catch (err) {
    t.equal(err.message, 'some err')
  }
  t.equal(inUse(phantomPool), 0)
})

test('destroy pool', async () => {
  await phantomPool.drain()
  return phantomPool.clear()
})
