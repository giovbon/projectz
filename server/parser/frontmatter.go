package parser

import (
	"bufio"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

// Frontmatter holds the metadata from a markdown file.
type Frontmatter struct {
	Title string `yaml:"title"`
	Type  string `yaml:"type"`  // "slides", "codetree", "" (default page)
	Theme string `yaml:"theme"` // reveal.js theme
}

// ParseFrontmatter extracts YAML frontmatter from a markdown file.
// Returns the frontmatter, the remaining body, and any error.
func ParseFrontmatter(path string) (*Frontmatter, string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, "", err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	// Check for opening ---
	if !scanner.Scan() {
		return &Frontmatter{}, "", nil
	}
	firstLine := strings.TrimSpace(scanner.Text())
	if firstLine != "---" {
		// No frontmatter, rewind and read all as body
		body := firstLine + "\n" + readRemaining(scanner)
		return &Frontmatter{}, body, nil
	}

	// Read YAML lines until closing ---
	var yamlLines []string
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "---" {
			break
		}
		yamlLines = append(yamlLines, line)
	}

	fm := &Frontmatter{}
	yamlText := strings.Join(yamlLines, "\n")
	if err := yaml.Unmarshal([]byte(yamlText), fm); err != nil {
		return nil, "", err
	}

	// Read the body
	body := readRemaining(scanner)

	return fm, body, nil
}

// ExtractTitleFromBody returns the first # heading from markdown body.
func ExtractTitleFromBody(body string) string {
	for _, line := range strings.Split(body, "\n") {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "# ") {
			return strings.TrimPrefix(trimmed, "# ")
		}
	}
	return "Untitled"
}

func readRemaining(scanner *bufio.Scanner) string {
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return strings.Join(lines, "\n")
}
