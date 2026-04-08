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
  type CoachDifficultyMode,
  type CoachLessonScore,
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

type PracticeHabitStats = {
  currentStreak: number;
  longestStreak: number;
  weeklyGoalTarget: number;
  weeklyGoalCompleted: number;
  weeklyGoalWeekStart: string;
  lastLessonDay: string | null;
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
  last_lesson_result: LessonResult | null;
  last_lesson_template: string | null;
  last_lesson_completed_at: string | null;
  current_streak: number | null;
  longest_streak: number | null;
  weekly_goal_target: number | null;
  weekly_goal_completed: number | null;
  weekly_goal_week_start: string | null;
  last_lesson_day: string | null;
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
  lesson_template: string | null;
  lesson_turn_index: number | null;
  lesson_turn_target: number | null;
  lesson_score: LessonResult | null;
  created_at: string;
};

type LessonTemplate = {
  id: string;
  title: string;
  description: string;
  mode: PracticeModeOption;
  topic: string;
  goal: string;
  turnTarget: number;
  starterPrompt: string;
};

type ActiveLessonState = {
  templateId: string;
  title: string;
  description: string;
  mode: PracticeModeOption;
  topic: string;
  goal: string;
  difficultyMode: CoachDifficultyMode;
  difficultyNote: string;
  turnTarget: number;
  userTurnsCompleted: number;
  startedAt: string;
};

type LessonResult = CoachLessonScore & {
  templateId: string;
  title: string;
  turnTarget: number;
  completedAt: string;
};

type LessonReview = {
  templateId: string;
  title: string;
  sourceMode: PracticeModeOption;
  sourceTopic: string;
  turnTarget: number;
  grammar: string[];
  vocabulary: string[];
  pronunciation: string[];
  weakPoints: string[];
};

type AdaptiveLessonPlan = {
  template: LessonTemplate;
  goal: string;
  reason: string;
  focus: string[];
  starterPrompt: string;
  difficultyMode: CoachDifficultyMode;
  difficultyLabel: string;
  difficultyNote: string;
};

const WEEKLY_GOAL_OPTIONS = [3, 4, 5, 7] as const;

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
const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: "small-talk-loop",
    title: "Small talk loop",
    description: "Practice friendly small talk, react naturally, and keep the exchange moving.",
    mode: "daily",
    topic: "Small talk",
    goal: "Keep a casual conversation going for several short turns.",
    turnTarget: 4,
    starterPrompt:
      "Start a short small-talk lesson. Set a casual scene and ask the learner an easy everyday question.",
  },
  {
    id: "cafe-order",
    title: "Cafe order",
    description: "Order a drink, answer one follow-up question, and pay politely.",
    mode: "roleplay",
    topic: "At the cafe",
    goal: "Order confidently and handle one simple follow-up question.",
    turnTarget: 4,
    starterPrompt:
      "Start a short cafe role-play lesson. You are the barista. Set the scene briefly and ask for the learner's order.",
  },
  {
    id: "job-intro",
    title: "Job interview intro",
    description: "Introduce yourself, explain your background, and answer why you want the role.",
    mode: "roleplay",
    topic: "Job interview",
    goal: "Introduce yourself clearly and answer one motivation question.",
    turnTarget: 5,
    starterPrompt:
      "Start a short job interview lesson. You are the interviewer. Set the scene and ask the learner to introduce themselves.",
  },
  {
    id: "travel-checkin",
    title: "Travel check-in",
    description: "Check into a hotel and answer a practical travel question.",
    mode: "roleplay",
    topic: "Travel",
    goal: "Handle a hotel check-in with clear, practical language.",
    turnTarget: 4,
    starterPrompt:
      "Start a short hotel check-in lesson. You are the receptionist. Set the scene and ask for the learner's reservation details.",
  },
  {
    id: "doctor-visit",
    title: "Doctor visit",
    description: "Describe symptoms and answer basic follow-up questions.",
    mode: "roleplay",
    topic: "Doctor visit",
    goal: "Explain symptoms simply and answer one or two health questions.",
    turnTarget: 4,
    starterPrompt:
      "Start a short doctor visit lesson. You are the doctor. Set the scene and ask what problem the learner has today.",
  },
  {
    id: "presentation-opening",
    title: "Presentation opening",
    description: "Open a presentation, explain the topic, and guide the listener into the talk.",
    mode: "topic",
    topic: "Presentation",
    goal: "Open a short presentation with structure and confidence.",
    turnTarget: 5,
    starterPrompt:
      "Start a short presentation practice lesson. Set the context and ask the learner to open a presentation on their topic.",
  },
];

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

