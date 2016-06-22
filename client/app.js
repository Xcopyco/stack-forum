import most from 'most'
import hold from '@most/hold'
import fwitch from 'fwitch'

import * as vrender from './vrender'

export default function main ({DOM, ROUTER, ITEMS}) {
  let match$ = hold(
    ROUTER.define({
      '/items': {where: 'ITEMS'},
      '/item/:post': id => ({where: 'ITEM', id})
    })
  )
    .startWith({value: {where: 'ITEMS'}})

  let vtree$ = most.combine((m, items) =>
    fwitch(m.value.where, {
      'ITEMS': vrender.list.bind(null, {threads: items}),
      'ITEM': vrender.thread.bind(null, {thread: items[m.value.id]})
    })
  , match$, ITEMS)
    .map(x => x || vrender.empty())

  let href$ = most.merge(DOM.select('a[href^="#/"]').events('click'))
    .map(e => e.target.getAttribute('href').slice(1))

  return {
    DOM: vtree$,
    ROUTER: most.empty()
      .merge(href$)
  }
}
