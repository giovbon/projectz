package handler

import (
	"encoding/json"
	"net/http"

	"projectz/parser"
)

// MenuHandler returns a JSON representation of the content structure.
func MenuHandler(contentPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		menu, err := parser.BuildMenu(contentPath)
		if err != nil {
			http.Error(w, `{"error":"failed to read content"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=60")
		json.NewEncoder(w).Encode(menu)
	}
}
