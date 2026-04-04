import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
const defaultVoiceId = Deno.env.get("ELEVENLABS_VOICE_ID") ?? "";
const allowedVoiceIds = (Deno.env.get("ELEVENLABS_ALLOWED_VOICE_IDS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const defaultModelId = Deno.env.get("ELEVENLABS_MODEL_ID") ?? "eleven_flash_v2_5";
const outputFormat = Deno.env.get("ELEVENLABS_OUTPUT_FORMAT") ?? "mp3_44100_128";
const elevenLabsBaseUrl =
  Deno.env.get("ELEVENLABS_API_BASE_URL") ?? "https://api.elevenlabs.io";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function tryParseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readFirstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeElevenLabsError(payload: Record<string, unknown>, responseText: string) {
  const detailRecord = tryParseJsonRecord(payload.detail);
  const voiceRecord = tryParseJsonRecord(payload.voice);
  const status = readFirstString(detailRecord ?? payload, ["status", "code", "type"]).toLowerCase();
  const voiceStatus = readFirstString(voiceRecord ?? {}, ["status", "code", "type"]).toLowerCase();
  const directMessage = readFirstString(payload, ["message", "error"]);
  const detailMessage = readFirstString(detailRecord ?? {}, ["message", "detail", "error"]);
  const voiceMessage = readFirstString(voiceRecord ?? {}, ["message", "detail", "error"]);
  const combinedMessage = [directMessage, detailMessage, voiceMessage, responseText]
    .filter((value) => value.trim())
    .join(" ");
  const normalizedText = combinedMessage.toLowerCase();

  if (status === "invalid_api_key" || normalizedText.includes("invalid api key")) {
    return "Invalid ElevenLabs API key. Update ELEVENLABS_API_KEY in Supabase secrets and redeploy.";
  }
  if (
    status === "detected_unusual_activity" ||
    normalizedText.includes("unusual activity detected")
  ) {
    return "ElevenLabs Free Tier is temporarily blocked for this account or network. Disable VPN/proxy or use a paid plan.";
  }
  if (
    status === "paid_plan_required" ||
    voiceStatus === "payment_required" ||
    normalizedText.includes("paid_plan_required") ||
    normalizedText.includes("payment_required") ||
    normalizedText.includes("free users cannot use library voices") ||
    normalizedText.includes("library voices via the api")
  ) {
    return "Selected ElevenLabs voice requires a paid plan or library voice access. Choose another voice or upgrade the plan.";
  }

  return directMessage || detailMessage || voiceMessage || responseText;
}

function isVoiceAllowed(voiceId: string) {
  if (!allowedVoiceIds.length) return true;
  return allowedVoiceIds.includes(voiceId.trim());
}

function resolveVoiceId(requestedVoiceId: string) {
  const trimmedVoiceId = requestedVoiceId.trim();
  if (trimmedVoiceId) {
    return trimmedVoiceId;
  }
  if (defaultVoiceId.trim()) {
    return defaultVoiceId.trim();
  }
  if (allowedVoiceIds.length) {
    return allowedVoiceIds[0];
  }
  return "";
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

async function elevenLabsFetch(path: string, init?: RequestInit) {
  if (!elevenLabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing.");
  }
  const response = await fetch(`${elevenLabsBaseUrl.replace(/\/+$/, "")}${path}`, {
    ...init,
    headers: {
      "xi-api-key": elevenLabsApiKey,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const responseText = await response.text();
    let message = "";
    if (contentType.includes("application/json")) {
      try {
        const payload = JSON.parse(responseText) as Record<string, unknown>;
        message = normalizeElevenLabsError(payload, responseText);
      } catch {
        message = "";
      }
    }
    if (!message) {
      message = responseText;
    }
    throw new Error(message || `ElevenLabs request failed with status ${response.status}.`);
  }

  return response;
}

type ElevenLabsVoiceApi = {
  voice_id?: string;
  name?: string;
  category?: string;
  preview_url?: string;
  labels?: Record<string, string>;
  verified_languages?: Array<{ language?: string; locale?: string }>;
};

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

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action.toLowerCase() : "";

    if (action === "list-voices") {
      const response = await elevenLabsFetch("/v1/voices", {
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as { voices?: ElevenLabsVoiceApi[] };
      const voices = (payload.voices ?? [])
        .filter((voice) => typeof voice.voice_id === "string" && typeof voice.name === "string")
        .filter((voice) => isVoiceAllowed((voice.voice_id as string).trim()))
        .map((voice) => ({
          voiceId: voice.voice_id as string,
          name: voice.name as string,
          category: typeof voice.category === "string" ? voice.category : null,
          previewUrl: typeof voice.preview_url === "string" ? voice.preview_url : null,
          labels: voice.labels ?? {},
          verifiedLanguages: Array.isArray(voice.verified_languages)
            ? voice.verified_languages
                .map((entry) =>
                  typeof entry.locale === "string"
                    ? entry.locale
                    : typeof entry.language === "string"
                      ? entry.language
                      : null,
                )
                .filter((value): value is string => Boolean(value))
            : [],
        }));
      const resolvedDefaultVoiceId = resolveVoiceId(defaultVoiceId);

      return json(200, {
        defaultVoiceId: resolvedDefaultVoiceId || null,
        defaultModelId: defaultModelId || null,
        voices,
      });
    }

    if (action === "speak") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      const voiceId = resolveVoiceId(typeof body.voiceId === "string" ? body.voiceId : "");
      const modelId =
        typeof body.modelId === "string" && body.modelId.trim()
          ? body.modelId.trim()
          : defaultModelId.trim();
      const requestedRate =
        typeof body.rate === "number" && Number.isFinite(body.rate) ? body.rate : 1;
      const speed = Math.max(0.7, Math.min(1.2, requestedRate));
      const languageCode =
        typeof body.languageCode === "string" && body.languageCode.trim()
          ? body.languageCode.trim()
          : "de";

      if (!text) {
        return json(400, { error: "Text is required." });
      }
      if (text.length > 320) {
        return json(400, { error: "Text is too long for TTS." });
      }
      if (!voiceId) {
        return json(400, { error: "No ElevenLabs voice is configured." });
      }
      if (!isVoiceAllowed(voiceId)) {
        return json(400, { error: "This ElevenLabs voice is not allowed." });
      }
      if (!modelId) {
        return json(400, { error: "No ElevenLabs model is configured." });
      }

      const response = await elevenLabsFetch(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            language_code: languageCode,
            voice_settings: {
              speed,
            },
          }),
        },
      );

      const audioBuffer = await response.arrayBuffer();
      return new Response(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
          "Cache-Control": "private, max-age=3600",
          ...corsHeaders,
        },
      });
    }

    return json(400, { error: "Unsupported action." });
  } catch (error) {
    console.error("[elevenlabs-tts] Request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
