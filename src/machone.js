const path = require('path')
const chokidar = require('chokidar')
const httpProxy = require('http-proxy')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const connect = require('connect')
const harmon = require('harmon')

const defaults = {
  watch: './public/**/*.{css,js}'
}

const setup = (options = defaults) => {
  MachOne.options = Object.assign({}, options, defaults)
  // MachOne.watch()
  // MachOne.serve()
  MachOne.proxy()
}

const watch = () => {
  chokidar
    .watch(MachOne.options.watch)
    .on('all', (event, path) => {
      console.log(event, path)
    })
}

const serve = () => {
  const app = express()
  const server = http.createServer(app)
  const io = socketio(server)

  app.use(express.static(path.join(__dirname, '../public')))

  let count = 0

  io.on('connection', (socket) => {
    console.log('Connection established!')

    socket.emit('countUpdated', count)

    socket.on('increment', () => {
      count++
      console.log(count)
      io.emit('countUpdated', count)
    })
  })

  server.listen(9000, () => {
    console.log('http://localhost:9000')
  })
}

const proxy = () => {
  const selects = [{
    query: 'body',
    func (node) {
      const stuff = `<!-- injected via via MachOne -->
<script src="/socket.io/socket.io.js"></script>
<script src="/client.js"></script>
<!-- /injected via via MachOne -->`
      const read = node.createReadStream()
      const write = node.createWriteStream({ outer: false })
      read.pipe(write, { end: false })
      read.on('end', () => {
        write.end(stuff)
      })
    }
  }]

  const app = connect()
  const proxied = httpProxy.createProxyServer({
    target: 'http://localhost:8080'
  })
  const server = http.createServer(app)
  const io = socketio(server)
  app.use(harmon([], selects))
  app.use((req, res) => {
    proxied.web(req, res)
  })
  io.on('connection', (socket) => {
    console.log('Connection established!')
  })

  chokidar
    .watch(MachOne.options.watch)
    .on('all', (event, path) => {
      console.log(event, path)
      io.emit('filesUpdated', path)
    })
  server.listen(9000)
  // httpProxy.createProxyServer({
  //   target: 'http://localhost:8080'
  // }).listen('9000')
}

const MachOne = {
  options: {},
  setup,
  watch,
  proxy,
  serve
}

MachOne.setup()

/*

[origin] - php
^
[client] - proxy of php server
  Needs to inject client.js???
^
[server] - serves client.js

 */
