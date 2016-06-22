package main

import "github.com/graphql-go/graphql"

var fields = graphql.Fields{
	"threads": &graphql.Field{
		Type: graphql.String,
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			return "a", nil
		},
	},
}

var rootQuery = graphql.ObjectConfig{
	Name:   "RootQuery",
	Fields: fields,
}

var schemaConfig = graphql.SchemaConfig{
	Query: graphql.NewObject(rootQuery),
}
