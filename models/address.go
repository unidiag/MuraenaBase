package models

import (
	"fmt"
	"time"
)

type Address struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Addr     uint16 `gorm:"not null;uniqueIndex" json:"addr"`
	Mask     uint8  `gorm:"not null;default:0" json:"mask"`
	Location string `gorm:"size:255;not null;default:''" json:"location"`
	Descr    string `gorm:"size:1024;not null;default:''" json:"descr"`
	Map      string `gorm:"size:1024;not null;default:''" json:"map"`
	Billing  string `gorm:"size:1024;not null;default:''" json:"billing"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (a Address) AddrHex() string {
	return fmt.Sprintf("%04X", a.Addr)
}
