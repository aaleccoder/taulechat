import { ChatProvider, FormattedMessage, StreamRequest } from "./types";

export class OpenRouterProvider implements ChatProvider {
  formatMessages(messages: any[], options?: { supportsImages?: boolean }): FormattedMessage[] {
    return messages.map((m: any) => {
      if (m.role === "user" && (m.files?.length || 0) > 0) {
        const parts: any[] = [];
        if (m.content?.trim()) parts.push({ type: "text", text: m.content });
        if (options?.supportsImages) {
          for (const f of m.files!.slice(0, 2)) {
            if (f.mime_type.startsWith("image/")) {
              const b64 = typeof f.data === "string" ? f.data : "";
              parts.push({ type: "image_url", image_url: { url: `data:${f.mime_type};base64,${b64}` } });
            }
          }
        }
        return { role: m.role, content: parts.length > 0 ? parts : m.content };
      }
      return { role: m.role, content: m.content };
    });
  }

  async streamResponse(request: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey || ""}`,
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages,
        stream: true,
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
    if (!response.body) throw new Error("OpenRouter response missing body stream");
    return response.body.getReader();
  }

  parseStreamChunk(value: Uint8Array, decoder: TextDecoder) {
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
    let token = "";
    for (const line of lines) {
      const jsonStr = line.replace("data: ", "");
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        token += parsed.choices[0]?.delta?.content || "";
      } catch {}
    }
    return { token };
  }
}
