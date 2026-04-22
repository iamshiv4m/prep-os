import type { AIChatRequest, AIChatResponse, AIProvider } from "@shared/types";
import { getApiKey } from "./store.js";

function extractImageBase64(
  dataUrl: string | undefined,
): { base64: string; mediaType: string } | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

async function callOpenAI(req: AIChatRequest, apiKey: string): Promise<AIChatResponse> {
  const messages = req.messages.map((m) => {
    const img = extractImageBase64(m.imageDataUrl);
    if (img) {
      return {
        role: m.role,
        content: [
          {
            type: "text",
            text: m.content || "Please analyse this screenshot.",
          },
          {
            type: "image_url",
            image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
          },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      messages,
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return {
      content: "",
      error: `OpenAI ${resp.status}: ${errText.slice(0, 500)}`,
    };
  }
  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return { content };
}

async function callAnthropic(req: AIChatRequest, apiKey: string): Promise<AIChatResponse> {
  const systemMessage = req.messages.find((m) => m.role === "system")?.content;
  const chatMessages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const img = extractImageBase64(m.imageDataUrl);
      const contentParts: Array<Record<string, unknown>> = [];
      if (m.content) contentParts.push({ type: "text", text: m.content });
      if (img) {
        contentParts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.base64,
          },
        });
      }
      if (contentParts.length === 0) {
        contentParts.push({ type: "text", text: "(empty)" });
      }
      return { role: m.role, content: contentParts };
    });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: 2048,
      ...(systemMessage ? { system: systemMessage } : {}),
      messages: chatMessages,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return {
      content: "",
      error: `Anthropic ${resp.status}: ${errText.slice(0, 500)}`,
    };
  }
  const data = (await resp.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const content =
    data.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n") ?? "";
  return { content };
}

export async function chatWithAI(req: AIChatRequest): Promise<AIChatResponse> {
  const provider: AIProvider = req.provider;
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    return {
      content: "",
      error: `No ${provider} API key set. Open Settings to add one.`,
    };
  }
  try {
    if (provider === "openai") return await callOpenAI(req, apiKey);
    if (provider === "anthropic") return await callAnthropic(req, apiKey);
    return { content: "", error: `Unknown provider: ${provider}` };
  } catch (err) {
    return {
      content: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
