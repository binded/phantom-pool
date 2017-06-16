/* eslint-disable no-console */
const phantom = require('phantom')
const http = require('http')
const createPhantomPool = require('../src')

const startServer = () => new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    res.end('test')
  }).listen((err) => {
    if (err) return reject(err)
    resolve(server)
  })
})

const pool = createPhantomPool()

/* eslint-disable no-unused-vars */
const noPool = async (url) => {
  const instance = await phantom.create()
  const page = await instance.createPage()
  const status = await page.open(url, { operation: 'GET' })
  if (status !== 'success') throw new Error(status)
  const content = await page.property('content')
  // console.log(content)
  await instance.exit()
}

const withPool = (url) => pool.use(async (instance) => {
  const page = await instance.createPage()
  const status = await page.open(url, { operation: 'GET' })
  if (status !== 'success') throw new Error(status)
  const content = await page.property('content')
  // console.log(content)
})

const benchmark = async (iters) => {
  const server = await startServer()
  const url = `http://localhost:${server.address().port}`
  console.log('Starting benchmark without pool')
  for (let i = 0; i < iters; i++) {
    console.time(`noPool-${i}`)
    await noPool(`${url}/${i}`)
    console.timeEnd(`noPool-${i}`)
  }
  console.log('')
  console.log('Starting benchmark with pool')
  for (let i = 0; i < iters; i++) {
    console.time(`pool-${i}`)
    await withPool(`${url}/${i}`)
    console.timeEnd(`pool-${i}`)
  }
  console.log('Done')
}

benchmark(10).then(() => {
  process.exit(0)
}).catch(console.error)
