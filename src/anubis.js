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
const { log } = console

let cliOptions = {
  files: null,
  target: null,
  port: null
}

const scriptsToInject = (port) => {
  return `
<!-- injected via Anubis -->
<script src="/socket.io/socket.io.js"></script>
<script src="http://localhost:${port}/client.js"></script>
<!-- /injected via Anubis -->
`
}

const Anubis = (opts) => {
  const logger = {
    onStart () {
      log(
        chalk.green('\n𓂀  Anubis is watching 𓂀\n'),
        chalk.yellow(opts.files),
        '\n'
      )
    },
    onClientConnect (socket) {
      log(
        this.timeStamp() +
        chalk.yellow('[⚭ browser connected]') +
        chalk.blue(` ${socket.handshake.headers.host}`)
      )
    },
    onFileUpdated (event, path) {
      const time = this.timeStamp()
      const message = path.indexOf('.css') > -1 ? 'Injecting CSS!' : 'Reloading browser!'
      log(
        time +
        chalk.magenta(`[${event}] `) +
        chalk.green(`${path}`)
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
    app.use(
      '/client.js',
      serveStatic('src/', { index: ['client.js'] })
    )
    app.use((req, res) => {
      proxied.web(req, res)
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
      .on('all', (event, path) => {
        logger.onFileUpdated(event, path)
        io.emit('filesUpdated', path)
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
      cliOptions = {
        files: argv.files,
        target: argv.target,
        port: argv.port
      }
      Anubis(cliOptions)()
    }
  })
  .demandOption(
    ['files'],
    'Anubis was asked to watch nothing! Anubis must be given an array or glob of files to be watched with the --files option'
  )
  .parse()

module.exports = Anubis
