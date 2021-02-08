const sandbox = require('./sandbox.js')

describe('Proxy connects and behaves as expected', () => {
  let results = null
  
  beforeAll(async () => {
    results = await sandbox({
      files: './sandbox/**/*.{js,css}',
      port: 9000,
      target: 'http://localhost:5000',
      logs: false,
      openBrowser: false
    })
  }, 10000)

  test('socket.io script was injected', () => {
    expect(results.srcs.socket).toBe('http://localhost:9000/socket.io/socket.io.js')
  })

  test('client script was injected', () => {
    expect(results.srcs.client).toBe('http://localhost:9000/anubis-client.js')
  })

  test('socket.io returns 200 status', () => {
    expect(results.responses.socket).toBe(true)
  })

  test('client returns 200 status', () => {
    expect(results.responses.client).toBe(true)
  })

})
