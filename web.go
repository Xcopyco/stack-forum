package main

import (
	"net/http"
	"time"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
	"github.com/kelseyhightower/envconfig"
	"github.com/mgutz/logxi/v1"
	"gopkg.in/tylerb/graceful.v1"
)

type Settings struct {
	Debug bool   `envconfig:"DEBUG"`
	Port  string `envconfig:"PORT"`
}

var err error
var settings Settings

func main() {
	envconfig.Process("", &settings)

	schema, err := graphql.NewSchema(schemaConfig)
	if err != nil {
		log.Info("error creating schema", "err", err)
		return
	}

	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	mux := http.NewServeMux()
	mux.Handle("/dist", http.FileServer(http.Dir("dist")))
	mux.Handle("/graphql", h)

	log.Info("Listening at " + settings.Port + "...")
	graceful.Run(":"+settings.Port, 1*time.Second, mux)
	log.Info("Exiting...")
}
