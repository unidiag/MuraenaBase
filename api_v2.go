package main

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"main/internal/muraenatx"
	"main/models"

	"gorm.io/gorm"
)

const billingAPIKeySetting = "apikey"

type apiV2Method struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	Description string `json:"description"`
}

type apiV2IndexResponse struct {
	Name    string        `json:"name"`
	Version string        `json:"version"`
	Methods []apiV2Method `json:"methods"`
}

type apiV2ListResponse struct {
	Count int              `json:"count"`
	Items []models.Address `json:"items"`
}

type apiV2TXResponse struct {
	Enabled  bool   `json:"enabled"`
	State    string `json:"state"`
	Response string `json:"response,omitempty"`
}

type apiV2StateResponse struct {
	Address   models.Address `json:"address"`
	BillingID uint64         `json:"billing_id"`
	Output    int            `json:"output"`
	State     uint8          `json:"state"`

	Command       uint8  `json:"command"`
	CommandHex    string `json:"command_hex"`
	CommandBinary string `json:"command_binary"`
	Mask          uint8  `json:"mask"`
	MaskBinary    string `json:"mask_binary"`
}

type apiV2SetStateResponse struct {
	Address   models.Address `json:"address"`
	BillingID uint64         `json:"billing_id"`
	Output    int            `json:"output"`
	State     uint8          `json:"state"`

	Command       uint8  `json:"command"`
	CommandHex    string `json:"command_hex"`
	CommandBinary string `json:"command_binary"`

	Mask       uint8  `json:"mask"`
	MaskBinary string `json:"mask_binary"`

	Response string `json:"response"`
}

func registerAPIV2Handlers() {
	http.HandleFunc("/api/v2", apiV2Handler)
	http.HandleFunc("/api/v2/", apiV2Handler)
}

func apiV2Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method != http.MethodGet {
		writeAPIV2Error(
			w,
			http.StatusMethodNotAllowed,
			"Only GET requests are allowed",
		)
		return
	}

	if !validateBillingAPIKey(r) {
		w.Header().Set(
			"WWW-Authenticate",
			`Bearer realm="MuraenaBase API"`,
		)

		writeAPIV2Error(
			w,
			http.StatusUnauthorized,
			"Invalid or missing API key",
		)
		return
	}

	path := strings.TrimSuffix(r.URL.Path, "/")

	switch {
	case path == "/api/v2":
		apiV2Index(w)

	case path == "/api/v2/list":
		apiV2List(w)

	case strings.HasPrefix(path, "/api/v2/list/"):
		apiV2GetAddress(w, path)

	case strings.HasPrefix(path, "/api/v2/state/"):
		apiV2State(w, r, path)

	case path == "/api/v2/tx":
		apiV2GetTXState(w, r)

	case path == "/api/v2/tx/on":
		apiV2SetTXState(w, r, true)

	case path == "/api/v2/tx/off":
		apiV2SetTXState(w, r, false)

	default:
		writeAPIV2Error(
			w,
			http.StatusNotFound,
			"API method not found",
		)
	}
}

func apiV2GetTXState(
	w http.ResponseWriter,
	r *http.Request,
) {
	enabled, response, err :=
		getMuraenaTXClient().TransmissionStatus(
			r.Context(),
		)
	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusBadGateway,
			err.Error(),
		)
		return
	}

	state := "OFF"
	if enabled {
		state = "ON"
	}

	writeAPIV2JSON(
		w,
		http.StatusOK,
		apiV2TXResponse{
			Enabled:  enabled,
			State:    state,
			Response: response.Raw,
		},
	)
}

func apiV2SetTXState(
	w http.ResponseWriter,
	r *http.Request,
	enabled bool,
) {
	client := getMuraenaTXClient()

	var (
		response muraenatx.Response
		err      error
	)

	if enabled {
		response, err = client.TransmissionOn(
			r.Context(),
		)
	} else {
		response, err = client.TransmissionOff(
			r.Context(),
		)
	}

	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusBadGateway,
			err.Error(),
		)
		return
	}

	state := "OFF"
	if enabled {
		state = "ON"
	}

	writeAPIV2JSON(
		w,
		http.StatusOK,
		apiV2TXResponse{
			Enabled:  enabled,
			State:    state,
			Response: response.Raw,
		},
	)
}

