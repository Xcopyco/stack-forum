package main

import (
	l "log"
	"net/url"
	"os"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/graphql/language/ast"
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
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				cols := make([]string, len(p.Info.FieldASTs[0].SelectionSet.Selections))
				for i, f := range p.Info.FieldASTs[0].SelectionSet.Selections {
					cols[i] = f.(*ast.Field).Name.Value
				}

				messages := []Message{}
				err := db.Model(&Message{}).
					Column(cols...).
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
	Id string `json:"id,omitempty"`
}

type Message struct {
	Id     int64  `json:"id,omitempty"`
	Thread string `json:"thread,omitempty"`
	Owner  string `json:"owner,omitempty"`
	Text   string `json:"text,omitempty"`
}
