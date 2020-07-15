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
      },
      logs: {
        alias: 'l',
        describe: 'Turn logging off (not recommended)',
        default: defaults.logs,
        type: 'boolean'
      }
    },
    handler (argv) {
      const Anubis = require('./api')({
        files: argv.files,
        target: argv.target,
        port: argv.port,
        logs: argv.logs
      })
      Anubis.start()
    }
  })
  .demandOption(
    ['files'],
    'Anubis was asked to watch nothing! Anubis must be given an array or glob of files to be watched with the --files option'
  )
  .parse()
