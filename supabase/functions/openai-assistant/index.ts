import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
const openAiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const textEncoder = new TextEncoder();

type JsonRecord = Record<string, unknown>;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function sse(eventType: string, payload: unknown) {
  return textEncoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const accessToken = tokenMatch?.[1]?.trim() ?? "";
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      error: !accessToken
        ? "Missing or invalid Bearer token."
        : "SUPABASE_URL or SUPABASE_ANON_KEY is missing.",
    };
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return {
      user: null,
      error: error?.message ?? "No user resolved from access token.",
    };
  }
  return { user: data.user, error: null };
}

function getLanguageName(locale: string) {
  switch (locale) {
    case "de":
      return "German";
    case "en":
      return "English";
    case "vi":
      return "Vietnamese";
    case "ru":
      return "Russian";
    case "uk":
      return "Ukrainian";
    case "fa":
      return "Persian";
    case "ar":
      return "Arabic";
    case "sq":
      return "Albanian";
    case "tr":
      return "Turkish";
    case "fr":
      return "French";
    case "es":
      return "Spanish";
    case "it":
      return "Italian";
    case "pl":
      return "Polish";
    default:
      return "English";
  }
}

function extractResponseText(payload: JsonRecord) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (payload.response && typeof payload.response === "object") {
    const nestedText = extractResponseText(payload.response as JsonRecord);
    if (nestedText) {
      return nestedText;
    }
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as {
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    };
    if (candidate.type !== "message" || !Array.isArray(candidate.content)) continue;
    for (const contentItem of candidate.content) {
      if (
        contentItem &&
        (contentItem.type === "output_text" || contentItem.type === "text") &&
        typeof contentItem.text === "string" &&
        contentItem.text.trim()
      ) {
        chunks.push(contentItem.text.trim());
      }
    }
  }
  return chunks.join("\n").trim();
}

function extractMessageTextFromItem(item: unknown) {
  if (!item || typeof item !== "object") {
    return "";
  }

  const record = item as JsonRecord;
  if (record.type !== "message" || !Array.isArray(record.content)) {
    return "";
  }

  const chunks: string[] = [];
  for (const contentItem of record.content) {
    if (!contentItem || typeof contentItem !== "object") continue;
    const part = contentItem as JsonRecord;
    if (
      (part.type === "output_text" || part.type === "text") &&
      typeof part.text === "string" &&
      part.text.trim()
    ) {
      chunks.push(part.text.trim());
    }
  }

  return chunks.join("\n").trim();
}

function extractContentPartText(part: unknown) {
  if (!part || typeof part !== "object") {
    return "";
  }

  const record = part as JsonRecord;
  if (
    (record.type === "output_text" || record.type === "text") &&
    typeof record.text === "string" &&
    record.text.trim()
  ) {
    return record.text.trim();
  }

  return "";
}

function extractErrorMessage(payload: JsonRecord) {
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  if (payload.error && typeof payload.error === "object") {
    const nestedMessage = (payload.error as { message?: unknown }).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage.trim();
    }
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  return null;
}

function parseStreamEventBlock(block: string) {
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

  let payload: JsonRecord;
  try {
    payload = JSON.parse(rawData) as JsonRecord;
  } catch {
    return null;
  }

  const resolvedEventType =
    eventType || (typeof payload.type === "string" ? payload.type : "");
  if (!resolvedEventType) {
    return null;
  }

  return {
    eventType: resolvedEventType,
    payload,
  };
}

function consumeStreamBuffer(
  rawBuffer: string,
  consumeBlock: (block: string) => void
) {
  let buffer = rawBuffer.replace(/\r\n/g, "\n");
  let separatorIndex = buffer.indexOf("\n\n");
  while (separatorIndex >= 0) {
    const block = buffer.slice(0, separatorIndex).trim();
    buffer = buffer.slice(separatorIndex + 2);
    if (block) {
      consumeBlock(block);
    }
    separatorIndex = buffer.indexOf("\n\n");
  }
  return buffer;
}

function extractResponseMeta(payload: JsonRecord) {
  const response =
    payload.response && typeof payload.response === "object"
      ? (payload.response as JsonRecord)
      : null;
  const candidate = response ?? payload;
  return {
    responseId:
      typeof candidate.id === "string"
        ? candidate.id
        : typeof payload.response_id === "string"
          ? payload.response_id
          : null,
    model: typeof candidate.model === "string" ? candidate.model : null,
    response,
  };
}

