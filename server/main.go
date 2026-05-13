package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"projectz/handler"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

//go:embed all:embed
var frontend embed.FS

func main() {
	contentPath := os.Getenv("CONTENT_PATH")
	if contentPath == "" {
		// Default: content directory relative to binary
		contentPath = "content"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(corsMiddleware())

	// ---- API Routes ----
	r.Route("/api", func(r chi.Router) {
		r.Get("/menu", handler.MenuHandler(contentPath))
		r.Get("/page/*", handler.PageHandler(contentPath))
		r.Get("/slides/*", handler.SlidesHandler(contentPath))
		r.Post("/submit", handler.SubmitHandler)
	})

	// ---- Static Frontend (SPA) ----
	staticFS, err := fs.Sub(frontend, "embed")
	if err != nil {
		log.Fatalf("failed to get embedded frontend: %v", err)
	}

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Catch-all: serve SPA
	r.Handle("/*", handler.SPAHandler(staticFS))

	log.Printf("🚀 ProjectZ starting on :%s", port)
	log.Printf("📁 Content path: %s", contentPath)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func corsMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
