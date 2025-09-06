# TauleChat

### A lightweight chat and LLM interface for AI providers (OpenRouter and Gemini)
[![publish](https://github.com/aaleccoder/taulechat/actions/workflows/publish.yml/badge.svg)](https://github.com/aaleccoder/taulechat/actions/workflows/publish.yml)

![TauleChat Banner](src-tauri/icons/icon.png)

TauleChat is a simple chat and LLM interface for providers like OpenRouter and Gemini. It focuses on a clean, fast, and desktop-first experience, while still being able to compile for Android via Tauri. It was built to avoid overly complex apps and web-only workflows.

## How to build

Prerequisites:
- Bun: https://bun.sh/
- Rust toolchain via rustup: https://rustup.rs/

Commands:
```bash
bun install
bun tauri dev
bun tauri build
```

## Current features

Recent work focused on provider streaming, image support, and Android UX.

- Core chat
    - LaTeX rendering and syntax-highlighted code blocks
    - Streaming and raw-text streaming (SSE buffering for Gemini)
    - Collapsible “Thoughts” view to inspect model reasoning

- Models & providers
    - Gemini and OpenRouter with improved error handling and metadata
    - Model picker with provider icons and a ModelParameters UI per request

- Images & attachments
    - Image upload and image generation (GeminiImageProvider + OpenRouter multimodal)
    - Image optimization, loading states, preview strip, and lightbox
    - File attachments in messages and Android file handling via tauri-plugin-fs

- UI & UX
    - Refactored ChatInput and ChatMessages with mobile-friendly behavior
    - Dialog-based parameter editor (replaces Drawer) and smoother collapsibles
    - Memoized markdown rendering and improved image previews

- Utilities & integrations
    - Usage metadata for responses and message stats for Gemini
    - Link preview tooltip, shell plugin integration, and Radix checkbox for multi-select in the sidebar

## Roadmap

Short-term priorities based on recent work and gaps:

- Release & CI
    - Stabilize the publish workflow and release automation
    - Improve CI installs and caching across Linux, macOS, Windows, and Android

- Provider & streaming
    - Finalize robust SSE/streaming with retry/backpressure
    - Add streaming UX (cancel/stop, partial save)

- Images & local LLMs
    - Better image generation controls (presets, params, progress)
    - Groundwork for optional local LLM support when hardware is available

- Android & file handling
    - Broaden Android tests and fix platform-specific file/permission issues
    - Finalize tauri-plugin-fs usage and file picker behavior across API levels

- Polishing & stability
    - Add unit/integration tests for providers and message parsing
    - Improve error reporting and user-facing network/provider messages

## Contributions

Not accepting contributions at this time. Feel free to fork and explore your own direction.

## License

MIT License. See [LICENSE](LICENSE) for details.
