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
  phantomArgs = [],
  ...otherConfig
} = {}) => {
  // TODO: randomly destroy old instances to avoid resource leak?
  const factory = {
    create: () => phantom.create(...phantomArgs),
    destroy: (instance) => instance.exit(),
  }
  const config = {
    max,
    min,
    idleTimeoutMillis,
    ...otherConfig,
  }
  const pool = genericPool.createPool(factory, config)
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
