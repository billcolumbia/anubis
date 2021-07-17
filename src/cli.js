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
        describe: 'Backend URL',
        default: defaults.target,
        type: 'string'
      },
      port: {
        alias: 'p',
        describe: 'Port to serve anubis client from',
        default: defaults.port,
        type: 'number'
      },
      logs: {
        alias: 'l',
        describe: 'Turn logging off (not recommended)',
        default: defaults.logs,
        type: 'boolean'
      },
      openBrowser: {
        alias: 'o',
        describe: 'Open browser to proxied server on start',
        default: defaults.openBrowser,
        type: 'boolean'
      }
    },
    handler(argv) {
      const Anubis = require('./api')({
        files: argv.files,
        target: argv.target,
        port: argv.port,
        logs: argv.logs,
        openBrowser: argv.openBrowser
      })
      Anubis.start()
    }
  })
  .demandOption(
    ['files'],
    'Anubis was asked to watch nothing! Anubis must be given an array or glob of files to be watched with the --files option'
  )
  .parse()
