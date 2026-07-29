package main

import (
	"fmt"
	"main/models"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

const demoAddressCount = 150

func parseRunMode() {
	if len(os.Args) < 2 {
		return
	}

	if strings.EqualFold(
		strings.TrimSpace(os.Args[1]),
		"demo",
	) {
		demoMode = true
		dbname = "demo.sqlite3"
	}
}

func initDemoData() error {
	if !demoMode {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Session(
			&gorm.Session{AllowGlobalUpdate: true},
		).Delete(&models.Address{}).Error; err != nil {
			return fmt.Errorf(
				"clear demo addresses: %w",
				err,
			)
		}

		addresses := makeDemoAddresses(
			demoAddressCount,
		)

		if err := tx.CreateInBatches(
			addresses,
			50,
		).Error; err != nil {
			return fmt.Errorf(
				"create demo addresses: %w",
				err,
			)
		}

		return nil
	})
}

func makeDemoAddresses(count int) []models.Address {
	addresses := make(
		[]models.Address,
		0,
		count,
	)

	rnd := rand.New(
		rand.NewSource(time.Now().UnixNano()),
	)

	now := time.Now()
	nextBillingNumber := 1200

	for i := 1; i <= count; i++ {
		apartments := makeDemoApartments(rnd, 8)

		billingNumbers := makeDemoBillingNumbers(
			rnd,
			&nextBillingNumber,
			8,
		)

		address := models.Address{
			Addr: uint16(i),
			Mask: demoMask(i),

			Location: fmt.Sprintf(
				"Минск, объект №%03d",
				i,
			),

			Descr: demoDescription(i),

			Map: strings.Join(
				apartments,
				":",
			),

			Billing: strings.Join(
				billingNumbers,
				":",
			),

			CreatedAt: now.Add(
				-time.Duration(count-i) *
					24 *
					time.Hour,
			),

			UpdatedAt: now.Add(
				-time.Duration(i%48) *
					time.Hour,
			),
		}

		addresses = append(
			addresses,
			address,
		)
	}

	return addresses
}

func makeDemoApartments(
	rnd *rand.Rand,
	count int,
) []string {
	permutation := rnd.Perm(30)

	apartments := make(
		[]string,
		0,
		count,
	)

	for _, value := range permutation[:count] {
		apartments = append(
			apartments,
			strconv.Itoa(value+1),
		)
	}

	return apartments
}

func makeDemoBillingNumbers(
	rnd *rand.Rand,
	nextNumber *int,
	count int,
) []string {
	values := make([]int, count)

	for i := range count {
		values[i] = *nextNumber
		*nextNumber = *nextNumber + 1
	}

	rnd.Shuffle(
		len(values),
		func(i, j int) {
			values[i], values[j] =
				values[j], values[i]
		},
	)

	numbers := make(
		[]string,
		0,
		count,
	)

	for _, value := range values {
		numbers = append(
			numbers,
			strconv.Itoa(value),
		)
	}

	return numbers
}

func demoMask(index int) uint8 {
	switch index % 8 {
	case 0:
		return 0b11111111

	case 1:
		return 0b00000001

	case 2:
		return 0b00000011

	case 3:
		return 0b00000111

	case 4:
		return 0b00001111

	case 5:
		return 0b00011111

	case 6:
		return 0b00111111

	default:
		return 0b01111111
	}
}

func demoDescription(index int) string {
	types := []string{
		"Жилой дом",
		"Административное здание",
		"Торговый объект",
		"Складское помещение",
		"Производственный объект",
		"Гостиница",
		"Учебное учреждение",
		"Медицинское учреждение",
	}

	objectType := types[(index-1)%len(types)]

	return fmt.Sprintf(
		"%s. Демонстрационный абонент №%03d",
		objectType,
		index,
	)
}

func initDemoSettings() {
	setSetting(
		"port",
		":9000",
		"Web server listen address",
		"0",
	)

	setSetting(
		"dev",
		"DEMO",
		"MuraenaTX dev path",
		"1",
	)

	setSetting(
		"mappos",
		"53.89372:27.56521:12",
		"LAT:LNG:ZOOM for map",
		"5",
	)

	setSetting(
		"demo",
		"1",
		"Demo mode",
		"6",
	)
}

func apiGetDemoMuraenaTXAddresses(
	ctx *ApiCtx,
) map[string]any {
	out := ctx.Out

	var addresses []models.Address

	if err := db.
		Order("addr ASC").
		Find(&addresses).Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	rows := make(
		[]muraenaTXAddressRow,
		0,
		len(addresses),
	)

	for _, item := range addresses {
		command := demoCommand(item.Addr)

		rows = append(
			rows,
			muraenaTXAddressRow{
				Address:    item.Addr,
				AddressHex: item.AddrHex(),

				Command: command,

				CommandHex: fmt.Sprintf(
					"%02X",
					command,
				),

				Mask: item.Mask,

				MaskBinary: fmt.Sprintf(
					"%08b",
					item.Mask,
				),

				ID:        item.ID,
				Location:  item.Location,
				Descr:     item.Descr,
				Map:       item.Map,
				Billing:   item.Billing,
				CreatedAt: item.CreatedAt,
				UpdatedAt: item.UpdatedAt,
			},
		)
	}

	out["device"] = "DEMO"
	out["demo"] = true
	out["rows"] = rows

	return out
}

func demoCommand(address uint16) uint8 {
	switch address % 6 {
	case 0:
		return 0b11111111

	case 1:
		return 0b00000000

	case 2:
		return 0b00000001

	case 3:
		return 0b00000011

	case 4:
		return 0b00000111

	default:
		return 0b00001111
	}
}

func rejectDemoWrite(
	ctx *ApiCtx,
) (map[string]any, bool) {
	if !demoMode {
		return nil, false
	}

	out := ctx.Out
	out["status"] =
		"This operation is disabled in demo mode"

	return out, true
}
