# phantom-pool

[![Build Status](https://travis-ci.org/binded/phantom-pool.svg?branch=master)](https://travis-ci.org/binded/phantom-pool)

Resource pool based on [generic-pool](https://github.com/coopernurse/node-pool) for [PhantomJS](https://github.com/amir20/phantomjs-node).

Creating new phantom instances with `phantom.create()` can be slow. If
you are frequently creating new instances and destroying them, as a
result of HTTP requests for example, this module can help by keeping a
pool of phantom instances alive and making it easy to re-use them across
requests.

Here's an artificial [benchmark](./test/benchmark.js) to illustrate:

```
Starting benchmark without pool

noPool-0: 786.829ms
noPool-1: 790.822ms
noPool-2: 795.150ms
noPool-3: 788.928ms
noPool-4: 793.788ms
noPool-5: 798.075ms
noPool-6: 813.130ms
noPool-7: 803.801ms
noPool-8: 782.936ms
noPool-9: 805.630ms

Starting benchmark with pool

pool-0: 48.160ms
pool-1: 98.966ms
pool-2: 89.573ms
pool-3: 99.057ms
pool-4: 101.970ms
pool-5: 102.967ms
pool-6: 102.938ms
pool-7: 99.359ms
pool-8: 101.972ms
pool-9: 103.309ms

Done
```

Using pool in this benchmark results in an average >8x speed increase.

## Install

```bash
npm install --save phantom-pool
```

Requires Node v6+

## Usage

See [./test](./test) directory for usage examples.

```javascript
const createPhantomPool = require('phantom-pool')

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
    logLevel: 'debug',
  }], // arguments passed to phantomjs-node directly, default is `[]`. For all opts, see https://github.com/amir20/phantomjs-node#phantom-object-api
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
```

## Security

When using phantom-pool, you should be aware that the phantom instance
you are getting might not be in a completely clean state. It could have
browser history, cookies or other persistent data from a previous use.

If that is an issue for you, make sure you clean up any sensitive data
on the phantom instance before returning it to the pool.
