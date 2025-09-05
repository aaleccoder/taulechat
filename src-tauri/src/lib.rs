use base64::{engine::general_purpose, Engine as _};
use std::fs;
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn read_and_encode_file(file_path: String) -> Result<String, String> {
    let file_bytes = fs::read(&file_path).map_err(|e| e.to_string())?;

    let encoded_string = general_purpose::STANDARD.encode(file_bytes);

    Ok(encoded_string)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migration = vec![
        Migration{
        version: 1,
        description: "create messages table",
        sql: "

        -- Conversations (like threads or chat rooms)
        -- Use TEXT primary key to store UUIDs generated on the frontend
        CREATE TABLE conversations (
            id              TEXT PRIMARY KEY,
            title           TEXT,                   -- e.g. \"Project brainstorm\"
            model_id        TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Messages in a conversation
        -- message id as TEXT to store UUIDs; conversation_id references conversations(id) which is TEXT
        CREATE TABLE messages (
            id              TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content         TEXT NOT NULL,
            tokens_used     INTEGER,                -- optional: for token counting
            grounding_chunks TEXT,                  -- JSON string
            grounding_supports TEXT,                -- JSON string
            web_search_queries TEXT,                -- JSON string
            usage_metadata TEXT,                    -- JSON string
            model_version TEXT,
            response_id TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
        kind: MigrationKind::Up,
    },
    Migration{
        version: 2,
        description: "create message_files table",
        sql: "
        -- Files (attachments) associated with messages. Limit enforced in app layer.
        CREATE TABLE IF NOT EXISTS message_files (
            id          TEXT PRIMARY KEY,
            message_id  TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            file_name   TEXT NOT NULL,
            mime_type   TEXT NOT NULL,
            data        BLOB NOT NULL,
            size        INTEGER NOT NULL,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 3,
        description: "add thoughts to messages table",
        sql: "ALTER TABLE messages ADD COLUMN thoughts TEXT;",
        kind: MigrationKind::Up,
    }
    ];
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:database.db", migration)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_and_encode_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
