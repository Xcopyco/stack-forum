CREATE TABLE messages (
  id serial PRIMARY KEY,
  created timestamp NOT NULL default now(),
  thread text NOT NULL,
  owner text NOT NULL,
  text text NOT NULL
);
