const OPENAI_URL = "https://api.openai.com/v1";

export async function createEmbedding(text: string, apiKey: string): Promise<number[]> {
  const body = {
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  };
  const res = await fetch(`${OPENAI_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) {
    let message = raw;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      message = j.error?.message || raw;
    } catch {
      /* ignore */
    }
    throw new Error(`Embedding: ${message}`);
  }
  const data = JSON.parse(raw) as { data?: { embedding: number[] }[] };
  const embedding = data.data?.[0]?.embedding;
  if (!embedding?.length) throw new Error("Embedding boş döndü.");
  return embedding;
}

export async function chatCompletionMarkdown(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch(`${OPENAI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: 0.65,
      max_tokens: opts.maxTokens ?? 1200,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let message = raw;
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      message = j.error?.message || raw;
    } catch {
      /* ignore */
    }
    throw new Error(`Chat: ${message}`);
  }
  const data = JSON.parse(raw) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("LLM yanıtı boş.");
  return text;
}
