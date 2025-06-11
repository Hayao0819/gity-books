package utils

import (
    "log"
    "os"

    supa "github.com/supabase-community/supabase-go"
)

var SupabaseClient *supa.Client

// InitSupabase initializes the Supabase client
func InitSupabase() {
    supabaseURL := os.Getenv("SUPABASE_URL")
    supabaseKey := os.Getenv("SUPABASE_KEY")
    
    if supabaseURL == "" || supabaseKey == "" {
        log.Fatal("SUPABASE_URL and SUPABASE_KEY must be set")
    }
    
    client, err := supa.New(supabaseURL, supabaseKey)
    if err != nil {
        log.Fatalf("Failed to initialize Supabase client: %v", err)
    }
    
    SupabaseClient = client
    log.Println("Supabase client initialized successfully")
}
