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

	if demoMode {
		return apiGetDemoMuraenaTXAddresses(ctx)
	}

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

// ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
// ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
// ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
// ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
// ██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
// ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝

func parseLatLng(value string) (float64, float64, error) {
	parts := strings.Split(strings.TrimSpace(value), ":")
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("invalid coordinates")
	}

	latitude, err := strconv.ParseFloat(parts[0], 64)
	if err != nil || latitude < -90 || latitude > 90 {
		return 0, 0, fmt.Errorf("invalid latitude")
	}

	longitude, err := strconv.ParseFloat(parts[1], 64)
	if err != nil || longitude < -180 || longitude > 180 {
		return 0, 0, fmt.Errorf("invalid longitude")
	}

	return latitude, longitude, nil
}

func normalizeLatLng(value string) (string, error) {
	latitude, longitude, err := parseLatLng(value)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%.5f:%.5f", latitude, longitude), nil
}

func getMapCenterLatLng() string {
	value := getSetting(
		"mappos",
		"53.89372:27.56521:13",
	)

	parts := strings.Split(value, ":")
	if len(parts) != 3 {
		return "53.89372:27.56521"
	}

	latLng, err := normalizeLatLng(
		parts[0] + ":" + parts[1],
	)
	if err != nil {
		return "53.89372:27.56521"
	}

	return latLng
}
