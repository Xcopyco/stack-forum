package main

import (
	"net/http"
	"time"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
	"github.com/inconshreveable/log15"
	"github.com/kelseyhightower/envconfig"
	"gopkg.in/tylerb/graceful.v1"
)

type Settings struct {
	Debug       bool   `envconfig:"DEBUG"`
	Port        string `envconfig:"PORT"`
	DatabaseURL string `envconfig:"DATABASE_URL"`
}

var err error
var settings Settings
var log log15.Logger

func main() {
	log = log15.New()
	log.Info("starting server...")

	envconfig.Process("", &settings)

	schema, err := graphql.NewSchema(makeSchema())
	if err != nil {
		log.Info("error creating schema", "err", err)
		return
	}

	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: false,
	})

	mux := http.NewServeMux()
	mux.Handle("/graphql", h)
	mux.Handle("/", http.FileServer(http.Dir("dist")))

	log.Info("Listening at " + settings.Port + "...")
	graceful.Run(":"+settings.Port, 1*time.Second, mux)
	log.Info("Exiting...")
}
