import {h} from '@motorcycle/dom'
import MarkdownIt from 'markdown-it'
import mem from 'mem'

var memcache = {
  has (k) { return this[k] },
  get (k) { return this[k] },
  set (k, v) { this[k] = v }
}

const md = new MarkdownIt({
  linkify: true,
  breaks: true
})

export function list (data, typed) {
  return h('main', [
    h('section', [
      h('ul.panel', Object.keys(data.threads).map(id =>
        h('li.item', {key: id}, [
          thread(data.threads[id], false, data.threads[id].messages.length)
        ])
      )),
      create(null, typed)
    ])
  ])
}

export function standalone (data, typed) {
  return h('main', [
    h('article', [
      thread(data, true, data.messages.length),
      create(data.id, typed)
    ])
  ])
}

const thread = mem(_thread, memcache)

function _thread (data, standalone = false) {
  let messages = standalone
    ? data.messages.reverse()
    : data.messages.slice(0, 7)
  let random = Math.random() * 7
  var rotateLeft = Math.random() <= 0.5
  var rotate = rotateLeft ? -random : random
  var color = 255

  return h('ul.thread', {
    props: {
      id: data.id
    }
  }, messages.map((message, i) => {
    color = color - i * 10
    let padding = message.text.length > 20
      ? parseInt(Math.random() * 6 + (i * 2 + 2))
      : '10px'

    let props = standalone ? {key: message.id} : {
      style: {
        'z-index': `${-i + 10}`,
        'top': '2px',
        'left': '2px',
        'transform': `rotate(${parseInt(rotate)}deg)`,
        'background-color': `rgb(${color}, ${color}, ${color})`,
        'opacity': `${(10 - i) / 10}`,
        'padding': `${padding}px`
      },
      hook: {
        insert (vnode) {
          vnode.elm.style.top = `${(vnode.elm.parentNode.offsetHeight - vnode.elm.offsetHeight) / 2}px`
        },
        postpatch (_, vnode) {
          vnode.elm.style.top = `${(vnode.elm.parentNode.offsetHeight - vnode.elm.offsetHeight) / 2}px`
        }
      }
    }

    props.props = {}
    props.props.innerHTML = md.render(message.text)

    let random = Math.random() * 7
    rotateLeft = !rotateLeft
    rotate = (rotateLeft ? -random : random) % 360

    return h('li.message', props)
  }))
}

export function empty () {
  return h('div')
}

export function nav () {
  return h('nav', [
    h('ul', [
      h('li', [
        h('a', {props: {href: '#/'}}, 'you')
      ])
    ])
  ])
}

function create (id = '', typed = '') {
  return h('form.create', [
    h('input', {props: {name: 'thread', type: 'hidden', value: id}}),
    h('textarea', {
      props: {name: 'text', value: typed, placeholder: 'Ctrl+Enter to send. Markdown accepted.'},
      hook: {
        create (_, vnode) {
          vnode.elm.addEventListener('input', e => {
            e.target.style.height = '1px'
            e.target.style.height = e.target.scrollHeight + 5 + 'px'
          })
        },
        insert (vnode) {
          vnode.elm.value = typed
        },
        postpatch (vnode) {
          vnode.elm.value = typed
        }
      }
    }),
    h('button', id ? 'send' : 'create new stack')
  ])
}
