package main

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"main/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

const maxAddressCSVSize = 10 * 1024 * 1024

var addressCSVHeader = []string{
	"id",
	"addr",
	"mask",
	"location",
	"descr",
	"map",
	"billing",
	"latlng",
	"created_at",
	"updated_at",
}

type addressCSVRow struct {
	Addr     uint16
	Mask     uint8
	Location string
	Descr    string
	Map      string
	Billing  string
	LatLng   string
	Line     int
}

func apiExportAddressesCSV(
	ctx *ApiCtx,
) map[string]any {
	out := ctx.Out

	var addresses []models.Address

	if err := db.
		Order("addr ASC").
		Find(&addresses).
		Error; err != nil {
		out["status"] = err.Error()
		return out
	}

	var buffer bytes.Buffer

	writer := csv.NewWriter(&buffer)

	if err := writer.Write(
		addressCSVHeader,
	); err != nil {
		out["status"] = err.Error()
		return out
	}

	for _, item := range addresses {
		record := []string{
			strconv.FormatUint(
				uint64(item.ID),
				10,
			),
			fmt.Sprintf(
				"%04X",
				item.Addr,
			),
			strconv.FormatUint(
				uint64(item.Mask),
				10,
			),
			item.Location,
			item.Descr,
			item.Map,
			item.Billing,
			item.LatLng,
			item.CreatedAt.Format(
				time.RFC3339,
			),
			item.UpdatedAt.Format(
				time.RFC3339,
			),
		}

		if err := writer.Write(
			record,
		); err != nil {
			out["status"] = err.Error()
			return out
		}
	}

	writer.Flush()

	if err := writer.Error(); err != nil {
		out["status"] = err.Error()
		return out
	}

	out["filename"] = fmt.Sprintf(
		"muraenabase-addresses-%s.csv",
		time.Now().Format("20060102-150405"),
	)
	out["csv"] = buffer.String()
	out["count"] = len(addresses)

	return out
}

func apiImportAddressesCSV(
	ctx *ApiCtx,
) map[string]any {
	if out, rejected :=
		rejectDemoWrite(ctx); rejected {
		return out
	}

	out := ctx.Out

	csvText := ctx.D["csv"]

	if len(csvText) > maxAddressCSVSize {
		out["status"] =
			"CSV file is too large"
		return out
	}

	rows, err :=
		parseAddressCSV(csvText)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	created := 0
	updated := 0

	err = db.Transaction(
		func(tx *gorm.DB) error {
			for _, row := range rows {
				var model models.Address

				result := tx.
					Where(
						"addr = ?",
						row.Addr,
					).
					First(&model)

				switch {
				case result.Error == nil:
					if err :=
						validateImportedBilling(
							tx,
							row.Billing,
							model.ID,
						); err != nil {
						return fmt.Errorf(
							"line %d: %w",
							row.Line,
							err,
						)
					}

					err = tx.
						Model(&models.Address{}).
						Where(
							"id = ?",
							model.ID,
						).
						Updates(
							map[string]any{
								"mask":     row.Mask,
								"location": row.Location,
								"descr":    row.Descr,
								"map":      row.Map,
								"billing":  row.Billing,
								"lat_lng":  row.LatLng,
							},
						).
						Error
					if err != nil {
						return fmt.Errorf(
							"line %d: %w",
							row.Line,
							err,
						)
					}

					updated++

				case errors.Is(
					result.Error,
					gorm.ErrRecordNotFound,
				):
					if err :=
						validateImportedBilling(
							tx,
							row.Billing,
							0,
						); err != nil {
						return fmt.Errorf(
							"line %d: %w",
							row.Line,
							err,
						)
					}

					model = models.Address{
						Addr:     row.Addr,
						Mask:     row.Mask,
						Location: row.Location,
						Descr:    row.Descr,
						Map:      row.Map,
						Billing:  row.Billing,
						LatLng:   row.LatLng,
					}

					if err :=
						tx.Create(
							&model,
						).Error; err != nil {
						return fmt.Errorf(
							"line %d: %w",
							row.Line,
							err,
						)
					}

					created++

				default:
					return fmt.Errorf(
						"line %d: %w",
						row.Line,
						result.Error,
					)
				}
			}

			return nil
		},
	)
	if err != nil {
		out["status"] = err.Error()
		return out
	}

	out["created"] = created
	out["updated"] = updated
	out["count"] = len(rows)

	return out
}

func parseAddressCSV(
	csvText string,
) ([]addressCSVRow, error) {
	csvText = strings.TrimPrefix(
		csvText,
		"\uFEFF",
	)
	csvText = strings.TrimSpace(
		csvText,
	)

	if csvText == "" {
		return nil, errors.New(
			"CSV file is empty",
		)
	}

	reader := csv.NewReader(
		strings.NewReader(csvText),
	)
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf(
			"failed to read CSV header: %w",
			err,
		)
	}

	indexes, err :=
		parseAddressCSVHeader(header)
	if err != nil {
		return nil, err
	}

	rows := make(
		[]addressCSVRow,
		0,
	)

	seenAddresses :=
		make(map[uint16]int)

	line := 1

	for {
		line++

		record, readErr :=
			reader.Read()

		if errors.Is(
			readErr,
			io.EOF,
		) {
			break
		}

		if readErr != nil {
			return nil, fmt.Errorf(
				"line %d: %w",
				line,
				readErr,
			)
		}

		if isEmptyCSVRecord(record) {
			continue
		}

		row, parseErr :=
			parseAddressCSVRow(
				record,
				indexes,
				line,
			)
		if parseErr != nil {
			return nil, parseErr
		}

		if previousLine, exists :=
			seenAddresses[row.Addr]; exists {
			return nil, fmt.Errorf(
				"line %d: address %04X is already used on line %d",
				line,
				row.Addr,
				previousLine,
			)
		}

		seenAddresses[row.Addr] = line

		rows = append(rows, row)
	}

	if len(rows) == 0 {
		return nil, errors.New(
			"CSV contains no address records",
		)
	}

	return rows, nil
}

