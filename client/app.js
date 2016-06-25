import most from 'most'
import hold from '@most/hold'
import fwitch from 'fwitch'
import {h} from '@motorcycle/dom'

import * as vrender from './vrender'

export default function main ({DOM, ROUTER, GRAPHQL}) {
  let match$ = hold(
    ROUTER.define({
      '/': {where: 'THREADS'},
      '/thread': id => ({where: 'THREAD', id})
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

  let vtree$ = most.combine((m, threads) =>
    h('div', [
      vrender.nav(),
      fwitch(m.value.where, {
        'THREADS': vrender.list.bind(null, {threads}),
        'THREAD': vrender.thread.bind(null, {thread: threads[m.value.id]})
      }),
      vrender.create()
    ])
  ,
    match$,
    data$.map(r => r.threads).filter(t => t).startWith([])
  )
    .map(x => x || vrender.empty())

  let graphql$ = most.merge(
    most.of({query: 'fetchThreads'}),
    DOM.select('form.create').events('submit')
      .tap(e => e.preventDefault())
      .map(e => e.target.querySelector('input').value)
      .filter(v => v)
      .map(v => ({mutation: 'postMessage', variables: {text: v}}))
  )
  let notify$ = most.merge(
    response$
      .filter(({errors}) => errors && errors.length)
      .flatMap(({errors}) => most.from(errors.map(e => e.message)))
  )

  return {
    DOM: vtree$,
    ROUTER: most.empty(),
    GRAPHQL: graphql$,
    NOTIFICATION: notify$
  }
}
