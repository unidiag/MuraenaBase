package main

import (
	"context"
	"errors"
	"fmt"
	"main/internal/muraenatx"
	"main/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type muraenaTXAddressRow struct {
	Address    uint16 `json:"address"`
	AddressHex string `json:"address_hex"`
	Command    uint8  `json:"command"`
	CommandHex string `json:"command_hex"`
	Mask       uint8  `json:"mask"`
	MaskBinary string `json:"mask_binary"`

	ID        uint      `json:"id"`
	Location  string    `json:"location"`
	Descr     string    `json:"descr"`
	Map       string    `json:"map"`
	Billing   string    `json:"billing"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ██╗     ██╗███████╗████████╗
// ██║     ██║██╔════╝╚══██╔══╝
// ██║     ██║███████╗   ██║
// ██║     ██║╚════██║   ██║
// ███████╗██║███████║   ██║
// ╚══════╝╚═╝╚══════╝   ╚═╝

func apiGetMuraenaTXAddresses(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	result, err := getMuraenaTXClient().List(ctx.R.Context())
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	var storedAddresses []models.Address

	if err := db.Find(&storedAddresses).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	storedByAddr := make(map[uint16]models.Address, len(storedAddresses))

	for _, item := range storedAddresses {
		storedByAddr[item.Addr] = item
	}

	rows := make([]muraenaTXAddressRow, 0, len(result.Items))

	for _, item := range result.Items {
		stored := storedByAddr[item.Address]

		rows = append(rows, muraenaTXAddressRow{
			Address:    item.Address,
			AddressHex: fmt.Sprintf("%04X", item.Address),
			Command:    item.Command,
			CommandHex: fmt.Sprintf("%02X", item.Command),
			Mask:       item.Mask,
			MaskBinary: fmt.Sprintf("%08b", item.Mask),

			ID:        stored.ID,
			Location:  stored.Location,
			Descr:     stored.Descr,
			Map:       stored.Map,
			Billing:   stored.Billing,
			CreatedAt: stored.CreatedAt,
			UpdatedAt: stored.UpdatedAt,
		})
	}

	out["device"] = getSetting("dev")
	out["rows"] = rows

	return out
}

// ██████╗ ███████╗███████╗███████╗████████╗
// ██╔══██╗██╔════╝██╔════╝██╔════╝╚══██╔══╝
// ██████╔╝█████╗  ███████╗█████╗     ██║
// ██╔══██╗██╔══╝  ╚════██║██╔══╝     ██║
// ██║  ██║███████╗███████║███████╗   ██║
// ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝

func apiResetMuraenaTX(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	device := getSetting("dev")
	if device == "" {
		out["status"] = "MuraenaTX serial device is not configured"
		return out
	}

	response, err := getMuraenaTXClient().Restart(ctx.R.Context())
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	out["response"] = response.Raw

	return out
}

// ██████╗ ███████╗██╗     ███████╗████████╗███████╗
// ██╔══██╗██╔════╝██║     ██╔════╝╚══██╔══╝██╔════╝
// ██║  ██║█████╗  ██║     █████╗     ██║   █████╗
// ██║  ██║██╔══╝  ██║     ██╔══╝     ██║   ██╔══╝
// ██████╔╝███████╗███████╗███████╗   ██║   ███████╗
// ╚═════╝ ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝

func apiDeleteMuraenaTXAddress(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	addressValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["address"]),
		16,
		16,
	)
	if err != nil || addressValue > muraenatx.MaxAddress {
		out["status"] = "Invalid MuraenaTX address"
		return out
	}

	address := uint16(addressValue)

	if address == 0 {
		out["status"] = "Service address 0000 cannot be deleted"
		return out
	}

	var model models.Address

	dbResult := db.Where("addr = ?", address).First(&model)

	if dbResult.Error != nil &&
		!errors.Is(dbResult.Error, gorm.ErrRecordNotFound) {
		out["status"] = dbResult.Error.Error()
		return out
	}

	response, err := getMuraenaTXClient().DeleteSwitch(
		ctx.R.Context(),
		address,
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	if model.ID != 0 {
		if err := db.Delete(&model).Error; err != nil {
			out["status"] = fmt.Sprintf(
				"address was deleted from MuraenaTX, but database deletion failed: %v",
				err,
			)
			return out
		}
	}

	out["address"] = fmt.Sprintf("%04X", address)
	out["response"] = response.Raw

	return out
}

//  █████╗ ██████╗ ██████╗
// ██╔══██╗██╔══██╗██╔══██╗
// ███████║██║  ██║██║  ██║
// ██╔══██║██║  ██║██║  ██║
// ██║  ██║██████╔╝██████╔╝
// ╚═╝  ╚═╝╚═════╝ ╚═════╝

func apiSaveMuraenaTXAddress(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	addressValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["address"]),
		16,
		16,
	)
	if err != nil || addressValue > muraenatx.MaxAddress {
		out["status"] = "Invalid MuraenaTX address"
		return out
	}

	commandValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["command"]),
		16,
		8,
	)
	if err != nil {
		out["status"] = "Invalid MuraenaTX command"
		return out
	}

	maskValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["mask"]),
		2,
		8,
	)
	if err != nil {
		out["status"] = "Invalid MuraenaTX mask"
		return out
	}

	mapValue, err := normalizeAddressValues(
		ctx.D["map"],
		"Map",
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	billingValue, err := normalizeBilling(
		ctx.D["billing"],
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	if err := validateUniqueBilling(
		billingValue,
		0,
	); err != nil {
		out["status"] = err.Error()
		return out
	}

	address := uint16(addressValue)

	var count int64

	if err := db.Model(&models.Address{}).
		Where("addr = ?", address).
		Count(&count).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	if count > 0 {
		out["status"] = "Address already exists in database"
		return out
	}

	item := muraenatx.Switch{
		Address: address,
		Command: uint8(commandValue),
		Mask:    uint8(maskValue),
	}

	// Сначала добавляем адрес в устройство.
	response, err := getMuraenaTXClient().SetSwitch(
		ctx.R.Context(),
		item,
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	model := models.Address{
		Addr:     address,
		Mask:     uint8(maskValue),
		Location: strings.TrimSpace(ctx.D["location"]),
		Descr:    strings.TrimSpace(ctx.D["descr"]),
		Map:      mapValue,
		Billing:  billingValue,
	}

	if err := db.Create(&model).Error; err != nil {
		// Компенсационный откат: удаляем только что созданный адрес
		// из MuraenaTX, поскольку запись БД сохранить не удалось.
		_, rollbackErr := getMuraenaTXClient().DeleteSwitch(
			ctx.R.Context(),
			address,
		)

		if rollbackErr != nil {
			out["status"] = fmt.Sprintf(
				"database error: %v; MuraenaTX rollback error: %v",
				err,
				rollbackErr,
			)
			return out
		}

		out["status"] = err.Error()
		return out
	}

	out["id"] = model.ID
	out["address"] = fmt.Sprintf("%04X", address)
	out["response"] = response.Raw

	return out
}

// ███████╗██████╗ ██╗████████╗
// ██╔════╝██╔══██╗██║╚══██╔══╝
// █████╗  ██║  ██║██║   ██║
// ██╔══╝  ██║  ██║██║   ██║
// ███████╗██████╔╝██║   ██║
// ╚══════╝╚═════╝ ╚═╝   ╚═╝

func apiUpdateMuraenaTXAddress(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	oldAddressValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["old_address"]),
		16,
		16,
	)
	if err != nil {
		out["status"] = "Invalid old MuraenaTX address"
		return out
	}

	newAddressValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["address"]),
		16,
		16,
	)
	if err != nil || newAddressValue > muraenatx.MaxAddress {
		out["status"] = "Invalid new MuraenaTX address"
		return out
	}

	commandValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["command"]),
		16,
		8,
	)
	if err != nil {
		out["status"] = "Invalid MuraenaTX command"
		return out
	}

	maskValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["mask"]),
		2,
		8,
	)
	if err != nil {
		out["status"] = "Invalid MuraenaTX mask"
		return out
	}

	mapValue, err := normalizeAddressValues(
		ctx.D["map"],
		"Map",
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	billingValue, err := normalizeBilling(
		ctx.D["billing"],
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	oldAddress := uint16(oldAddressValue)
	newAddress := uint16(newAddressValue)

	var model models.Address

	result := db.Where("addr = ?", oldAddress).First(&model)
	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		out["status"] = result.Error.Error()
		return out
	}

	if err := validateUniqueBilling(
		billingValue,
		model.ID,
	); err != nil {
		out["status"] = err.Error()
		return out
	}

	// При старых адресах, которые были созданы до появления таблицы,
	// запись создадим автоматически.
	if model.ID == 0 {
		model = models.Address{
			Addr: oldAddress,
		}
	}

	client := getMuraenaTXClient()

	if oldAddress != newAddress {
		var count int64

		if err := db.Model(&models.Address{}).
			Where("addr = ? AND id <> ?", newAddress, model.ID).
			Count(&count).Error; err != nil {
			out["status"] = err.Error()
			return out
		}

		if count > 0 {
			out["status"] = "New address already exists in database"
			return out
		}

		if _, err := client.ChangeAddress(
			ctx.R.Context(),
			oldAddress,
			newAddress,
		); err != nil {
			out["status"] = err.Error()
			return out
		}
	}

	item := muraenatx.Switch{
		Address: newAddress,
		Command: uint8(commandValue),
		Mask:    uint8(maskValue),
	}

	response, err := client.SetSwitch(
		ctx.R.Context(),
		item,
	)
	if err != nil {
		if oldAddress != newAddress {
			_, _ = client.ChangeAddress(
				ctx.R.Context(),
				newAddress,
				oldAddress,
			)
		}

		out["status"] = err.Error()
		return out
	}

	oldModel := model

	model.Addr = newAddress
	model.Mask = uint8(maskValue)
	model.Location = strings.TrimSpace(ctx.D["location"])
	model.Descr = strings.TrimSpace(ctx.D["descr"])
	model.Map = mapValue
	model.Billing = billingValue

	var dbErr error

	if model.ID == 0 {
		model = models.Address{
			Addr:     newAddress,
			Mask:     uint8(maskValue),
			Location: strings.TrimSpace(ctx.D["location"]),
			Descr:    strings.TrimSpace(ctx.D["descr"]),
			Map:      mapValue,
			Billing:  billingValue,
		}

		dbErr = db.Create(&model).Error
	} else {
		dbErr = db.Model(&models.Address{}).
			Where("id = ?", model.ID).
			Updates(map[string]any{
				"addr":     newAddress,
				"mask":     uint8(maskValue),
				"location": strings.TrimSpace(ctx.D["location"]),
				"descr":    strings.TrimSpace(ctx.D["descr"]),
				"map":      mapValue,
				"billing":  billingValue,
			}).Error
	}

	if dbErr != nil {
		// Возвращаем адрес устройства обратно.
		if oldAddress != newAddress {
			_, _ = client.ChangeAddress(
				ctx.R.Context(),
				newAddress,
				oldAddress,
			)
		}

		// Полностью восстановить старые CMD и MASK здесь можно,
		// если перед изменением получить их из LIST.
		_ = oldModel

		out["status"] = dbErr.Error()
		return out
	}

	out["id"] = model.ID
	out["address"] = fmt.Sprintf("%04X", newAddress)
	out["response"] = response.Raw

	return out
}

//  ██████╗ ███████╗████████╗    ████████╗██╗  ██╗    ███████╗████████╗ █████╗ ████████╗██╗   ██╗███████╗
// ██╔════╝ ██╔════╝╚══██╔══╝    ╚══██╔══╝╚██╗██╔╝    ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║██╔════╝
// ██║  ███╗█████╗     ██║          ██║    ╚███╔╝     ███████╗   ██║   ███████║   ██║   ██║   ██║███████╗
// ██║   ██║██╔══╝     ██║          ██║    ██╔██╗     ╚════██║   ██║   ██╔══██║   ██║   ██║   ██║╚════██║
// ╚██████╔╝███████╗   ██║          ██║   ██╔╝ ██╗    ███████║   ██║   ██║  ██║   ██║   ╚██████╔╝███████║
//  ╚═════╝ ╚══════╝   ╚═╝          ╚═╝   ╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝

func apiGetMuraenaTXTransmissionState(
	ctx *ApiCtx,
) map[string]any {
	out := ctx.Out

	enabled, response, err :=
		getMuraenaTXClient().TransmissionStatus(
			ctx.R.Context(),
		)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	out["enabled"] = enabled

	if enabled {
		out["state"] = "ON"
	} else {
		out["state"] = "OFF"
	}

	out["response"] = response.Raw

	return out
}

// ███████╗███████╗████████╗    ████████╗██╗  ██╗    ███████╗████████╗ █████╗ ████████╗██╗   ██╗███████╗
// ██╔════╝██╔════╝╚══██╔══╝    ╚══██╔══╝╚██╗██╔╝    ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║██╔════╝
// ███████╗█████╗     ██║          ██║    ╚███╔╝     ███████╗   ██║   ███████║   ██║   ██║   ██║███████╗
// ╚════██║██╔══╝     ██║          ██║    ██╔██╗     ╚════██║   ██║   ██╔══██║   ██║   ██║   ██║╚════██║
// ███████║███████╗   ██║          ██║   ██╔╝ ██╗    ███████║   ██║   ██║  ██║   ██║   ╚██████╔╝███████║
// ╚══════╝╚══════╝   ╚═╝          ╚═╝   ╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝

func apiSetMuraenaTXTransmissionState(
	ctx *ApiCtx,
) map[string]any {
	out := ctx.Out

	enabledText := strings.TrimSpace(
		strings.ToLower(ctx.D["enabled"]),
	)

	var enabled bool

	switch enabledText {
	case "1", "true", "on":
		enabled = true

	case "0", "false", "off":
		enabled = false

	default:
		out["status"] = "Invalid transmission state"
		return out
	}

	client := getMuraenaTXClient()

	var (
		response muraenatx.Response
		err      error
	)

	if enabled {
		response, err = client.TransmissionOn(
			ctx.R.Context(),
		)
	} else {
		response, err = client.TransmissionOff(
			ctx.R.Context(),
		)
	}

	if err != nil {
		out["status"] = err.Error()
		return out
	}

	out["enabled"] = enabled

	if enabled {
		out["state"] = "ON"
	} else {
		out["state"] = "OFF"
	}

	out["response"] = response.Raw

	return out
}

// ███████╗████████╗ █████╗ ████████╗███████╗
// ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝
// ███████╗   ██║   ███████║   ██║   █████╗
// ╚════██║   ██║   ██╔══██║   ██║   ██╔══╝
// ███████║   ██║   ██║  ██║   ██║   ███████╗
// ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝

func apiSetMuraenaTXOutputState(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	addressValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["address"]),
		16,
		16,
	)
	if err != nil || addressValue > muraenatx.MaxAddress {
		out["status"] = "Invalid MuraenaTX address"
		return out
	}

	commandValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["command"]),
		16,
		8,
	)
	if err != nil {
		out["status"] = "Invalid MuraenaTX command"
		return out
	}

	maskValue, err := strconv.ParseUint(
		strings.TrimSpace(ctx.D["mask"]),
		2,
		8,
	)
	if err != nil {
		out["status"] = "Invalid MuraenaTX mask"
		return out
	}

	item := muraenatx.Switch{
		Address: uint16(addressValue),
		Command: uint8(commandValue),
		Mask:    uint8(maskValue),
	}

	if err := db.Model(&models.Address{}).
		Where("addr = ?", item.Address).
		Update("mask", item.Mask).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	response, err := getMuraenaTXClient().SetSwitch(
		ctx.R.Context(),
		item,
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	out["address"] = fmt.Sprintf(
		"%04X",
		item.Address,
	)
	out["command"] = fmt.Sprintf(
		"%02X",
		item.Command,
	)
	out["mask"] = fmt.Sprintf(
		"%08b",
		item.Mask,
	)
	out["response"] = response.Raw

	return out
}

// ██████╗ ███████╗███████╗ ██████╗██████╗ ██╗██████╗ ████████╗██╗ ██████╗ ███╗   ██╗
// ██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
// ██║  ██║█████╗  ███████╗██║     ██████╔╝██║██████╔╝   ██║   ██║██║   ██║██╔██╗ ██║
// ██║  ██║██╔══╝  ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██║██║   ██║██║╚██╗██║
// ██████╔╝███████╗███████║╚██████╗██║  ██║██║██║        ██║   ██║╚██████╔╝██║ ╚████║
// ╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

func apiUpdateMuraenaTXAddressDescr(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	addressText := strings.TrimSpace(ctx.D["address"])
	descr := strings.TrimSpace(ctx.D["descr"])

	addressValue, err := strconv.ParseUint(addressText, 16, 16)
	if err != nil || addressValue > muraenatx.MaxAddress {
		out["status"] = "Invalid MuraenaTX address"
		return out
	}

	address := uint16(addressValue)

	result := db.Model(&models.Address{}).
		Where("addr = ?", address).
		Update("descr", descr)

	if result.Error != nil {
		out["status"] = result.Error.Error()
		return out
	}

	if result.RowsAffected == 0 {
		out["status"] = "Address database record not found"
		return out
	}

	var model models.Address

	if err := db.
		Where("addr = ?", address).
		First(&model).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	out["address"] = fmt.Sprintf("%04X", address)
	out["descr"] = model.Descr
	out["updated_at"] = model.UpdatedAt

	return out
}

// ██╗      ██████╗  ██████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
// ██║     ██╔═══██╗██╔════╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
// ██║     ██║   ██║██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║
// ██║     ██║   ██║██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
// ███████╗╚██████╔╝╚██████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
// ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

func apiUpdateMuraenaTXAddressLocation(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	addressText := strings.TrimSpace(ctx.D["address"])
	location := strings.TrimSpace(ctx.D["location"])

	addressValue, err := strconv.ParseUint(addressText, 16, 16)
	if err != nil {
		out["status"] = "Invalid MuraenaTX address"
		return out
	}

	address := uint16(addressValue)

	result := db.Model(&models.Address{}).
		Where("addr = ?", address).
		Update("location", location)

	if result.Error != nil {
		out["status"] = result.Error.Error()
		return out
	}

	if result.RowsAffected == 0 {
		out["status"] = "Address database record not found"
		return out
	}

	var model models.Address

	if err := db.
		Where("addr = ?", address).
		First(&model).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	out["location"] = model.Location
	out["updated_at"] = model.UpdatedAt

	return out
}

// ███████╗██╗   ██╗███╗   ██╗ ██████╗
// ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
// ███████╗ ╚████╔╝ ██╔██╗ ██║██║
// ╚════██║  ╚██╔╝  ██║╚██╗██║██║
// ███████║   ██║   ██║ ╚████║╚██████╗
// ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝

func apiSyncMuraenaTX(ctx *ApiCtx) map[string]any {
	out := ctx.Out

	var addresses []models.Address

	if err := db.
		Order("addr ASC").
		Find(&addresses).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	client := getMuraenaTXClient()

	deleteResponse, err := client.DeleteAll(ctx.R.Context())
	if err != nil {
		out["status"] = fmt.Sprintf(
			"DELETE=ALL failed: %v",
			err,
		)
		return out
	}

	synced := 0

	for _, address := range addresses {
		item := muraenatx.Switch{
			Address: address.Addr,
			Command: 0x00,
			Mask:    address.Mask,
		}

		response, err := client.SetSwitch(
			ctx.R.Context(),
			item,
		)
		if err != nil {
			out["status"] = fmt.Sprintf(
				"Failed to sync address %04X: %v",
				address.Addr,
				err,
			)

			out["synced"] = synced
			out["failed_address"] = fmt.Sprintf(
				"%04X",
				address.Addr,
			)
			out["response"] = response.Raw

			return out
		}

		synced++
	}

	out["synced"] = synced
	out["response"] = deleteResponse.Raw

	return out
}

// ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
// ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
// ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
// ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
// ██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
// ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝

func findMuraenaTXSwitch(
	ctx context.Context,
	address uint16,
) (muraenatx.Switch, error) {
	result, err := getMuraenaTXClient().List(ctx)
	if err != nil {
		return muraenatx.Switch{}, err
	}

	for _, item := range result.Items {
		if item.Address == address {
			return item, nil
		}
	}

	return muraenatx.Switch{}, fmt.Errorf(
		"MuraenaTX address %04X not found",
		address,
	)
}
