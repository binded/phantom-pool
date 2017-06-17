const createPhantomPool = require('../src/index');

// Returns a generic-pool instance
const pool = createPhantomPool({
  max: 10, // default
  min: 2, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 30000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  phantomArgs: [['--ignore-ssl-errors=true', '--disk-cache=true'], {
    logLevel: 'debug'
  }] // arguments passed to phantomjs-node directly, default is `[]`. For all opts, see https://github.com/amir20/phantomjs-node#phantom-object-api
})

// Automatically acquires a phantom instance and releases it back to the
// pool when the function resolves or throws
pool.use(async (instance) => {
  const page = await instance.createPage()
  const status = await page.open('http://google.com', { operation: 'GET' })
  if (status !== 'success') {
    throw new Error('cannot open google.com')
  }
  const content = await page.property('content')
  return content
}).then((content) => {
  console.log(content)
})

// Destroying the pool:
pool.drain().then(() => pool.clear())

// For more API doc, see https://github.com/coopernurse/node-pool#generic-pool
