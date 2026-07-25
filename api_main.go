package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

func apiGetTime(ctx *ApiCtx) map[string]any {
	out := ctx.Out
	out["time"] = time.Now().Format("2006-01-02 15:04:05")
	return out
}

func apiGetMapSettings(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	out["mappos"] = getSetting(
		"mappos",
		"53.89372:27.56521:13",
	)

	return out
}

func apiSaveMapSettings(ctx *ApiCtx) map[string]any {
	out := ctx.Out
	value := strings.TrimSpace(ctx.D["mappos"])

	parts := strings.Split(value, ":")
	if len(parts) != 3 {
		out["status"] = "invalid map position"
		return out
	}

	latitude, err := strconv.ParseFloat(parts[0], 64)
	if err != nil || latitude < -90 || latitude > 90 {
		out["status"] = "invalid latitude"
		return out
	}

	longitude, err := strconv.ParseFloat(parts[1], 64)
	if err != nil || longitude < -180 || longitude > 180 {
		out["status"] = "invalid longitude"
		return out
	}

	zoom, err := strconv.Atoi(parts[2])
	if err != nil || zoom < 1 || zoom > 19 {
		out["status"] = "invalid zoom"
		return out
	}

	mappos := fmt.Sprintf(
		"%.5f:%.5f:%d",
		latitude,
		longitude,
		zoom,
	)

	setSetting("mappos", mappos)

	out["mappos"] = mappos

	return out
}
