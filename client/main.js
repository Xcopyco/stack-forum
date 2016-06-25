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
      `,
      fetchThread: gql`
query fetchThread($id: ID!) {
  thread(id: $id) {
    id
    messages {
      owner
      text
    }
  }
}
      `,
      postMessage: gql`
mutation postMessage($thread: ID!, $text: String!) {
  postMessage(thread: $thread, text: $text) {
    thread
    id
  }
}
      `
    }
  }),
  NOTIFICATION: makeNotificationDriver({timeout: 4000})
})
