const chokidar = require('chokidar')
const httpProxy = require('http-proxy')
const http = require('http')
const WebSocket = require('ws')
const url = require('url')

const defaults = {
  watch: './stuff/**/*.{css,js}'
}

const setup = (options = defaults) => {
  MachOne.options = Object.assign({}, options, defaults)
  MachOne.watch()
  MachOne.serve()
}

const watch = () => {
  chokidar
    .watch(MachOne.options.watch)
    .on('all', (event, path) => {
      console.log(event, path)
    })
}

const serve = () => {
  // MachOne.proxy()
}

const proxy = () => {
  httpProxy.createProxyServer({
    target: 'http://localhost:8080'
  }).listen('9000')
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