func apiV2Index(w http.ResponseWriter) {
	writeAPIV2JSON(
		w,
		http.StatusOK,
		apiV2IndexResponse{
			Name:    "MuraenaBase Billing API",
			Version: "v2",
			Methods: []apiV2Method{
				{
					Method:      http.MethodGet,
					Path:        "/api/v2",
					Description: "Returns a list of available API methods",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/list",
					Description: "Returns all Address database records",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/list/{id}",
					Description: "Returns one Address database record by Address.ID",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/state/{billing_id}",
					Description: "Returns the database Address record and current MuraenaTX output state by unique Billing ID",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/state/{billing_id}/{state}",
					Description: "Sets MuraenaTX output state by unique Billing ID. State: 0=disabled, 1=enabled, 2=warning",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/tx",
					Description: "Returns the current MuraenaTX transmission state",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/tx/on",
					Description: "Enables MuraenaTX transmission and saves the state in device NVS",
				},
				{
					Method:      http.MethodGet,
					Path:        "/api/v2/tx/off",
					Description: "Disables MuraenaTX transmission and saves the state in device NVS",
				},
			},
		},
	)
}

func apiV2State(
	w http.ResponseWriter,
	r *http.Request,
	path string,
) {
	value := strings.TrimPrefix(
		path,
		"/api/v2/state/",
	)

	parts := strings.Split(value, "/")

	switch len(parts) {
	case 1:
		apiV2GetState(w, r, parts[0])

	case 2:
		apiV2SetState(w, r, parts[0], parts[1])

	default:
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid state API path",
		)
	}
}

func apiV2List(w http.ResponseWriter) {
	var addresses []models.Address

	if err := db.
		Order("id ASC").
		Find(&addresses).Error; err != nil {
		writeAPIV2Error(
			w,
			http.StatusInternalServerError,
			"Failed to read Address records",
		)
		return
	}

	writeAPIV2JSON(
		w,
		http.StatusOK,
		apiV2ListResponse{
			Count: len(addresses),
			Items: addresses,
		},
	)
}

func apiV2GetAddress(
	w http.ResponseWriter,
	path string,
) {
	idText := strings.TrimPrefix(
		path,
		"/api/v2/list/",
	)

	if idText == "" || strings.Contains(idText, "/") {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid Address ID",
		)
		return
	}

	id, err := strconv.ParseUint(idText, 10, 64)
	if err != nil || id == 0 {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid Address ID",
		)
		return
	}

	var address models.Address

	err = db.First(&address, uint(id)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		writeAPIV2Error(
			w,
			http.StatusNotFound,
			"Address record not found",
		)
		return
	}

	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusInternalServerError,
			"Failed to read Address record",
		)
		return
	}

	writeAPIV2JSON(
		w,
		http.StatusOK,
		address,
	)
}

func validateBillingAPIKey(r *http.Request) bool {
	expectedKey := strings.TrimSpace(
		getSetting(billingAPIKeySetting),
	)

	// Пустой API-ключ отключает авторизацию для /api/v2.
	if expectedKey == "" {
		return true
	}

	providedKey := extractBillingAPIKey(r)
	if providedKey == "" {
		return false
	}

	if len(providedKey) != len(expectedKey) {
		return false
	}

	return subtle.ConstantTimeCompare(
		[]byte(providedKey),
		[]byte(expectedKey),
	) == 1
}

func extractBillingAPIKey(r *http.Request) string {
	authorization := strings.TrimSpace(
		r.Header.Get("Authorization"),
	)

	const bearerPrefix = "Bearer "

	if len(authorization) >= len(bearerPrefix) &&
		strings.EqualFold(
			authorization[:len(bearerPrefix)],
			bearerPrefix,
		) {
		return strings.TrimSpace(
			authorization[len(bearerPrefix):],
		)
	}

	return strings.TrimSpace(
		r.Header.Get("X-API-Key"),
	)
}

