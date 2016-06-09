import {h} from '@motorcycle/dom'

export function list (data) {
  return h('ul.panel', data.threads.map(item =>
    h('li.item', [thread(item)])
  ))
}

export function thread (data) {
  return h('ul.thread', data.messages.slice(0, 3).map(m =>
    h('li.message', m.text)
  ))
}

export function empty () {
  return h('div')
}
