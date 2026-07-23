package muraenatx

import (
	"strconv"
	"strings"
)

type Response struct {
	Command string   `json:"command"`
	Raw     string   `json:"raw"`
	Lines   []string `json:"lines"`
	OK      bool     `json:"ok"`
	Error   string   `json:"error,omitempty"`
}

func parseResponse(command string, data []byte) Response {
	raw := normalizeResponse(string(data))
	lines := splitLines(raw)

	response := Response{
		Command: command,
		Raw:     raw,
		Lines:   lines,
	}

	for _, line := range lines {
		switch {
		case strings.HasPrefix(line, "ERROR:"):
			response.Error = strings.TrimSpace(strings.TrimPrefix(line, "ERROR:"))
			return response

		case strings.HasPrefix(line, "OK:"):
			response.OK = true
		}
	}

	// LIST и HELP не возвращают строку OK.
	if strings.EqualFold(command, "LIST") {
		response.OK =
			containsLine(lines, "BEGIN LIST") &&
				hasLinePrefix(lines, "END LIST COUNT=")
	}

	if strings.EqualFold(command, "HELP") {
		response.OK = containsLine(lines, "Commands:")
	}

	return response
}

func normalizeResponse(value string) string {
	value = strings.ReplaceAll(value, "\r\n", "\n")
	value = strings.ReplaceAll(value, "\r", "\n")
	return strings.TrimSpace(value)
}

func splitLines(value string) []string {
	if value == "" {
		return nil
	}

	rawLines := strings.Split(value, "\n")
	lines := make([]string, 0, len(rawLines))

	for _, line := range rawLines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		lines = append(lines, line)
	}

	return lines
}

func containsLine(lines []string, expected string) bool {
	for _, line := range lines {
		if line == expected {
			return true
		}
	}

	return false
}

func hasLinePrefix(lines []string, prefix string) bool {
	for _, line := range lines {
		if strings.HasPrefix(line, prefix) {
			return true
		}
	}

	return false
}

func parseReportedCount(lines []string) int {
	const prefix = "END LIST COUNT="

	for _, line := range lines {
		if !strings.HasPrefix(line, prefix) {
			continue
		}

		value := strings.TrimSpace(strings.TrimPrefix(line, prefix))

		count, err := strconv.Atoi(value)
		if err == nil {
			return count
		}
	}

	return 0
}
