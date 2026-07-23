package main

import (
	"main/internal/muraenatx"
	"time"
)

var muraenaTXClient = muraenatx.New(muraenatx.Config{
	BaudRate:    115200,
	Timeout:     10 * time.Second,
	IdleTimeout: 150 * time.Millisecond,
	DrainTime:   50 * time.Millisecond,
	Debug:       debug,
})

func getMuraenaTXClient() *muraenatx.Client {
	muraenaTXClient.SetDevice(getSetting("dev"))
	return muraenaTXClient
}
