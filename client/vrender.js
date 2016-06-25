import {h} from '@motorcycle/dom'

export function list (data) {
  return h('ul.panel', data.threads.map(item =>
    h('li.item', [thread(item)])
  ))
}

export function thread (data) {
  let messages = (data.messages || []).slice(0, 7)
  let random = Math.random() * 7
  var rotateLeft = Math.random() <= 0.5
  var rotate = rotateLeft ? -random : random
  var color = 255

  return h('ul.thread', {
    hook: {
      insert (vnode) {
        vnode.elm.style
      }
    }
  }, messages.map((message, i) => {
    color = color - i * 10

    let v = h('li.message', {
      style: {
        'z-index': `${-i + 10}`,
        'top': '2px',
        'left': '2px',
        'transform': `rotate(${parseInt(rotate)}deg)`,
        'background-color': `rgb(${color}, ${color}, ${color})`,
        'opacity': `${(10 - i) / 10}`,
        'padding': `${parseInt(Math.random() * 6 + (i * 2 + 2))}px`
      },
      hook: {
        insert (vnode) {
          vnode.elm.style.top = `${(vnode.elm.parentNode.offsetHeight - vnode.elm.offsetHeight) / 2}px`
        },
        postpatch (_, vnode) {
          vnode.elm.style.top = `${(vnode.elm.parentNode.offsetHeight - vnode.elm.offsetHeight) / 2}px`
        }
      }
    }, message.text)

    let random = Math.random() * 7
    rotateLeft = !rotateLeft
    rotate = (rotateLeft ? -random : random) % 360

    return v
  }))
}

export function empty () {
  return h('div')
}

export function nav () {
  return h('nav', [
    h('ul', [
      h('li', [
        h('a', 'you')
      ])
    ])
  ])
}

export function create () {
  return h('form.create', [
    h('input'),
    h('button', 'post message')
  ])
}
