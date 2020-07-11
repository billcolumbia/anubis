# Anubis 𓁢

Ask Anubis to watch your front-end assets. When those files change, Anubis will inject them and remove the dead link, or reload the browser altogether.

## What Anubis is not

- [HMR](https://webpack.js.org/concepts/hot-module-replacement/):
This is not Hot Module Replacement is not not intended to replace it. Anubis is best used for websites with limited JavaScript client managed state, and is not recommended for web apps.
- [LiveReload](http://livereload.com/):
Anubis shares some ideas from the days of old, but is not at feature parity with LiveReload at this time.
- [BrowserSync](https://www.browsersync.io/)
Anubis shares some ideas with BrowserSync, but will never meet feature parity. Anubis does not sync scroll position, have a dashboard, etc.

## What Anubis excels at
- Injecting CSS changes (via `link` tags, no `style` support yet)
- Reloading the browser when other files change
- Being very fast and light weight
- Makes working with backend servers easy (does not expect your project to be an SPA)
