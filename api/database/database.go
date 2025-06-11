package database

import (
	"log"
	"library-management/utils"
)

// Connect initializes the Supabase connection
func Connect() {
	utils.InitSupabase()
	log.Println("Connected to Supabase successfully")
}

// Migrate is not needed with Supabase as tables are managed via dashboard
func Migrate() {
	log.Println("Database migration not needed with Supabase")
}

// SeedData can be used to insert initial data if needed
func SeedData() {
	log.Println("Seed data can be managed via Supabase dashboard")
}
