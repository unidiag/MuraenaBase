package muraenatx

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
	"sync"
	"time"

	"go.bug.st/serial"
)

type Client struct {
	configMu  sync.RWMutex
	commandMu sync.Mutex

	config Config
}

func New(config Config) *Client {
	return &Client{
		config: config.normalized(),
	}
}

func (c *Client) SetDevice(device string) {
	c.configMu.Lock()
	c.config.Device = strings.TrimSpace(device)
	c.configMu.Unlock()
}

func (c *Client) Device() string {
	c.configMu.RLock()
	defer c.configMu.RUnlock()

	return c.config.Device
}

func (c *Client) SetConfig(config Config) {
	c.configMu.Lock()
	c.config = config.normalized()
	c.configMu.Unlock()
}

func (c *Client) Config() Config {
	c.configMu.RLock()
	defer c.configMu.RUnlock()

	return c.config
}

func (c *Client) Execute(
	ctx context.Context,
	command string,
) (Response, error) {
	command = strings.TrimSpace(command)
	if command == "" {
		return Response{}, ErrEmptyCommand
	}

	c.commandMu.Lock()
	defer c.commandMu.Unlock()

	config := c.Config().normalized()

	if config.Device == "" {
		return Response{}, ErrDeviceNotConfigured
	}

	if config.Debug {
		log.Printf(
			"[MuraenaTX] OPEN device=%s baud=%d",
			config.Device,
			config.BaudRate,
		)
	}

	port, err := serial.Open(config.Device, &serial.Mode{
		BaudRate: config.BaudRate,
		DataBits: 8,
		Parity:   serial.NoParity,
		StopBits: serial.OneStopBit,
	})
	if err != nil {
		if config.Debug {
			log.Printf(
				"[MuraenaTX] OPEN ERROR device=%s error=%v",
				config.Device,
				err,
			)
		}

		return Response{}, fmt.Errorf(
			"open MuraenaTX serial port %s: %w",
			config.Device,
			err,
		)
	}

	defer func() {
		if err := port.Close(); err != nil {
			if config.Debug {
				log.Printf(
					"[MuraenaTX] CLOSE ERROR device=%s error=%v",
					config.Device,
					err,
				)
			}
			return
		}

		if config.Debug {
			log.Printf(
				"[MuraenaTX] CLOSE device=%s",
				config.Device,
			)
		}
	}()

	if config.OpenDelay > 0 {
		if err := waitContext(ctx, config.OpenDelay); err != nil {
			return Response{}, err
		}
	}

	if err := drainInput(ctx, port, config.DrainTime); err != nil {
		return Response{}, fmt.Errorf(
			"drain MuraenaTX serial input: %w",
			err,
		)
	}

	if err := port.SetReadTimeout(config.IdleTimeout); err != nil {
		return Response{}, fmt.Errorf(
			"set MuraenaTX serial timeout: %w",
			err,
		)
	}

	if config.Debug {
		log.Printf(
			"[MuraenaTX] TX %q",
			command,
		)
	}

	payload := []byte(command + "\n")

	if err := writeAll(port, payload); err != nil {
		if config.Debug {
			log.Printf(
				"[MuraenaTX] TX ERROR command=%q error=%v",
				command,
				err,
			)
		}

		return Response{}, fmt.Errorf(
			"send MuraenaTX command %q: %w",
			command,
			err,
		)
	}

	data, err := readUntilIdle(
		ctx,
		port,
		config.Timeout,
		config.IdleTimeout,
	)
	if err != nil {
		if config.Debug {
			log.Printf(
				"[MuraenaTX] RX ERROR command=%q error=%v",
				command,
				err,
			)
		}

		return Response{}, fmt.Errorf(
			"read MuraenaTX response for %q: %w",
			command,
			err,
		)
	}

	response := parseResponse(command, data)

	if config.Debug {
		logMuraenaTXResponse(response)
	}

	if response.Raw == "" {
		return response, ErrEmptyResponse
	}

	if response.Error != "" {
		return response, &DeviceError{
			Command:  command,
			Message:  response.Error,
			Response: response,
		}
	}

	if !response.OK {
		return response, fmt.Errorf(
			"unexpected MuraenaTX response to %q: %s",
			command,
			response.Raw,
		)
	}

	return response, nil
}

func writeAll(
	writer io.Writer,
	data []byte,
) error {
	for len(data) > 0 {
		n, err := writer.Write(data)
		if err != nil {
			return err
		}

		if n == 0 {
			return io.ErrShortWrite
		}

		data = data[n:]
	}

	return nil
}

func drainInput(
	ctx context.Context,
	port serial.Port,
	duration time.Duration,
) error {
	if duration <= 0 {
		return nil
	}

	const drainReadTimeout = 10 * time.Millisecond

	if err := port.SetReadTimeout(drainReadTimeout); err != nil {
		return err
	}

	deadline := time.Now().Add(duration)
	buffer := make([]byte, 512)

	for time.Now().Before(deadline) {
		if err := ctx.Err(); err != nil {
			return err
		}

		_, err := port.Read(buffer)
		if err != nil && !errors.Is(err, io.EOF) {
			return err
		}
	}

	return nil
}

func readUntilIdle(
	ctx context.Context,
	port serial.Port,
	totalTimeout time.Duration,
	idleTimeout time.Duration,
) ([]byte, error) {
	if totalTimeout <= 0 {
		totalTimeout = DefaultTimeout
	}

	if idleTimeout <= 0 {
		idleTimeout = DefaultIdleTimeout
	}

	if err := port.SetReadTimeout(idleTimeout); err != nil {
		return nil, err
	}

	var result bytes.Buffer

	buffer := make([]byte, 1024)
	deadline := time.Now().Add(totalTimeout)
	received := false

	for {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		if time.Now().After(deadline) {
			if !received {
				return nil, ErrTimeout
			}

			return result.Bytes(), nil
		}

		n, err := port.Read(buffer)

		if n > 0 {
			received = true
			result.Write(buffer[:n])
			continue
		}

		if err != nil && !errors.Is(err, io.EOF) {
			return nil, err
		}

		// Для go.bug.st/serial n == 0 после ReadTimeout означает,
		// что в течение idleTimeout новых данных не появилось.
		if received {
			return result.Bytes(), nil
		}
	}
}

func waitContext(
	ctx context.Context,
	duration time.Duration,
) error {
	timer := time.NewTimer(duration)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()

	case <-timer.C:
		return nil
	}
}

func logMuraenaTXResponse(response Response) {
	const maxLoggedResponseLines = 100
	total := len(response.Lines)

	log.Printf(
		"[MuraenaTX] RX BEGIN command=%q lines=%d",
		response.Command,
		total,
	)

	limit := total
	if limit > maxLoggedResponseLines {
		limit = maxLoggedResponseLines
	}

	for i := 0; i < limit; i++ {
		log.Printf("[MuraenaTX] RX %s", response.Lines[i])
	}

	if total > limit {
		log.Printf(
			"[MuraenaTX] RX ... omitted %d lines",
			total-limit,
		)
	}

	log.Printf(
		"[MuraenaTX] RX END command=%q ok=%t",
		response.Command,
		response.OK,
	)
}
