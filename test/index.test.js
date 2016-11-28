import test from 'blue-tape'
import init from '../src'

test('todo', (t) => {
  t.ok(!!init)
  t.end()
})