func writeAPIV2Error(
	w http.ResponseWriter,
	statusCode int,
	message string,
) {
	writeAPIV2JSON(
		w,
		statusCode,
		map[string]any{
			"error": message,
		},
	)
}

func writeAPIV2JSON(
	w http.ResponseWriter,
	statusCode int,
	value any,
) {
	payload, err := json.Marshal(value)
	if err != nil {
		http.Error(
			w,
			`{"error":"Failed to encode response"}`,
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(statusCode)
	_, _ = w.Write(payload)
}

func apiV2GetState(
	w http.ResponseWriter,
	r *http.Request,
	billingIDText string,
) {

	if billingIDText == "" ||
		strings.Contains(billingIDText, "/") {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid Billing ID",
		)
		return
	}

	billingID, err := strconv.ParseUint(
		billingIDText,
		10,
		64,
	)
	if err != nil || billingID == 0 {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid Billing ID",
		)
		return
	}

	address, outputIndex, err :=
		findAddressByBillingID(billingID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		writeAPIV2Error(
			w,
			http.StatusNotFound,
			"Billing ID was not found",
		)
		return
	}

	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusInternalServerError,
			err.Error(),
		)
		return
	}

	item, _, err := getMuraenaTXClient().GetSwitch(
		r.Context(),
		address.Addr,
	)
	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusBadGateway,
			err.Error(),
		)
		return
	}

	state := calculateMuraenaTXOutputState(
		item.Command,
		item.Mask,
		outputIndex,
	)

	writeAPIV2JSON(
		w,
		http.StatusOK,
		apiV2StateResponse{
			Address:   address,
			BillingID: billingID,
			Output:    outputIndex + 1,
			State:     state,

			Command:       item.Command,
			CommandHex:    fmt.Sprintf("%02X", item.Command),
			CommandBinary: fmt.Sprintf("%08b", item.Command),
			Mask:          item.Mask,
			MaskBinary:    fmt.Sprintf("%08b", item.Mask),
		},
	)
}

func findAddressByBillingID(
	billingID uint64,
) (models.Address, int, error) {
	var addresses []models.Address

	if err := db.
		Where("billing <> ''").
		Order("id ASC").
		Find(&addresses).Error; err != nil {
		return models.Address{}, 0, err
	}

	target := strconv.FormatUint(
		billingID,
		10,
	)

	var (
		foundAddress models.Address
		foundOutput  int
		found        bool
	)

	for _, address := range addresses {
		parts := strings.Split(
			address.Billing,
			":",
		)

		for outputIndex, value := range parts {
			if outputIndex >= 8 {
				break
			}

			value = strings.TrimSpace(value)

			if value != target {
				continue
			}

			if found {
				return models.Address{}, 0, fmt.Errorf(
					"Billing ID %s is assigned more than once",
					target,
				)
			}

			foundAddress = address
			foundOutput = outputIndex
			found = true
		}
	}

	if !found {
		return models.Address{}, 0, gorm.ErrRecordNotFound
	}

	return foundAddress, foundOutput, nil
}

func calculateMuraenaTXOutputState(
	command uint8,
	mask uint8,
	outputIndex int,
) uint8 {
	if outputIndex < 0 || outputIndex > 7 {
		return 0
	}

	// Первый элемент Billing соответствует старшему,
	// левому биту в строке из восьми битов.
	bit := uint(7 - outputIndex)

	commandEnabled :=
		command&(uint8(1)<<bit) != 0

	if commandEnabled {
		return 2
	}

	maskEnabled :=
		mask&(uint8(1)<<bit) != 0

	if maskEnabled {
		return 1
	}

	return 0
}

