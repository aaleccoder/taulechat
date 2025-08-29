// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri_plugin_sql::{Migration, MigrationKind};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migration = vec![
        Migration{
        version: 1,
        description: "create messages table",
        sql: "
        CREATE TABLE ai_models (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL,          -- e.g. \"gpt-4\"
            provider        TEXT NOT NULL,          -- e.g. \"OpenAI\"
            description     TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Conversations (like threads or chat rooms)
        CREATE TABLE conversations (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id        INTEGER REFERENCES ai_models(id),
            title           TEXT,                   -- e.g. \"Project brainstorm\"
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Messages in a conversation
        CREATE TABLE messages (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content         TEXT NOT NULL,
            tokens_used     INTEGER,                -- optional: for token counting
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
        kind: MigrationKind::Up,
    }];
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().add_migrations("sqlite:database.db", migration).build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}





