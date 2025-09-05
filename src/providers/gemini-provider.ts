import { ChatProvider, FormattedMessage, StreamRequest } from "./types";

export class GeminiProvider implements ChatProvider {
  formatMessages(messages: any[]): FormattedMessage[] {
    // Gemini expects a different format, but for now just pass through
    return messages.map((m: any) => ({ role: m.role, content: m.content }));
  }

  async streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (request.apiKey) headers["x-goog-api-key"] = request.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.modelId.split("/")[1]}:streamGenerateContent?alt=sse`;
    const body = JSON.stringify({
      contents: [
        {
          parts: request.attachments ? request.attachments : [{ text: "" }],
        },
      ],
      tools: [{ google_search: {} }],
    });
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    if (!response.body) throw new Error("Gemini response missing body stream");
    return response.body.getReader();
  }

  parseStreamChunk(value: Uint8Array, decoder: TextDecoder) {
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
    let token = "";
    let metadata: any = {};
    for (const line of lines) {
      const jsonStr = line.replace("data: ", "").trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        token += parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        metadata = {
          groundingChunks: parsed?.candidates?.[0]?.groundingMetadata?.groundingChunks,
          groundingSupports: parsed?.candidates?.[0]?.groundingMetadata?.groundingSupports,
          webSearchQueries: parsed?.webSearchQueries,
          usageMetadata: parsed?.usageMetadata,
          modelVersion: parsed?.modelVersion,
          responseId: parsed?.responseId,
        };
      } catch {}
    }
    return { token, metadata };
  }
}
