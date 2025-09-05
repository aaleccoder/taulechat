use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, GenericImageView, ImageReader};
use std::fs;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_fs::FsExt;
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
async fn read_and_encode_file(app: AppHandle, file_path: String) -> Result<String, String> {
    let file_bytes = if cfg!(target_os = "android") && file_path.starts_with("content://") {
        app.fs()
            .read(PathBuf::from(&file_path))
            .map_err(|e| e.to_string())?
    } else {
        fs::read(&file_path).map_err(|e| e.to_string())?
    };

    let encoded_string = general_purpose::STANDARD.encode(file_bytes);

    Ok(encoded_string)
}

#[tauri::command]
async fn read_and_optimize_image(app: AppHandle, file_path: String) -> Result<String, String> {
    let img_bytes = if cfg!(target_os = "android") && file_path.starts_with("content://") {
        app.fs()
            .read(PathBuf::from(&file_path))
            .map_err(|e| e.to_string())?
    } else {
        fs::read(&file_path).map_err(|e| e.to_string())?
    };

    // Run the CPU-intensive operation in a blocking task
    let result = tokio::task::spawn_blocking(move || -> Result<String, String> {
        let img = ImageReader::new(Cursor::new(&img_bytes))
            .with_guessed_format()
            .map_err(|e| format!("Failed to guess image format: {}", e))?
            .decode()
            .map_err(|e| format!("Failed to decode image: {}", e))?;

        let optimized_img = optimize_image(img)?;

        let mut output_buffer = Vec::new();
        let mut cursor = Cursor::new(&mut output_buffer);

        let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor, 85);
        optimized_img
            .write_with_encoder(encoder)
            .map_err(|e| format!("Failed to encode optimized image: {}", e))?;

        let encoded_string = general_purpose::STANDARD.encode(output_buffer);
        Ok(encoded_string)
    })
    .await;

    result.map_err(|e| format!("Task execution failed: {}", e))?
}

fn optimize_image(img: DynamicImage) -> Result<DynamicImage, String> {
    const MAX_DIMENSION: u32 = 1536; // Increased from 1024 to preserve more quality
    const MIN_RESIZE_THRESHOLD: u32 = 1200; // Only resize if significantly larger
    const SMALL_IMAGE_THRESHOLD: u32 = 800; // Consider images smaller than this as already optimized

    let (width, height) = img.dimensions();

    // For very small images, return as-is without any processing
    if width <= SMALL_IMAGE_THRESHOLD && height <= SMALL_IMAGE_THRESHOLD {
        return Ok(img);
    }

    // Only resize if the image is significantly larger than our threshold
    if width <= MIN_RESIZE_THRESHOLD && height <= MIN_RESIZE_THRESHOLD {
        return Ok(img);
    }

    // Calculate new dimensions with less aggressive scaling
    let (new_width, new_height) = if width > height {
        let ratio = MAX_DIMENSION as f32 / width as f32;
        (MAX_DIMENSION, (height as f32 * ratio) as u32)
    } else {
        let ratio = MAX_DIMENSION as f32 / height as f32;
        ((width as f32 * ratio) as u32, MAX_DIMENSION)
    };

    // Use Triangle filter instead of Lanczos3 for faster processing with good quality
    let resized_img = img.resize(new_width, new_height, image::imageops::FilterType::Triangle);

    Ok(resized_img)
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
        .plugin(tauri_plugin_fs::init())
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
        .invoke_handler(tauri::generate_handler![
            read_and_encode_file,
            read_and_optimize_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
