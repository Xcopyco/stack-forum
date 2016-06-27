import Cycle from '@cycle/most-run'
import {makeDOMDriver} from '@motorcycle/dom'
import {makeGraphQLDriver, gql} from 'cycle-graphql-most-driver'
import {makeNotificationDriver} from 'cycle-notification-most-driver'
import {makeStorageDriver} from 'cycle-storage-most-driver'
import ROUTER from 'cycle-hashrouter-most-driver'

import app from './app'

Cycle.run(app, {
  DOM: makeDOMDriver('#main', [
    require('snabbdom/modules/props'),
    require('snabbdom/modules/style')
  ]),
  GRAPHQL: makeGraphQLDriver({
    endpoint: '/graphql',
    templates: {
      fetchThreads: gql`
query fetchThreads {
  threads {
    id
    messages(order: "DESC") {
      text
      owner {
        name
      }
    }
  }
}
      `,
      fetchThread: gql`
query fetchThread($id: ID!) {
  thread(id: $id) {
    id
    messages(order: "DESC") {
      id
      text
      owner {
        name
        pic
      }
    }
  }
}
      `,
      postMessage: gql`
mutation postMessage($thread: ID!, $text: String!) {
  postMessage(thread: $thread, text: $text) {
    thread
    text
    owner
  }
}
      `
    }
  }),
  NOTIFICATION: makeNotificationDriver({timeout: 4000}),
  STORAGE: makeStorageDriver(window.sessionStorage),
  ROUTER
})
