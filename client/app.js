import most from 'most'
import hold from '@most/hold'
import fwitch from 'fwitch'
import {h} from '@motorcycle/dom'

import * as vrender from './vrender'

export default function main ({DOM, ROUTER, GRAPHQL}) {
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

  let threads$ = data$.map(r => r.threads).filter(t => t)
  let thread$ = data$.map(r => r.thread).filter(t => t)
  let threadMap$ = most.merge(threads$, thread$).scan((map, cur) => {
    if (Array.isArray(cur)) {
      for (let i = 0; i < cur.length; i++) {
        var thread = map[cur.id] || {}
        for (let k in cur[i]) {
          thread[k] = cur[i][k]
        }
        map[cur[i].id] = thread
      }
    } else {
      map[cur.id] = cur
    }
    return map
  }, {})

  let vtree$ = most.combine((m, threads) =>
    h('div', [
      vrender.nav(),
      fwitch(m.value.where, {
        'THREADS': () => vrender.list({threads}),
        'THREAD': () =>
          threads[m.value.id] ? vrender.standalone(threads[m.value.id]) : vrender.empty()
      })
    ])
  ,
    match$,
    threadMap$
  )
    .map(x => x || vrender.empty())

  let graphql$ = most.merge(
    match$
      .filter(m => m.value.where === 'THREADS')
      .constant({query: 'fetchThreads'}),
    match$
      .filter(m => m.value.where === 'THREAD')
      .map(m => ({query: 'fetchThread', variables: {id: m.value.id}})),
    DOM.select('form.create').events('submit')
      .tap(e => e.preventDefault())
      .map(e => ({
        text: e.target.querySelector('input[name="text"]').value,
        thread: e.target.querySelector('input[name="thread"]').value
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
        .map(e => `/thread/${e.ownerTarget.id}`)
    ),
    GRAPHQL: graphql$,
    NOTIFICATION: notify$
  }
}
