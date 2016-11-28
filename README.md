# phantom-pool

[![Build Status](https://travis-ci.org/blockai/phantom-pool.svg?branch=master)](https://travis-ci.org/blockai/phantom-pool)

Resource pool based on [generic-pool](https://github.com/coopernurse/node-pool) for [PhantomJS](https://github.com/amir20/phantomjs-node).

## Install

```bash
npm install --save phantom-pool
```

Requires Node v6+

## Usage

See [./test](./test) directory for usage examples.

```javascript
import createPhantomPool from 'phantom-pool'

// Returns a generic-pool instance
const pool = createPhantomPool({
  max: 10, // default
  min: 2, // default
  // specifies how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 30000, // default.
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
})

// Automatically acquires a phantom instance and releases it back to the
// pool when the function resolves or throws
pool.use(async (phantomInstance) => {
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

// For more API doc, see https://github.com/coopernurse/node-pool#generic-pool
```