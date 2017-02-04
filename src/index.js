import phantom from 'phantom'
import genericPool from 'generic-pool'

// import initDebug from 'debug'
// const debug = initDebug('phantom-pool')

export default ({
  max = 10,
  // optional. if you set this, make sure to drain() (see step 3)
  min = 2,
  // specifies how long a resource can stay idle in pool before being removed
  idleTimeoutMillis = 30000,
  // specifies the maximum number of times a resource can be reused before being destroyed
  maxUses = 50,
  testOnBorrow = true,
  phantomArgs = [],
  validator = () => Promise.resolve(true),
  ...otherConfig
} = {}) => {
  // TODO: randomly destroy old instances to avoid resource leak?
  const factory = {
    create: () => phantom.create(...phantomArgs)
      .then(instance => {
        instance.useCount = 0
        return instance
      }),
    destroy: (instance) => instance.exit(),
    validate: (instance) => validator(instance)
      .then(valid => Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses))),
  }
  const config = {
    max,
    min,
    idleTimeoutMillis,
    testOnBorrow,
    ...otherConfig,
  }
  const pool = genericPool.createPool(factory, config)
  const genericAcquire = pool.acquire.bind(pool)
  pool.acquire = () => genericAcquire().then(r => {
    r.useCount += 1
    return r
  })
  pool.use = (fn) => {
    let resource
    return pool.acquire()
      .then(r => {
        resource = r
        return resource
      })
      .then(fn)
      .then((result) => {
        pool.release(resource)
        return result
      }, (err) => {
        pool.release(resource)
        throw err
      })
  }

  return pool
}
