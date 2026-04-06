import { getSupabaseClient, supabaseConfigured } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const ASSISTANT_FUNCTION_NAME =
  import.meta.env.VITE_AI_ASSISTANT_FUNCTION_NAME ?? "openai-assistant";

export type OpenAiAssistantReply = {
  responseId: string | null;
  conversationId: string | null;
  text: string;
  model: string | null;
};

type StreamEventPayload = Record<string, unknown>;

function getAssistantFunctionUrl() {
  const baseUrl = SUPABASE_URL.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Supabase is not configured.");
  }
  return `${baseUrl}/functions/v1/${ASSISTANT_FUNCTION_NAME}`;
}

async function getAccessToken() {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token?.trim() ?? "";
  if (error || !accessToken) {
    throw new Error("Sign in to use the AI voice assistant.");
  }
  return accessToken;
}

async function parseFunctionError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text().catch(() => "");
  if (contentType.includes("application/json")) {
    try {
      const payload = JSON.parse(responseText) as Record<string, unknown>;
      const message =
        typeof payload.error === "string"
          ? payload.error
          : typeof payload.message === "string"
            ? payload.message
            : "";
      if (message.trim()) {
        return message;
      }
    } catch {
      // Ignore JSON parse failure and continue to generic error.
    }
  }

  if (responseText.trim()) {
    return responseText;
  }

  return `AI assistant request failed with status ${response.status}.`;
}

function parseSseBlock(block: string) {
  const lines = block.split("\n");
  let eventType = "";
  const dataParts: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataParts.push(line.slice(5).trimStart());
    }
  }

  const rawData = dataParts.join("\n").trim();
  if (!rawData || rawData === "[DONE]") {
    return null;
  }

  let payload: StreamEventPayload;
  try {
    payload = JSON.parse(rawData) as StreamEventPayload;
  } catch {
    payload = { message: rawData };
  }

  return {
    eventType,
    payload,
  };
}

function consumeSseBuffer(
  buffer: string,
  consumeBlock: (block: string) => void
) {
  let normalized = buffer.replace(/\r\n/g, "\n");
  let separatorIndex = normalized.indexOf("\n\n");
  while (separatorIndex >= 0) {
    const block = normalized.slice(0, separatorIndex).trim();
    normalized = normalized.slice(separatorIndex + 2);
    if (block) {
      consumeBlock(block);
    }
    separatorIndex = normalized.indexOf("\n\n");
  }
  return normalized;
}

export async function createOpenAiAssistantReply(input: {
  text: string;
  conversationId?: string | null;
  locale?: string;
  levelRange?: string;
  nativeHelp?: boolean;
  nativeLocale?: string;
  signal?: AbortSignal;
}) {
  if (!SUPABASE_ANON_KEY.trim()) {
    throw new Error("Supabase is not configured.");
  }
  const accessToken = await getAccessToken();
  const response = await fetch(getAssistantFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: "respond",
      input: input.text,
      conversationId: input.conversationId,
      locale: input.locale,
      levelRange: input.levelRange,
      nativeHelp: input.nativeHelp,
      nativeLocale: input.nativeLocale,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    throw new Error(await parseFunctionError(response));
  }

  return (await response.json()) as OpenAiAssistantReply;
}

export async function streamOpenAiAssistantReply(
  input: {
    text: string;
    conversationId?: string | null;
    locale?: string;
    levelRange?: string;
    nativeHelp?: boolean;
    nativeLocale?: string;
  },
  handlers: {
    signal?: AbortSignal;
    onDelta?: (delta: string) => void;
    onCompleted?: (reply: OpenAiAssistantReply) => void;
  }
) {
  if (!SUPABASE_ANON_KEY.trim()) {
    throw new Error("Supabase is not configured.");
  }
  const accessToken = await getAccessToken();
  const response = await fetch(getAssistantFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      apikey: SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: "stream",
      input: input.text,
      conversationId: input.conversationId,
      locale: input.locale,
      levelRange: input.levelRange,
      nativeHelp: input.nativeHelp,
      nativeLocale: input.nativeLocale,
    }),
    signal: handlers.signal,
  });

  if (!response.ok) {
    throw new Error(await parseFunctionError(response));
  }
  if (!response.body) {
    throw new Error("AI assistant stream is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;

  const handleBlock = (block: string) => {
    const parsed = parseSseBlock(block);
    if (!parsed) return;
    const { eventType, payload } = parsed;

    if (eventType === "delta") {
      const delta = typeof payload.text === "string" ? payload.text : "";
      if (delta) {
        handlers.onDelta?.(delta);
      }
      return;
    }

    if (eventType === "completed") {
      completed = true;
      handlers.onCompleted?.({
        responseId:
          typeof payload.responseId === "string" ? payload.responseId : null,
        conversationId:
          typeof payload.conversationId === "string" ? payload.conversationId : null,
        text: typeof payload.text === "string" ? payload.text : "",
        model: typeof payload.model === "string" ? payload.model : null,
      });
      return;
    }

    if (eventType === "error") {
      const message =
        typeof payload.error === "string"
          ? payload.error
          : typeof payload.message === "string"
            ? payload.message
            : "AI assistant stream failed.";
      throw new Error(message);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = consumeSseBuffer(buffer, handleBlock);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    consumeSseBuffer(`${buffer}\n\n`, handleBlock);
  }

  if (!completed && !handlers.signal?.aborted) {
    throw new Error("AI assistant stream ended unexpectedly.");
  }
}
