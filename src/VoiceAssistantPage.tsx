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
import { streamOpenAiAssistantReply } from "./openAiAssistant";
import { getVoiceAssistantText } from "./voiceAssistantText";

type VoiceAssistantPageProps = {
  locale: string;
  languageOptions: Array<{ locale: string; label: string }>;
  preferredInputLocales: string[];
  guestMode: boolean;
  requireAuth: () => void;
};

type VoiceAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  pending?: boolean;
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
};

function buildId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
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
    guestMode,
    requireAuth,
  } = props;
  const text = useMemo(() => getVoiceAssistantText(locale), [locale]);
  const defaultConversationLocale = useMemo(
    () => getPreferredConversationLocale(preferredInputLocales, locale),
    [locale, preferredInputLocales]
  );
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const previousResponseIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
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

  const stopAudioPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
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
        const objectUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = objectUrl;
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
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
    [clearAudioUrl, stopAudioPlayback, text.idle, text.speaking]
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
      const replyLocale =
        inputSource === "speech"
          ? selectedLocale
          : detectConversationLocale(trimmedValue, selectedLocale);
      conversationLocaleRef.current = replyLocale;
      lastInputSourceRef.current = inputSource;

      const assistantMessageId = buildId();
      setMessages((prev) => [
        ...prev,
        { id: buildId(), role: "user", text: trimmedValue },
        { id: assistantMessageId, role: "assistant", text: "", pending: true },
      ]);

      const abortController = new AbortController();
      streamAbortRef.current = abortController;
      let streamedText = "";
      let completed = false;

      try {
        await streamOpenAiAssistantReply(
          {
            text: trimmedValue,
            previousResponseId: previousResponseIdRef.current,
            locale: replyLocale,
          },
          {
            signal: abortController.signal,
            onDelta: (delta) => {
              streamedText += delta;
              updateMessage(assistantMessageId, (message) => ({
                ...message,
                text: `${message.text}${delta}`,
                pending: true,
              }));
            },
            onCompleted: (reply) => {
              completed = true;
              streamAbortRef.current = null;
              previousResponseIdRef.current = reply.responseId;
              const finalText = reply.text.trim() || streamedText.trim();
              updateMessage(assistantMessageId, (message) => ({
                ...message,
                text: finalText,
                pending: false,
              }));
              setThinking(false);
              setStatusMessage(text.idle);
              if (finalText) {
                void speakReply(finalText, replyLocale);
              } else {
                setErrorMessage("AI returned an empty response.");
              }
            },
          }
        );

        if (!completed && !abortController.signal.aborted) {
          streamAbortRef.current = null;
          updateMessage(assistantMessageId, (message) =>
            message.text.trim() ? { ...message, pending: false } : null
          );
          setThinking(false);
          setStatusMessage(text.idle);
        }
      } catch (error) {
        streamAbortRef.current = null;
        updateMessage(assistantMessageId, (message) =>
          message.text.trim() ? { ...message, pending: false } : null
        );
        if (isAbortError(error)) {
          setThinking(false);
          setStatusMessage(text.idle);
          return;
        }
        setThinking(false);
        setStatusMessage(text.idle);
        setErrorMessage(error instanceof Error ? error.message : "AI request failed.");
      }
    },
    [
      guestMode,
      requireAuth,
      speakReply,
      stopAudioPlayback,
      stopReplyStream,
      defaultConversationLocale,
      selectedConversationLocale,
      text.emptyPrompt,
      text.idle,
      text.thinking,
      updateMessage,
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
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
    },
    [defaultConversationLocale]
  );

  const handleClearConversation = useCallback(() => {
    stopReplyStream();
    setMessages([]);
    setDraft("");
    setInterimTranscript("");
    setErrorMessage("");
    previousResponseIdRef.current = null;
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
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch" && event.button !== 0) return;
      event.preventDefault();
      activePointerIdRef.current = event.pointerId;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore browsers that do not support pointer capture on buttons.
      }
      startListening();
    },
    [startListening]
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
        <div className="voiceAssistantControls">
          <button
            className={`btn voiceAssistantHoldButton${listening ? " btnActive" : ""}`}
            type="button"
            onPointerDown={handlePushToTalkStart}
            onPointerUp={handlePushToTalkEnd}
            onPointerCancel={handlePushToTalkEnd}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
