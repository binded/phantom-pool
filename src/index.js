const phantom = require('phantom')
const genericPool = require('generic-pool')

//instead of spread operator, takes the first argument (in this case obj with all arguments),
//creates an object out of all the k-v pairs that are not part of the argument name array in recieves (called 'keys' in the function signature)
function _objectWithoutProperties(obj, keys) {
    var target = {};
    for (var i in obj) {
        if (keys.indexOf(i) >= 0) continue;
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
        target[i] = obj[i];
    }
    return target;
}

// import initDebug from 'debug'
// const debug = initDebug('phantom-pool')

module.exports = function({
  max = 10,
  // optional. if you set this, make sure to drain() (see step 3)
  min = 2,
  // specifies how long a resource can stay idle in pool before being removed
  idleTimeoutMillis = 30000,
  // specifies the maximum number of times a resource can be reused before being destroyed
  maxUses = 50,
  testOnBorrow = true,
  phantomArgs = [],
  validator = () => Promise.resolve(true)
} = {}) {
   const captureFirstArgument = arguments[0];
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
  const additionalConfigArgument = _objectWithoutProperties(captureFirstArgument, ['max', 'min', 'idleTimeoutMillis', 'maxUses', 'testOnBorrow', 'phantomArgs', 'validator']);
  const config = {
    max,
    min,
    idleTimeoutMillis,
    testOnBorrow,
    additionalConfigArgument
  }
  const pool = genericPool.createPool(factory, config)
  const genericAcquire = pool.acquire.bind(pool)
  pool.acquire = () => genericAcquire().then(r => {
    r.useCount += 1
    return r
});
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
