package muraenatx

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"
)

func (c *Client) Help(ctx context.Context) (Response, error) {
	return c.Execute(ctx, "HELP")
}

func (c *Client) TransmissionOn(ctx context.Context) (Response, error) {
	return c.Execute(ctx, "ON")
}

func (c *Client) TransmissionOff(ctx context.Context) (Response, error) {
	return c.Execute(ctx, "OFF")
}

func (c *Client) Restart(ctx context.Context) (Response, error) {
	return c.Execute(ctx, "RESET")
}

func (c *Client) SetPower(
	ctx context.Context,
	percent uint8,
) (Response, error) {
	if percent > 100 {
		return Response{}, fmt.Errorf(
			"invalid RF power %d: expected 0..100",
			percent,
		)
	}

	return c.Execute(
		ctx,
		fmt.Sprintf("P=%d", percent),
	)
}

func (c *Client) SetSwitch(
	ctx context.Context,
	item Switch,
) (Response, error) {
	if err := validateAddress(item.Address); err != nil {
		return Response{}, err
	}

	return c.Execute(
		ctx,
		fmt.Sprintf(
			"ADDR=%04X CMD=%02X MASK=%08b",
			item.Address,
			item.Command,
			item.Mask,
		),
	)
}

func (c *Client) GetSwitch(
	ctx context.Context,
	address uint16,
) (Switch, Response, error) {
	if err := validateAddress(address); err != nil {
		return Switch{}, Response{}, err
	}

	command := fmt.Sprintf(
		"ADDR=%04X",
		address,
	)

	response, executeErr := c.executeWithTimeout(
		ctx,
		command,
		5*time.Second,
	)

	for _, line := range response.Lines {
		line = strings.TrimSpace(line)

		if !strings.HasPrefix(line, "ADDR=") {
			continue
		}

		item, err := parseSwitchLine(line)
		if err != nil {
			return Switch{}, response, err
		}

		if item.Address != address {
			return Switch{}, response, fmt.Errorf(
				"MuraenaTX returned address %04X instead of %04X",
				item.Address,
				address,
			)
		}

		// Строка данных успешно разобрана.
		// Ошибку executeWithTimeout игнорируем, поскольку этот метод
		// ожидает стандартный ответ, состоящий только из OK.
		return item, response, nil
	}

	if executeErr != nil {
		return Switch{}, response, executeErr
	}

	return Switch{}, response, fmt.Errorf(
		"MuraenaTX address %04X was not found in response: %s",
		address,
		strings.TrimSpace(response.Raw),
	)
}

func (c *Client) SetSwitchWithoutCommand(
	ctx context.Context,
	address uint16,
	mask uint8,
) (Response, error) {
	if err := validateAddress(address); err != nil {
		return Response{}, err
	}

	return c.Execute(
		ctx,
		fmt.Sprintf(
			"ADDR=%04X MASK=%08b",
			address,
			mask,
		),
	)
}

func (c *Client) ChangeAddress(
	ctx context.Context,
	oldAddress uint16,
	newAddress uint16,
) (Response, error) {
	if err := validateAddress(oldAddress); err != nil {
		return Response{}, fmt.Errorf(
			"invalid old address: %w",
			err,
		)
	}

	if err := validateAddress(newAddress); err != nil {
		return Response{}, fmt.Errorf(
			"invalid new address: %w",
			err,
		)
	}

	if newAddress == 0 {
		return Response{}, fmt.Errorf(
			"new address 0000 is reserved",
		)
	}

	if oldAddress == newAddress {
		return Response{}, fmt.Errorf(
			"old and new addresses are identical",
		)
	}

	return c.Execute(
		ctx,
		fmt.Sprintf(
			"ADDR=%04X NEWADDR=%04X",
			oldAddress,
			newAddress,
		),
	)
}

func (c *Client) DeleteSwitch(
	ctx context.Context,
	address uint16,
) (Response, error) {
	if err := validateAddress(address); err != nil {
		return Response{}, err
	}

	if address == 0 {
		return Response{}, fmt.Errorf(
			"service address 0000 cannot be deleted",
		)
	}

	return c.Execute(
		ctx,
		fmt.Sprintf("DELETE=%04X", address),
	)
}

func (c *Client) DeleteAll(ctx context.Context) (Response, error) {
	return c.Execute(ctx, "DELETE=ALL")
}

func (c *Client) Debug(
	ctx context.Context,
	count uint32,
) (Response, error) {
	if count == 0 || count > MaxAddress+1 {
		return Response{}, fmt.Errorf(
			"invalid DEBUG count %d: expected 1..%d",
			count,
			MaxAddress+1,
		)
	}

	return c.Execute(
		ctx,
		fmt.Sprintf("DEBUG=%d", count),
	)
}

func (c *Client) DebugAll(ctx context.Context) (Response, error) {
	return c.Execute(ctx, "DEBUG")
}

func (c *Client) List(ctx context.Context) (ListResult, error) {
	response, err := c.executeWithTimeout(
		ctx,
		"LIST",
		30*time.Second,
	)
	if err != nil {
		return ListResult{
			Raw: response.Raw,
		}, err
	}

	result := ListResult{
		Items:         make([]Switch, 0),
		ReportedCount: parseReportedCount(response.Lines),
		Raw:           response.Raw,
	}

	for _, line := range response.Lines {
		if !strings.HasPrefix(line, "ADDR=") {
			continue
		}

		item, err := parseSwitchLine(line)
		if err != nil {
			return result, err
		}

		result.Items = append(result.Items, item)
	}

	if result.ReportedCount != len(result.Items) {
		return result, fmt.Errorf(
			"MuraenaTX LIST count mismatch: reported=%d parsed=%d",
			result.ReportedCount,
			len(result.Items),
		)
	}

	return result, nil
}

func parseSwitchLine(line string) (Switch, error) {
	var (
		addressText string
		commandText string
		maskText    string
	)

	for _, field := range strings.Fields(line) {
		switch {
		case strings.HasPrefix(field, "ADDR="):
			addressText = strings.TrimPrefix(field, "ADDR=")

		case strings.HasPrefix(field, "CMD="):
			commandText = strings.TrimPrefix(field, "CMD=")

		case strings.HasPrefix(field, "MASK="):
			maskText = strings.TrimPrefix(field, "MASK=")
		}
	}

	if addressText == "" || commandText == "" || maskText == "" {
		return Switch{}, fmt.Errorf(
			"invalid MuraenaTX LIST line: %q",
			line,
		)
	}

	address, err := strconv.ParseUint(addressText, 16, 16)
	if err != nil {
		return Switch{}, fmt.Errorf(
			"parse address %q: %w",
			addressText,
			err,
		)
	}

	commandText = strings.TrimPrefix(
		strings.ToUpper(commandText),
		"0X",
	)

	command, err := strconv.ParseUint(commandText, 16, 8)
	if err != nil {
		return Switch{}, fmt.Errorf(
			"parse command %q: %w",
			commandText,
			err,
		)
	}

	mask, err := strconv.ParseUint(maskText, 2, 8)
	if err != nil {
		return Switch{}, fmt.Errorf(
			"parse mask %q: %w",
			maskText,
			err,
		)
	}

	return Switch{
		Address: uint16(address),
		Command: uint8(command),
		Mask:    uint8(mask),
	}, nil
}

func validateAddress(address uint16) error {
	if address > MaxAddress {
		return fmt.Errorf(
			"address %04X is outside 0000..7FFF",
			address,
		)
	}

	return nil
}
