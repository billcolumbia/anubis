#!/usr/bin/env node
const yargs = require('yargs')
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

const defaults = {
  files: null,
  target: 'http://localhost:8080',
  port: 3000
}

const missingOptionsMessage = 'Anubis was asked to watch nothing! Anubis must be given an array or glob of files to be watched with the --files option'

const scriptsToInject = (port) => {
  return `
<!-- injected via Anubis -->
<script src="/socket.io/socket.io.js"></script>
<script src="http://localhost:${port}/anubis-client.js"></script>
<!-- /injected via Anubis -->
`
}

const Anubis = (userOptions) => {
  const opts = Object.assign({}, defaults, userOptions)

  if (!opts.files) {
    log(chalk.redBright(missingOptionsMessage))
    throw new Error('Missing required options! (files)')
  }

  const logger = {
    onStart () {
      log(
        chalk.green('\n♺  Anubis is watching ♺\n'),
        chalk.yellow(opts.files),
        '\n'
      )
    },
    onClientConnect (socket) {
      log(
        this.timeStamp() +
        chalk.magenta('[⚭ browser connected]') +
        chalk.blue(` ${socket.handshake.headers.host}`)
      )
    },
    onFileUpdated (event, filePath) {
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
    const server = http.createServer(app)
    const io = socketio(server)
    app.use(harmon([], [{
      query: 'body',
      func: injectClient
    }]))
    app.use((req, res, next) => {
      if (req.url !== '/anubis-client.js') proxied.web(req, res)
      else {
        const serve = serveStatic(path.join(__dirname))
        serve(req, res, finalhandler(req, res))
      }
    })
    server.listen(opts.port)

    return { io }
  }

  return () => {
    logger.onStart()
    const { io } = createServer()

    io.on('connection', logger.onClientConnect.bind(logger))

    chokidar
      .watch(opts.files)
      .on('all', (event, filePath) => {
        logger.onFileUpdated(event, filePath)
        io.emit('filesUpdated', filePath)
      })
  }
}

yargs
  .command({
    command: ['start', '$0'],
    describe: 'Start Anubis',
    builder: {
      files: {
        alias: 'f',
        describe: 'Files to watch'
      },
      target: {
        alias: 't',
        describe: 'URL to proxy',
        default: 'http://localhost:8080',
        type: 'string'
      },
      port: {
        alias: 'p',
        describe: 'Port to proxy to',
        default: 3000,
        type: 'number'
      }
    },
    handler (argv) {
      Anubis({
        files: argv.files,
        target: argv.target,
        port: argv.port
      })()
    }
  })
  .demandOption(
    ['files'],
    missingOptionsMessage
  )
  .parse()

module.exports = Anubis
