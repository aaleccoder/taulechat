#!/bin/bash

# Script to clean the database for TauleChat development
# This will remove the existing database so migrations can run fresh

echo "🧹 Cleaning TauleChat database for fresh start..."

# Common database locations for Tauri apps
DB_LOCATIONS=(
    "$HOME/.local/share/com.tauri.taulechat/database.db"
    "$HOME/.config/com.tauri.taulechat/database.db"
    "$HOME/Library/Application Support/com.tauri.taulechat/database.db"
    "$HOME/AppData/Local/com.tauri.taulechat/database.db"
    "./src-tauri/target/debug/database.db"
    "./src-tauri/target/release/database.db"
    "./database.db"
    "./.tauri/database.db"
)

# Find and remove database files
FOUND=false
for location in "${DB_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        echo "Found database at: $location"
        rm -f "$location"
        echo "✅ Removed database file"
        FOUND=true
    fi
done

# Also check for any .db files in the project
echo "Checking for any .db files in project directory..."
find . -name "*.db" -not -path "./node_modules/*" -not -path "./dist/*" 2>/dev/null | while read -r db_file; do
    echo "Found: $db_file"
    rm -f "$db_file"
    echo "✅ Removed $db_file"
    FOUND=true
done

if [ "$FOUND" = false ]; then
    echo "ℹ️  No database files found. Database will be created fresh on next run."
else
    echo "🎉 Database cleanup complete!"
fi

echo ""
echo "You can now run 'bun run tauri dev' to start with a fresh database."
