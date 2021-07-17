const chalk = require('chalk')
const chokidar = require('chokidar')
const http = require('http')
const socketio = require('socket.io')
const connect = require('connect')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const open = require('open')
const Buffer = require('buffer').Buffer
const path = require('path')
const { log } = console
const defaults = require('./defaults')

const missingOptionsMessage =
  'Anubis was asked to watch nothing! Anubis must be given an array or glob of files to be watched with the --files option'

const Anubis = (userOptions) => {
  const opts = Object.assign({}, defaults, userOptions)

  let server = null
  let io = null
  let watcher = null
  let throttler = null

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
    onStart() {
      if (!opts.logs) return
      log(chalk.green('\nAnubis is watching 👀'), chalk.blue(`\n${opts.target} 🆙\n`))
    },
    onClientConnect(socket) {
      if (!opts.logs) return
      log(this.timeStamp() + chalk.magenta('[⚭ browser connected]'))
    },
    onClientDisconnect() {
      if (!opts.logs) return
      log(this.timeStamp() + chalk.magenta('[% browser disconnected]'))
    },
    onFileUpdated(event, filePath) {
      if (!opts.logs) return
      const time = this.timeStamp()
      const message =
        filePath.indexOf('.css') > -1 ? 'Injecting CSS!' : 'Reloading browser!'
      log(time + chalk.magenta(`[${event}] `) + chalk.green(`${filePath}`))
      log(time + chalk.cyan(` ↳ ${message}`))
    },
    onBrowserOpened() {
      if (!opts.logs) return
      log(this.timeStamp() + chalk.blue(`Opening browser to ${opts.target}`))
    },
    timeStamp() {
      const timeNow = new Date().toLocaleTimeString().replace(/\s*(AM|PM)/, '')
      return chalk.dim(`[${timeNow}] `)
    }
  }

  const openBrowser = () => {
    if (!opts.openBrowser) return
    ;(async () => {
      logger.onBrowserOpened()
      await open(`${opts.target}`)
    })()
  }

  /**
   * Create a webserver for our static assets and sockets
   */
  const createServer = () => {
    const app = connect()
    app.use((req, res) => {
      const serve = serveStatic(path.join(__dirname))
      serve(req, res, finalhandler(req, res))
    })
    server = http.createServer(app)
    io = socketio(server)
    io.on('connect', (client) => {
      logger.onClientConnect(client)
      client.on('disconnect', logger.onClientDisconnect.bind(logger))
    })
    server.listen(opts.port)
  }

  let q = []

  const clearQ = () => {
    if (q.length > 0) {
      const { event, filePath } = q[q.length - 1]
      notifyClient(event, filePath)
      q = []
    }
  }

  const handleEvent = (event, filePath) => {
    if (filePath.indexOf('.css') > -1) notifyClient(event, filePath)
    else q.push({ event, filePath })
  }

  const notifyClient = (event, filePath) => {
    logger.onFileUpdated(event, filePath)
    io.emit('filesUpdated', filePath)
  }

  /**
   * Just a wrapper around chokidar that fires events to connected socket
   */
  const createWatcher = () => {
    watcher = chokidar.watch(opts.files, { ignoreInitial: true })
    watcher.on('all', (event, filePath) => {
      handleEvent(event, filePath)
    })
    throttler = setInterval(clearQ, 200)
  }

  return {
    start() {
      logger.onStart()
      createServer()
      createWatcher()
      openBrowser()
    },
    stop() {
      clearInterval(throttler)
      io.close()
      server.close()
      watcher.close()
    }
  }
}

module.exports = Anubis
