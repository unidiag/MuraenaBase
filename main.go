package main

import (
	"log"
	"log/syslog"
	"os"
	"sync"
	"time"

	"github.com/oschwald/geoip2-golang"
	llama "github.com/unidiag/go-llama"
	"gorm.io/gorm"
)

const APPNAME = "MuraenaBase"
const APPLINK = "http://github.com/unidiag/MuraenaBase"
const VERSION = "1.02"
const BUILD_DATE = "2026-07-29"
const BUILD_TIME = "21:46:20"

var dbname = "mbase:mbase@tcp(127.0.0.1:3306)/mbase?charset=utf8mb4&parseTime=True&loc=Local"

// CREATE DATABASE IF NOT EXISTS mbase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
// CREATE USER IF NOT EXISTS 'mbase'@'127.0.0.1' IDENTIFIED BY 'mbase';
// GRANT ALL PRIVILEGES ON mbase.* TO 'mbase'@'127.0.0.1';
// FLUSH PRIVILEGES;

var (
	mu        sync.Mutex
	debug     = false
	err       error
	settings  map[string]string
	db        *gorm.DB
	sysLogger *syslog.Writer // для slog(..)
	runtime   time.Time
	dbip      *geoip2.Reader

	jwtSecret  = []byte("CHANGE_ME_LONG_RANDOM_SECRET_1234")
	accessTTL  = 10 * time.Minute
	refreshTTL = 14 * 24 * time.Hour

	llamaClient *llama.Client

	demoMode bool
)

// ███╗   ███╗ █████╗ ██╗███╗   ██╗
// ████╗ ████║██╔══██╗██║████╗  ██║
// ██╔████╔██║███████║██║██╔██╗ ██║
// ██║╚██╔╝██║██╔══██║██║██║╚██╗██║
// ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
// ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝

func main() {
	runtime = time.Now()

	parseRunMode()

	sysLogger, err = syslog.New(
		syslog.LOG_INFO|syslog.LOG_DAEMON,
		APPNAME,
	)
	if err != nil {
		log.Println("syslog init error:", err)
	}

	debug = isRunThroughGoRun()

	if demoMode {
		slog("Server run in DEMO-mode", "info")
	} else if debug {
		slog("Server run in DEBUG-mode", "debug")
	}

	if dbname != "" {
		initDB()
	} else {
		port := ":9000"

		if len(os.Args) > 1 {
			port = os.Args[1]
		}

		setSetting("port", port)
	}

	if demoMode {
		if err := initDemoData(); err != nil {
			log.Fatal("Demo data init error:", err)
		}
	}

	initGeoIP()
	go webserver()

	for {
		delay(1000)
	}
}
