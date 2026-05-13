package handler

import (
	"io/fs"
	"net/http"
	"strings"
)

// SPAHandler serves the embedded frontend with SPA fallback.
// Any request that doesn't match an API route and isn't a static file
// gets redirected to index.html for client-side routing.
func SPAHandler(staticFS fs.FS) http.HandlerFunc {
	fileServer := http.FileServer(http.FS(staticFS))

	return func(w http.ResponseWriter, r *http.Request) {
		// Don't handle API routes
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Try to serve the file
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// Check if file exists
		f, err := staticFS.Open(path)
		if err != nil {
			// SPA fallback: serve index.html
			r.URL.Path = "/index.html"
			fileServer.ServeHTTP(w, r)
			return
		}
		f.Close()

		fileServer.ServeHTTP(w, r)
	}
}
