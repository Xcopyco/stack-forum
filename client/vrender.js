import cuid from 'cuid'
import {h} from '@motorcycle/dom'

export function list (data) {
  return h('main', [
    h('section', [
      h('ul.panel', Object.keys(data.threads).map(id =>
        h('li.item', [thread(data.threads[id])])
      )),
      create()
    ])
  ])
}

export function standalone (data) {
  return h('main', [
    h('article', [
      thread(data, true),
      create(data.id)
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

    let props = standalone ? {} : {
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

    let random = Math.random() * 7
    rotateLeft = !rotateLeft
    rotate = (rotateLeft ? -random : random) % 360

    return h('li.message', props, message.text)
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

export function create (id = cuid.slug()) {
  return h('form.create', [
    h('input', {props: {name: 'id', type: 'hidden', value: id}}),
    h('input', {props: {name: 'text'}}),
    h('button', 'post message')
  ])
}
