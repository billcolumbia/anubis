const path = require('path')
const http = require('http')
const connect = require('connect')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const { webkit } = require('playwright')
const Anubis = require('../src/api')

const anubisSandbox = async (opts) => {
  const proxiedURL = `http://localhost:${opts.port}`
  const expectedURLs = {
    socket:`${proxiedURL}/socket.io/socket.io.js`,
    client: `${proxiedURL}/anubis-client.js`
  }

  const app = connect()
  const server = http.createServer(app)
  app.use((req, res) => {
    const serve = serveStatic(path.join(__dirname, 'sandbox'))
    serve(req, res, finalhandler(req, res))
  })
  server.listen(5000)

  const instance = Anubis(opts)
  instance.start()

  const browserResults = async () => {
    const browser = await webkit.launch()
    const context = await browser.newContext()
    const rootURL = await context.newPage()
    await rootURL.goto(proxiedURL)
    const socket = await rootURL.$('#anubis-socket')
    const client = await rootURL.$('#anubis-client')
    const srcs = {
      socket: await socket.getAttribute('src'),
      client: await client.getAttribute('src')
    }

    const socketJS = await context.newPage()
    const socketRes = await socketJS.goto(expectedURLs.socket)

    const clientJS = await context.newPage()
    const clientRes = await clientJS.goto(expectedURLs.socket)

    const responses = {
      socket: socketRes.ok(),
      client: clientRes.ok()
    }

    await browser.close()

    return {
      expectedURLs,
      srcs,
      responses
    }
  }

  const results = await browserResults()
  //instance.stop()
  return results
}

module.exports = anubisSandbox

