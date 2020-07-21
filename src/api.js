const chalk = require('chalk')
const chokidar = require('chokidar')
const httpProxy = require('http-proxy')
const http = require('http')
const socketio = require('socket.io')
const connect = require('connect')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const Buffer = require('buffer').Buffer
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

  /**
   * Can't do much if there are no files to watch...
   */
  if (!opts.files) {
    log(chalk.redBright(missingOptionsMessage))
    throw new Error('Missing required options! (files)')
  }

  /**
   * Generic Logger for events
   */
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
    onClientDisconnect () {
      if (!opts.logs) return
      log(
        this.timeStamp() +
        chalk.magenta('[% browser disconnected]')
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
      const timeNow = new Date()
        .toLocaleTimeString()
        .replace(/\s*(AM|PM)/, '')
      return chalk.dim(
        `[${timeNow}] `
      )
    }
  }

  /**
   * Overwrite write, writeHead, and end in the request life cycle to modify
   * the response by injecting our socket scripts. This makes it automatic
   * so we don't have to manually add the socket script in the project.
   *
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  const injectScripts = (req, res, next) => {
    const _write = res.write
    const _writeHead = res.writeHead
    const _end = res.end
    const isHTML = (res) => {
      const contentType = res.getHeader('Content-Type') || ''
      return contentType.indexOf('text/html') === 0
    }

    res.writeHead = function () {
      var headers = (arguments.length > 2) ? arguments[2] : arguments[1]
      headers = headers || {}
      if (isHTML(res)) {
        res.removeHeader('Content-Length')
        delete headers['content-length']
      }
      _writeHead.apply(res, arguments)
    }

    res.write = function (data) {
      if (isHTML(res)) {
        const resString = data.toString().replace('</body>', `${scriptsToInject(opts.port)}\n</body>`)
        _write.call(res, Buffer.from(resString))
      } else _write.apply(res, arguments)
    }

    res.end = function (data, encoding) {
      _end.call(res)
    }

    next()
  }

  /**
   * Proxy all our requests to backend except our static assets for the socket
   * scripts (anubis-client and socket.io)
   * @param {*} proxy 
   */
  const proxyOrServe = (proxy) => {
    return (req, res, next) => {
      if (req.url !== `/${clientScriptName}`) proxy.web(req, res)
      else {
        const serve = serveStatic(path.join(__dirname))
        serve(req, res, finalhandler(req, res))
      }
    }
  }

  /**
   * Create a webserver for our proxy, static assets, and sockets
   */
  const createServer = () => {
    const app = connect()
    const proxy = httpProxy.createProxyServer({
      target: opts.target
    })
    app.use(injectScripts)
    app.use(proxyOrServe(proxy))
    server = http.createServer(app)
    server.listen(opts.port)
    io = socketio(server)
    io.on('connect', (socket) => {
      logger.onClientConnect(socket)
      socket.on('disconnect', logger.onClientDisconnect.bind(logger))
    })
  }

  /**
   * Just a wrapper around chokidar that fires events to connected socket
   */
  const createWatcher = () => {
    watcher = chokidar.watch(opts.files, { ignoreInitial: true })
    watcher.on('all', (event, filePath) => {
      logger.onFileUpdated(event, filePath)
      io.emit('filesUpdated', filePath)
    })
  }

  return {
    start () {
      logger.onStart()
      createServer()
      createWatcher()
    },
    stop () {
      io.close()
      server.close()
      watcher.close()
    }
  }
}

module.exports = Anubis