function buildLevelInstruction(levelRange: string) {
  const normalizedLevelRange = levelRange.trim().toUpperCase();
  if (!normalizedLevelRange) {
    return "Use simple, learner-friendly language.";
  }
  if (normalizedLevelRange.includes("-")) {
    return `Keep the reply within CEFR ${normalizedLevelRange}. Use vocabulary and grammar that fit this learner range, and avoid jumping above it.`;
  }
  return `Keep the reply within CEFR ${normalizedLevelRange}. Use vocabulary and grammar that fit this level, and avoid going above it.`;
}

function buildNativeHelpInstruction(nativeHelp: boolean, nativeLocale: string) {
  if (!nativeHelp || !nativeLocale.trim()) {
    return "Do not switch away from the selected learning language unless the user explicitly requests it.";
  }
  return `Keep the main reply in the selected learning language. Use ${getLanguageName(
    nativeLocale
  )} only for brief translations or short clarifications when truly useful.`;
}

function buildInstructions(
  locale: string,
  levelRange: string,
  nativeHelp: boolean,
  nativeLocale: string
) {
  return [
    "You are the Vela Language Cafe AI voice assistant.",
    "Help with language learning, speaking practice, the app, events, organizers, and general conversation.",
    `Reply only in ${getLanguageName(locale)} unless the user explicitly asks to switch the conversation language.`,
    "Treat the selected conversation language as the active learning language for this chat.",
    buildLevelInstruction(levelRange),
    buildNativeHelpInstruction(nativeHelp, nativeLocale),
    "Keep replies natural for speech, plain text only, and usually under two short sentences.",
  ].join(" ");
}

function buildOpenAiRequestBody(input: {
  input: string;
  previousResponseId: string | null;
  locale: string;
  levelRange: string;
  nativeHelp: boolean;
  nativeLocale: string;
  stream?: boolean;
}) {
  return {
    model: openAiModel.trim() || "gpt-5-mini",
    input: input.input,
    instructions: buildInstructions(
      input.locale,
      input.levelRange,
      input.nativeHelp,
      input.nativeLocale
    ),
    previous_response_id: input.previousResponseId ?? undefined,
    max_output_tokens: 180,
    store: true,
    stream: input.stream === true ? true : undefined,
  };
}

