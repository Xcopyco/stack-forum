package main

import (
	"crypto/md5"
	"errors"
	"fmt"
	"io"
	l "log"
	"net/url"
	"os"
	"time"

	"github.com/graphql-go/graphql"
	"gopkg.in/pg.v4"
)

var db *pg.DB

var userType = graphql.NewObject(graphql.ObjectConfig{
	Name: "User",
	Fields: graphql.Fields{
		"name": &graphql.Field{Type: graphql.String},
		"pic":  &graphql.Field{Type: graphql.String},
	},
})

var messageType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Message",
	Fields: graphql.Fields{
		"id": &graphql.Field{Type: graphql.ID},
		"created": &graphql.Field{
			Type: graphql.Int,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				if c, ok := p.Source.(Message); ok {
					return c.Created.Unix(), nil
				} else {
					return 0, errors.New("FAILED")
				}
			},
		},
		"thread": &graphql.Field{Type: graphql.ID},
		"owner": &graphql.Field{
			Type: userType,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				email := p.Source.(Message).Owner
				h := md5.New()
				io.WriteString(h, email)
				return User{
					Name: email,
					Pic:  fmt.Sprintf("https://s.gravatar.com/avatar/%x?s=200&d=retro", h.Sum(nil)),
				}, nil
			},
		},
		"text": &graphql.Field{Type: graphql.String},
	},
})

var threadType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Thread",
	Fields: graphql.Fields{
		"id": &graphql.Field{Type: graphql.ID},
		"messages": &graphql.Field{
			Type: graphql.NewList(messageType),
			Args: graphql.FieldConfigArgument{
				"order": &graphql.ArgumentConfig{
					Type:        graphql.String,
					Description: "DESC: last messages first, and vice-versa with ASC.",
				},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				cols := selectedFields(p)

				var order string
				if o, ok := p.Args["order"]; ok {
					order = o.(string)
				} else {
					order = "ASC"
				}

				messages := []Message{}
				err := db.Model(&Message{}).
					Column(cols...).
					Order("id "+order).
					Where("thread = ?", p.Source.(Thread).Id).
					Select(&messages)
				return messages, err
			},
		},
	},
})

func makeSchema() graphql.SchemaConfig {
	urlp, _ := url.Parse(settings.DatabaseURL)
	pass, _ := urlp.User.Password()

	db = pg.Connect(&pg.Options{
		Addr:     urlp.Host,
		User:     urlp.User.Username(),
		Password: pass,
		Database: urlp.Path[1:],
		SSL:      true,
	})

	pg.SetQueryLogger(l.New(os.Stderr, "sql", 0))
	pg.SetLogger(l.New(os.Stderr, "pg", 0))

	return graphql.SchemaConfig{
		Query: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootQuery",
			Fields: graphql.Fields{
				"threads": &graphql.Field{
					Type: graphql.NewList(threadType),
					Resolve: func(p graphql.ResolveParams) (interface{}, error) {
						threads := []Thread{}
						err := db.Model(&Message{}).
							ColumnExpr("DISTINCT thread AS id").
							Select(&threads)
						return threads, err
					},
				},
				"thread": &graphql.Field{
					Type: threadType,
					Args: graphql.FieldConfigArgument{
						"id": &graphql.ArgumentConfig{
							Type:        graphql.NewNonNull(graphql.ID),
							Description: "the id of the thread to fetch.",
						},
					},
					Resolve: func(p graphql.ResolveParams) (interface{}, error) {
						id, _ := p.Args["id"].(string)
						return Thread{Id: id}, nil
					},
				},
			},
		}),
		Mutation: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootMutation",
			Fields: graphql.Fields{
				"postMessage": &graphql.Field{
					Type: messageType,
					Args: graphql.FieldConfigArgument{
						"text": &graphql.ArgumentConfig{
							Type: graphql.NewNonNull(graphql.String),
						},
						"thread": &graphql.ArgumentConfig{
							Type:        graphql.NewNonNull(graphql.ID),
							Description: "the id of the thread to which this message will be posted.",
						},
					},
					Resolve: func(params graphql.ResolveParams) (interface{}, error) {
						text, _ := params.Args["text"].(string)
						thread, _ := params.Args["thread"].(string)

						message := Message{
							Owner:  "fiatjaf@gmail.com",
							Text:   text,
							Thread: thread,
						}

						err := db.Create(&message)
						return message, err
					},
				},
			},
		}),
	}
}

type Thread struct {
	Id string `json:"id,omitempty" sql:",pk"`
}

type Message struct {
	Id      int64     `json:"id,omitempty" sql:",pk"`
	Created time.Time `json:"created,omitempty" sql:",null"`
	Thread  string    `json:"thread,omitempty"`
	Owner   string    `json:"owner,omitempty"`
	Text    string    `json:"text,omitempty"`
}

type User struct {
	Name string `json:"name"`
	Pic  string `json:"pic"`
}
