import { getSupabaseClient, supabaseConfigured } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const TTS_FUNCTION_NAME = import.meta.env.VITE_TTS_FUNCTION_NAME ?? "elevenlabs-tts";

export type ElevenLabsVoiceOption = {
  voiceId: string;
  name: string;
  category: string | null;
  previewUrl: string | null;
  labels: Record<string, string>;
  verifiedLanguages: string[];
};

type ElevenLabsVoiceListResponse = {
  voices: ElevenLabsVoiceOption[];
  defaultVoiceId: string | null;
  defaultModelId: string | null;
};

function getTtsFunctionUrl() {
  const baseUrl = SUPABASE_URL.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Supabase is not configured.");
  }
  return `${baseUrl}/functions/v1/${TTS_FUNCTION_NAME}`;
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
    throw new Error("Sign in to use ElevenLabs voice.");
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

  return `TTS request failed with status ${response.status}.`;
}

async function invokeTtsJson<T>(body: Record<string, unknown>) {
  if (!SUPABASE_ANON_KEY.trim()) {
    throw new Error("Supabase is not configured.");
  }
  const accessToken = await getAccessToken();
  const response = await fetch(getTtsFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseFunctionError(response));
  }

  return (await response.json()) as T;
}

async function invokeTtsAudio(body: Record<string, unknown>) {
  if (!SUPABASE_ANON_KEY.trim()) {
    throw new Error("Supabase is not configured.");
  }
  const accessToken = await getAccessToken();
  const response = await fetch(getTtsFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseFunctionError(response));
  }

  return await response.blob();
}

export async function listElevenLabsVoices() {
  return await invokeTtsJson<ElevenLabsVoiceListResponse>({
    action: "list-voices",
  });
}

export async function synthesizeElevenLabsSpeech(input: {
  text: string;
  voiceId?: string;
  modelId?: string;
  rate?: number;
  languageCode?: string;
}) {
  return await invokeTtsAudio({
    action: "speak",
    text: input.text,
    voiceId: input.voiceId,
    modelId: input.modelId,
    rate: input.rate,
    languageCode: input.languageCode,
  });
}
