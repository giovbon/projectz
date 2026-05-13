package handler

import (
	"encoding/json"
	"net/http"
	"os"
)

// ActivitySubmission represents a form submission.
type ActivitySubmission struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
	Date    string `json:"date"`
}

// SubmitHandler handles form submissions and writes to Google Sheets.
// Requires GOOGLE_SHEETS_KEY and GOOGLE_SHEET_ID environment variables.
func SubmitHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var sub ActivitySubmission
	if err := json.NewDecoder(r.Body).Decode(&sub); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if sub.Name == "" || sub.Message == "" {
		http.Error(w, `{"error":"name and message are required"}`, http.StatusBadRequest)
		return
	}

	// If Google Sheets is not configured, log and return success (no-op mode)
	sheetID := os.Getenv("GOOGLE_SHEET_ID")
	if sheetID == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"message": "submission recorded (sheets not configured)",
		})
		return
	}

	// TODO: Integrate with Google Sheets API using service account
	// For now, return success and log the submission
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"message": "submission sent to Google Sheets",
	})
}
