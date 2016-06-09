import most from 'most'
import Cycle from '@cycle/most-run'
import {makeDOMDriver} from '@motorcycle/dom'
import {makeRouterDriver} from 'cyclic-router'
import {createHashHistory} from 'history'

import app from './app'

Cycle.run(app, {
  DOM: makeDOMDriver('#main', [
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style')
  ]),
  ROUTER: makeRouterDriver(createHashHistory({queryKey: false})),
  ITEMS: threadsDriver
})

import hold from '@most/hold'
import data from './threads.yaml'

function threadsDriver (save$) {
  let threads = data.threads

  return hold(most.empty().startWith(threads))
}
