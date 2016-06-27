package main

import (
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/graphql/language/ast"
)

func selectedFields(p graphql.ResolveParams) []string {
	fields := make([]string, len(p.Info.FieldASTs[0].SelectionSet.Selections))
	for i, f := range p.Info.FieldASTs[0].SelectionSet.Selections {
		fields[i] = f.(*ast.Field).Name.Value
	}
	return fields
}
