const chalk = require('chalk')
const { log } = console

class Logger {
  static onStart(url) {
    log(chalk.green('\nAnubis is watching 👀'), chalk.blue(`\n${url} 🆙\n`))
  }
  static onClientConnect() {
    log(this.timeStamp() + chalk.magenta('[⚭ browser connected]'))
  }
  static onClientDisconnect() {
    log(this.timeStamp() + chalk.magenta('[% browser disconnected]'))
  }
  static onFileUpdated(event, filePath) {
    const time = this.timeStamp()
    const message =
      filePath.indexOf('.css') > -1 ? 'Injecting CSS!' : 'Reloading browser!'
    log(time + chalk.magenta(`[${event}] `) + chalk.green(`${filePath}`))
    log(time + chalk.cyan(` ↳ ${message}`))
  }
  static onBrowserOpened(url) {
    log(this.timeStamp() + chalk.blue(`Opening browser to ${url}`))
  }
  static missingFiles() {
    log(
      chalk.redBright(
        'Anubis was asked to watch nothing! Required param: An array or glob of files to watch with the --files option.'
      )
    )
    throw new Error('Missing required options! (files)')
  }
  static timeStamp() {
    const timeNow = new Date().toLocaleTimeString().replace(/\s*(AM|PM)/, '')
    return chalk.dim(`[${timeNow}] `)
  }
}

module.exports = Logger