function getPracticeHabitsStorageKey(userId: string | null | undefined, locale: string) {
  return `vela-ai-practice-habits:${userId?.trim() || "guest"}:${locale}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getWeekStartKey(date: Date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return formatDateKey(normalized);
}

function createEmptyPracticeHabits(now = new Date()): PracticeHabitStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    weeklyGoalTarget: 4,
    weeklyGoalCompleted: 0,
    weeklyGoalWeekStart: getWeekStartKey(now),
    lastLessonDay: null,
    updatedAt: null,
  };
}

function normalizePracticeHabits(
  habits: Partial<PracticeHabitStats> | null | undefined,
  now = new Date()
): PracticeHabitStats {
  const defaults = createEmptyPracticeHabits(now);
  const weeklyGoalWeekStart =
    typeof habits?.weeklyGoalWeekStart === "string" && habits.weeklyGoalWeekStart.trim()
      ? habits.weeklyGoalWeekStart.trim()
      : defaults.weeklyGoalWeekStart;
  const currentWeekStart = getWeekStartKey(now);
  const target =
    typeof habits?.weeklyGoalTarget === "number" && habits.weeklyGoalTarget > 0
      ? habits.weeklyGoalTarget
      : defaults.weeklyGoalTarget;

  return {
    currentStreak:
      typeof habits?.currentStreak === "number" && habits.currentStreak >= 0
        ? habits.currentStreak
        : defaults.currentStreak,
    longestStreak:
      typeof habits?.longestStreak === "number" && habits.longestStreak >= 0
        ? habits.longestStreak
        : defaults.longestStreak,
    weeklyGoalTarget: target,
    weeklyGoalCompleted:
      weeklyGoalWeekStart === currentWeekStart &&
      typeof habits?.weeklyGoalCompleted === "number" &&
      habits.weeklyGoalCompleted >= 0
        ? habits.weeklyGoalCompleted
        : 0,
    weeklyGoalWeekStart: currentWeekStart,
    lastLessonDay:
      typeof habits?.lastLessonDay === "string" && habits.lastLessonDay.trim()
        ? habits.lastLessonDay.trim()
        : null,
    updatedAt:
      typeof habits?.updatedAt === "string" && habits.updatedAt.trim()
        ? habits.updatedAt
        : defaults.updatedAt,
  };
}

function advancePracticeHabits(previous: PracticeHabitStats, completedAt: Date) {
  const normalized = normalizePracticeHabits(previous, completedAt);
  const todayKey = formatDateKey(completedAt);
  let nextCurrentStreak = normalized.currentStreak;
  let nextLongestStreak = normalized.longestStreak;

  if (normalized.lastLessonDay !== todayKey) {
    const previousLessonDate = normalized.lastLessonDay
      ? parseDateKey(normalized.lastLessonDay)
      : null;
    if (previousLessonDate) {
      const daysBetween = Math.round(
        (parseDateKey(todayKey)!.getTime() - previousLessonDate.getTime()) / 86400000
      );
      nextCurrentStreak = daysBetween === 1 ? normalized.currentStreak + 1 : 1;
    } else {
      nextCurrentStreak = 1;
    }
    nextLongestStreak = Math.max(normalized.longestStreak, nextCurrentStreak);
  }

  return {
    ...normalized,
    currentStreak: nextCurrentStreak,
    longestStreak: nextLongestStreak,
    weeklyGoalCompleted: normalized.weeklyGoalCompleted + 1,
    weeklyGoalWeekStart: getWeekStartKey(completedAt),
    lastLessonDay: todayKey,
    updatedAt: completedAt.toISOString(),
  };
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

function clampLessonScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildFallbackLessonScore(
  coach: CoachFeedback | null,
  lesson: ActiveLessonState
): LessonResult {
  const accuracy = clampLessonScore(coach?.quickCorrection ? 76 : 88);
  const vocabulary = clampLessonScore(coach?.betterVersion ? 82 : 90);
  const pronunciation = clampLessonScore(coach?.pronunciationTip ? 78 : 87);
  const fluency = clampLessonScore(84);
  const goalCompletion = clampLessonScore(86);
  const overall = clampLessonScore(
    (accuracy + vocabulary + pronunciation + fluency + goalCompletion) / 5
  );

  return {
    overall,
    fluency,
    accuracy,
    vocabulary,
    pronunciation,
    goalCompletion,
    finalFeedback:
      coach?.summary?.homework[0] ||
      coach?.summary?.focusNext[0] ||
      `Good work in "${lesson.title}". Repeat the lesson once more and try to sound more natural on the key phrases.`,
    templateId: lesson.templateId,
    title: lesson.title,
    turnTarget: lesson.turnTarget,
    completedAt: new Date().toISOString(),
  };
}

function createLessonResult(score: CoachLessonScore, lesson: ActiveLessonState): LessonResult {
  return {
    ...score,
    templateId: lesson.templateId,
    title: lesson.title,
    turnTarget: lesson.turnTarget,
    completedAt: new Date().toISOString(),
  };
}

function buildLessonReviewFromCoach(
  coach: CoachFeedback | null,
  lesson: ActiveLessonState
): LessonReview {
  const grammar = normalizeUniqueItems(
    [coach?.quickCorrection ?? "", ...(coach?.summary?.focusNext ?? [])],
    3
  );
  const vocabulary = normalizeUniqueItems(
    [coach?.betterVersion ?? "", ...(coach?.summary?.newPhrases ?? [])],
    4
  );
  const pronunciation = normalizeUniqueItems([coach?.pronunciationTip ?? ""], 2);

  return {
    templateId: lesson.templateId,
    title: lesson.title,
    sourceMode: lesson.mode,
    sourceTopic: lesson.topic,
    turnTarget: lesson.turnTarget,
    grammar,
    vocabulary,
    pronunciation,
    weakPoints: normalizeUniqueItems([...grammar, ...vocabulary, ...pronunciation], 6),
  };
}

function buildLessonReviewFromSession(session: PracticeSessionHistoryRow): LessonReview | null {
  if (!session.lesson_score || !session.lesson_template) {
    return null;
  }

  const grammar = normalizeUniqueItems(
    [session.quick_correction ?? "", ...(session.summary?.focusNext ?? [])],
    3
  );
  const vocabulary = normalizeUniqueItems(
    [session.better_version ?? "", ...(session.summary?.newPhrases ?? [])],
    4
  );
  const pronunciation = normalizeUniqueItems([session.pronunciation_tip ?? ""], 2);

  return {
    templateId: session.lesson_template,
    title: session.lesson_template,
    sourceMode: isPracticeModeOption(session.practice_mode) ? session.practice_mode : "daily",
    sourceTopic: session.practice_topic ?? "",
    turnTarget: session.lesson_turn_target ?? 3,
    grammar,
    vocabulary,
    pronunciation,
    weakPoints: normalizeUniqueItems([...grammar, ...vocabulary, ...pronunciation], 6),
  };
}

function findLessonTemplateById(templateId: string) {
  return LESSON_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

function getDifficultyLabel(mode: CoachDifficultyMode) {
  switch (mode) {
    case "supportive":
      return "Supportive";
    case "stretch":
      return "Stretch";
    case "balanced":
    default:
      return "Balanced";
  }
}

function selectTemplateForAdaptivePlan(input: {
  dominantArea: "grammar" | "vocabulary" | "pronunciation" | "fluency";
  recentTemplateIds: string[];
  previousTemplateId?: string;
}) {
  const candidateIds =
    input.dominantArea === "grammar"
      ? ["doctor-visit", "cafe-order", "job-intro", "small-talk-loop"]
      : input.dominantArea === "vocabulary"
        ? ["presentation-opening", "job-intro", "travel-checkin", "small-talk-loop"]
        : input.dominantArea === "pronunciation"
          ? ["small-talk-loop", "travel-checkin", "cafe-order", "doctor-visit"]
          : ["small-talk-loop", "travel-checkin", "cafe-order", "job-intro"];

  const preferredTemplate = candidateIds
    .map((templateId) => findLessonTemplateById(templateId))
    .find(
      (template) =>
        template &&
        template.id !== input.previousTemplateId &&
        !input.recentTemplateIds.includes(template.id)
    );

  return (
    preferredTemplate ??
    candidateIds
      .map((templateId) => findLessonTemplateById(templateId))
      .find((template) => template && template.id !== input.previousTemplateId) ??
    LESSON_TEMPLATES[0]
  );
}

function buildAdaptiveLessonPlan(input: {
  lessonResult: LessonResult | null;
  lessonReview: LessonReview | null;
  practiceProgress: PracticeProgress;
  practiceHabits: PracticeHabitStats;
  recentSessions: PracticeSessionHistoryRow[];
}): AdaptiveLessonPlan | null {
  const recentTemplateIds = input.recentSessions
    .map((session) => session.lesson_template ?? "")
    .filter(Boolean)
    .slice(0, 3);

  const review = input.lessonReview;
  const result = input.lessonResult;
  const isBehindWeeklyGoal =
    input.practiceHabits.weeklyGoalCompleted < input.practiceHabits.weeklyGoalTarget;
  const needsConsistencyPush =
    input.practiceHabits.currentStreak <= 1 && isBehindWeeklyGoal;

  let dominantArea: "grammar" | "vocabulary" | "pronunciation" | "fluency" = "fluency";
  let difficultyMode: CoachDifficultyMode = "balanced";
  let focus: string[] = [];
  let reason = "";

  if (review?.pronunciation.length || (result && result.pronunciation < 80)) {
    dominantArea = "pronunciation";
    difficultyMode = result && result.pronunciation < 72 ? "supportive" : "balanced";
    focus = review?.pronunciation.length
      ? review.pronunciation
      : input.practiceProgress.pronunciationTips.slice(0, 2);
    reason = "Your last lesson shows pronunciation still needs repetition under speaking pressure.";
  } else if (review?.grammar.length || (result && result.accuracy < 80)) {
    dominantArea = "grammar";
    difficultyMode = result && result.accuracy < 72 ? "supportive" : "balanced";
    focus = review?.grammar.length
      ? review.grammar
      : input.practiceProgress.focusAreas.slice(0, 3);
    reason = "Your next best lesson should tighten grammar accuracy in short real-life replies.";
  } else if (review?.vocabulary.length || (result && result.vocabulary < 82)) {
    dominantArea = "vocabulary";
    difficultyMode = result && result.vocabulary >= 78 ? "balanced" : "supportive";
    focus = review?.vocabulary.length
      ? review.vocabulary
      : input.practiceProgress.savedPhrases.slice(0, 3);
    reason = "You are ready for a lesson that pushes vocabulary range and more natural phrasing.";
  } else if (result) {
    dominantArea = result.fluency < 85 ? "fluency" : "vocabulary";
    difficultyMode =
      result.overall >= 90 && result.fluency >= 88 && result.accuracy >= 86
        ? "stretch"
        : result.overall >= 80
          ? "balanced"
          : "supportive";
    focus = input.practiceProgress.savedPhrases.slice(0, 3);
    reason =
      result.fluency < 85
        ? "Your scores are solid, so the best next step is a lesson that improves flow and spontaneity."
        : "You handled the last lesson well, so the planner is moving you to a slightly richer speaking task.";
  } else if (
    input.practiceProgress.focusAreas.length ||
    input.practiceProgress.savedPhrases.length ||
    input.practiceProgress.pronunciationTips.length
  ) {
    if (input.practiceProgress.pronunciationTips.length) {
      dominantArea = "pronunciation";
      difficultyMode = "supportive";
      focus = input.practiceProgress.pronunciationTips.slice(0, 2);
      reason = "Your practice memory still shows pronunciation targets that should be recycled in a fresh scenario.";
    } else if (input.practiceProgress.focusAreas.length) {
      dominantArea = "grammar";
      difficultyMode = "supportive";
      focus = input.practiceProgress.focusAreas.slice(0, 3);
      reason = "Your practice memory points to grammar patterns that need one more structured lesson.";
    } else {
      dominantArea = "vocabulary";
      difficultyMode = "balanced";
      focus = input.practiceProgress.savedPhrases.slice(0, 3);
      reason = "The planner is reusing your saved phrases to turn passive vocabulary into spoken vocabulary.";
    }
  } else {
    return null;
  }

  const template = needsConsistencyPush
    ? selectTemplateForAdaptivePlan({
        dominantArea: "fluency",
        recentTemplateIds,
        previousTemplateId: review?.templateId,
      })
    : selectTemplateForAdaptivePlan({
        dominantArea,
        recentTemplateIds,
        previousTemplateId: review?.templateId,
      });

  if (needsConsistencyPush) {
    difficultyMode = difficultyMode === "stretch" ? "balanced" : "supportive";
    reason = `${reason} You are also behind your weekly goal, so the planner is choosing a shorter win to rebuild consistency.`;
  } else if (input.practiceHabits.currentStreak >= 5 && result && result.overall >= 88) {
    difficultyMode = "stretch";
    reason = `${reason} Your streak is strong, so the next lesson can safely push the upper edge of your selected range.`;
  }

  const focusText = focus.length
    ? `Pay special attention to: ${focus.join("; ")}.`
    : "Keep the lesson focused on one clear speaking objective.";
  const difficultyNote =
    difficultyMode === "supportive"
      ? "Keep the lesson at the lower edge of the selected CEFR range, with shorter questions, more scaffolding, and easier follow-up prompts."
      : difficultyMode === "stretch"
        ? "Keep the lesson inside the selected CEFR range but use the upper edge with richer vocabulary, less scaffolding, and slightly less predictable follow-up questions."
        : "Keep the lesson in the middle of the selected CEFR range with normal support and natural pacing.";

  return {
    template,
    focus,
    reason,
    difficultyMode,
    difficultyLabel: getDifficultyLabel(difficultyMode),
    difficultyNote,
    goal: `${template.goal} ${focusText}`.trim(),
    starterPrompt: [
      `Start the recommended next lesson "${template.title}".`,
      `Focus area: ${dominantArea}.`,
      `Difficulty mode: ${difficultyMode}.`,
      focus.length ? `Targets: ${focus.join("; ")}.` : "",
      "Set the scene briefly and ask the learner the first question right away.",
    ]
      .filter(Boolean)
      .join(" "),
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
  const [activeLesson, setActiveLesson] = useState<ActiveLessonState | null>(null);
  const [lessonResult, setLessonResult] = useState<LessonResult | null>(null);
  const [lessonReview, setLessonReview] = useState<LessonReview | null>(null);
  const [practiceSummary, setPracticeSummary] = useState<CoachPracticeSummary | null>(null);
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress>(
    createEmptyPracticeProgress()
  );
  const [practiceHabits, setPracticeHabits] = useState<PracticeHabitStats>(
    createEmptyPracticeHabits()
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

    try {
      const stored = window.localStorage.getItem(
        getPracticeHabitsStorageKey(sessionUserId, selectedConversationLocale)
      );
      if (!stored) {
        setPracticeHabits(createEmptyPracticeHabits());
        return;
      }

      const parsed = JSON.parse(stored) as Partial<PracticeHabitStats>;
      setPracticeHabits(normalizePracticeHabits(parsed));
    } catch {
      setPracticeHabits(createEmptyPracticeHabits());
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
    if (sessionUserId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getPracticeHabitsStorageKey(sessionUserId, selectedConversationLocale),
      JSON.stringify(practiceHabits)
    );
  }, [practiceHabits, selectedConversationLocale, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId) {
      setRecentSessions([]);
      setLessonResult(null);
      setLessonReview(null);
      setPracticeHabits(createEmptyPracticeHabits());
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
              "user_id,locale,turns_completed,focus_areas,saved_phrases,pronunciation_tips,last_practice_mode,last_practice_topic,last_summary,last_lesson_result,last_lesson_template,last_lesson_completed_at,current_streak,longest_streak,weekly_goal_target,weekly_goal_completed,weekly_goal_week_start,last_lesson_day,updated_at"
            )
            .eq("user_id", sessionUserId)
            .eq("locale", selectedConversationLocale)
            .maybeSingle(),
          supabase
            .from("ai_practice_session_history")
            .select(
              "id,locale,level_range,practice_mode,practice_topic,user_message,assistant_reply,quick_correction,better_version,next_question,pronunciation_tip,summary,lesson_template,lesson_turn_index,lesson_turn_target,lesson_score,created_at"
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
        const loadedSessions = (sessionsResult.data ?? []) as PracticeSessionHistoryRow[];
        const latestScoredSession = loadedSessions.find((session) => Boolean(session.lesson_score));
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
        setLessonResult((stateRow?.last_lesson_result as LessonResult | null) ?? null);
        setLessonReview(latestScoredSession ? buildLessonReviewFromSession(latestScoredSession) : null);
        setPracticeHabits(
          normalizePracticeHabits(
            stateRow
              ? {
                  currentStreak: stateRow.current_streak ?? 0,
                  longestStreak: stateRow.longest_streak ?? 0,
                  weeklyGoalTarget: stateRow.weekly_goal_target ?? 4,
                  weeklyGoalCompleted: stateRow.weekly_goal_completed ?? 0,
                  weeklyGoalWeekStart: stateRow.weekly_goal_week_start ?? "",
                  lastLessonDay: stateRow.last_lesson_day ?? null,
                  updatedAt: stateRow.updated_at ?? null,
                }
              : null
          )
        );
        setRecentSessions(loadedSessions);
      } catch {
        if (!active) {
          return;
        }
        setPracticeProgress(createEmptyPracticeProgress());
        setPracticeHabits(createEmptyPracticeHabits());
        setLessonResult(null);
        setLessonReview(null);
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
  const adaptiveLessonPlan = useMemo(
    () =>
      buildAdaptiveLessonPlan({
        lessonResult,
        lessonReview,
        practiceProgress,
        practiceHabits,
        recentSessions,
      }),
    [lessonResult, lessonReview, practiceProgress, practiceHabits, recentSessions]
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

  const runAssistantRequest = useCallback(
    async (options: {
      assistantInput: string;
      displayUserText: string | null;
      inputSource: "text" | "speech";
      lessonState?: ActiveLessonState | null;
      lessonTurnIndex?: number;
    }) => {
      const trimmedAssistantInput = options.assistantInput.trim();
      if (!trimmedAssistantInput) {
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
      const lessonState = options.lessonState ?? activeLesson;
      const lessonTurnIndex = lessonState ? options.lessonTurnIndex ?? 0 : 0;
      conversationLocaleRef.current = replyLocale;
      lastInputSourceRef.current = options.inputSource;

      const assistantMessageId = buildId();
      setMessages((prev) => [
        ...prev,
        ...(options.displayUserText
          ? [{ id: buildId(), role: "user" as const, text: options.displayUserText }]
          : []),
        { id: assistantMessageId, role: "assistant", text: "", pending: true },
      ]);

      const assistantRequest = {
        text: trimmedAssistantInput,
        conversationId: conversationIdRef.current,
        locale: replyLocale,
        levelRange: selectedConversationLevel,
        practiceMode: lessonState?.mode ?? selectedPracticeMode,
        practiceTopic: lessonState?.topic || practiceTopic.trim() || undefined,
        lessonTemplate: lessonState?.title || undefined,
        lessonGoal: lessonState?.goal || undefined,
        lessonTurnIndex,
        lessonTurnTarget: lessonState?.turnTarget ?? 0,
        difficultyMode: lessonState?.difficultyMode ?? "balanced",
        difficultyNote: lessonState?.difficultyNote || undefined,
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

        let nextProgressSnapshot = practiceProgress;
        let nextHabitSnapshot = practiceHabits;
        let lessonResultSnapshot: LessonResult | null = null;
        let lessonReviewSnapshot: LessonReview | null = null;
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          text: displayText,
          spokenText,
          coach: reply.coach,
          pending: false,
        }));
        setThinking(false);
        setStatusMessage(text.idle);

        if (options.displayUserText) {
          setPracticeSummary(reply.coach?.summary ?? null);
          setPracticeProgress((prev) => {
            nextProgressSnapshot = mergePracticeProgress(prev, reply.coach);
            return nextProgressSnapshot;
          });
        }

        if (lessonState) {
          const progressedLesson =
            options.displayUserText && lessonTurnIndex > 0
              ? { ...lessonState, userTurnsCompleted: lessonTurnIndex }
              : lessonState;
          if (reply.coach?.lessonComplete) {
            lessonResultSnapshot = reply.coach.score
              ? createLessonResult(reply.coach.score, progressedLesson)
              : buildFallbackLessonScore(reply.coach, progressedLesson);
            lessonReviewSnapshot = buildLessonReviewFromCoach(reply.coach, progressedLesson);
            setLessonResult(lessonResultSnapshot);
            setLessonReview(lessonReviewSnapshot);
            setPracticeHabits((prev) => {
              nextHabitSnapshot = advancePracticeHabits(prev, new Date());
              return nextHabitSnapshot;
            });
            setActiveLesson(null);
          } else {
            setActiveLesson(progressedLesson);
          }
        }

        if (sessionUserId) {
          const supabase = getSupabaseClient();
          if (supabase) {
            const nowIso = new Date().toISOString();
            const practiceTopicValue = (lessonState?.topic || practiceTopic.trim()) || null;
            const historyRow: Omit<PracticeSessionHistoryRow, "id"> & { user_id: string } = {
              user_id: sessionUserId,
              locale: replyLocale,
              level_range: selectedConversationLevel,
              practice_mode: lessonState?.mode ?? selectedPracticeMode,
              practice_topic: practiceTopicValue,
              user_message: options.displayUserText ?? "",
              assistant_reply: displayText,
              quick_correction: reply.coach?.quickCorrection || null,
              better_version: reply.coach?.betterVersion || null,
              next_question: reply.coach?.nextQuestion || null,
              pronunciation_tip: reply.coach?.pronunciationTip || null,
              summary: reply.coach?.summary ?? null,
              lesson_template: lessonState?.title ?? null,
              lesson_turn_index:
                lessonState && options.displayUserText ? lessonTurnIndex : null,
              lesson_turn_target: lessonState?.turnTarget ?? null,
              lesson_score: lessonResultSnapshot,
              created_at: nowIso,
            };
            const recentHistoryRow: PracticeSessionHistoryRow = {
              id: buildId(),
              ...historyRow,
            };
            setRecentSessions((prev) => [recentHistoryRow, ...prev].slice(0, 5));
            void (async () => {
              const statePayload: Record<string, unknown> = {
                user_id: sessionUserId,
                locale: replyLocale,
                turns_completed: nextProgressSnapshot.turnsCompleted,
                focus_areas: nextProgressSnapshot.focusAreas,
                saved_phrases: nextProgressSnapshot.savedPhrases,
                pronunciation_tips: nextProgressSnapshot.pronunciationTips,
                current_streak: nextHabitSnapshot.currentStreak,
                longest_streak: nextHabitSnapshot.longestStreak,
                weekly_goal_target: nextHabitSnapshot.weeklyGoalTarget,
                weekly_goal_completed: nextHabitSnapshot.weeklyGoalCompleted,
                weekly_goal_week_start: nextHabitSnapshot.weeklyGoalWeekStart,
                last_lesson_day: nextHabitSnapshot.lastLessonDay,
                last_practice_mode: lessonState?.mode ?? selectedPracticeMode,
                last_practice_topic: practiceTopicValue,
                last_summary:
                  options.displayUserText ? reply.coach?.summary ?? null : practiceSummary,
                updated_at: nowIso,
              };
              if (lessonResultSnapshot) {
                statePayload.last_lesson_result = lessonResultSnapshot;
                statePayload.last_lesson_template = lessonResultSnapshot.title;
                statePayload.last_lesson_completed_at = lessonResultSnapshot.completedAt;
              }

              const stateResult = await supabase
                .from("ai_practice_user_state")
                .upsert(statePayload, { onConflict: "user_id,locale" });
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
      activeLesson,
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
      practiceHabits,
      practiceProgress,
      practiceSummary,
      practiceTopic,
      canUseNativeHelp,
      nativeHelpEnabled,
      nativeLocale,
      sessionUserId,
      text.idle,
      text.thinking,
      updateMessage,
    ]
  );

  const sendPrompt = useCallback(
    async (rawValue: string, inputSource: "text" | "speech" = "text") => {
      const trimmedValue = rawValue.trim();
      if (!trimmedValue) {
        setErrorMessage(text.emptyPrompt);
        return;
      }

      const lessonTurnIndex = activeLesson ? activeLesson.userTurnsCompleted + 1 : 0;
      await runAssistantRequest({
        assistantInput: buildConversationInput(messages, trimmedValue),
        displayUserText: trimmedValue,
        inputSource,
        lessonState: activeLesson,
        lessonTurnIndex,
      });
    },
    [activeLesson, messages, runAssistantRequest, text.emptyPrompt]
  );

  const beginLessonSession = useCallback(
    async (input: {
      lesson: ActiveLessonState;
      starterPrompt: string;
      selectedMode: PracticeModeOption;
      selectedTopic: string;
    }) => {
      if (guestMode) {
        requireAuth();
        return;
      }

      stopReplyStream();
      stopAudioPlayback();
      shouldSubmitSpeechRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
      setMessages([]);
      setDraft("");
      setInterimTranscript("");
      setErrorMessage("");
      setPracticeSummary(null);
      setLessonResult(null);
      setLessonReview(null);
      setSelectedPracticeMode(input.selectedMode);
      setPracticeTopic(input.selectedTopic);
      setActiveLesson(input.lesson);
      conversationIdRef.current = null;
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      shouldSubmitSpeechRef.current = false;
      setStatusMessage(text.thinking);

      await runAssistantRequest({
        assistantInput: input.starterPrompt,
        displayUserText: null,
        inputSource: "text",
        lessonState: input.lesson,
        lessonTurnIndex: 0,
      });
    },
    [
      guestMode,
      requireAuth,
      runAssistantRequest,
      stopAudioPlayback,
      stopReplyStream,
      text.thinking,
    ]
  );

  const handleLessonStart = useCallback(
    async (template: LessonTemplate) => {
      const nextLesson: ActiveLessonState = {
        templateId: template.id,
        title: template.title,
        description: template.description,
        mode: template.mode,
        topic: template.topic,
        goal: template.goal,
        difficultyMode: "balanced",
        difficultyNote:
          "Keep the lesson in the middle of the selected CEFR range with normal support and natural pacing.",
        turnTarget: template.turnTarget,
        userTurnsCompleted: 0,
        startedAt: new Date().toISOString(),
      };

      await beginLessonSession({
        lesson: nextLesson,
        starterPrompt: template.starterPrompt,
        selectedMode: template.mode,
        selectedTopic: template.topic,
      });
    },
    [beginLessonSession]
  );

  const handleRepeatWeakPoints = useCallback(async () => {
    if (!lessonReview) {
      return;
    }

    const nextLesson: ActiveLessonState = {
      templateId: `${lessonReview.templateId}-review`,
      title: `${lessonReview.title} review`,
      description: "Short drill focused only on your weak points from the last lesson.",
      mode: lessonReview.sourceMode,
      topic: lessonReview.sourceTopic || "Weak-point drill",
      goal: lessonReview.weakPoints.length
        ? `Fix these weak points: ${lessonReview.weakPoints.join("; ")}.`
        : "Repeat the last lesson and focus only on accuracy, vocabulary, and pronunciation.",
      difficultyMode: "supportive",
      difficultyNote:
        "Keep the lesson at the lower edge of the selected CEFR range, with shorter questions, more scaffolding, and easier follow-up prompts.",
      turnTarget: 3,
      userTurnsCompleted: 0,
      startedAt: new Date().toISOString(),
    };

    const starterPrompt = [
      `Start a focused weak-point drill lesson based on "${lessonReview.title}".`,
      lessonReview.grammar.length
        ? `Grammar weak points: ${lessonReview.grammar.join("; ")}.`
        : "",
      lessonReview.vocabulary.length
        ? `Vocabulary targets: ${lessonReview.vocabulary.join("; ")}.`
        : "",
      lessonReview.pronunciation.length
        ? `Pronunciation targets: ${lessonReview.pronunciation.join("; ")}.`
        : "",
      "Set the scene in one short sentence and ask the learner a short practice question.",
    ]
      .filter(Boolean)
      .join(" ");

    await beginLessonSession({
      lesson: nextLesson,
      starterPrompt,
      selectedMode: lessonReview.sourceMode,
      selectedTopic: lessonReview.sourceTopic,
    });
  }, [
    beginLessonSession,
    lessonReview,
  ]);

  const handleStartRecommendedLesson = useCallback(async () => {
    if (!adaptiveLessonPlan) {
      return;
    }

    const nextLesson: ActiveLessonState = {
      templateId: `${adaptiveLessonPlan.template.id}-adaptive`,
      title: adaptiveLessonPlan.template.title,
      description: adaptiveLessonPlan.template.description,
      mode: adaptiveLessonPlan.template.mode,
      topic: adaptiveLessonPlan.template.topic,
      goal: adaptiveLessonPlan.goal,
      difficultyMode: adaptiveLessonPlan.difficultyMode,
      difficultyNote: adaptiveLessonPlan.difficultyNote,
      turnTarget: adaptiveLessonPlan.template.turnTarget,
      userTurnsCompleted: 0,
      startedAt: new Date().toISOString(),
    };

    await beginLessonSession({
      lesson: nextLesson,
      starterPrompt: adaptiveLessonPlan.starterPrompt,
      selectedMode: adaptiveLessonPlan.template.mode,
      selectedTopic: adaptiveLessonPlan.template.topic,
    });
  }, [adaptiveLessonPlan, beginLessonSession]);

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

  const handleWeeklyGoalTargetChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextTarget = Number(event.target.value);
      if (!WEEKLY_GOAL_OPTIONS.includes(nextTarget as (typeof WEEKLY_GOAL_OPTIONS)[number])) {
        return;
      }

      setPracticeHabits((prev) =>
        normalizePracticeHabits({
          ...prev,
          weeklyGoalTarget: nextTarget,
        })
      );

      if (sessionUserId) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void supabase
            .from("ai_practice_user_state")
            .upsert(
              {
                user_id: sessionUserId,
                locale: selectedConversationLocale,
                weekly_goal_target: nextTarget,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,locale" }
            )
            .then(({ error }) => {
              if (error) {
                setErrorMessage("Practice goal sync is temporarily unavailable.");
              }
            });
        }
      }
    },
    [selectedConversationLocale, sessionUserId]
  );

  const handleClearConversation = useCallback(() => {
    stopReplyStream();
    setMessages([]);
    setDraft("");
    setInterimTranscript("");
    setErrorMessage("");
    setPracticeSummary(null);
    setLessonResult(null);
    setLessonReview(null);
    setActiveLesson(null);
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
        <div className="voiceAssistantCoachPanel voiceAssistantHabitsPanel">
          <div className="voiceAssistantCoachTitle">{text.habitsTitle}</div>
          <div className="voiceAssistantHabitStats">
            <div className="voiceAssistantHabitStat">
              <div className="voiceAssistantCoachLabel">{text.habitsCurrentStreak}</div>
              <div className="voiceAssistantHabitValue">{practiceHabits.currentStreak}</div>
            </div>
            <div className="voiceAssistantHabitStat">
              <div className="voiceAssistantCoachLabel">{text.habitsLongestStreak}</div>
              <div className="voiceAssistantHabitValue">{practiceHabits.longestStreak}</div>
            </div>
          </div>
          <label className="label" htmlFor="voiceAssistantWeeklyGoal">
            {text.habitsWeeklyGoal}
          </label>
          <select
            className="input"
            id="voiceAssistantWeeklyGoal"
            value={practiceHabits.weeklyGoalTarget}
            onChange={handleWeeklyGoalTargetChange}
            disabled={thinking || listening || Boolean(activeLesson)}
          >
            {WEEKLY_GOAL_OPTIONS.map((goalValue) => (
              <option key={goalValue} value={goalValue}>
                {`${goalValue} lessons`}
              </option>
            ))}
          </select>
          <div className="voiceAssistantCoachSection">
            <div className="voiceAssistantCoachLabel">{text.habitsWeeklyProgress}</div>
            <div className="voiceAssistantLessonScoreBar">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    (practiceHabits.weeklyGoalCompleted / Math.max(practiceHabits.weeklyGoalTarget, 1)) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="muted">
              {`${practiceHabits.weeklyGoalCompleted}/${practiceHabits.weeklyGoalTarget} lessons this week`}
            </div>
          </div>
          <div className="muted">{text.habitsWeeklyHint}</div>
        </div>
        <div className="voiceAssistantCoachPanel">
          <div className="voiceAssistantCoachTitle">{text.lessonTemplatesTitle}</div>
          <div className="muted">{text.lessonTemplatesHint}</div>
          <div className="voiceAssistantLessonTemplates">
            {LESSON_TEMPLATES.map((template) => {
              const isActive = activeLesson?.templateId === template.id;
              return (
                <div
                  key={template.id}
                  className={`voiceAssistantLessonTemplate${
                    isActive ? " voiceAssistantLessonTemplate--active" : ""
                  }`}
                >
                  <div className="voiceAssistantLessonTemplateTitle">{template.title}</div>
                  <div className="voiceAssistantLessonTemplateDescription">
                    {template.description}
                  </div>
                  <div className="voiceAssistantRecentSessionMeta">
                    <span>{template.mode}</span>
                    <span>{template.topic}</span>
                    <span>{`${template.turnTarget} turns`}</span>
                  </div>
                  <div className="muted">{template.goal}</div>
                  <button
                    className="btn btnGhost"
                    type="button"
                    onClick={() => void handleLessonStart(template)}
                    disabled={thinking || listening}
                  >
                    {activeLesson?.templateId === template.id
                      ? text.lessonRestart
                      : text.lessonStart}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {activeLesson ? (
          <div className="voiceAssistantCoachPanel voiceAssistantLessonStatus">
            <div className="voiceAssistantCoachTitle">{text.lessonActiveTitle}</div>
            <div className="voiceAssistantLessonHeadline">{activeLesson.title}</div>
            <div className="muted">{activeLesson.description}</div>
            <div className="voiceAssistantRecentSessionMeta">
              <span>
                {text.lessonProgress.replace(
                  "{progress}",
                  `${activeLesson.userTurnsCompleted}/${activeLesson.turnTarget}`
                )}
              </span>
              <span>{activeLesson.topic}</span>
              <span>{getDifficultyLabel(activeLesson.difficultyMode)}</span>
            </div>
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.lessonGoalLabel}</div>
              <div>{activeLesson.goal}</div>
            </div>
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.lessonDifficultyLabel}</div>
              <div>{activeLesson.difficultyNote}</div>
            </div>
          </div>
        ) : null}

        {lessonResult ? (
          <div className="voiceAssistantCoachPanel voiceAssistantLessonScore">
            <div className="voiceAssistantCoachTitle">{text.lessonScoreTitle}</div>
            <div className="voiceAssistantLessonHeadline">{lessonResult.title}</div>
            <div className="voiceAssistantLessonOverall">
              <span className="voiceAssistantLessonOverallValue">
                {lessonResult.overall}
              </span>
              <span>/100</span>
            </div>
            <div className="voiceAssistantLessonScoreGrid">
              {[
                [text.lessonScoreFluency, lessonResult.fluency],
                [text.lessonScoreAccuracy, lessonResult.accuracy],
                [text.lessonScoreVocabulary, lessonResult.vocabulary],
                [text.lessonScorePronunciation, lessonResult.pronunciation],
                [text.lessonScoreGoal, lessonResult.goalCompletion],
              ].map(([label, value]) => (
                <div key={String(label)} className="voiceAssistantLessonScoreItem">
                  <div className="voiceAssistantCoachLabel">{label}</div>
                  <div className="voiceAssistantLessonScoreBar">
                    <span style={{ width: `${Number(value)}%` }} />
                  </div>
                  <div>{value}</div>
                </div>
              ))}
            </div>
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.lessonScoreFeedback}</div>
              <div>{lessonResult.finalFeedback}</div>
            </div>
          </div>
        ) : null}

        {lessonReview ? (
          <div className="voiceAssistantCoachPanel voiceAssistantLessonReview">
            <div className="voiceAssistantCoachTitle">{text.lessonReviewTitle}</div>
            <div className="muted">{text.lessonReviewHint}</div>
            <div className="voiceAssistantCoachGrid">
              {lessonReview.grammar.length ? (
                <div className="voiceAssistantCoachCard">
                  <div className="voiceAssistantCoachLabel">{text.lessonReviewGrammar}</div>
                  <ul className="voiceAssistantCoachList">
                    {lessonReview.grammar.map((item) => (
                      <li key={`review-grammar-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {lessonReview.vocabulary.length ? (
                <div className="voiceAssistantCoachCard">
                  <div className="voiceAssistantCoachLabel">{text.lessonReviewVocabulary}</div>
                  <ul className="voiceAssistantCoachList">
                    {lessonReview.vocabulary.map((item) => (
                      <li key={`review-vocab-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {lessonReview.pronunciation.length ? (
                <div className="voiceAssistantCoachCard">
                  <div className="voiceAssistantCoachLabel">{text.lessonReviewPronunciation}</div>
                  <ul className="voiceAssistantCoachList">
                    {lessonReview.pronunciation.map((item) => (
                      <li key={`review-pron-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="voiceAssistantLessonActionRow">
              <button
                className="btn"
                type="button"
                onClick={() => void handleRepeatWeakPoints()}
                disabled={thinking || listening}
              >
                {text.lessonReviewRepeat}
              </button>
            </div>
          </div>
        ) : null}

        {adaptiveLessonPlan && !activeLesson ? (
          <div className="voiceAssistantCoachPanel voiceAssistantLessonPlanner">
            <div className="voiceAssistantCoachTitle">{text.lessonPlannerTitle}</div>
            <div className="muted">{text.lessonPlannerHint}</div>
            <div className="voiceAssistantLessonHeadline">{adaptiveLessonPlan.template.title}</div>
            <div className="voiceAssistantLessonTemplateDescription">
              {adaptiveLessonPlan.template.description}
            </div>
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.lessonPlannerReason}</div>
              <div>{adaptiveLessonPlan.reason}</div>
            </div>
            <div className="voiceAssistantCoachSection">
              <div className="voiceAssistantCoachLabel">{text.lessonPlannerDifficulty}</div>
              <div>{`${adaptiveLessonPlan.difficultyLabel}. ${adaptiveLessonPlan.difficultyNote}`}</div>
            </div>
            {adaptiveLessonPlan.focus.length ? (
              <div className="voiceAssistantCoachSection">
                <div className="voiceAssistantCoachLabel">{text.lessonPlannerFocus}</div>
                <div className="voiceAssistantCoachChips">
                  {adaptiveLessonPlan.focus.map((item) => (
                    <span key={`adaptive-focus-${item}`} className="voiceAssistantCoachChip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="voiceAssistantLessonActionRow">
              <button
                className="btn"
                type="button"
                onClick={() => void handleStartRecommendedLesson()}
                disabled={thinking || listening}
              >
                {text.lessonPlannerStart}
              </button>
            </div>
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
          disabled={thinking || listening || Boolean(activeLesson)}
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
          disabled={thinking || listening || Boolean(activeLesson)}
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
          disabled={thinking || listening || Boolean(activeLesson)}
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
          disabled={thinking || listening || Boolean(activeLesson)}
        />
        <div className="muted">{text.practiceTopicHint}</div>
        <div className="voiceAssistantSuggestionRow">
          {PRACTICE_TOPIC_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              className="btn btnGhost voiceAssistantSuggestion"
              type="button"
              onClick={() => setPracticeTopic(suggestion)}
              disabled={thinking || listening || Boolean(activeLesson)}
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
              disabled={!canUseNativeHelp || thinking || listening || Boolean(activeLesson)}
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
                  {session.lesson_score ? <span>{`${session.lesson_score.overall}/100`}</span> : null}
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