func apiV2SetState(
	w http.ResponseWriter,
	r *http.Request,
	billingIDText string,
	stateText string,
) {
	billingID, err := strconv.ParseUint(
		strings.TrimSpace(billingIDText),
		10,
		64,
	)
	if err != nil || billingID == 0 {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid Billing ID",
		)
		return
	}

	stateValue, err := strconv.ParseUint(
		strings.TrimSpace(stateText),
		10,
		8,
	)
	if err != nil || stateValue > 2 {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			"Invalid state: expected 0, 1 or 2",
		)
		return
	}

	address, outputIndex, err :=
		findAddressByBillingID(billingID)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		writeAPIV2Error(
			w,
			http.StatusNotFound,
			"Billing ID was not found",
		)
		return
	}

	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusInternalServerError,
			err.Error(),
		)
		return
	}

	client := getMuraenaTXClient()

	currentSwitch, _, err := client.GetSwitch(
		r.Context(),
		address.Addr,
	)
	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusBadGateway,
			err.Error(),
		)
		return
	}

	updatedSwitch, err := setMuraenaTXSwitchOutputState(
		currentSwitch,
		outputIndex,
		uint8(stateValue),
	)
	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusBadRequest,
			err.Error(),
		)
		return
	}

	response, err := client.SetSwitch(
		r.Context(),
		updatedSwitch,
	)
	if err != nil {
		writeAPIV2Error(
			w,
			http.StatusBadGateway,
			err.Error(),
		)
		return
	}

	dbResult := db.Model(&models.Address{}).
		Where("id = ?", address.ID).
		Update("mask", updatedSwitch.Mask)

	if dbResult.Error != nil {
		// Возвращаем MuraenaTX в исходное состояние,
		// поскольку БД обновить не удалось.
		_, rollbackErr := client.SetSwitch(
			r.Context(),
			currentSwitch,
		)

		if rollbackErr != nil {
			writeAPIV2Error(
				w,
				http.StatusInternalServerError,
				fmt.Sprintf(
					"database update failed: %v; MuraenaTX rollback failed: %v",
					dbResult.Error,
					rollbackErr,
				),
			)
			return
		}

		writeAPIV2Error(
			w,
			http.StatusInternalServerError,
			fmt.Sprintf(
				"database update failed: %v",
				dbResult.Error,
			),
		)
		return
	}

	if dbResult.RowsAffected == 0 {
		_, _ = client.SetSwitch(
			r.Context(),
			currentSwitch,
		)

		writeAPIV2Error(
			w,
			http.StatusNotFound,
			"Address database record was not found",
		)
		return
	}

	// Получаем актуальный UpdatedAt.
	if err := db.First(
		&address,
		address.ID,
	).Error; err != nil {
		writeAPIV2Error(
			w,
			http.StatusInternalServerError,
			"State was changed, but updated database record could not be read",
		)
		return
	}

	writeAPIV2JSON(
		w,
		http.StatusOK,
		apiV2SetStateResponse{
			Address:   address,
			BillingID: billingID,
			Output:    outputIndex + 1,
			State:     uint8(stateValue),

			Command:       updatedSwitch.Command,
			CommandHex:    fmt.Sprintf("%02X", updatedSwitch.Command),
			CommandBinary: fmt.Sprintf("%08b", updatedSwitch.Command),

			Mask:       updatedSwitch.Mask,
			MaskBinary: fmt.Sprintf("%08b", updatedSwitch.Mask),

			Response: response.Raw,
		},
	)
}

func setMuraenaTXSwitchOutputState(
	item muraenatx.Switch,
	outputIndex int,
	state uint8,
) (muraenatx.Switch, error) {
	if outputIndex < 0 || outputIndex > 7 {
		return item, fmt.Errorf(
			"invalid output index %d",
			outputIndex,
		)
	}

	if state > 2 {
		return item, fmt.Errorf(
			"invalid state %d: expected 0, 1 or 2",
			state,
		)
	}

	// Первый Billing ID соответствует старшему,
	// левому биту восьмибитной строки.
	bit := uint(7 - outputIndex)
	bitMask := uint8(1) << bit

	switch state {
	case 0:
		item.Mask &^= bitMask
		item.Command &^= bitMask

	case 1:
		item.Mask |= bitMask
		item.Command &^= bitMask

	case 2:
		item.Mask |= bitMask
		item.Command |= bitMask
	}

	return item, nil
}
