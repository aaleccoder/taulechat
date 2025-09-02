# Taulechat.

### A lightweight chat and LLM interface for AI providers (currently OpenRouter and Gemini).
[![publish](https://github.com/aaleccoder/taulechat/actions/workflows/publish.yml/badge.svg)](https://github.com/aaleccoder/taulechat/actions/workflows/publish.yml)

![Taulechat Banner](src-tauri/icons/icon.png)

This is a chat and LLM interface that consumes from AI providers like OpenRouter and Gemini. It focuses on simplicity rather than tons of functionality, and it's made as a hobby for personal use. It was born out of the necessity of having an app that does this. Some exist, but they are far too complex and fully features which is amazing, but i dont take much of those functionalities, also kind of pain to set up, and i dont wanna use a website. And on Android, I haven't really found any alternative.

So that's why I built this using Tauri. Even if it's experimental, I can build something that's desktop-first, fully featured, and performant while being able to compile for Android too.

## How to build

To build the app, you need to have [Bun](https://bun.sh/) installed. Also, use [rustup](https://rustup.rs/) to set up the Rust toolchain correctly.

```bash
bun install
bun tauri dev
bun tauri build
```

## Current Features

*   **LaTeX Rendering:** Write and render LaTeX expressions.
*   **Syntax Highlighting:** Code blocks are highlighted for better readability.
*   **Image Uploading to OpenRouter:** Upload images to use with multimodal models on OpenRouter.
*   **Model Picker:** Switch between different models from the supported providers.
*   **Providers:**
    *   Gemini
    *   OpenRouter

## Roadmap

*   **Gemini File Uploading:** Enable file uploads for Gemini models.
*   **Image Generation:** Add support for image generation models.
*   **Search:** Implement a search functionality for conversations.
*   **UI/UX Enhancements:** Continuously improve the user interface and experience.
*   **Android Support:** Full-fledged support for Android devices.
*   **Message Branching:** Create and manage different conversation branches.
*   **Message Stats:** View statistics about your messages.
*   **Local LLM Support:** Support for running local LLMs (pending hardware availability for testing that i do not have right now).
*   **Theme Support:** Customize the look and feel of the app with themes.

## Contributions

For now, I'm not open to contributions because this is a learning project for me. However, you are free to fork it and continue your own path.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
