package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"projectz/parser"
)

// SlidesHandler serves a markdown file in a reveal.js-compatible format.
// The frontend handles the actual reveal.js rendering.
func SlidesHandler(contentPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pagePath := strings.TrimPrefix(r.URL.Path, "/api/slides/")
		pagePath = strings.TrimPrefix(pagePath, "/")

		if !strings.HasSuffix(pagePath, ".md") {
			pagePath += ".md"
		}

		fullPath := filepath.Clean(filepath.Join(contentPath, pagePath))
		if !strings.HasPrefix(fullPath, filepath.Clean(contentPath)) {
			http.Error(w, `{"error":"invalid path"}`, http.StatusForbidden)
			return
		}

		raw, err := os.ReadFile(fullPath)
		if err != nil {
			http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
			return
		}

		fm, body, err := parser.ParseFrontmatter(fullPath)
		if err != nil {
			http.Error(w, `{"error":"failed to parse"}`, http.StatusInternalServerError)
			return
		}

		// Split slides by "---" on its own line
		slides := splitSlides(body)

		title := fm.Title
		if title == "" {
			title = parser.ExtractTitleFromBody(body)
		}

		theme := fm.Theme
		if theme == "" {
			theme = "black"
		}

		resp := map[string]any{
			"title":  title,
			"theme":  theme,
			"slides": slides,
			"raw":    string(raw),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

func splitSlides(content string) []string {
	raw := strings.Split(content, "\n---\n")
	var slides []string
	for _, s := range raw {
		trimmed := strings.TrimSpace(s)
		if trimmed != "" {
			slides = append(slides, trimmed)
		}
	}
	if len(slides) == 0 {
		slides = []string{content}
	}
	return slides
}
