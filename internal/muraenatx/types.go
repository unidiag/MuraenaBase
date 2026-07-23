package muraenatx

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	DefaultBaudRate    = 115200
	DefaultTimeout     = 3 * time.Second
	DefaultIdleTimeout = 100 * time.Millisecond

	MaxAddress = 0x7FFF
)

var (
	ErrDeviceNotConfigured = errors.New("MuraenaTX serial device is not configured")
	ErrEmptyCommand        = errors.New("MuraenaTX command is empty")
	ErrTimeout             = errors.New("MuraenaTX response timeout")
	ErrEmptyResponse       = errors.New("MuraenaTX returned an empty response")
)

type Config struct {
	Device      string
	BaudRate    int
	Timeout     time.Duration
	IdleTimeout time.Duration
	OpenDelay   time.Duration
	DrainTime   time.Duration
	Debug       bool
}

func (c Config) normalized() Config {
	c.Device = strings.TrimSpace(c.Device)

	if c.BaudRate <= 0 {
		c.BaudRate = DefaultBaudRate
	}

	if c.Timeout <= 0 {
		c.Timeout = DefaultTimeout
	}

	if c.IdleTimeout <= 0 {
		c.IdleTimeout = DefaultIdleTimeout
	}

	if c.DrainTime <= 0 {
		c.DrainTime = 50 * time.Millisecond
	}

	return c
}

type Switch struct {
	Address uint16 `json:"address"`
	Command uint8  `json:"command"`
	Mask    uint8  `json:"mask"`
}

func (s Switch) AddressHex() string {
	return fmt.Sprintf("%04X", s.Address)
}

func (s Switch) CommandHex() string {
	return fmt.Sprintf("%02X", s.Command)
}

func (s Switch) MaskBinary() string {
	return fmt.Sprintf("%08b", s.Mask)
}

type ListResult struct {
	Items         []Switch `json:"items"`
	ReportedCount int      `json:"reported_count"`
	Raw           string   `json:"raw"`
}

type DeviceError struct {
	Command  string
	Message  string
	Response Response
}

func (e *DeviceError) Error() string {
	if e.Message == "" {
		return "MuraenaTX command failed"
	}

	return e.Message
}
