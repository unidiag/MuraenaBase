package main

import (
	"fmt"
)

type apiMuraenaTXAddress struct {
	Address    uint16 `json:"address"`
	AddressHex string `json:"address_hex"`
	Command    uint8  `json:"command"`
	CommandHex string `json:"command_hex"`
	Mask       uint8  `json:"mask"`
	MaskBinary string `json:"mask_binary"`
}

func apiGetMuraenaTXAddresses(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	device := getSetting("dev")
	if device == "" {
		out["status"] = "MuraenaTX serial device is not configured"
		return out
	}

	result, err := getMuraenaTXClient().List(ctx.R.Context())
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	rows := make([]apiMuraenaTXAddress, 0, len(result.Items))

	for _, item := range result.Items {
		rows = append(rows, apiMuraenaTXAddress{
			Address:    item.Address,
			AddressHex: fmt.Sprintf("%04X", item.Address),
			Command:    item.Command,
			CommandHex: fmt.Sprintf("%02X", item.Command),
			Mask:       item.Mask,
			MaskBinary: fmt.Sprintf("%08b", item.Mask),
		})
	}

	out["device"] = device
	out["count"] = len(rows)
	out["reported_count"] = result.ReportedCount
	out["rows"] = rows

	return out
}
