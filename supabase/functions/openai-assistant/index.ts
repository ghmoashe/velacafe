import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
const openAiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini";
const openAiChatModel =
  Deno.env.get("OPENAI_CHAT_MODEL") ??
  (openAiModel.trim().toLowerCase().startsWith("gpt-5") ? "gpt-4.1-mini" : openAiModel);
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const textEncoder = new TextEncoder();
const OPENAI_RETRY_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504]);
const OPENAI_MAX_RETRIES = 3;

type JsonRecord = Record<string, unknown>;
type CoachPracticeSummary = {
  strengths: string[];
  focusNext: string[];
  newPhrases: string[];
  homework: string[];
};
type CoachLessonScore = {
  overall: number;
  fluency: number;
  accuracy: number;
  vocabulary: number;
  pronunciation: number;
  goalCompletion: number;
  finalFeedback: string;
};
type CoachFeedback = {
  assistantReply: string;
  quickCorrection: string;
  betterVersion: string;
  nextQuestion: string;
  pronunciationTip: string;
  summary: CoachPracticeSummary | null;
  lessonComplete: boolean;
  score: CoachLessonScore | null;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function sse(eventType: string, payload: unknown) {
  return textEncoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function shouldRetryOpenAiStatus(status: number) {
  return OPENAI_RETRY_STATUSES.has(status);
}

function parseRetryDelayMs(retryAfterHeader: string | null, attemptIndex: number) {
  const retryAfter = retryAfterHeader?.trim() ?? "";
  const asSeconds = Number(retryAfter);
  if (Number.isFinite(asSeconds) && asSeconds > 0) {
    return Math.min(asSeconds * 1000, 5000);
  }

  return Math.min(300 * 2 ** attemptIndex, 2000);
}

async function waitBeforeRetry(delayMs: number, signal?: AbortSignal) {
  if (delayMs <= 0) return;

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);

    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function getOpenAiErrorMessage(status: number, payload: JsonRecord, fallback: string) {
  const message = extractErrorMessage(payload);
  if (message && status < 500 && status !== 429) {
    return message;
  }

  if (status === 429) {
    return "OpenAI rate limit was reached. Please try again in a moment.";
  }

  if (status >= 500) {
    return "OpenAI is temporarily unavailable. Please try again.";
  }

  return message || fallback;
}

async function fetchOpenAiWithRetry(
  url: string,
  init: RequestInit & { signal?: AbortSignal }
) {
  let lastError: unknown = null;

  for (let attemptIndex = 0; attemptIndex < OPENAI_MAX_RETRIES; attemptIndex += 1) {
    try {
      const response = await fetch(url, init);
      if (
        !shouldRetryOpenAiStatus(response.status) ||
        attemptIndex === OPENAI_MAX_RETRIES - 1
      ) {
        return response;
      }

      await waitBeforeRetry(
        parseRetryDelayMs(response.headers.get("retry-after"), attemptIndex),
        init.signal
      );
    } catch (error) {
      if (isAbortError(error) || attemptIndex === OPENAI_MAX_RETRIES - 1) {
        throw error;
      }
      lastError = error;
      await waitBeforeRetry(parseRetryDelayMs(null, attemptIndex), init.signal);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed.");
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
  const directOutputText = extractTextValue(payload.output_text);
  if (directOutputText) {
    return directOutputText;
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
      if (!contentItem) continue;
      const text = extractTextValue((contentItem as JsonRecord).text);
      if (
        ((contentItem as JsonRecord).type === "output_text" ||
          (contentItem as JsonRecord).type === "text") &&
        text
      ) {
        chunks.push(text);
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
    const text = extractTextValue(part.text);
    if ((part.type === "output_text" || part.type === "text") && text) {
      chunks.push(text);
    }
  }

  return chunks.join("\n").trim();
}

function extractContentPartText(part: unknown) {
  if (!part || typeof part !== "object") {
    return "";
  }

  const record = part as JsonRecord;
  const text = extractTextValue(record.text);
  if ((record.type === "output_text" || record.type === "text") && text) {
    return text;
  }

  return "";
}

function extractTextValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const chunks = value
      .map((item) => extractTextValue(item))
      .filter(Boolean);
    return chunks.join("\n").trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as JsonRecord;
  if (typeof record.value === "string" && record.value.trim()) {
    return record.value.trim();
  }
  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }

  return "";
}

function extractChatCompletionText(payload: JsonRecord) {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  for (const choice of choices) {
    if (!choice || typeof choice !== "object") continue;
    const message = (choice as JsonRecord).message;
    if (!message || typeof message !== "object") continue;
    const content = (message as JsonRecord).content;
    const text = extractTextValue(content);
    if (text) {
      return text;
    }
  }
  return "";
}

function extractChatCompletionContent(payload: JsonRecord) {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  for (const choice of choices) {
    if (!choice || typeof choice !== "object") continue;
    const message = (choice as JsonRecord).message;
    if (!message || typeof message !== "object") continue;
    const content = (message as JsonRecord).content;
    const text = extractTextValue(content);
    if (text) {
      return text;
    }
  }
  return "";
}

function normalizeCoachList(value: unknown, maxItems = 3) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeScoreValue(value: unknown) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function parseCoachFeedback(text: string): CoachFeedback | null {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  const withoutFence = normalized
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const payload = JSON.parse(withoutFence) as JsonRecord;
    const summary =
      payload.summary && typeof payload.summary === "object"
        ? (payload.summary as JsonRecord)
        : null;
    const score =
      payload.score && typeof payload.score === "object"
        ? (payload.score as JsonRecord)
        : null;

    return {
      assistantReply: extractTextValue(payload.assistant_reply),
      quickCorrection: extractTextValue(payload.quick_correction),
      betterVersion: extractTextValue(payload.better_version),
      nextQuestion: extractTextValue(payload.next_question),
      pronunciationTip: extractTextValue(payload.pronunciation_tip),
      summary: summary
        ? {
            strengths: normalizeCoachList(summary.strengths),
            focusNext: normalizeCoachList(summary.focus_next),
            newPhrases: normalizeCoachList(summary.new_phrases),
            homework: normalizeCoachList(summary.homework),
          }
        : null,
      lessonComplete: payload.lesson_complete === true,
      score: score
        ? {
            overall: normalizeScoreValue(score.overall),
            fluency: normalizeScoreValue(score.fluency),
            accuracy: normalizeScoreValue(score.accuracy),
            vocabulary: normalizeScoreValue(score.vocabulary),
            pronunciation: normalizeScoreValue(score.pronunciation),
            goalCompletion: normalizeScoreValue(score.goal_completion),
            finalFeedback: extractTextValue(score.final_feedback),
          }
        : null,
    };
  } catch {
    return {
      assistantReply: normalized,
      quickCorrection: "",
      betterVersion: "",
      nextQuestion: "",
      pronunciationTip: "",
      summary: null,
      lessonComplete: false,
      score: null,
    };
  }
}

function extractConversationMessageText(item: unknown) {
  if (!item || typeof item !== "object") {
    return "";
  }

  const record = item as JsonRecord;
  if (record.type !== "message" || record.role !== "assistant") {
    return "";
  }

  const content = Array.isArray(record.content) ? record.content : [];
  const chunks: string[] = [];
  for (const contentItem of content) {
    if (!contentItem || typeof contentItem !== "object") continue;
    const part = contentItem as JsonRecord;
    const text =
      part.type === "output_text" || part.type === "text" || part.type === "input_text"
        ? extractTextValue(part.text)
        : "";
    if (text) {
      chunks.push(text);
    }
  }

  return chunks.join("\n").trim();
}

async function getLatestConversationAssistantText(conversationId: string) {
  const response = await fetchOpenAiWithRetry(
    `https://api.openai.com/v1/conversations/${encodeURIComponent(conversationId)}/items`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${openAiApiKey.trim()}`,
      },
    }
  );

  const payload = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    throw new Error(getOpenAiErrorMessage(
      response.status,
      payload,
      "OpenAI conversation items request failed."
    ));
  }

  const items = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.items)
      ? payload.items
      : [];

  let latestAssistantText = "";
  for (const item of items) {
    const text = extractConversationMessageText(item);
    if (text) {
      latestAssistantText = text;
    }
  }

  return latestAssistantText.trim();
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

function buildDifficultyInstruction(difficultyMode: string, difficultyNote: string) {
  const normalizedMode = difficultyMode.trim().toLowerCase();
  const note = difficultyNote.trim();

  if (normalizedMode === "supportive") {
    return [
      "Use a supportive difficulty mode inside the selected CEFR range.",
      "Stay near the lower edge of the range, use shorter questions, more predictable follow-ups, and gentle scaffolding.",
      note,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (normalizedMode === "stretch") {
    return [
      "Use a stretch difficulty mode inside the selected CEFR range.",
      "Stay inside the CEFR range but move toward the upper edge with richer vocabulary, less scaffolding, and slightly more open follow-up questions.",
      note,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "Use a balanced difficulty mode inside the selected CEFR range.",
    "Stay around the middle of the range with natural pacing and normal support.",
    note,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildNativeHelpInstruction(nativeHelp: boolean, nativeLocale: string) {
  if (!nativeHelp || !nativeLocale.trim()) {
    return "Do not switch away from the selected learning language unless the user explicitly requests it.";
  }
  return `Keep the main reply in the selected learning language. Use ${getLanguageName(
    nativeLocale
  )} only for brief translations or short clarifications when truly useful.`;
}

function buildPracticeModeInstruction(practiceMode: string, practiceTopic: string) {
  const normalizedMode = practiceMode.trim().toLowerCase();
  const normalizedTopic = practiceTopic.trim();

  const topicInstruction = normalizedTopic
    ? `Focus the session on this scenario or topic: ${normalizedTopic}.`
    : "If no topic is given, choose a simple real-life topic that matches the learner level.";

  switch (normalizedMode) {
    case "roleplay":
      return [
        "Run the session as a role-play speaking lesson.",
        topicInstruction,
        "Stay inside the scenario and keep the interaction realistic.",
      ].join(" ");
    case "topic":
      return [
        "Run the session as guided topic-based speaking practice.",
        topicInstruction,
        "Ask questions that help the learner explain opinions, preferences, or experiences.",
      ].join(" ");
    case "daily":
    default:
      return [
        "Run the session as everyday speaking practice.",
        topicInstruction,
        "Prefer natural daily-life topics, small talk, plans, routines, shopping, travel, or social situations.",
      ].join(" ");
  }
}

function buildLessonFlowInstruction(input: {
  lessonTemplate: string;
  lessonGoal: string;
  lessonTurnIndex: number;
  lessonTurnTarget: number;
}) {
  const template = input.lessonTemplate.trim();
  const goal = input.lessonGoal.trim();
  const turnTarget = Math.max(1, input.lessonTurnTarget);
  const turnIndex = Math.max(0, input.lessonTurnIndex);

  if (!template && !goal && turnIndex === 0 && turnTarget === 0) {
    return "";
  }

  const lessonIdentity = template
    ? `You are running a structured lesson called "${template}".`
    : "You are running a structured speaking lesson.";
  const goalInstruction = goal
    ? `The lesson goal is: ${goal}.`
    : "The lesson goal is to keep the learner speaking confidently in a realistic scenario.";

  if (turnIndex <= 0) {
    return [
      lessonIdentity,
      goalInstruction,
      `This is the lesson kickoff before learner turn 1 of ${turnTarget}.`,
      "In assistant_reply, set the scene in one or two short sentences.",
      "Put the first learner prompt in next_question.",
      "Leave quick_correction, better_version, pronunciation_tip, and score empty at kickoff.",
      "Set lesson_complete to false at kickoff.",
    ].join(" ");
  }

  if (turnIndex >= turnTarget) {
    return [
      lessonIdentity,
      goalInstruction,
      `This learner has just completed turn ${turnIndex} of ${turnTarget}, which is the final turn.`,
      "Do not ask another follow-up question.",
      "Use assistant_reply for a brief encouraging wrap-up.",
      "Set lesson_complete to true.",
      "Fill the score object with overall, fluency, accuracy, vocabulary, pronunciation, goal_completion, and final_feedback.",
      "The score should be fair for the selected CEFR level, not native-speaker standards.",
    ].join(" ");
  }

  return [
    lessonIdentity,
    goalInstruction,
    `The learner has completed ${turnIndex} of ${turnTarget} lesson turns.`,
    "Continue the lesson naturally and ask exactly one short next question.",
    "Set lesson_complete to false and leave score empty until the final learner turn.",
  ].join(" ");
}

function buildInstructions(
  locale: string,
  levelRange: string,
  practiceMode: string,
  practiceTopic: string,
  lessonTemplate: string,
  lessonGoal: string,
  lessonTurnIndex: number,
  lessonTurnTarget: number,
  difficultyMode: string,
  difficultyNote: string,
  nativeHelp: boolean,
  nativeLocale: string
) {
  return [
    "You are the Vela AI Practice speaking coach.",
    "Your main job is to run a spoken practice lesson, not to act like a generic chatbot.",
    `Reply only in ${getLanguageName(locale)} unless the user explicitly asks to switch the conversation language.`,
    "Treat the selected conversation language as the active learning language for this chat.",
    buildLevelInstruction(levelRange),
    buildDifficultyInstruction(difficultyMode, difficultyNote),
    buildPracticeModeInstruction(practiceMode, practiceTopic),
    buildLessonFlowInstruction({
      lessonTemplate,
      lessonGoal,
      lessonTurnIndex,
      lessonTurnTarget,
    }),
    buildNativeHelpInstruction(nativeHelp, nativeLocale),
    "After the learner speaks, do three things in one compact reply when useful: acknowledge, lightly correct or reformulate one key mistake, then continue the conversation.",
    "Ask one short follow-up question at a time so the learner keeps speaking.",
    "Keep replies natural for speech and short enough for voice playback.",
    "Return valid JSON only with these keys: assistant_reply, quick_correction, better_version, next_question, pronunciation_tip, summary, lesson_complete, score.",
    "The summary object must contain arrays named strengths, focus_next, new_phrases, homework.",
    "The score object must contain overall, fluency, accuracy, vocabulary, pronunciation, goal_completion, final_feedback.",
    "If a field is not needed, return an empty string or an empty array.",
  ].join(" ");
}

function buildUnavailableReply(locale: string) {
  switch (locale) {
    case "de":
      return "Entschuldigung, ich hatte gerade ein Problem. Bitte versuche es noch einmal.";
    case "ru":
      return "Извините, у меня сейчас была ошибка. Пожалуйста, попробуйте ещё раз.";
    case "uk":
      return "Вибачте, у мене щойно сталася помилка. Будь ласка, спробуйте ще раз.";
    case "ar":
      return "عذرًا، حدثت مشكلة للتو. من فضلك حاول مرة أخرى.";
    case "fa":
      return "ببخشید، همین الان یک مشکل پیش آمد. لطفاً دوباره تلاش کنید.";
    case "fr":
      return "Desole, j'ai eu un probleme. Merci de reessayer.";
    case "es":
      return "Lo siento, acabo de tener un problema. Intentalo de nuevo.";
    case "it":
      return "Mi dispiace, ho avuto un problema. Per favore riprova.";
    case "pl":
      return "Przepraszam, wystapil problem. Sprobuj jeszcze raz.";
    case "tr":
      return "Uzgunum, az once bir sorun oldu. Lutfen tekrar dene.";
    case "vi":
      return "Xin loi, toi vua gap loi. Hay thu lai mot lan nua.";
    case "sq":
      return "Me fal, sapo pata nje problem. Te lutem provo perseri.";
    case "en":
    default:
      return "Sorry, I had a problem just now. Please try again.";
  }
}

function buildOpenAiRequestBody(input: {
  input: string;
  conversationId: string | null;
  locale: string;
  levelRange: string;
  practiceMode: string;
  practiceTopic: string;
  lessonTemplate: string;
  lessonGoal: string;
  lessonTurnIndex: number;
  lessonTurnTarget: number;
  difficultyMode: string;
  difficultyNote: string;
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
      input.practiceMode,
      input.practiceTopic,
      input.lessonTemplate,
      input.lessonGoal,
      input.lessonTurnIndex,
      input.lessonTurnTarget,
      input.difficultyMode,
      input.difficultyNote,
      input.nativeHelp,
      input.nativeLocale
    ),
    conversation: input.conversationId ?? undefined,
    max_output_tokens: 260,
    store: true,
    stream: input.stream === true ? true : undefined,
  };
}

async function createOpenAiResponse(input: {
  input: string;
  conversationId: string | null;
  locale: string;
  levelRange: string;
  practiceMode: string;
  practiceTopic: string;
  lessonTemplate: string;
  lessonGoal: string;
  lessonTurnIndex: number;
  lessonTurnTarget: number;
  difficultyMode: string;
  difficultyNote: string;
  nativeHelp: boolean;
  nativeLocale: string;
  signal?: AbortSignal;
  stream?: boolean;
}) {
  return fetchOpenAiWithRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey.trim()}`,
    },
    body: JSON.stringify(buildOpenAiRequestBody(input)),
    signal: input.signal,
  });
}

