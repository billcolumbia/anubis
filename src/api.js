const chalk = require('chalk')
const chokidar = require('chokidar')
const httpProxy = require('http-proxy')
const http = require('http')
const socketio = require('socket.io')
const connect = require('connect')
const harmon = require('harmon')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const path = require('path')
const { log } = console
const defaults = require('./defaults')

const missingOptionsMessage = 'Anubis was asked to watch nothing! Anubis must be given an array or glob of files to be watched with the --files option'
const clientScriptName = 'anubis-client.js'

const scriptsToInject = (port) => {
  return `
<!-- injected via Anubis -->
<script id="anubis-socket" src="http://localhost:${port}/socket.io/socket.io.js"></script>
<script id="anubis-client" src="http://localhost:${port}/${clientScriptName}"></script>
<!-- /injected via Anubis -->
`
}

const Anubis = (userOptions) => {
  const opts = Object.assign({}, defaults, userOptions)
  
  let server = null
  let io = null
  let watcher = null

  if (!opts.files) {
    log(chalk.redBright(missingOptionsMessage))
    throw new Error('Missing required options! (files)')
  }

  const logger = {
    onStart () {
      if (!opts.logs) return
      log(
        chalk.green('\nAnubis is watching 👀'),
        chalk.blue(`\nhttp://localhost:${opts.port} 🆙\n`)
      )
    },
    onClientConnect (socket) {
      if (!opts.logs) return
      log(
        this.timeStamp() +
        chalk.magenta('[⚭ browser connected]') +
        chalk.blue(` ${socket.handshake.headers.host}`)
      )
    },
    onFileUpdated (event, filePath) {
      if (!opts.logs) return
      const time = this.timeStamp()
      const message = filePath.indexOf('.css') > -1 ? 'Injecting CSS!' : 'Reloading browser!'
      log(
        time +
        chalk.magenta(`[${event}] `) +
        chalk.green(`${filePath}`)
      )
      log(
        time +
        chalk.cyan(` ↳  ${message}`)
      )
    },
    timeStamp () {
      const now = new Date()
      return chalk.dim(
        `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}] `
      )
    }
  }

  const injectClient = (node) => {
    const read = node.createReadStream()
    const write = node.createWriteStream({ outer: false })
    read.pipe(write, { end: false })
    read.on('end', () => {
      write.end(scriptsToInject(opts.port))
    })
  }

  const createServer = () => {
    const app = connect()
    const proxied = httpProxy.createProxyServer({
      target: opts.target
    })
    app.use(harmon([], [{
      query: 'body',
      func: injectClient
    }]))
    app.use((req, res, next) => {
      if (req.url !== `/${clientScriptName}`) proxied.web(req, res)
      else {
        const serve = serveStatic(path.join(__dirname))
        serve(req, res, finalhandler(req, res))
      }
    })
    server = http.createServer(app)
    server.listen(opts.port)

    return server
  }

  return {
    start () {
      logger.onStart()
      server = createServer()
      io = socketio(server)
      io.on('connection', logger.onClientConnect.bind(logger))
      watcher = chokidar.watch(opts.files)
      watcher.on('all', (event, filePath) => {
        logger.onFileUpdated(event, filePath)
        io.emit('filesUpdated', filePath)
      })
    },
    stop () {
      io.close()
      server.close()
      watcher.close()
    }
  }
}

module.exports = Anubis