func parseAddressCSVHeader(
	header []string,
) (map[string]int, error) {
	indexes := make(
		map[string]int,
		len(header),
	)

	for index, name := range header {
		name = strings.ToLower(
			strings.TrimSpace(name),
		)

		if name == "" {
			continue
		}

		indexes[name] = index
	}

	required := []string{
		"addr",
		"mask",
		"location",
		"descr",
		"map",
		"billing",
		"latlng",
	}

	for _, name := range required {
		if _, exists := indexes[name]; !exists {
			return nil, fmt.Errorf(
				"CSV column %q is missing",
				name,
			)
		}
	}

	return indexes, nil
}

func parseAddressCSVRow(
	record []string,
	indexes map[string]int,
	line int,
) (addressCSVRow, error) {
	addrText := strings.TrimSpace(
		csvField(
			record,
			indexes["addr"],
		),
	)

	addrValue, err :=
		parseCSVAddress(addrText)
	if err != nil {
		return addressCSVRow{},
			fmt.Errorf(
				"line %d: %w",
				line,
				err,
			)
	}

	maskText := strings.TrimSpace(
		csvField(
			record,
			indexes["mask"],
		),
	)

	maskValue, err :=
		strconv.ParseUint(
			maskText,
			10,
			8,
		)
	if err != nil {
		return addressCSVRow{},
			fmt.Errorf(
				"line %d: invalid mask %q",
				line,
				maskText,
			)
	}

	mapValue, err :=
		normalizeAddressValues(
			csvField(
				record,
				indexes["map"],
			),
			"Map",
		)
	if err != nil {
		return addressCSVRow{},
			fmt.Errorf(
				"line %d: %w",
				line,
				err,
			)
	}

	billingValue, err :=
		normalizeBilling(
			csvField(
				record,
				indexes["billing"],
			),
		)
	if err != nil {
		return addressCSVRow{},
			fmt.Errorf(
				"line %d: %w",
				line,
				err,
			)
	}

	latLngValue := strings.TrimSpace(
		csvField(
			record,
			indexes["latlng"],
		),
	)

	if len(latLngValue) > 64 {
		return addressCSVRow{},
			fmt.Errorf(
				"line %d: latlng is longer than 64 characters",
				line,
			)
	}

	return addressCSVRow{
		Addr: uint16(addrValue),
		Mask: uint8(maskValue),
		Location: strings.TrimSpace(
			csvField(
				record,
				indexes["location"],
			),
		),
		Descr: strings.TrimSpace(
			csvField(
				record,
				indexes["descr"],
			),
		),
		Map:     mapValue,
		Billing: billingValue,
		LatLng:  latLngValue,
		Line:    line,
	}, nil
}

func parseCSVAddress(
	value string,
) (uint64, error) {
	value = strings.TrimSpace(
		value,
	)
	value = strings.TrimPrefix(
		strings.ToUpper(value),
		"0X",
	)

	if value == "" {
		return 0, errors.New(
			"address is empty",
		)
	}

	address, err :=
		strconv.ParseUint(
			value,
			16,
			16,
		)
	if err != nil {
		return 0, fmt.Errorf(
			"invalid hexadecimal address %q",
			value,
		)
	}

	return address, nil
}

func csvField(
	record []string,
	index int,
) string {
	if index < 0 ||
		index >= len(record) {
		return ""
	}

	return record[index]
}

func isEmptyCSVRecord(
	record []string,
) bool {
	for _, value := range record {
		if strings.TrimSpace(value) != "" {
			return false
		}
	}

	return true
}

func validateImportedBilling(
	tx *gorm.DB,
	billing string,
	excludeID uint,
) error {
	if billing == "" {
		return nil
	}

	values := strings.Split(
		billing,
		":",
	)

	var addresses []models.Address

	query := tx.Model(
		&models.Address{},
	)

	if excludeID != 0 {
		query = query.Where(
			"id <> ?",
			excludeID,
		)
	}

	if err := query.
		Where("billing <> ''").
		Find(&addresses).
		Error; err != nil {
		return err
	}

	importedValues := make(
		map[string]struct{},
	)

	for _, value := range values {
		value = strings.TrimSpace(value)

		// 0 означает, что договор
		// для этого выхода не назначен.
		if value == "" || value == "0" {
			continue
		}

		if _, exists :=
			importedValues[value]; exists {
			return fmt.Errorf(
				"billing value %q is duplicated",
				value,
			)
		}

		importedValues[value] = struct{}{}
	}

	for _, address := range addresses {
		for _, existing := range strings.Split(
			address.Billing,
			":",
		) {
			existing = strings.TrimSpace(
				existing,
			)

			if existing == "" ||
				existing == "0" {
				continue
			}

			if _, exists :=
				importedValues[existing]; exists {
				return fmt.Errorf(
					"billing value %q is already used by address %04X",
					existing,
					address.Addr,
				)
			}
		}
	}

	return nil
}
