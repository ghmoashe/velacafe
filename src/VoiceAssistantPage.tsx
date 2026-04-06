import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { synthesizeElevenLabsSpeech } from "./elevenLabsTts";
import {
  type CoachFeedback,
  type CoachPracticeSummary,
  createOpenAiAssistantReply,
} from "./openAiAssistant";
import { getSupabaseClient } from "./supabaseClient";
import { getVoiceAssistantText } from "./voiceAssistantText";

type VoiceAssistantPageProps = {
  locale: string;
  languageOptions: Array<{ locale: string; label: string }>;
  preferredInputLocales: string[];
  profileLevel?: string;
  nativeLocale?: string | null;
  nativeLanguageLabel?: string | null;
  sessionUserId?: string | null;
  guestMode: boolean;
  requireAuth: () => void;
};

type VoiceAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  spokenText?: string;
  coach?: CoachFeedback | null;
  pending?: boolean;
};

type PracticeProgress = {
  turnsCompleted: number;
  focusAreas: string[];
  savedPhrases: string[];
  pronunciationTips: string[];
  updatedAt: string | null;
};

type PracticeUserStateRow = {
  user_id: string;
  locale: string;
  turns_completed: number;
  focus_areas: string[] | null;
  saved_phrases: string[] | null;
  pronunciation_tips: string[] | null;
  last_practice_mode: string | null;
  last_practice_topic: string | null;
  last_summary: CoachPracticeSummary | null;
  updated_at: string | null;
};

