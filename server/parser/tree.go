package parser

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Page represents a single markdown page in the menu.
type Page struct {
	Title string `json:"title"`
	Slug  string `json:"slug"`
	Path  string `json:"path"`
	Type  string `json:"type,omitempty"`
	Theme string `json:"theme,omitempty"`
}

// Section represents a folder in the content directory.
type Section struct {
	Label string `json:"label"`
	Slug  string `json:"slug"`
	Pages []Page `json:"pages"`
	Type  string `json:"type,omitempty"`
}

// Menu is the full sidebar structure.
type Menu struct {
	Sections []Section `json:"sections"`
}

// BuildMenu reads the content directory and builds the menu structure.
// Directories become sections; markdown files become pages.
// Special file "_index.md" inside a folder sets section metadata.
func BuildMenu(contentPath string) (*Menu, error) {
	entries, err := os.ReadDir(contentPath)
	if err != nil {
		return nil, err
	}

	menu := &Menu{Sections: []Section{}}

	for _, entry := range entries {
		name := entry.Name()

		// Skip hidden files/folders
		if strings.HasPrefix(name, ".") {
			continue
		}

		if entry.IsDir() {
			section := buildSection(filepath.Join(contentPath, name), name)
			if len(section.Pages) > 0 || section.Label != "" {
				menu.Sections = append(menu.Sections, section)
			}
			continue
		}

		// Root-level markdown file
		if strings.HasSuffix(name, ".md") {
			fullPath := filepath.Join(contentPath, name)
			fm, body, err := ParseFrontmatter(fullPath)
			if err != nil {
				continue
			}

			title := fm.Title
			if title == "" {
				title = ExtractTitleFromBody(body)
			}

			slug := strings.TrimSuffix(name, ".md")
			menu.Sections = append(menu.Sections, Section{
				Label: title,
				Slug:  slug,
				Pages: []Page{{
					Title: title,
					Slug:  slug,
					Path:  name,
					Type:  fm.Type,
					Theme: fm.Theme,
				}},
				Type: fm.Type,
			})
		}
	}

	// Sort alphabetically by label
	sort.Slice(menu.Sections, func(i, j int) bool {
		return menu.Sections[i].Label < menu.Sections[j].Label
	})

	return menu, nil
}

func buildSection(dirPath, dirName string) Section {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return Section{}
	}

	section := Section{
		Label: humanize(dirName),
		Slug:  dirName,
		Pages: []Page{},
	}

	for _, entry := range entries {
		name := entry.Name()

		if entry.IsDir() || !strings.HasSuffix(name, ".md") {
			continue
		}

		fullPath := filepath.Join(dirPath, name)
		fm, body, err := ParseFrontmatter(fullPath)
		if err != nil {
			continue
		}

		title := fm.Title
		if title == "" {
			title = ExtractTitleFromBody(body)
		}

		slug := strings.TrimSuffix(name, ".md")
		page := Page{
			Title: title,
			Slug:  slug,
			Path:  filepath.Join(dirName, name),
			Type:  fm.Type,
			Theme: fm.Theme,
		}

		// If _index.md, use it to set section-level metadata
		if slug == "_index" {
			section.Label = title
			section.Type = fm.Type
			continue
		}

		section.Pages = append(section.Pages, page)
	}

	// Sort pages
	sort.Slice(section.Pages, func(i, j int) bool {
		return section.Pages[i].Title < section.Pages[j].Title
	})

	return section
}

// humanize converts a folder name like "my-docs" to "My Docs".
func humanize(name string) string {
	name = strings.ReplaceAll(name, "-", " ")
	name = strings.ReplaceAll(name, "_", " ")
	words := strings.Fields(name)
	for i, w := range words {
		if len(w) > 1 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		} else if len(w) == 1 {
			words[i] = strings.ToUpper(w)
		}
	}
	return strings.Join(words, " ")
}
