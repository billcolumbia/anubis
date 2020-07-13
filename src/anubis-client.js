const socket = window.io()
const cacheBust = '?cachebust='

const injectCSS = (path) => {
  const source = path.match(/([a-zA-Z]|-|_|\d)+\.css/)[0]
  const currentLink = document.querySelector(`link[href*="${source}"]`)

  if (currentLink) {
    const clone = currentLink.cloneNode(false)
    const parent = currentLink.parentNode
    const qsIndex = currentLink.href.indexOf(cacheBust)
    const href = qsIndex > -1
      ? currentLink.href.substring(0, qsIndex)
      : currentLink.href
    clone.href = href + cacheBust + Date.now()
    if (parent.lastChild === currentLink) parent.appendChild(clone)
    else parent.insertBefore(clone, currentLink.nextSibling)
    parent.removeChild(currentLink)
  }
}

socket.on('filesUpdated', (path) => {
  if (path.indexOf('.css') > -1) injectCSS(path)
  else location.reload()
})
