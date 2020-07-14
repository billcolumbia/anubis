#!/usr/bin/env node
const yargs = require('yargs')
const defaults = require('./defaults')

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
        default: defaults.target,
        type: 'string'
      },
      port: {
        alias: 'p',
        describe: 'Port to proxy to',
        default: defaults.port,
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
