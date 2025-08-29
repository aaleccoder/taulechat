// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri_plugin_sql::{Migration, MigrationKind};
use reqwest_eventsource::EventSource;
use serde::{Deserialize, Serialize};
use serde_json::json;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use futures_util::StreamExt;
use tauri::Emitter;


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
            sender          TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
            content         TEXT NOT NULL,
            tokens_used     INTEGER,                -- optional: for token counting
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ",
        kind: MigrationKind::Up,
    }];
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().add_migrations("sqlite:databse.db", migration).build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_openrouter_stream])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}




#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[tauri::command]
async fn start_openrouter_stream(
    window: tauri::Window,
    stream_id: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let client = reqwest::Client::new();

    let body = json!({
        "model": "deepseek/deepseek-r1-0528:free",
        "messages": messages,
        "stream": true
    });


    let req = client.post("https://openrouter.ai/api/v1/chat/completions").header(AUTHORIZATION,"Bearer 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").header(CONTENT_TYPE, "application/json").json(&body);

    let mut es = EventSource::new(req).map_err(|e| e.to_string())?;

    tauri::async_runtime::spawn({
            let window = window.clone();
            async move {
                while let Some(event) = es.next().await {
                    match event {
                        Ok(reqwest_eventsource::Event::Open) => {
                            let _ = window.emit(
                                &format!("openrouter://{}/open", stream_id),
                                serde_json::json!({}),
                            );
                        }
                        Ok(reqwest_eventsource::Event::Message(msg)) => {
                            // msg.data is either a JSON chunk or "[DONE]"
                            if msg.data.trim() == "[DONE]" {
                                let _ = window.emit(
                                    &format!("openrouter://{}/end", stream_id),
                                    serde_json::json!({ "reason": "done" }),
                                );
                                break;
                            }

                            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&msg.data) {
                                if let Some(choices) = v.get("choices").and_then(|c| c.as_array()) {
                                    for choice in choices {
                                        if let Some(delta) = choice.get("delta") {
                                            if let Some(piece) = delta.get("content").and_then(|c| c.as_str()) {
                                                let _ = window.emit(
                                                    &format!("openrouter://{}/chunk", stream_id),
                                                    serde_json::json!({ "content": piece }),
                                                );
                                            }
                                        }
                                        if let Some(reason) = choice.get("finish_reason").and_then(|r| r.as_str()) {
                                            if !reason.is_empty() {
                                                let _ = window.emit(
                                                    &format!("openrouter://{}/end", stream_id),
                                                    serde_json::json!({ "reason": reason }),
                                                );
                                            }
                                        }
                                    }
                                }
                            } else {
                                // If parsing fails, forward the raw data for debugging
                                let _ = window.emit(
                                    &format!("openrouter://{}/chunk", stream_id),
                                    serde_json::json!({ "raw": msg.data }),
                                );
                            }
                        }
                        Err(e) => {
                            let _ = window.emit(
                                &format!("openrouter://{}/error", stream_id),
                                serde_json::json!({ "error": e.to_string() }),
                            );
                            break;
                        }
                    }
                }

                // Ensure closed
                es.close();
            }
        });


    Ok(())



}
