import Cycle from '@cycle/most-run'
import {makeDOMDriver} from '@motorcycle/dom'
import hashRouterDriver from 'cycle-hashrouter-most-driver'
import {makeGraphQLDriver, gql} from 'cycle-graphql-most-driver'
import {makeNotificationDriver} from 'cycle-notification-most-driver'

import app from './app'

Cycle.run(app, {
  DOM: makeDOMDriver('#main', [
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style')
  ]),
  ROUTER: hashRouterDriver,
  GRAPHQL: makeGraphQLDriver({
    endpoint: '/graphql',
    templates: {
      fetchThreads: gql`
query {
  threads {
    id
    messages {
      text
    }
  }
}
      `
    }
  }),
  NOTIFICATION: makeNotificationDriver({timeout: 4000})
})
