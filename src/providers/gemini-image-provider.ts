import { ChatProvider, FormattedMessage, StreamRequest } from "./types";

export class GeminiImageProvider implements ChatProvider {
  formatMessages(messages: any[]): FormattedMessage[] {
    // Only use the latest user message as prompt
    const lastUser = messages.filter((m: any) => m.role === "user").pop();
    return lastUser ? [{ role: "user", content: lastUser.content }] : [];
  }

  async streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (request.apiKey) headers["x-goog-api-key"] = request.apiKey;
    const modelName = request.modelId.split("/")[1];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict`;
    const body = JSON.stringify({
      instances: [
        { prompt: request.messages[0]?.content || "" },
      ],
      parameters: { sampleCount: 1 }, // Support up to 4 images
    });
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
      if (!response.ok) {
        let errorMsg = `Gemini image error: ${response.status}`;
        if (response.status === 400) {
          try {
            const errJson = await response.json();
            if (errJson?.error?.message) {
              errorMsg = errJson.error.message;
            }
          } catch {}
        }
        throw new Error(errorMsg);
      }
    const json = await response.json();
    console.log(json);
    const images = json?.images || [];
    const stream = new ReadableStream({
      start(controller) {
        const chunk = new TextEncoder().encode(JSON.stringify({ images }));
        controller.enqueue(chunk);
        controller.close();
      },
    });
    return stream.getReader();
  }

  parseStreamChunk(value: Uint8Array, decoder: TextDecoder) {
    const chunk = decoder.decode(value, { stream: true });
    try {
      const parsed = JSON.parse(chunk);
      if (parsed.images) {
        return { token: "", metadata: { images: parsed.images } };
      }
    } catch {}
    return { token: chunk, metadata: {} };
  }
}
