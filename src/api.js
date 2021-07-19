const chokidar = require('chokidar')
const http = require('http')
const socketio = require('socket.io')
const connect = require('connect')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const open = require('open')
const path = require('path')
const Logger = require('./logger')
const defaults = require('./defaults')

class Anubis {
  constructor(userOptions) {
    this.opts = Object.assign({}, defaults, userOptions)
    if (!this.opts.files) Logger.missingFiles()
  }

  io = null
  server = null
  watcher = null
  throttler = null
  q = []

  /**
   * Create a basic HTTP server for serving Anubis
   * client.js. The Anubis client creates a socket
   * connection to inject CSS and reload the browser
   * on certain chokidar events.
   */
  createServer = () => {
    const app = connect()
    app.use((req, res) => {
      const serve = serveStatic(path.join(__dirname))
      serve(req, res, finalhandler(req, res))
    })
    this.server = http.createServer(app)
    this.io = socketio(this.server)
    this.io.on('connect', (client) => {
      Logger.onClientConnect(client)
      client.on('disconnect', Logger.onClientDisconnect.bind(Logger))
    })
    this.server.listen(this.opts.port)
  }

  openBrowser = () => {
    if (!this.opts.openBrowser) return
    ;(async () => {
      Logger.onBrowserOpened(this.opts.target)
      await open(`${this.opts.target}`)
    })()
  }

  /**
   * Handle event from chokidar watcher
   *
   * Events on CSS files get sent to client immediately,
   * all others are queued. This is because CSS gets injected
   * and other files have a full reload. The queue tries to
   * help prevent excessive reloads in a short period of time.
   * @param {String} event Chokidar event
   * @param {String} filePath path to file that triggered event
   */
  handleEvent = (event, filePath) => {
    if (filePath.indexOf('.css') > -1) this.notifyClient(event, filePath)
    else this.q.push({ event, filePath })
  }

  /**
   * @param {String} event Chokidar event
   * @param {String} filePath path to file that triggered event
   */
  notifyClient = (event, filePath) => {
    Logger.onFileUpdated(event, filePath)
    this.io.emit('filesUpdated', filePath)
  }

  clearQ = () => {
    if (this.q.length > 0) {
      const { event, filePath } = this.q[this.q.length - 1]
      this.notifyClient(event, filePath)
      this.q = []
    }
  }

  createWatcher = () => {
    this.watcher = chokidar.watch(this.opts.files, { ignoreInitial: true })
    this.watcher.on('all', (event, filePath) => {
      this.handleEvent(event, filePath)
    })
    this.throttler = setInterval(this.clearQ, 200)
  }

  start() {
    Logger.onStart(this.opts.target)
    this.createServer()
    this.createWatcher()
    this.openBrowser()
  }

  stop() {
    clearInterval(this.throttler)
    this.io.close()
    this.server.close()
    this.watcher.close()
  }
}

module.exports = Anubis
