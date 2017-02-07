import test from 'blue-tape'
import createPool from '../src'

let phantomPool
test('create pool with maxUses', async () => {
  phantomPool = createPool({
    maxUses: 3,
    min: 1,
    max: 1,
  })
})

test('instance is removed after 3 acquires', async (t) => {
  const acquire1 = await phantomPool.acquire()
  await phantomPool.release(acquire1)
  const acquire2 = await phantomPool.acquire()
  t.equal(acquire1, acquire2)
  await phantomPool.release(acquire2)
  const acquire3 = await phantomPool.acquire()
  t.equal(acquire1, acquire3)
  await phantomPool.release(acquire3)
  const acquire4 = await phantomPool.acquire()
  t.notEqual(acquire1, acquire4)
  await phantomPool.release(acquire4)
})

test('destroy pool', async () => {
  await phantomPool.drain()
  return phantomPool.clear()
})