async function createConversation(input: {
  userId: string;
  locale: string;
}) {
  const response = await fetchOpenAiWithRetry("https://api.openai.com/v1/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey.trim()}`,
    },
    body: JSON.stringify({
      metadata: {
        topic: "vela-voice",
        user_id: input.userId,
        locale: input.locale,
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    throw new Error(
      getOpenAiErrorMessage(response.status, payload, "OpenAI conversation creation failed.")
    );
  }

  const conversationId = typeof payload.id === "string" ? payload.id.trim() : "";
  if (!conversationId) {
    throw new Error("OpenAI conversation creation returned no id.");
  }

  return conversationId;
}

async function createOpenAiChatCompletion(input: {
  input: string;
  locale: string;
  levelRange: string;
  practiceMode: string;
  practiceTopic: string;
  lessonTemplate: string;
  lessonGoal: string;
  lessonTurnIndex: number;
  lessonTurnTarget: number;
  difficultyMode: string;
  difficultyNote: string;
  nativeHelp: boolean;
  nativeLocale: string;
}) {
  return fetchOpenAiWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey.trim()}`,
    },
    body: JSON.stringify({
      model: openAiChatModel.trim() || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: buildInstructions(
            input.locale,
            input.levelRange,
            input.practiceMode,
            input.practiceTopic,
            input.lessonTemplate,
            input.lessonGoal,
            input.lessonTurnIndex,
            input.lessonTurnTarget,
            input.difficultyMode,
            input.difficultyNote,
            input.nativeHelp,
            input.nativeLocale
          ),
        },
        {
          role: "user",
          content: input.input,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 260,
    }),
  });
}

async function handleJsonResponse(input: {
  input: string;
  conversationId: string | null;
  locale: string;
  levelRange: string;
  practiceMode: string;
  practiceTopic: string;
  lessonTemplate: string;
  lessonGoal: string;
  lessonTurnIndex: number;
  lessonTurnTarget: number;
  difficultyMode: string;
  difficultyNote: string;
  nativeHelp: boolean;
  nativeLocale: string;
  userId: string;
}) {
  const fallbackResponse = await createOpenAiChatCompletion({
    input: input.input,
    locale: input.locale,
    levelRange: input.levelRange,
    practiceMode: input.practiceMode,
    practiceTopic: input.practiceTopic,
    lessonTemplate: input.lessonTemplate,
    lessonGoal: input.lessonGoal,
    lessonTurnIndex: input.lessonTurnIndex,
    lessonTurnTarget: input.lessonTurnTarget,
    difficultyMode: input.difficultyMode,
    difficultyNote: input.difficultyNote,
    nativeHelp: input.nativeHelp,
    nativeLocale: input.nativeLocale,
  });
  const fallbackPayload = (await fallbackResponse.json().catch(() => ({}))) as JsonRecord;
  if (fallbackResponse.ok) {
    const rawContent = extractChatCompletionContent(fallbackPayload);
    const coach = parseCoachFeedback(rawContent);
    const fallbackText =
      coach && (coach.assistantReply || coach.nextQuestion)
        ? [coach.assistantReply, coach.nextQuestion].filter(Boolean).join(" ").trim()
        : extractChatCompletionText(fallbackPayload);
    if (fallbackText) {
      return json(200, {
        responseId: null,
        conversationId: null,
        text: fallbackText,
        model:
          typeof fallbackPayload.model === "string" ? fallbackPayload.model : null,
        coach,
        userId: input.userId,
      });
    }

    return json(200, {
      responseId: null,
      conversationId: null,
      text: buildUnavailableReply(input.locale),
      model:
        typeof fallbackPayload.model === "string" ? fallbackPayload.model : null,
      coach: null,
      userId: input.userId,
    });
  }

  if (!fallbackResponse.ok) {
    if (fallbackResponse.status >= 429) {
      return json(200, {
        responseId: null,
        conversationId: null,
        text: buildUnavailableReply(input.locale),
        model: null,
        coach: null,
        userId: input.userId,
      });
    }

    return json(fallbackResponse.status, {
      error: getOpenAiErrorMessage(
        fallbackResponse.status,
        fallbackPayload,
        "OpenAI chat completion failed."
      ),
    });
  }

  return json(200, {
    responseId: null,
    conversationId: null,
    text: buildUnavailableReply(input.locale),
    model: null,
    coach: null,
    userId: input.userId,
  });
}

async function handleStreamingResponse(req: Request, input: {
  input: string;
  conversationId: string | null;
  locale: string;
  levelRange: string;
  practiceMode: string;
  practiceTopic: string;
  lessonTemplate: string;
  lessonGoal: string;
  lessonTurnIndex: number;
  lessonTurnTarget: number;
  difficultyMode: string;
  difficultyNote: string;
  nativeHelp: boolean;
  nativeLocale: string;
  userId: string;
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
          const response = await createOpenAiChatCompletion({
            input: input.input,
            locale: input.locale,
            levelRange: input.levelRange,
            practiceMode: input.practiceMode,
            practiceTopic: input.practiceTopic,
            lessonTemplate: input.lessonTemplate,
            lessonGoal: input.lessonGoal,
            lessonTurnIndex: input.lessonTurnIndex,
            lessonTurnTarget: input.lessonTurnTarget,
            difficultyMode: input.difficultyMode,
            difficultyNote: input.difficultyNote,
            nativeHelp: input.nativeHelp,
            nativeLocale: input.nativeLocale,
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as JsonRecord;
            if (response.status >= 429) {
              const fallbackText = buildUnavailableReply(input.locale);
              send("delta", { text: fallbackText });
              send("completed", {
                responseId: null,
                conversationId: null,
                model: null,
                text: fallbackText,
              });
            } else {
              send("error", {
                message: getOpenAiErrorMessage(
                  response.status,
                  payload,
                  "OpenAI request failed."
                ),
              });
            }
            close();
            return;
          }

          const payload = (await response.json().catch(() => ({}))) as JsonRecord;
          const rawContent = extractChatCompletionContent(payload);
          const coach = parseCoachFeedback(rawContent);
          const finalText =
            coach && (coach.assistantReply || coach.nextQuestion)
              ? [coach.assistantReply, coach.nextQuestion].filter(Boolean).join(" ").trim()
              : extractChatCompletionText(payload);
          const model =
            typeof payload.model === "string" ? payload.model : openAiModel.trim() || null;

          if (!finalText) {
            const fallbackText = buildUnavailableReply(input.locale);
            send("delta", { text: fallbackText });
            send("completed", {
              responseId: null,
              conversationId: null,
              model,
              text: fallbackText,
              coach: null,
            });
          } else {
            send("delta", { text: finalText });
            send("completed", {
              responseId: null,
              conversationId: null,
              model,
              text: finalText,
              coach,
            });
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
    const conversationId =
      typeof body.conversationId === "string" && body.conversationId.trim()
        ? body.conversationId.trim()
        : null;
    const locale =
      typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : "en";
    const levelRange =
      typeof body.levelRange === "string" && body.levelRange.trim()
        ? body.levelRange.trim().toUpperCase()
        : "A1-A2";
    const practiceMode =
      typeof body.practiceMode === "string" && body.practiceMode.trim()
        ? body.practiceMode.trim().toLowerCase()
        : "daily";
    const practiceTopic =
      typeof body.practiceTopic === "string" && body.practiceTopic.trim()
        ? body.practiceTopic.trim()
        : "";
    const lessonTemplate =
      typeof body.lessonTemplate === "string" && body.lessonTemplate.trim()
        ? body.lessonTemplate.trim()
        : "";
    const lessonGoal =
      typeof body.lessonGoal === "string" && body.lessonGoal.trim()
        ? body.lessonGoal.trim()
        : "";
    const lessonTurnIndex =
      typeof body.lessonTurnIndex === "number" && Number.isFinite(body.lessonTurnIndex)
        ? Math.max(0, Math.round(body.lessonTurnIndex))
        : 0;
    const lessonTurnTarget =
      typeof body.lessonTurnTarget === "number" && Number.isFinite(body.lessonTurnTarget)
        ? Math.max(0, Math.round(body.lessonTurnTarget))
        : 0;
    const difficultyMode =
      typeof body.difficultyMode === "string" && body.difficultyMode.trim()
        ? body.difficultyMode.trim().toLowerCase()
        : "balanced";
    const difficultyNote =
      typeof body.difficultyNote === "string" && body.difficultyNote.trim()
        ? body.difficultyNote.trim()
        : "";
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
        conversationId,
        locale,
        levelRange,
        practiceMode,
        practiceTopic,
        lessonTemplate,
        lessonGoal,
        lessonTurnIndex,
        lessonTurnTarget,
        difficultyMode,
        difficultyNote,
        nativeHelp,
        nativeLocale,
        userId: user.id,
      });
    }

    return handleJsonResponse({
      input,
      conversationId,
      locale,
      levelRange,
      practiceMode,
      practiceTopic,
      lessonTemplate,
      lessonGoal,
      lessonTurnIndex,
      lessonTurnTarget,
      difficultyMode,
      difficultyNote,
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