async function createOpenAiResponse(input: {
  input: string;
  previousResponseId: string | null;
  locale: string;
  levelRange: string;
  nativeHelp: boolean;
  nativeLocale: string;
  signal?: AbortSignal;
  stream?: boolean;
}) {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey.trim()}`,
    },
    body: JSON.stringify(buildOpenAiRequestBody(input)),
    signal: input.signal,
  });
}

async function handleJsonResponse(input: {
  input: string;
  previousResponseId: string | null;
  locale: string;
  levelRange: string;
  nativeHelp: boolean;
  nativeLocale: string;
  userId: string;
}) {
  const attempts = input.previousResponseId
    ? [input.previousResponseId, null]
    : [null];

  let lastStatus = 500;
  let lastErrorMessage = "OpenAI returned an empty response.";

  for (const previousResponseId of attempts) {
    const response = await createOpenAiResponse({
      input: input.input,
      previousResponseId,
      locale: input.locale,
      levelRange: input.levelRange,
      nativeHelp: input.nativeHelp,
      nativeLocale: input.nativeLocale,
    });

    const payload = (await response.json().catch(() => ({}))) as JsonRecord;
    if (!response.ok) {
      lastStatus = response.status;
      lastErrorMessage = extractErrorMessage(payload) || "OpenAI request failed.";
      continue;
    }

    const replyText = extractResponseText(payload);
    if (!replyText) {
      lastStatus = 500;
      lastErrorMessage = "OpenAI returned an empty response.";
      continue;
    }

    const meta = extractResponseMeta(payload);
    return json(200, {
      responseId: meta.responseId,
      text: replyText,
      model: meta.model,
      userId: input.userId,
    });
  }

  return json(lastStatus, { error: lastErrorMessage });
}

async function handleStreamingResponse(req: Request, input: {
  input: string;
  previousResponseId: string | null;
  locale: string;
  levelRange: string;
  nativeHelp: boolean;
  nativeLocale: string;
}) {
  const upstreamAbortController = new AbortController();
  req.signal.addEventListener("abort", () => upstreamAbortController.abort(), {
    once: true,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const close = () => {
          if (isClosed) return;
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Ignore double-close attempts from aborted streams.
          }
        };
        const send = (eventType: string, payload: unknown) => {
          if (isClosed) return;
          controller.enqueue(sse(eventType, payload));
        };

        try {
          const response = await createOpenAiResponse({
            input: input.input,
            previousResponseId: input.previousResponseId,
            locale: input.locale,
            levelRange: input.levelRange,
            nativeHelp: input.nativeHelp,
            nativeLocale: input.nativeLocale,
            signal: upstreamAbortController.signal,
            stream: true,
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as JsonRecord;
            send("error", {
              message: extractErrorMessage(payload) || "OpenAI request failed.",
            });
            close();
            return;
          }

          if (!response.body) {
            send("error", { message: "OpenAI stream is unavailable." });
            close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let accumulatedText = "";
          let responseId: string | null = null;
          let model: string | null = null;
          let completed = false;

          const handleBlock = (block: string) => {
            const parsed = parseStreamEventBlock(block);
            if (!parsed) return;

            const { eventType, payload } = parsed;
            const meta = extractResponseMeta(payload);
            responseId = meta.responseId ?? responseId;
            model = meta.model ?? model;

            if (eventType === "response.output_text.delta") {
              const delta = typeof payload.delta === "string" ? payload.delta : "";
              if (delta) {
                accumulatedText += delta;
                send("delta", { text: delta });
              }
              return;
            }

            if (eventType === "response.output_text.done") {
              const text = typeof payload.text === "string" ? payload.text.trim() : "";
              if (text && text.length > accumulatedText.length) {
                accumulatedText = text;
              }
              return;
            }

            if (eventType === "response.content_part.done") {
              const text = extractContentPartText(payload.part);
              if (text && text.length > accumulatedText.length) {
                accumulatedText = text;
              }
              return;
            }

            if (eventType === "response.output_item.done") {
              const text = extractMessageTextFromItem(payload.item);
              if (text && text.length > accumulatedText.length) {
                accumulatedText = text;
              }
              return;
            }

            if (eventType === "response.completed") {
              const finalText = meta.response
                ? extractResponseText(meta.response) || accumulatedText.trim()
                : accumulatedText.trim();
              completed = true;
              if (!finalText) {
                send("error", {
                  message: "OpenAI returned an empty response.",
                });
              } else {
                send("completed", {
                  responseId,
                  model,
                  text: finalText,
                });
              }
              return;
            }

            if (eventType === "error") {
              send("error", {
                message: extractErrorMessage(payload) || "OpenAI request failed.",
              });
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            buffer = consumeStreamBuffer(buffer, handleBlock);
          }

          buffer += decoder.decode();
          if (buffer.trim()) {
            consumeStreamBuffer(`${buffer}\n\n`, handleBlock);
          }

          if (!completed && !upstreamAbortController.signal.aborted) {
            const finalText = accumulatedText.trim();
            if (!finalText) {
              send("error", {
                message: "OpenAI returned an empty response.",
              });
            } else {
              send("completed", {
                responseId,
                model,
                text: finalText,
              });
            }
          }
        } catch (error) {
          if (!upstreamAbortController.signal.aborted) {
            send("error", {
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        } finally {
          close();
        }
      },
      cancel() {
        upstreamAbortController.abort();
      },
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    }
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed." });
    }

    const { user, error: authError } = await requireUser(req);
    if (!user) {
      return json(401, { error: authError || "Unauthorized" });
    }
    if (!openAiApiKey.trim()) {
      return json(500, { error: "OPENAI_API_KEY is missing." });
    }

    const body = (await req.json().catch(() => ({}))) as JsonRecord;
    const action = typeof body.action === "string" ? body.action.toLowerCase() : "";
    if (action !== "respond" && action !== "stream") {
      return json(400, { error: "Unsupported action." });
    }

    const input = typeof body.input === "string" ? body.input.trim() : "";
    const previousResponseId =
      typeof body.previousResponseId === "string" && body.previousResponseId.trim()
        ? body.previousResponseId.trim()
        : null;
    const locale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : "en";
    const levelRange =
      typeof body.levelRange === "string" && body.levelRange.trim()
        ? body.levelRange.trim().toUpperCase()
        : "A1-A2";
    const nativeHelp = body.nativeHelp === true;
    const nativeLocale =
      typeof body.nativeLocale === "string" && body.nativeLocale.trim()
        ? body.nativeLocale.trim()
        : "";

    if (!input) {
      return json(400, { error: "Input text is required." });
    }

    if (action === "stream") {
      return handleStreamingResponse(req, {
        input,
        previousResponseId,
        locale,
        levelRange,
        nativeHelp,
        nativeLocale,
      });
    }

    return handleJsonResponse({
      input,
      previousResponseId,
      locale,
      levelRange,
      nativeHelp,
      nativeLocale,
      userId: user.id,
    });
  } catch (error) {
    console.error("[openai-assistant] Request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
