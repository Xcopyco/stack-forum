import {h} from '@motorcycle/dom'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  linkify: true,
  breaks: true
})

export function list (data, typed) {
  return h('main', [
    h('section', [
      h('ul.panel', Object.keys(data.threads).map(id =>
        h('li.item', {key: id}, [thread(data.threads[id])])
      )),
      create(null, typed)
    ])
  ])
}

export function standalone (data, typed) {
  return h('main', [
    h('article', [
      thread(data, true),
      create(data.id, typed)
    ])
  ])
}

export function thread (data, standalone = false) {
  let messages = data.messages.slice(0, 7)
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

    let props = standalone ? {key: message.id} : {
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

export function create (id = '', typed = '') {
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
