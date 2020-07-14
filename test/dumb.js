const path = require('path')
const http = require('http')
const connect = require('connect')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')

const app = connect()
const server = http.createServer(app)
app.use((req, res) => {
  const serve = serveStatic(path.join(__dirname, 'sandbox'))
  serve(req, res, finalhandler(req, res))
})
console.log('upping')
server.listen(5000)
console.log('is up')
console.log('closing')
server.close(() => {
  console.log('is down')
})
console.log('EOF')


