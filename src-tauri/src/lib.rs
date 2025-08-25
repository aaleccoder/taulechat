// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, fetch_test])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use serde_json::json;
use reqwest::header::HeaderMap;
use futures_util::StreamExt;

#[tauri::command]
async fn fetch_test() -> Result<(), String> {
    match fetch_open_router().await {
        Ok(_) => {
            println!("fetch_open_router executed successfully.");
            Ok(())
        }
        Err(e) => {
            println!("Error: {}", e);
            Err(e.to_string())
        }
    }
}

async fn fetch_open_router() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let mut headers = HeaderMap::new();
    headers.insert("Authorization", "Bearer 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".parse()?);
    headers.insert("Content-Type", "application/json".parse()?);

    let res = client.post("https://openrouter.ai/api/v1/chat/completions")
        .headers(headers)
        .json(&json!({
            "model": "deepseek/deepseek-r1-0528:free",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ],
            "stream": true,
        }))
        .send()
        .await?;

    let mut stream = res.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    println!("\n--- Stream finished ---");
                    return Ok(());
                }
                // Parse JSON chunk
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        print!("{content}");
                        // flush stdout immediately
                        use std::io::Write;
                        std::io::stdout().flush().unwrap();
                    }
                }
            }
        }
    }

    Ok(())
}