type PracticeSessionHistoryRow = {
  id: string;
  locale: string;
  level_range: string;
  practice_mode: string;
  practice_topic: string | null;
  user_message: string;
  assistant_reply: string;
  quick_correction: string | null;
  better_version: string | null;
  next_question: string | null;
  pronunciation_tip: string | null;
  summary: CoachPracticeSummary | null;
  created_at: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike> & {
  isFinal: boolean;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
  message?: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
};

const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YS4AAAAA";

const CONVERSATION_LEVEL_OPTIONS = [
  "A1-A2",
  "A2-B1",
  "B1-B2",
  "B2-C1",
  "C1-C2",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;

type ConversationLevelOption = (typeof CONVERSATION_LEVEL_OPTIONS)[number];
const PRACTICE_MODE_OPTIONS = ["daily", "roleplay", "topic"] as const;
type PracticeModeOption = (typeof PRACTICE_MODE_OPTIONS)[number];
const PRACTICE_TOPIC_SUGGESTIONS = [
  "At the cafe",
  "Job interview",
  "Travel",
  "Small talk",
  "Doctor visit",
  "Presentation",
] as const;

function buildId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return window.AudioContext ?? speechWindow.webkitAudioContext ?? null;
}

function getSpeechLocale(locale: string) {
  switch (locale) {
    case "de":
      return "de-DE";
    case "en":
      return "en-US";
    case "vi":
      return "vi-VN";
    case "ru":
      return "ru-RU";
    case "uk":
      return "uk-UA";
    case "fa":
      return "fa-IR";
    case "ar":
      return "ar-SA";
    case "sq":
      return "sq-AL";
    case "tr":
      return "tr-TR";
    case "fr":
      return "fr-FR";
    case "es":
      return "es-ES";
    case "it":
      return "it-IT";
    case "pl":
      return "pl-PL";
    default:
      return "en-US";
  }
}

function getPreferredConversationLocale(preferredLocales: string[], fallbackLocale: string) {
  const firstPreferredLocale = preferredLocales.find((value) => value.trim());
  return firstPreferredLocale ?? fallbackLocale;
}

function isConversationLevelOption(value: string): value is ConversationLevelOption {
  return (CONVERSATION_LEVEL_OPTIONS as readonly string[]).includes(value);
}

function isPracticeModeOption(value: string): value is PracticeModeOption {
  return (PRACTICE_MODE_OPTIONS as readonly string[]).includes(value);
}

function getDefaultConversationLevel(profileLevel?: string) {
  switch (profileLevel?.trim().toUpperCase()) {
    case "A1":
    case "A2":
      return "A1-A2";
    case "B1":
      return "A2-B1";
    case "B2":
      return "B1-B2";
    case "C1":
      return "B2-C1";
    case "C2":
      return "C1-C2";
    default:
      return "A1-A2";
  }
}

function hasAnyMatch(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function detectConversationLocale(text: string, fallbackLocale: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return fallbackLocale;

  if (/[іїєґ]/i.test(normalized)) return "uk";
  if (/[а-яё]/i.test(normalized)) return "ru";

  if (/[\u0600-\u06FF]/u.test(normalized)) {
    if (/[پچژگکی]/u.test(normalized)) return "fa";
    return "ar";
  }

  if (
    /[ğışçöü]/i.test(normalized) ||
    hasAnyMatch(normalized, ["merhaba", "tesekkur", "teşekkür", "nasilsin", "nasılsın"])
  ) {
    return "tr";
  }

  if (
    /[äöüß]/i.test(normalized) ||
    hasAnyMatch(normalized, ["hallo", "danke", "bitte", "guten", "tschuss", "tschüss"])
  ) {
    return "de";
  }

  if (
    /[àâçéèêëîïôùûüÿœæ]/i.test(normalized) ||
    hasAnyMatch(normalized, ["bonjour", "merci", "salut", "comment", "s'il", "ca va", "ça va"])
  ) {
    return "fr";
  }

  if (
    /[ñáéíóú¿¡]/i.test(normalized) ||
    hasAnyMatch(normalized, ["hola", "gracias", "buenos", "como estas", "cómo estás"])
  ) {
    return "es";
  }

  if (
    /[àèéìíîòóù]/i.test(normalized) ||
    hasAnyMatch(normalized, ["ciao", "grazie", "buongiorno", "come stai"])
  ) {
    return "it";
  }

  if (
    /[ąćęłńóśźż]/i.test(normalized) ||
    hasAnyMatch(normalized, ["czesc", "cześć", "dziekuje", "dziękuję", "dzien dobry", "dzień dobry"])
  ) {
    return "pl";
  }

  if (
    /[ăâđêôơư]/i.test(normalized) ||
    hasAnyMatch(normalized, ["xin chao", "xin chào", "cam on", "cảm ơn"])
  ) {
    return "vi";
  }

  if (
    /[çë]/i.test(normalized) ||
    hasAnyMatch(normalized, ["pershendetje", "përshëndetje", "faleminderit"])
  ) {
    return "sq";
  }

  if (
    hasAnyMatch(normalized, [
      "hello",
      "hi ",
      "thanks",
      "thank you",
      "please",
      "good morning",
      "how are you",
    ])
  ) {
    return "en";
  }

  return fallbackLocale;
}
void detectConversationLocale;

function trimForSpeech(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 300) return normalized;
  const shortened = normalized.slice(0, 297);
  const sentenceBreak = Math.max(
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf("? "),
    shortened.lastIndexOf("! ")
  );
  if (sentenceBreak > 120) {
    return shortened.slice(0, sentenceBreak + 1).trim();
  }
  return `${shortened.trim()}...`;
}

function normalizeUniqueItems(values: string[], maxItems = 4) {
  const normalized = values
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return normalized.filter((value, index) => normalized.indexOf(value) === index).slice(0, maxItems);
}

function createEmptyPracticeProgress(): PracticeProgress {
  return {
    turnsCompleted: 0,
    focusAreas: [],
    savedPhrases: [],
    pronunciationTips: [],
    updatedAt: null,
  };
}

function getPracticeProgressStorageKey(userId: string | null | undefined, locale: string) {
  return `vela-ai-practice:${userId?.trim() || "guest"}:${locale}`;
}

function mergePracticeProgress(
  previous: PracticeProgress,
  coach: CoachFeedback | null
): PracticeProgress {
  if (!coach) {
    return previous;
  }

  return {
    turnsCompleted: previous.turnsCompleted + 1,
    focusAreas: normalizeUniqueItems([
      ...previous.focusAreas,
      ...(coach.summary?.focusNext ?? []),
      coach.quickCorrection,
    ]),
    savedPhrases: normalizeUniqueItems([
      ...previous.savedPhrases,
      ...(coach.summary?.newPhrases ?? []),
      coach.betterVersion,
    ], 6),
    pronunciationTips: normalizeUniqueItems([
      ...previous.pronunciationTips,
      coach.pronunciationTip,
    ]),
    updatedAt: new Date().toISOString(),
  };
}

function buildConversationInput(
  messages: VoiceAssistantMessage[],
  nextUserText: string
) {
  const recentMessages = messages
    .filter((message) => !message.pending && message.text.trim())
    .slice(-6)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text.trim()}`);

  if (!recentMessages.length) {
    return nextUserText.trim();
  }

  return [
    "Conversation so far:",
    ...recentMessages,
    `User: ${nextUserText.trim()}`,
    "Reply to the latest user message.",
  ].join("\n");
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}

export default function VoiceAssistantPage(props: VoiceAssistantPageProps) {
  const {
    locale,
    languageOptions,
    preferredInputLocales,
    profileLevel,
    nativeLocale,
    nativeLanguageLabel,
    sessionUserId,
    guestMode,
    requireAuth,
  } = props;
  const text = useMemo(() => getVoiceAssistantText(locale), [locale]);
  const defaultConversationLocale = useMemo(
    () => getPreferredConversationLocale(preferredInputLocales, locale),
    [locale, preferredInputLocales]
  );
  const defaultConversationLevel = useMemo(
    () => getDefaultConversationLevel(profileLevel),
    [profileLevel]
  );
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioUnlockAttemptedRef = useRef(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const conversationLocaleRef = useRef<string | null>(null);
  const lastInputSourceRef = useRef<"text" | "speech">("text");
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const shouldSubmitSpeechRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<VoiceAssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedConversationLocale, setSelectedConversationLocale] = useState(
    defaultConversationLocale
  );
  const [selectedConversationLevel, setSelectedConversationLevel] = useState<ConversationLevelOption>(
    defaultConversationLevel
  );
  const [selectedPracticeMode, setSelectedPracticeMode] = useState<PracticeModeOption>("daily");
  const [practiceTopic, setPracticeTopic] = useState("");
  const [practiceSummary, setPracticeSummary] = useState<CoachPracticeSummary | null>(null);
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress>(
    createEmptyPracticeProgress()
  );
  const [recentSessions, setRecentSessions] = useState<PracticeSessionHistoryRow[]>([]);
  const [nativeHelpEnabled, setNativeHelpEnabled] = useState(
    Boolean(nativeLocale && nativeLocale !== defaultConversationLocale)
  );
  const [statusMessage, setStatusMessage] = useState(text.idle);
  const [errorMessage, setErrorMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionSupported = useMemo(
    () => Boolean(getRecognitionConstructor()),
    []
  );

  useEffect(() => {
    setSelectedConversationLocale(defaultConversationLocale);
    conversationLocaleRef.current = defaultConversationLocale;
  }, [defaultConversationLocale]);

  useEffect(() => {
    setSelectedConversationLevel(defaultConversationLevel);
  }, [defaultConversationLevel]);

  useEffect(() => {
    setNativeHelpEnabled(Boolean(nativeLocale && nativeLocale !== defaultConversationLocale));
  }, [defaultConversationLocale, nativeLocale]);

  useEffect(() => {
    if (sessionUserId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(
        getPracticeProgressStorageKey(sessionUserId, selectedConversationLocale)
      );
      if (!stored) {
        setPracticeProgress(createEmptyPracticeProgress());
        return;
      }

      const parsed = JSON.parse(stored) as Partial<PracticeProgress>;
      setPracticeProgress({
        turnsCompleted:
          typeof parsed.turnsCompleted === "number" && parsed.turnsCompleted >= 0
            ? parsed.turnsCompleted
            : 0,
        focusAreas: Array.isArray(parsed.focusAreas)
          ? normalizeUniqueItems(parsed.focusAreas.map((item) => String(item)))
          : [],
        savedPhrases: Array.isArray(parsed.savedPhrases)
          ? normalizeUniqueItems(parsed.savedPhrases.map((item) => String(item)), 6)
          : [],
        pronunciationTips: Array.isArray(parsed.pronunciationTips)
          ? normalizeUniqueItems(parsed.pronunciationTips.map((item) => String(item)))
          : [],
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      });
    } catch {
      setPracticeProgress(createEmptyPracticeProgress());
    }
  }, [selectedConversationLocale, sessionUserId]);

  useEffect(() => {
    if (sessionUserId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getPracticeProgressStorageKey(sessionUserId, selectedConversationLocale),
      JSON.stringify(practiceProgress)
    );
  }, [practiceProgress, selectedConversationLocale, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId) {
      setRecentSessions([]);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        const [stateResult, sessionsResult] = await Promise.all([
          supabase
            .from("ai_practice_user_state")
            .select(
              "user_id,locale,turns_completed,focus_areas,saved_phrases,pronunciation_tips,last_practice_mode,last_practice_topic,last_summary,updated_at"
            )
            .eq("user_id", sessionUserId)
            .eq("locale", selectedConversationLocale)
            .maybeSingle(),
          supabase
            .from("ai_practice_session_history")
            .select(
              "id,locale,level_range,practice_mode,practice_topic,user_message,assistant_reply,quick_correction,better_version,next_question,pronunciation_tip,summary,created_at"
            )
            .eq("user_id", sessionUserId)
            .eq("locale", selectedConversationLocale)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (stateResult.error || sessionsResult.error) {
          throw stateResult.error ?? sessionsResult.error;
        }
        if (!active) {
          return;
        }

        const stateRow = stateResult.data as PracticeUserStateRow | null;
        setPracticeProgress(
          stateRow
            ? {
                turnsCompleted: stateRow.turns_completed ?? 0,
                focusAreas: normalizeUniqueItems(stateRow.focus_areas ?? []),
                savedPhrases: normalizeUniqueItems(stateRow.saved_phrases ?? [], 6),
                pronunciationTips: normalizeUniqueItems(stateRow.pronunciation_tips ?? []),
                updatedAt: stateRow.updated_at ?? null,
              }
            : createEmptyPracticeProgress()
        );
        setPracticeSummary((stateRow?.last_summary as CoachPracticeSummary | null) ?? null);
        setRecentSessions((sessionsResult.data ?? []) as PracticeSessionHistoryRow[]);
      } catch {
        if (!active) {
          return;
        }
        setPracticeProgress(createEmptyPracticeProgress());
        setRecentSessions([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedConversationLocale, sessionUserId]);

  const canUseNativeHelp = Boolean(
    nativeLocale && nativeLocale.trim() && nativeLocale !== selectedConversationLocale
  );

  const updateMessage = useCallback(
    (
      messageId: string,
      update: (message: VoiceAssistantMessage) => VoiceAssistantMessage | null
    ) => {
      setMessages((prev) =>
        prev.flatMap((message) => {
          if (message.id !== messageId) {
            return [message];
          }
          const nextMessage = update(message);
          return nextMessage ? [nextMessage] : [];
        })
      );
    },
    []
  );

  const clearAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const getOrCreateAudioElement = useCallback(() => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.preload = "auto";
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    return audio;
  }, []);

  const unlockAudioPlayback = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextCtor = getAudioContextConstructor();
    if (AudioContextCtor) {
      try {
        const existingContext = audioContextRef.current;
        const context =
          !existingContext || existingContext.state === "closed"
            ? new AudioContextCtor()
            : existingContext;
        audioContextRef.current = context;
        if (context.state === "suspended") {
          await context.resume();
        }
      } catch {
        // Ignore unlock failures and continue with media-element unlock attempt.
      }
    }

    if (audioUnlockAttemptedRef.current) {
      return;
    }
    audioUnlockAttemptedRef.current = true;

    try {
      const audio = getOrCreateAudioElement();
      const previousSrc = audio.src;
      const previousMuted = audio.muted;
      audio.muted = true;
      audio.src = SILENT_WAV_DATA_URI;
      audio.currentTime = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.src = previousSrc;
      audio.muted = previousMuted;
    } catch {
      // iOS may still refuse here; real playback will surface the final error if needed.
    }
  }, [getOrCreateAudioElement]);

  const stopAudioPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      const source = audioSourceRef.current;
      audioSourceRef.current = null;
      source.onended = null;
      try {
        source.stop(0);
      } catch {
        // Ignore if the source already ended.
      }
      source.disconnect();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    clearAudioUrl();
    setSpeaking(false);
  }, [clearAudioUrl]);

  const stopReplyStream = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setThinking(false);
    setStatusMessage(text.idle);
    setMessages((prev) =>
      prev.flatMap((message) => {
        if (!message.pending || message.role !== "assistant") {
          return [message];
        }
        if (!message.text.trim()) {
          return [];
        }
        return [{ ...message, pending: false }];
      })
    );
  }, [text.idle]);

  const speakReply = useCallback(
    async (value: string, languageCode: string) => {
      const textForSpeech = trimForSpeech(value);
      if (!textForSpeech) return;
      try {
        stopAudioPlayback();
        setStatusMessage(text.speaking);
        const audioBlob = await synthesizeElevenLabsSpeech({
          text: textForSpeech,
          languageCode,
        });
        const AudioContextCtor = getAudioContextConstructor();
        if (AudioContextCtor) {
          try {
            const existingContext = audioContextRef.current;
            const context =
              !existingContext || existingContext.state === "closed"
                ? new AudioContextCtor()
                : existingContext;
            audioContextRef.current = context;
            if (context.state === "suspended") {
              await context.resume();
            }

            const encodedAudio = await audioBlob.arrayBuffer();
            const decodedAudio = await context.decodeAudioData(encodedAudio.slice(0));
            const source = context.createBufferSource();
            source.buffer = decodedAudio;
            source.connect(context.destination);
            source.onended = () => {
              if (audioSourceRef.current === source) {
                audioSourceRef.current = null;
              }
              source.disconnect();
              setSpeaking(false);
              setStatusMessage(text.idle);
            };
            audioSourceRef.current = source;
            setSpeaking(true);
            source.start(0);
            return;
          } catch {
            // Fall back to HTMLAudioElement playback when AudioContext decoding fails.
          }
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = objectUrl;
        const audio = getOrCreateAudioElement();
        audio.onended = () => {
          clearAudioUrl();
          setSpeaking(false);
          setStatusMessage(text.idle);
        };
        audio.onerror = () => {
          clearAudioUrl();
          setSpeaking(false);
          setStatusMessage(text.idle);
          setErrorMessage("Voice playback failed.");
        };
        audio.src = objectUrl;
        audio.currentTime = 0;
        setSpeaking(true);
        await audio.play();
      } catch (error) {
        setSpeaking(false);
        setStatusMessage(text.idle);
        setErrorMessage(error instanceof Error ? error.message : "Voice playback failed.");
      }
    },
    [clearAudioUrl, getOrCreateAudioElement, stopAudioPlayback, text.idle, text.speaking]
  );

  const sendPrompt = useCallback(
    async (rawValue: string, inputSource: "text" | "speech" = "text") => {
      const trimmedValue = rawValue.trim();
      if (!trimmedValue) {
        setErrorMessage(text.emptyPrompt);
        return;
      }
      if (guestMode) {
        requireAuth();
        return;
      }

      await unlockAudioPlayback();
      stopAudioPlayback();
      stopReplyStream();
      setErrorMessage("");
      setThinking(true);
      setStatusMessage(text.thinking);
      setDraft("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      const selectedLocale =
        conversationLocaleRef.current ?? selectedConversationLocale ?? defaultConversationLocale;
      const replyLocale = selectedLocale;
      conversationLocaleRef.current = replyLocale;
      lastInputSourceRef.current = inputSource;
      const assistantInput = buildConversationInput(messages, trimmedValue);

      const assistantMessageId = buildId();
      setMessages((prev) => [
        ...prev,
        { id: buildId(), role: "user", text: trimmedValue },
        { id: assistantMessageId, role: "assistant", text: "", pending: true },
      ]);

      const assistantRequest = {
        text: assistantInput,
        conversationId: conversationIdRef.current,
        locale: replyLocale,
        levelRange: selectedConversationLevel,
        practiceMode: selectedPracticeMode,
        practiceTopic: practiceTopic.trim() || undefined,
        nativeHelp:
          canUseNativeHelp && nativeHelpEnabled && Boolean(nativeLocale?.trim()),
        nativeLocale: nativeLocale?.trim() || undefined,
      };

      const abortController = new AbortController();
      streamAbortRef.current = abortController;
      const finalizeReply = (reply: Awaited<ReturnType<typeof createOpenAiAssistantReply>>) => {
        const spokenText = reply.text.trim();
        const displayText = reply.coach?.assistantReply?.trim() || spokenText;
        conversationIdRef.current = reply.conversationId;
        let nextProgressSnapshot = createEmptyPracticeProgress();
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          text: displayText,
          spokenText,
          coach: reply.coach,
          pending: false,
        }));
        setThinking(false);
        setStatusMessage(text.idle);
        setPracticeSummary(reply.coach?.summary ?? null);
        setPracticeProgress((prev) => {
          nextProgressSnapshot = mergePracticeProgress(prev, reply.coach);
          return nextProgressSnapshot;
        });
        if (sessionUserId) {
          const supabase = getSupabaseClient();
          if (supabase) {
            const nowIso = new Date().toISOString();
            const practiceTopicValue = practiceTopic.trim() || null;
            const historyRow: Omit<PracticeSessionHistoryRow, "id"> & { user_id: string } = {
              user_id: sessionUserId,
              locale: replyLocale,
              level_range: selectedConversationLevel,
              practice_mode: selectedPracticeMode,
              practice_topic: practiceTopicValue,
              user_message: trimmedValue,
              assistant_reply: displayText,
              quick_correction: reply.coach?.quickCorrection || null,
              better_version: reply.coach?.betterVersion || null,
              next_question: reply.coach?.nextQuestion || null,
              pronunciation_tip: reply.coach?.pronunciationTip || null,
              summary: reply.coach?.summary ?? null,
              created_at: nowIso,
            };
            const recentHistoryRow: PracticeSessionHistoryRow = {
              id: buildId(),
              ...historyRow,
            };
            setRecentSessions((prev) => [recentHistoryRow, ...prev].slice(0, 5));
            void (async () => {
              const stateResult = await supabase.from("ai_practice_user_state").upsert(
                {
                  user_id: sessionUserId,
                  locale: replyLocale,
                  turns_completed: nextProgressSnapshot.turnsCompleted,
                  focus_areas: nextProgressSnapshot.focusAreas,
                  saved_phrases: nextProgressSnapshot.savedPhrases,
                  pronunciation_tips: nextProgressSnapshot.pronunciationTips,
                  last_practice_mode: selectedPracticeMode,
                  last_practice_topic: practiceTopicValue,
                  last_summary: reply.coach?.summary ?? null,
                  updated_at: nowIso,
                },
                { onConflict: "user_id,locale" }
              );
              if (stateResult.error) {
                throw stateResult.error;
              }
              const historyResult = await supabase
                .from("ai_practice_session_history")
                .insert(historyRow);
              if (historyResult.error) {
                throw historyResult.error;
              }
            })().catch(() => {
              setErrorMessage("Practice progress sync is temporarily unavailable.");
            });
          }
        }
        if (spokenText) {
          void speakReply(spokenText, replyLocale);
        } else {
          setErrorMessage("AI returned an empty response.");
        }
      };

      try {
        const reply = await createOpenAiAssistantReply({
          ...assistantRequest,
          signal: abortController.signal,
        });
        streamAbortRef.current = null;
        finalizeReply(reply);
        return;
      } catch (error) {
        if (isAbortError(error)) {
          streamAbortRef.current = null;
          updateMessage(assistantMessageId, (message) =>
            message.text.trim() ? { ...message, pending: false } : null
          );
          setThinking(false);
          setStatusMessage(text.idle);
          return;
        }

        streamAbortRef.current = null;
        updateMessage(assistantMessageId, (message) =>
          message.text.trim() ? { ...message, pending: false } : null
        );
        setThinking(false);
        setStatusMessage(text.idle);
        setErrorMessage(error instanceof Error ? error.message : "AI request failed.");
      }
    },
    [
      guestMode,
      unlockAudioPlayback,
      requireAuth,
      speakReply,
      stopAudioPlayback,
      stopReplyStream,
      defaultConversationLocale,
      selectedConversationLocale,
      selectedConversationLevel,
      selectedPracticeMode,
      practiceTopic,
      canUseNativeHelp,
      nativeHelpEnabled,
      nativeLocale,
      sessionUserId,
      text.emptyPrompt,
      text.idle,
      text.thinking,
      updateMessage,
      messages,
    ]
  );

  const stopListening = useCallback(
    (shouldSubmit: boolean) => {
      shouldSubmitSpeechRef.current = shouldSubmit;
      recognitionRef.current?.stop();
      setListening(false);
      setStatusMessage(text.idle);
    },
    [text.idle]
  );

  const startListening = useCallback(() => {
    if (guestMode) {
      requireAuth();
      return;
    }
    const RecognitionCtor = getRecognitionConstructor();
    if (!RecognitionCtor) {
      setErrorMessage(text.unsupportedBrowser);
      return;
    }
    if (thinking || listening) return;

    setErrorMessage("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    shouldSubmitSpeechRef.current = false;
    recognitionRef.current?.abort();

    const recognition = new RecognitionCtor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getSpeechLocale(selectedConversationLocale);
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setStatusMessage(text.releaseToSend);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatusMessage(text.idle);
      if (event.error === "aborted") {
        return;
      }
      const speechError = event.error?.trim() ?? event.message?.trim() ?? "Speech recognition failed.";
      setErrorMessage(speechError);
    };
    recognition.onresult = (event) => {
      const interimParts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;
        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
        } else {
          interimParts.push(transcript);
        }
      }
      interimTranscriptRef.current = interimParts.join(" ").trim();
      const combinedTranscript = [
        finalTranscriptRef.current,
        interimTranscriptRef.current,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      setInterimTranscript(combinedTranscript);
    };
    recognition.onend = () => {
      setListening(false);
      const shouldSubmit = shouldSubmitSpeechRef.current;
      shouldSubmitSpeechRef.current = false;
      const transcript = [finalTranscriptRef.current, interimTranscriptRef.current]
        .filter(Boolean)
        .join(" ")
        .trim();
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";

      if (shouldSubmit && transcript) {
        setDraft(transcript);
        void sendPrompt(transcript, "speech");
        return;
      }

      setStatusMessage(text.idle);
    };
    recognition.start();
  }, [
    guestMode,
    listening,
    requireAuth,
    sendPrompt,
    selectedConversationLocale,
    text.idle,
    text.releaseToSend,
    text.unsupportedBrowser,
    thinking,
  ]);

  useEffect(() => {
    setStatusMessage(text.idle);
  }, [text.idle]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      streamAbortRef.current?.abort();
      if (audioSourceRef.current) {
        const source = audioSourceRef.current;
        audioSourceRef.current = null;
        source.onended = null;
        try {
          source.stop(0);
        } catch {
          // Ignore if the source already ended.
        }
        source.disconnect();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      if (audioContextRef.current) {
        const context = audioContextRef.current;
        audioContextRef.current = null;
        void context.close().catch(() => {
          // Ignore close failures during unmount.
        });
      }
      clearAudioUrl();
    };
  }, [clearAudioUrl]);

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  }, []);

  const handleConversationLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextLocale = event.target.value.trim() || defaultConversationLocale;
      setSelectedConversationLocale(nextLocale);
      conversationLocaleRef.current = nextLocale;
      if (nativeLocale && nextLocale === nativeLocale) {
        setNativeHelpEnabled(false);
      }
    },
    [defaultConversationLocale, nativeLocale]
  );

  const handleConversationLevelChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextLevel = event.target.value.trim().toUpperCase();
      setSelectedConversationLevel(
        isConversationLevelOption(nextLevel) ? nextLevel : defaultConversationLevel
      );
    },
    [defaultConversationLevel]
  );

  const handlePracticeModeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value.trim().toLowerCase();
    setSelectedPracticeMode(isPracticeModeOption(nextMode) ? nextMode : "daily");
  }, []);

  const handlePracticeTopicChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPracticeTopic(event.target.value);
  }, []);

  const handleNativeHelpChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNativeHelpEnabled(event.target.checked);
  }, []);

  const handleClearConversation = useCallback(() => {
    stopReplyStream();
    setMessages([]);
    setDraft("");
    setInterimTranscript("");
    setErrorMessage("");
    setPracticeSummary(null);
    conversationIdRef.current = null;
    conversationLocaleRef.current = selectedConversationLocale;
    lastInputSourceRef.current = "text";
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    shouldSubmitSpeechRef.current = false;
    stopAudioPlayback();
    stopListening(false);
    setStatusMessage(text.idle);
  }, [stopAudioPlayback, stopListening, stopReplyStream, text.idle]);

  const handlePushToTalkStart = useCallback(
    async (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch" && event.button !== 0) return;
      event.preventDefault();
      activePointerIdRef.current = event.pointerId;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore browsers that do not support pointer capture on buttons.
      }
      await unlockAudioPlayback();
      startListening();
    },
    [startListening, unlockAudioPlayback]
  );

  const handlePushToTalkEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (
        activePointerIdRef.current !== null &&
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      event.preventDefault();
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore browsers that already released pointer capture.
      }
      activePointerIdRef.current = null;
      if (listening) {
        stopListening(true);
      }
    },
    [listening, stopListening]
  );

  return (
    <div className="voiceAssistantPage">
      <div className="voiceAssistantHeader">
        <div className="voiceAssistantTitle">{text.title}</div>
        <div className="voiceAssistantSubtitle">{text.subtitle}</div>
      </div>

      {guestMode ? (
        <div className="voiceAssistantNotice voiceAssistantNotice--warning">
          {text.signInHint}
        </div>
      ) : null}
      {!recognitionSupported ? (
        <div className="voiceAssistantNotice voiceAssistantNotice--ghost">
          {text.unsupportedBrowser}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="voiceAssistantNotice voiceAssistantNotice--warning">
          {errorMessage}
        </div>
      ) : null}

      <div className="voiceAssistantCard">
        <div className="voiceAssistantStatus">
          <span className="voiceAssistantStatusDot" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>

        {(practiceProgress.focusAreas.length ||
          practiceProgress.savedPhrases.length ||
          practiceProgress.pronunciationTips.length) ? (
          <div className="voiceAssistantCoachPanel">
            <div className="voiceAssistantCoachTitle">{text.progressTitle}</div>
            {practiceProgress.focusAreas.length ? (
              <div className="voiceAssistantCoachSection">
                <div className="voiceAssistantCoachLabel">{text.progressFocus}</div>
                <div className="voiceAssistantCoachChips">
                  {practiceProgress.focusAreas.map((item) => (
                    <span key={`focus-${item}`} className="voiceAssistantCoachChip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {practiceProgress.savedPhrases.length ? (
              <div className="voiceAssistantCoachSection">
                <div className="voiceAssistantCoachLabel">{text.progressPhrases}</div>
                <div className="voiceAssistantCoachChips">
                  {practiceProgress.savedPhrases.map((item) => (
                    <span key={`phrase-${item}`} className="voiceAssistantCoachChip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {practiceProgress.pronunciationTips.length ? (
              <div className="voiceAssistantCoachSection">
                <div className="voiceAssistantCoachLabel">{text.progressPronunciation}</div>
                <div className="voiceAssistantCoachChips">
                  {practiceProgress.pronunciationTips.map((item) => (
                    <span key={`pron-${item}`} className="voiceAssistantCoachChip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="voiceAssistantControls">
          <button
            className={`btn voiceAssistantHoldButton${listening ? " btnActive" : ""}`}
            type="button"
            onPointerDown={handlePushToTalkStart}
            onPointerUp={handlePushToTalkEnd}
            onPointerCancel={handlePushToTalkEnd}
            onContextMenu={(event) => event.preventDefault()}
            disabled={!recognitionSupported || thinking}
          >
            {listening ? text.releaseToSend : text.holdToTalk}
          </button>
          <button
            className="btn btnGhost"
            type="button"
            onClick={stopAudioPlayback}
            disabled={!speaking}
          >
            {text.stopAudio}
          </button>
          <button
            className="btn btnGhost"
            type="button"
            onClick={handleClearConversation}
            disabled={thinking && messages.length === 0}
          >
            {text.clear}
          </button>
        </div>

        {interimTranscript ? (
          <div className="voiceAssistantInterim">{interimTranscript}</div>
        ) : null}

        <label className="label" htmlFor="voiceAssistantLocale">
          {text.languageLabel}
        </label>
        <select
          className="input"
          id="voiceAssistantLocale"
          value={selectedConversationLocale}
          onChange={handleConversationLocaleChange}
          disabled={thinking || listening}
        >
          {languageOptions.map((option) => (
            <option key={option.locale} value={option.locale}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="muted">{text.languageHint}</div>

        <label className="label" htmlFor="voiceAssistantLevel">
          {text.levelLabel}
        </label>
        <select
          className="input"
          id="voiceAssistantLevel"
          value={selectedConversationLevel}
          onChange={handleConversationLevelChange}
          disabled={thinking || listening}
        >
          {CONVERSATION_LEVEL_OPTIONS.map((levelOption) => (
            <option key={levelOption} value={levelOption}>
              {levelOption}
            </option>
          ))}
        </select>
        <div className="muted">{text.levelHint}</div>

        <label className="label" htmlFor="voiceAssistantPracticeMode">
          {text.practiceModeLabel}
        </label>
        <select
          className="input"
          id="voiceAssistantPracticeMode"
          value={selectedPracticeMode}
          onChange={handlePracticeModeChange}
          disabled={thinking || listening}
        >
          <option value="daily">{text.practiceModeDaily}</option>
          <option value="roleplay">{text.practiceModeRoleplay}</option>
          <option value="topic">{text.practiceModeTopic}</option>
        </select>
        <div className="muted">{text.practiceModeHint}</div>

        <label className="label" htmlFor="voiceAssistantPracticeTopic">
          {text.practiceTopicLabel}
        </label>
        <input
          className="input"
          id="voiceAssistantPracticeTopic"
          type="text"
          value={practiceTopic}
          onChange={handlePracticeTopicChange}
          placeholder={text.practiceTopicPlaceholder}
          disabled={thinking || listening}
        />
        <div className="muted">{text.practiceTopicHint}</div>
        <div className="voiceAssistantSuggestionRow">
          {PRACTICE_TOPIC_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              className="btn btnGhost voiceAssistantSuggestion"
              type="button"
              onClick={() => setPracticeTopic(suggestion)}
              disabled={thinking || listening}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {nativeLocale?.trim() ? (
          <label className="voiceAssistantToggle">
            <input
              type="checkbox"
              checked={canUseNativeHelp && nativeHelpEnabled}
              onChange={handleNativeHelpChange}
              disabled={!canUseNativeHelp || thinking || listening}
            />
            <span>
              {text.nativeHelpLabel.replace(
                "{language}",
                nativeLanguageLabel?.trim() || nativeLocale
              )}
            </span>
          </label>
        ) : null}
        {nativeLocale?.trim() ? (
          <div className="muted">
            {canUseNativeHelp
              ? text.nativeHelpHint
              : text.nativeHelpUnavailable}
          </div>
        ) : null}

        <label className="label" htmlFor="voiceAssistantDraft">
          {text.inputLabel}
        </label>
        <textarea
          className="input input--textarea"
          id="voiceAssistantDraft"
          rows={3}
          placeholder={text.inputPlaceholder}
          value={draft}
          onChange={handleDraftChange}
          disabled={thinking}
        />
        <div className="voiceAssistantSendRow">
          <button
            className="btn"
            type="button"
            onClick={() => void sendPrompt(draft, "text")}
            disabled={thinking || listening}
          >
            {text.send}
          </button>
        </div>
      </div>

      {practiceSummary ? (
        <div className="voiceAssistantCoachPanel">
          <div className="voiceAssistantCoachTitle">{text.summaryTitle}</div>
          {practiceSummary.strengths.length ? (
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.summaryStrengths}</div>
              <ul className="voiceAssistantCoachList">
                {practiceSummary.strengths.map((item) => (
                  <li key={`strength-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {practiceSummary.focusNext.length ? (
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.summaryFocus}</div>
              <ul className="voiceAssistantCoachList">
                {practiceSummary.focusNext.map((item) => (
                  <li key={`focus-next-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {practiceSummary.newPhrases.length ? (
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.summaryPhrases}</div>
              <ul className="voiceAssistantCoachList">
                {practiceSummary.newPhrases.map((item) => (
                  <li key={`new-phrase-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {practiceSummary.homework.length ? (
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.summaryHomework}</div>
              <ul className="voiceAssistantCoachList">
                {practiceSummary.homework.map((item) => (
                  <li key={`homework-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="voiceAssistantCoachPanel">
        <div className="voiceAssistantCoachTitle">{text.recentSessionsTitle}</div>
        {recentSessions.length ? (
          <div className="voiceAssistantRecentSessions">
            {recentSessions.map((session) => (
              <div key={session.id} className="voiceAssistantRecentSession">
                <div className="voiceAssistantRecentSessionMeta">
                  <span>{session.practice_mode}</span>
                  <span>{session.level_range}</span>
                  {session.practice_topic ? <span>{session.practice_topic}</span> : null}
                </div>
                <div className="voiceAssistantRecentSessionReply">{session.assistant_reply}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="voiceAssistantEmpty">{text.recentSessionsEmpty}</div>
        )}
      </div>

      <div className="voiceAssistantMessages">
        {messages.length === 0 ? (
          <div className="voiceAssistantEmpty">{text.empty}</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`voiceAssistantBubble voiceAssistantBubble--${message.role}${
                message.pending ? " voiceAssistantBubble--pending" : ""
              }`}
            >
              <div className="voiceAssistantBubbleRole">
                {message.role === "user" ? "You" : "AI"}
              </div>
              <div>{message.text || (message.pending ? text.thinking : "")}</div>
              {message.role === "assistant" && message.coach ? (
                <div className="voiceAssistantCoachGrid">
                  {message.coach.quickCorrection ? (
                    <div className="voiceAssistantCoachCard">
                      <div className="voiceAssistantCoachLabel">{text.coachCorrection}</div>
                      <div>{message.coach.quickCorrection}</div>
                    </div>
                  ) : null}
                  {message.coach.betterVersion ? (
                    <div className="voiceAssistantCoachCard">
                      <div className="voiceAssistantCoachLabel">{text.coachBetterVersion}</div>
                      <div>{message.coach.betterVersion}</div>
                    </div>
                  ) : null}
                  {message.coach.nextQuestion ? (
                    <div className="voiceAssistantCoachCard">
                      <div className="voiceAssistantCoachLabel">{text.coachNextQuestion}</div>
                      <div>{message.coach.nextQuestion}</div>
                    </div>
                  ) : null}
                  {message.coach.pronunciationTip ? (
                    <div className="voiceAssistantCoachCard">
                      <div className="voiceAssistantCoachLabel">{text.coachPronunciation}</div>
                      <div>{message.coach.pronunciationTip}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
