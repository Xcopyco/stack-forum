package main

import (
	l "log"
	"net/url"
	"os"

	"github.com/graphql-go/graphql"
	"github.com/kr/pretty"
	"github.com/lucsky/cuid"
	"gopkg.in/pg.v4"
)

var db *pg.DB

var messageType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Message",
	Fields: graphql.Fields{
		"id":     &graphql.Field{Type: graphql.ID},
		"thread": &graphql.Field{Type: graphql.ID},
		"user":   &graphql.Field{Type: graphql.String},
		"text":   &graphql.Field{Type: graphql.String},
	},
})

var threadType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Thread",
	Fields: graphql.Fields{
		"id": &graphql.Field{Type: graphql.ID},
		"messages": &graphql.Field{
			Type: graphql.NewList(messageType),
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
				// "message": &graphql.Field{},
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
							Type:        graphql.ID,
							Description: "the id of the thread to which this message will be posted.",
						},
					},
					Resolve: func(params graphql.ResolveParams) (interface{}, error) {
						message := Message{
							Owner: "fiatjaf@gmail.com",
						}

						t, _ := params.Args["text"].(string)
						message.Text = t

						if threadInput, ok := params.Args["thread"]; ok {
							message.Thread = threadInput.(string)
						} else {
							message.Thread = cuid.New()
						}
						err := db.Create(&message)

						pretty.Log(message)
						return message, err
					},
				},
			},
		}),
	}
}

type Thread struct {
	Id string `json:"id"`
}

type Message struct {
	Id     int64  `json:"id"`
	Thread string `json:"thread"`
	Owner  string `json:"owner"`
	Text   string `json:"text"`
}
