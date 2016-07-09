# stack-forum

A simple, fast and thin forum software with stacked threads in the UI.

Do you need a forum for a group of friends, an organization, a project, a web teaching environment? Find PHP difficult to run? Discourse is too complicated and heavy, NodeBB has the same problems? Search no more. This thing only needs a Postgres database and runs on Heroku, super low memory footprint.

## The demo

See it live at: https://forumstack.herokuapp.com/

At this point, my email is hardcoded to be the only logged user, so you'll post as if you were me. Also, there are plenty of missing features and bugs. On the other hand, this project is still very open, so I hope we can talk and get good ideas to implement (otherwise I'll end up implementing anything that is in my crazy mind).

## The code

The code is simple and makes few assumptions. It is designed to be extendable, not with plugins, but with forks. You can use stack-forum as it is, but if you know a little Go (which is probably more than myself) then you can just move some parts inside the code and add your own functionality.

However, there are 2 major design choices:

  * Cycle.js for the UI -- in fact, it is more specific than that: it is Cycle.js with most only.
  * GraphQL for the HTTP API.

Which means you are good to go if you know Cycle.js (unlikely), but you can also write a totally different UI. That would be great if you could do that and contribute it back after -- maybe we even start a UI module system! Maybe in a hundred years, but I still encourage you to try and promise to give support whenever I can.

The GraphQL think seems to be a limitation if you're not into GraphQL, but that also means all the relevant code (for additions and mutations, as well as fetches and queries) is awkwardly placed inside the same `schema.go` file. Easy to hack if you don't have time.

Good luck.

## Roadmap

- [ ] authorization with letsauth
- [ ] more solid usership
- [ ] pagination
- [ ] basic admin features
