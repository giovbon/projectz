package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"projectz/parser"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	goldparser "github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

var md = goldmark.New(
	goldmark.WithExtensions(
		extension.GFM,
		extension.Table,
		extension.TaskList,
	),
	goldmark.WithParserOptions(
		goldparser.WithAutoHeadingID(),
	),
	goldmark.WithRendererOptions(
		html.WithHardWraps(),
		html.WithXHTML(),
	),
)

// PageResponse is the JSON returned for a page request.
type PageResponse struct {
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	Path     string `json:"path"`
	HTML     string `json:"html"`
	Raw      string `json:"raw"`
	Type     string `json:"type,omitempty"`
	Theme    string `json:"theme,omitempty"`
	NotFound bool   `json:"notFound,omitempty"`
}

// PageHandler serves a markdown page as HTML.
func PageHandler(contentPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract path from URL
		pagePath := strings.TrimPrefix(r.URL.Path, "/api/page/")
		pagePath = strings.TrimPrefix(pagePath, "/")

		// Default to index
		if pagePath == "" {
			pagePath = "index.md"
		}

		// Ensure .md extension
		if !strings.HasSuffix(pagePath, ".md") {
			pagePath += ".md"
		}

		// Security: prevent path traversal
		fullPath := filepath.Clean(filepath.Join(contentPath, pagePath))
		if !strings.HasPrefix(fullPath, filepath.Clean(contentPath)) {
			http.Error(w, `{"error":"invalid path"}`, http.StatusForbidden)
			return
		}

		// Read file
		raw, err := os.ReadFile(fullPath)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(PageResponse{
				NotFound: true,
				Slug:     strings.TrimSuffix(filepath.Base(pagePath), ".md"),
			})
			return
		}

		// Parse frontmatter
		fm, body, err := parser.ParseFrontmatter(fullPath)
		if err != nil {
			http.Error(w, `{"error":"failed to parse"}`, http.StatusInternalServerError)
			return
		}

		// Convert markdown to HTML
		var buf strings.Builder
		if err := md.Convert([]byte(body), &buf); err != nil {
			http.Error(w, `{"error":"failed to render"}`, http.StatusInternalServerError)
			return
		}

		title := fm.Title
		if title == "" {
			title = parser.ExtractTitleFromBody(body)
		}

		slug := strings.TrimSuffix(filepath.Base(pagePath), ".md")

		resp := PageResponse{
			Title: title,
			Slug:  slug,
			Path:  pagePath,
			HTML:  buf.String(),
			Raw:   string(raw),
			Theme: fm.Theme,
		}

		// Determine page type
		if fm.Type != "" {
			resp.Type = fm.Type
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=30")
		json.NewEncoder(w).Encode(resp)
	}
}
