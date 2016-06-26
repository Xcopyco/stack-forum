import cuid from 'cuid'
import most from 'most'
import hold from '@most/hold'
import fwitch from 'fwitch'
import {h} from '@motorcycle/dom'

import * as vrender from './vrender'

export default function main ({DOM, ROUTER, GRAPHQL, STORAGE}) {
  let match$ = hold(
    ROUTER.define({
      '/': {where: 'THREADS'},
      '/thread/:id': id => ({where: 'THREAD', id})
    })
  )
    .startWith({value: {where: 'ITEMS'}})

  let response$ = GRAPHQL
    .flatMap(r$ => r$ .recoverWith(err => most.of({errors: [err.message]})))

  let data$ = response$
    .filter(({errors}) => {
      if (errors && errors.length) {
        console.log('errors:', errors)
        return false
      }
      return true
    })
    .map(({data}) => data)

  let postMessage$ = data$.map(r => r.postMessage).filter(t => t)
  let threads$ = data$.map(r => r.threads).filter(t => t)
  let thread$ = data$.map(r => r.thread).filter(t => t)
  let threadMap$ = most.merge(threads$, thread$, postMessage$).scan((map, cur) => {
    if (cur.thread) {
      // a single message
      let thread = map[cur.thread] || {id: cur.thread}
      thread.messages = thread.messages || []
      thread.messages.push(cur)
      map[cur.thread] = thread
    } else if (Array.isArray(cur)) {
      // array of threads
      for (let i = 0; i < cur.length; i++) {
        let thread = map[cur.id] || {id: cur.id}
        for (let k in cur[i]) {
          thread[k] = cur[i][k]
        }
        map[cur[i].id] = thread
      }
    } else {
      // single thread
      map[cur.id] = cur
    }
    return map
  }, {})

  let vtree$ = most.combine(({value}, threads, storage) =>
    h('div', [
      vrender.nav(),
      fwitch(value.where, {
        'THREADS': () => vrender.list({threads}, storage['typed.']),
        'THREAD': () =>
          threads[value.id]
            ? vrender.standalone(threads[value.id], storage[`typed.${value.id}`])
            : vrender.empty()
      })
    ])
  ,
    match$,
    threadMap$,
    STORAGE.all$
  )
    .map(x => x || vrender.empty())

  let messageSubmit$ = DOM.select('form.create').events('submit')
    .tap(e => e.preventDefault())
    .multicast()

  let graphql$ = most.merge(
    match$
      .filter(m => m.value.where === 'THREADS')
      .constant({query: 'fetchThreads'}),
    match$
      .filter(m => m.value.where === 'THREAD')
      .map(m => ({query: 'fetchThread', variables: {id: m.value.id}})),
    messageSubmit$
      .map(e => ({
        text: e.target.querySelector('input[name="text"]').value,
        thread: e.target.querySelector('input[name="thread"]').value || cuid.slug()
      }))
      .filter(({text}) => text)
      .map(variables => ({mutation: 'postMessage', variables}))
  )

  let notify$ = most.merge(
    response$
      .filter(({errors}) => errors && errors.length)
      .flatMap(({errors}) => most.from(errors.map(e => e.message)))
  )

  return {
    DOM: vtree$,
    ROUTER: most.merge(
      DOM.select('ul.thread').events('click')
        .map(e => `/thread/${e.ownerTarget.id}`),
      postMessage$.map(message => `/thread/${message.thread}`)
    ),
    GRAPHQL: graphql$,
    NOTIFICATION: notify$,
    STORAGE: most.merge(
      DOM.select('form.create input[name="text"]').events('input')
        .map(e => ({
          [`typed.${e.target.parentNode.querySelector('[name="thread"]').value}`]:
            e.target.value
        })),
      messageSubmit$
        .map(e => ({
          text: e.target.querySelector('input[name="text"]').value,
          thread: e.target.querySelector('input[name="thread"]').value
        }))
        .map(e => ({[`typed.${e.thread}`]: ''}))
    )
  }
}
