# Anubis 𓁢

Ask Anubis to watch your front-end assets. When those files change, Anubis will inject them and remove the dead link, or reload the browser altogether.

## What Anubis is not

- [HMR](https://webpack.js.org/concepts/hot-module-replacement/):
    
    This is not Hot Module Replacement and is not intended to replace it. Anubis is best used for websites with minimal client-managed state, and is not recommended for web apps or SPAs.
- [LiveReload](http://livereload.com/):
    
    Anubis shares some ideas from the days of old, but is not at feature parity with LiveReload.
- [BrowserSync](https://www.browsersync.io/):
    
    Anubis shares some ideas with BrowserSync, but will never meet feature parity. Anubis does not sync scroll position, have a dashboard, etc.

## What Anubis excels at
- Injecting CSS changes (via `link` tags, no `style` support yet)
- Reloading the browser when other files change
- Being very fast and light weight
- Makes working with backend servers easy (does not expect your project to be an SPA)

## Usage

### Install
```shell
npm i -D https://github.com/billcolumbia/anubis
```

### Add npm script
```json
{
    "scripts": {
        "anubis": "anubis -f './public/**/*.{js,css,php}'"
    }
}
```

To pass an array of globs, just pass the same argument *n* times:

```json
{
    "scripts": {
        "anubis": "anubis -f './public/**/*.{js,css}' -f './templates/**/*.{twig,html}'"
    }
}
```

### Connect to the proxy
Once anubis is running make sure to connect to localhost at the port you provided (`localhost:3000` by default). If you go to the proxied URL, you wont get any injection or reloading!

## Options/API
```shell
npx anubis --help
```

### Available options
- **`--help`**: you know...
- **`port`**: 
    
    _about_: Port to proxy
    
    _required_: no

    _type_: number

    _default_: 3000
- **`target`**: 
    
    _about_: URL including port (root for your backend server)
    
    _required_: no

    _type_: string

    _default_: http://localhost:8080
- **`files`**: 
    
    _about_: Files to watch for changes (usually best to watch the compiled files if possible so we don't inject/reload too early)
    
    _required_: yes

    _type_: string | array (of globs)
    
    _default_: null
