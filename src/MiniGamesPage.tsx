import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_EXERCISES,
  GRAMMAR_EXERCISES,
  SENTENCE_EXERCISES,
  STORY_EPISODES,
  getArticleExercises,
  getTranslationExercises,
  type ArticleExercise,
  type ArticleOption,
  type ChatExercise,
  type GrammarExercise,
  type GrammarTopic,
  type SentenceExercise,
  type StoryEpisode,
  type TranslationExercise,
} from "./miniGamesData";
import { getMiniGamesText } from "./miniGamesText";
import { getSupabaseClient } from "./supabaseClient";

type MiniGamesPageProps = {
  locale: string;
  sessionUserId?: string | null;
  isPremium?: boolean;
};

type GameMode = "article" | "grammar" | "translate" | "sentence" | "chat" | "story";
type ExerciseLevel = ArticleExercise["level"];

type GameStats = {
  attempts: number;
  correct: number;
  streak: number;
  bestStreak: number;
};

type ArticleRound = {
  key: string;
  exercise: ArticleExercise;
  options: ArticleOption[];
};

type TranslationRound = {
  key: string;
  exercise: TranslationExercise;
};

type SentenceToken = {
  id: string;
  word: string;
  index: number;
};

type SentenceRound = {
  key: string;
  exercise: SentenceExercise;
  tokens: SentenceToken[];
};

type ChatRound = {
  key: string;
  exercise: ChatExercise;
  options: string[];
};

type GrammarRound = {
  key: string;
  exercise: GrammarPracticeExercise;
  options: string[];
};

type GrammarPracticeExercise = GrammarExercise & {
  topic: GrammarTopic;
  rule: string;
};

type GrammarLayer = "focus" | "contrast" | "mixed";

type StoryRound = {
  key: string;
  episode: StoryEpisode;
};

type ResolveAnswerOptions = {
  completeDaily?: boolean;
  dailyScore?: number;
  dailyCorrect?: boolean;
};

type AnswerState = {
  value: string | null;
  correct: boolean;
  timedOut: boolean;
};

type OverallProgress = {
  totalScore: number;
  totalAttempts: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
};

type LivesState = {
  lives: number;
  lastRefillAt: string;
  nextRefillAt: string | null;
  infinite: boolean;
};

type PersistenceStatus = {
  type: "idle" | "loading" | "error";
  message: string;
};

type MiniGameUserStateRow = {
  user_id: string;
  total_score: number;
  total_attempts: number;
  total_correct: number;
  current_streak: number;
  best_streak: number;
  lives: number;
  last_life_refill_at: string;
  daily_challenge_date?: string | null;
  daily_challenge_score?: number | null;
  daily_challenge_completed?: boolean | null;
  updated_at?: string | null;
};

type MiniGameModeProgressRow = {
  user_id: string;
  mode: GameMode;
  total_attempts: number;
  total_correct: number;
  current_streak: number;
  best_streak: number;
};

type MiniGameDailyResultRow = {
  challenge_date: string;
  user_id: string;
  mode: GameMode;
  level: ExerciseLevel;
  score: number;
  correct: boolean;
};

type LeaderboardEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  detail: string;
};

type DailyChallengeState = {
  date: string;
  completed: boolean;
  score: number;
  correct: boolean | null;
  mode: GameMode;
  level: ExerciseLevel;
};

type DailyChallengeRound =
  | { mode: "article"; level: ExerciseLevel; key: string; articleRound: ArticleRound }
  | { mode: "grammar"; level: ExerciseLevel; key: string; grammarRound: GrammarRound }
  | {
      mode: "translate";
      level: ExerciseLevel;
      key: string;
      translationRound: TranslationRound;
    }
  | { mode: "sentence"; level: ExerciseLevel; key: string; sentenceRound: SentenceRound }
  | { mode: "chat"; level: ExerciseLevel; key: string; chatRound: ChatRound }
  | { mode: "story"; level: ExerciseLevel; key: string; storyRound: StoryRound };

const ARTICLE_OPTIONS: ArticleOption[] = ["der", "die", "das"];
const LEVEL_OPTIONS: ExerciseLevel[] = ["A1", "A2", "B1", "B2"];
const GRAMMAR_TOPIC_ORDER: GrammarTopic[] = [
  "akkusativ",
  "dativ",
  "wechselpraepositionen",
  "genitiv",
];
const GRAMMAR_TOPIC_LABELS: Record<GrammarTopic, string> = {
  akkusativ: "Akkusativ",
  dativ: "Dativ",
  wechselpraepositionen: "Wechselpraepositionen",
  genitiv: "Genitiv",
};
const GRAMMAR_LAYER_THRESHOLDS = {
  contrast: 3,
  mixed: 6,
} as const;
const GRAMMAR_MASTERY_MAX = GRAMMAR_LAYER_THRESHOLDS.mixed;
const GRAMMAR_TOPIC_CONFUSIONS: Record<GrammarTopic, GrammarTopic[]> = {
  akkusativ: ["dativ", "wechselpraepositionen", "genitiv"],
  dativ: ["akkusativ", "wechselpraepositionen", "genitiv"],
  wechselpraepositionen: ["akkusativ", "dativ", "genitiv"],
  genitiv: ["dativ", "akkusativ", "wechselpraepositionen"],
};
const GRAMMAR_EXERCISE_META: Record<
  string,
  { topic: GrammarTopic; rule: string }
> = {
  "grammar-a1-1": {
    topic: "akkusativ",
    rule: "The direct object takes Akkusativ.",
  },
  "grammar-a1-2": {
    topic: "akkusativ",
    rule: "The direct object takes Akkusativ.",
  },
  "grammar-a1-3": {
    topic: "akkusativ",
    rule: "`fuer` always takes Akkusativ.",
  },
  "grammar-a1-4": {
    topic: "dativ",
    rule: "`mit` always takes Dativ.",
  },
  "grammar-a1-5": {
    topic: "dativ",
    rule: "`helfen` takes Dativ.",
  },
  "grammar-a1-6": {
    topic: "dativ",
    rule: "`zu` always takes Dativ.",
  },
  "grammar-a1-7": {
    topic: "akkusativ",
    rule: "The direct object takes Akkusativ.",
  },
  "grammar-a2-1": {
    topic: "wechselpraepositionen",
    rule: "Movement with a Wechselpraeposition takes Akkusativ.",
  },
  "grammar-a2-2": {
    topic: "wechselpraepositionen",
    rule: "Location with a Wechselpraeposition takes Dativ.",
  },
  "grammar-a2-3": {
    topic: "wechselpraepositionen",
    rule: "Movement with a Wechselpraeposition takes Akkusativ.",
  },
  "grammar-a2-4": {
    topic: "wechselpraepositionen",
    rule: "Location with a Wechselpraeposition takes Dativ.",
  },
  "grammar-a2-5": {
    topic: "wechselpraepositionen",
    rule: "Movement with a Wechselpraeposition takes Akkusativ.",
  },
  "grammar-a2-6": {
    topic: "wechselpraepositionen",
    rule: "Location with a Wechselpraeposition takes Dativ.",
  },
  "grammar-a2-7": {
    topic: "dativ",
    rule: "The receiver of something is often in Dativ.",
  },
  "grammar-a2-8": {
    topic: "akkusativ",
    rule: "`warten auf` takes Akkusativ.",
  },
  "grammar-a2-9": {
    topic: "dativ",
    rule: "`mit` always takes Dativ.",
  },
  "grammar-a2-10": {
    topic: "dativ",
    rule: "The receiver of something is often in Dativ.",
  },
  "grammar-b1-1": {
    topic: "genitiv",
    rule: "`wegen` is normally used with Genitiv.",
  },
  "grammar-b1-2": {
    topic: "genitiv",
    rule: "`trotz` is normally used with Genitiv.",
  },
  "grammar-b1-3": {
    topic: "genitiv",
    rule: "Possession with a noun phrase uses Genitiv.",
  },
  "grammar-b1-4": {
    topic: "akkusativ",
    rule: "`sich erinnern an` takes Akkusativ.",
  },
  "grammar-b1-5": {
    topic: "dativ",
    rule: "`bei` always takes Dativ.",
  },
  "grammar-b1-6": {
    topic: "genitiv",
    rule: "`waehrend` is normally used with Genitiv.",
  },
  "grammar-b1-7": {
    topic: "genitiv",
    rule: "`statt` is normally used with Genitiv.",
  },
};
const GAME_MODE_ORDER: GameMode[] = [
  "article",
  "grammar",
  "translate",
  "sentence",
  "chat",
  "story",
];
const ROUND_DURATIONS: Record<GameMode, number> = {
  article: 10,
  grammar: 20,
  translate: 30,
  sentence: 15,
  chat: 20,
  story: 25,
};
const ROUND_SCORE_BONUS: Record<GameMode, number> = {
  article: 10,
  grammar: 18,
  translate: 14,
  sentence: 18,
  chat: 20,
  story: 22,
};
const MAX_LIVES = 10;
const LIFE_REFILL_MS = 2 * 60 * 60 * 1000;

const INITIAL_STATS: Record<GameMode, GameStats> = {
  article: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  grammar: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  translate: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  sentence: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  chat: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  story: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
};

const INITIAL_OVERALL_PROGRESS: OverallProgress = {
  totalScore: 0,
  totalAttempts: 0,
  totalCorrect: 0,
  currentStreak: 0,
  bestStreak: 0,
};

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function shuffleWithSeed<T>(items: readonly T[], seed: string): T[] {
  const next = [...items];
  let state = hashString(seed) || 1;
  for (let index = next.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createArticleRoundFromExercise(
  exercise: ArticleExercise,
  seed: string | number,
): ArticleRound {
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffleWithSeed(ARTICLE_OPTIONS, `${exercise.id}-${seed}`),
  };
}

function createTranslationRoundFromExercise(
  exercise: TranslationExercise,
  seed: string | number,
): TranslationRound {
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
  };
}

function createSentenceRoundFromExercise(
  exercise: SentenceExercise,
  seed: string | number,
): SentenceRound {
  const tokenSeed = `${exercise.id}-${seed}`;
  return {
    key: tokenSeed,
    exercise,
    tokens: shuffleWithSeed(
      exercise.words.map((word, index) => ({
        id: `${exercise.id}-${seed}-${index}`,
        word,
        index,
      })),
      tokenSeed,
    ),
  };
}

function createChatRoundFromExercise(
  exercise: ChatExercise,
  seed: string | number,
): ChatRound {
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffleWithSeed(exercise.options, `${exercise.id}-${seed}`),
  };
}

function enrichGrammarExercise(exercise: GrammarExercise): GrammarPracticeExercise {
  const meta = GRAMMAR_EXERCISE_META[exercise.id];
  return {
    ...exercise,
    topic: meta?.topic ?? "akkusativ",
    rule: meta?.rule ?? "Choose the correct case form.",
  };
}

function createGrammarRoundFromExercise(
  exercise: GrammarPracticeExercise,
  seed: string | number,
): GrammarRound {
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffleWithSeed(exercise.options, `${exercise.id}-${seed}`),
  };
}

function createStoryRoundFromEpisode(
  episode: StoryEpisode,
  seed: string | number,
): StoryRound {
  return {
    key: `${episode.id}-${seed}`,
    episode,
  };
}

function getTodayChallengeKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createInitialLivesState(infinite: boolean): LivesState {
  const nowIso = new Date().toISOString();
  return {
    lives: MAX_LIVES,
    lastRefillAt: nowIso,
    nextRefillAt: null,
    infinite,
  };
}

function recoverLivesState(state: LivesState, nowMs = Date.now()): LivesState {
  if (state.infinite) {
    return {
      ...state,
      lives: MAX_LIVES,
      nextRefillAt: null,
    };
  }
  const lastMs = Number.isFinite(Date.parse(state.lastRefillAt))
    ? Date.parse(state.lastRefillAt)
    : nowMs;
  if (state.lives >= MAX_LIVES) {
    return {
      ...state,
      lives: MAX_LIVES,
      lastRefillAt: new Date(nowMs).toISOString(),
      nextRefillAt: null,
    };
  }
  const elapsed = Math.max(0, nowMs - lastMs);
  const recovered = Math.floor(elapsed / LIFE_REFILL_MS);
  if (recovered <= 0) {
    return {
      ...state,
      nextRefillAt: new Date(lastMs + LIFE_REFILL_MS).toISOString(),
    };
  }
  const nextLives = Math.min(MAX_LIVES, state.lives + recovered);
  const remainder = elapsed % LIFE_REFILL_MS;
  const nextLastMs =
    nextLives >= MAX_LIVES ? nowMs : nowMs - remainder;
  return {
    ...state,
    lives: nextLives,
    lastRefillAt: new Date(nextLastMs).toISOString(),
    nextRefillAt:
      nextLives >= MAX_LIVES ? null : new Date(nextLastMs + LIFE_REFILL_MS).toISOString(),
  };
}

function consumeLife(state: LivesState, nowIso: string): LivesState {
  if (state.infinite) return state;
  const refreshed = recoverLivesState(state, Date.parse(nowIso));
  if (refreshed.lives <= 0) return refreshed;
  return {
    lives: refreshed.lives - 1,
    lastRefillAt:
      refreshed.lives >= MAX_LIVES ? nowIso : refreshed.lastRefillAt,
    nextRefillAt:
      refreshed.lives >= MAX_LIVES
        ? new Date(Date.parse(nowIso) + LIFE_REFILL_MS).toISOString()
        : refreshed.nextRefillAt,
    infinite: false,
  };
}

function formatCountdown(targetIso: string | null): string {
  if (!targetIso) return "";
  const diff = Math.max(0, Date.parse(targetIso) - Date.now());
  const totalSeconds = Math.ceil(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function buildStatsFromRows(
  rows: MiniGameModeProgressRow[] | null | undefined,
): Record<GameMode, GameStats> {
  if (!rows?.length) return INITIAL_STATS;
  return rows.reduce(
    (acc, row) => ({
      ...acc,
      [row.mode]: {
        attempts: row.total_attempts,
        correct: row.total_correct,
        streak: row.current_streak,
        bestStreak: row.best_streak,
      },
    }),
    { ...INITIAL_STATS },
  );
}

function getModeLabel(text: ReturnType<typeof getMiniGamesText>, mode: GameMode): string {
  switch (mode) {
    case "article":
      return text.articleMode;
    case "grammar":
      return text.grammarMode ?? "Grammar cases";
    case "translate":
      return text.translateMode;
    case "sentence":
      return text.sentenceMode;
    case "chat":
      return text.chatMode;
    case "story":
      return text.storyMode ?? "Story mode";
  }
}

function createArticleRound(
  exercises: readonly ArticleExercise[],
  seed: number,
): ArticleRound {
  const exercise = randomItem(exercises);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffle(ARTICLE_OPTIONS),
  };
}

function createTranslationRound(
  exercises: readonly TranslationExercise[],
  seed: number,
): TranslationRound {
  const exercise = randomItem(exercises);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
  };
}

function createSentenceRound(
  exercises: readonly SentenceExercise[],
  seed: number,
): SentenceRound {
  const exercise = randomItem(exercises);
  const tokens = shuffle(
    exercise.words.map((word, index) => ({
      id: `${exercise.id}-${seed}-${index}`,
      word,
      index,
    })),
  );
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    tokens,
  };
}

function createChatRound(exercises: readonly ChatExercise[], seed: number): ChatRound {
  const exercise = randomItem(exercises);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffle(exercise.options),
  };
}

function createGrammarRound(
  exercises: readonly GrammarPracticeExercise[],
  seed: number,
): GrammarRound {
  const exercise = randomItem(exercises);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffle(exercise.options),
  };
}

function createInitialGrammarMastery(): Record<GrammarTopic, number> {
  return {
    akkusativ: 0,
    dativ: 0,
    wechselpraepositionen: 0,
    genitiv: 0,
  };
}

function getGrammarLayer(mastery: number): GrammarLayer {
  if (mastery >= GRAMMAR_LAYER_THRESHOLDS.mixed) {
    return "mixed";
  }
  if (mastery >= GRAMMAR_LAYER_THRESHOLDS.contrast) {
    return "contrast";
  }
  return "focus";
}

function getGrammarContrastTopics(
  topic: GrammarTopic,
  availableTopics: readonly GrammarTopic[],
): GrammarTopic[] {
  return GRAMMAR_TOPIC_CONFUSIONS[topic].filter((entry) => availableTopics.includes(entry));
}

function createStoryRound(episodes: readonly StoryEpisode[], seed: number): StoryRound {
  const episode = randomItem(episodes);
  return {
    key: `${episode.id}-${seed}`,
    episode,
  };
}

function formatAccuracy(stats: GameStats): string {
  if (!stats.attempts) return "0%";
  return `${Math.round((stats.correct / stats.attempts) * 100)}%`;
}

function formatTimer(seconds: number): string {
  return `00:${seconds.toString().padStart(2, "0")}`;
}

function renderStreakStars(streak: number): string {
  const clamped = Math.max(0, Math.min(streak, 5));
  return `${"★".repeat(clamped)}${"☆".repeat(5 - clamped)}`;
}

function normalizeTranslationAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function buildDailyChallengeRound(params: {
  challengeKey: string;
  articleExercises: readonly ArticleExercise[];
  grammarExercises: readonly GrammarPracticeExercise[];
  translationExercises: readonly TranslationExercise[];
  sentenceExercises: readonly SentenceExercise[];
  chatExercises: readonly ChatExercise[];
  storyEpisodes: readonly StoryEpisode[];
}): DailyChallengeRound {
  const {
    challengeKey,
    articleExercises,
    grammarExercises,
    translationExercises,
    sentenceExercises,
    chatExercises,
    storyEpisodes,
  } = params;
  const mode = GAME_MODE_ORDER[hashString(`${challengeKey}-mode`) % GAME_MODE_ORDER.length];
  const levelPools: Record<
    GameMode,
    Record<
      ExerciseLevel,
      | readonly ArticleExercise[]
      | readonly GrammarPracticeExercise[]
      | readonly TranslationExercise[]
      | readonly SentenceExercise[]
      | readonly ChatExercise[]
      | readonly StoryEpisode[]
    >
  > = {
    article: {
      A1: articleExercises.filter((exercise) => exercise.level === "A1"),
      A2: articleExercises.filter((exercise) => exercise.level === "A2"),
      B1: articleExercises.filter((exercise) => exercise.level === "B1"),
      B2: articleExercises.filter((exercise) => exercise.level === "B2"),
    },
    grammar: {
      A1: grammarExercises.filter((exercise) => exercise.level === "A1"),
      A2: grammarExercises.filter((exercise) => exercise.level === "A2"),
      B1: grammarExercises.filter((exercise) => exercise.level === "B1"),
      B2: grammarExercises.filter((exercise) => exercise.level === "B2"),
    },
    translate: {
      A1: translationExercises.filter((exercise) => exercise.level === "A1"),
      A2: translationExercises.filter((exercise) => exercise.level === "A2"),
      B1: translationExercises.filter((exercise) => exercise.level === "B1"),
      B2: translationExercises.filter((exercise) => exercise.level === "B2"),
    },
    sentence: {
      A1: sentenceExercises.filter((exercise) => exercise.level === "A1"),
      A2: sentenceExercises.filter((exercise) => exercise.level === "A2"),
      B1: sentenceExercises.filter((exercise) => exercise.level === "B1"),
      B2: sentenceExercises.filter((exercise) => exercise.level === "B2"),
    },
    chat: {
      A1: chatExercises.filter((exercise) => exercise.level === "A1"),
      A2: chatExercises.filter((exercise) => exercise.level === "A2"),
      B1: chatExercises.filter((exercise) => exercise.level === "B1"),
      B2: chatExercises.filter((exercise) => exercise.level === "B2"),
    },
    story: {
      A1: storyEpisodes.filter((episode) => episode.level === "A1"),
      A2: storyEpisodes.filter((episode) => episode.level === "A2"),
      B1: storyEpisodes.filter((episode) => episode.level === "B1"),
      B2: storyEpisodes.filter((episode) => episode.level === "B2"),
    },
  };
  const availableLevels = LEVEL_OPTIONS.filter(
    (level) => levelPools[mode][level].length > 0,
  );
  const level = availableLevels[
    hashString(`${challengeKey}-${mode}-level`) % availableLevels.length
  ] as ExerciseLevel;
  const pool = levelPools[mode][level];
  const exercise = pool[hashString(`${challengeKey}-${mode}-${level}`) % pool.length];
  if (mode === "article") {
    return {
      key: challengeKey,
      mode,
      level,
      articleRound: createArticleRoundFromExercise(
        exercise as ArticleExercise,
        challengeKey,
      ),
    };
  }
  if (mode === "grammar") {
    return {
      key: challengeKey,
      mode,
      level,
      grammarRound: createGrammarRoundFromExercise(
        exercise as GrammarPracticeExercise,
        challengeKey,
      ),
    };
  }
  if (mode === "translate") {
    return {
      key: challengeKey,
      mode,
      level,
      translationRound: createTranslationRoundFromExercise(
        exercise as TranslationExercise,
        challengeKey,
      ),
    };
  }
  if (mode === "sentence") {
    return {
      key: challengeKey,
      mode,
      level,
      sentenceRound: createSentenceRoundFromExercise(
        exercise as SentenceExercise,
        challengeKey,
      ),
    };
  }
  if (mode === "story") {
    return {
      key: challengeKey,
      mode,
      level,
      storyRound: createStoryRoundFromEpisode(exercise as StoryEpisode, challengeKey),
    };
  }
  return {
    key: challengeKey,
    mode,
    level,
    chatRound: createChatRoundFromExercise(exercise as ChatExercise, challengeKey),
  };
}

export default function MiniGamesPage({
  locale,
  sessionUserId = null,
  isPremium = false,
}: MiniGamesPageProps) {
  const text = getMiniGamesText(locale);
  const articleExercises = useMemo(() => getArticleExercises(locale), [locale]);
  const grammarExercises = useMemo(
    () => GRAMMAR_EXERCISES.map(enrichGrammarExercise),
    [],
  );
  const translationExercises = useMemo(
    () => getTranslationExercises(locale),
    [locale],
  );
  const [todayChallengeKey, setTodayChallengeKey] = useState(() =>
    getTodayChallengeKey(),
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousChallengeKeyRef = useRef(todayChallengeKey);
  const [mode, setMode] = useState<GameMode>("article");
  const [level, setLevel] = useState<ExerciseLevel>("A1");
  const [articleSeed, setArticleSeed] = useState(0);
  const [grammarSeed, setGrammarSeed] = useState(0);
  const [grammarTopic, setGrammarTopic] = useState<GrammarTopic>("akkusativ");
  const [grammarMastery, setGrammarMastery] = useState<Record<GrammarTopic, number>>(
    () => createInitialGrammarMastery(),
  );
  const [translationSeed, setTranslationSeed] = useState(0);
  const [sentenceSeed, setSentenceSeed] = useState(0);
  const [chatSeed, setChatSeed] = useState(0);
  const [storySeed, setStorySeed] = useState(0);
  const [storyDecisionIndex, setStoryDecisionIndex] = useState(0);
  const [storyEpisodeScore, setStoryEpisodeScore] = useState(0);
  const [storyEpisodeCorrectCount, setStoryEpisodeCorrectCount] = useState(0);
  const [sentenceSelection, setSentenceSelection] = useState<string[]>([]);
  const [translationInput, setTranslationInput] = useState("");
  const [stats, setStats] = useState(INITIAL_STATS);
  const [overallProgress, setOverallProgress] = useState(INITIAL_OVERALL_PROGRESS);
  const [livesState, setLivesState] = useState(() => createInitialLivesState(isPremium));
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>({
    type: "idle",
    message: "",
  });
  const [leaderboardTab, setLeaderboardTab] = useState<"daily" | "allTime">("daily");
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyChallengeState, setDailyChallengeState] = useState<DailyChallengeState>({
    date: todayChallengeKey,
    completed: false,
    score: 0,
    correct: null,
    mode: "article",
    level: "A1",
  });
  const [dailyChallengeActive, setDailyChallengeActive] = useState(false);
  const [answerAnimation, setAnswerAnimation] = useState<"correct" | "wrong" | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATIONS.article);

  const modeExercises = useMemo(() => {
    switch (mode) {
      case "article":
        return articleExercises;
      case "grammar":
        return grammarExercises;
      case "translate":
        return translationExercises;
      case "sentence":
        return SENTENCE_EXERCISES;
      case "chat":
        return CHAT_EXERCISES;
      case "story":
        return STORY_EPISODES;
    }
  }, [articleExercises, grammarExercises, mode, translationExercises]);

  const availableLevels = useMemo(
    () =>
      LEVEL_OPTIONS.filter((entry) =>
        modeExercises.some((exercise) => exercise.level === entry),
      ),
    [modeExercises],
  );

  const effectiveLevel = availableLevels.includes(level)
    ? level
    : availableLevels[0] ?? "A1";

  const filteredArticleExercises = useMemo(
    () => articleExercises.filter((exercise) => exercise.level === effectiveLevel),
    [articleExercises, effectiveLevel],
  );
  const filteredGrammarExercises = useMemo(
    () => grammarExercises.filter((exercise) => exercise.level === effectiveLevel),
    [effectiveLevel, grammarExercises],
  );
  const availableGrammarTopics = useMemo(
    () =>
      GRAMMAR_TOPIC_ORDER.filter((topic) =>
        filteredGrammarExercises.some((exercise) => exercise.topic === topic),
      ),
    [filteredGrammarExercises],
  );
  const filteredTranslationExercises = useMemo(
    () =>
      translationExercises.filter((exercise) => exercise.level === effectiveLevel),
    [effectiveLevel, translationExercises],
  );
  const filteredSentenceExercises = useMemo(
    () => SENTENCE_EXERCISES.filter((exercise) => exercise.level === effectiveLevel),
    [effectiveLevel],
  );
  const filteredChatExercises = useMemo(
    () => CHAT_EXERCISES.filter((exercise) => exercise.level === effectiveLevel),
    [effectiveLevel],
  );
  const filteredStoryEpisodes = useMemo(
    () => STORY_EPISODES.filter((episode) => episode.level === effectiveLevel),
    [effectiveLevel],
  );

  const dailyChallengeRound = useMemo(
    () =>
      buildDailyChallengeRound({
        challengeKey: todayChallengeKey,
        articleExercises,
        grammarExercises,
        translationExercises,
        sentenceExercises: SENTENCE_EXERCISES,
        chatExercises: CHAT_EXERCISES,
        storyEpisodes: STORY_EPISODES,
      }),
    [articleExercises, grammarExercises, todayChallengeKey, translationExercises],
  );
  const currentGrammarTopic =
    dailyChallengeActive && dailyChallengeRound.mode === "grammar"
      ? dailyChallengeRound.grammarRound.exercise.topic
      : availableGrammarTopics.includes(grammarTopic)
        ? grammarTopic
        : availableGrammarTopics[0] ?? "akkusativ";
  const currentGrammarMastery = grammarMastery[currentGrammarTopic] ?? 0;
  const currentGrammarLayer =
    dailyChallengeActive && dailyChallengeRound.mode === "grammar"
      ? "focus"
      : getGrammarLayer(currentGrammarMastery);
  const currentGrammarTopicLabel = GRAMMAR_TOPIC_LABELS[currentGrammarTopic];
  const grammarContrastTopics = useMemo(
    () => getGrammarContrastTopics(currentGrammarTopic, availableGrammarTopics),
    [availableGrammarTopics, currentGrammarTopic],
  );
  const filteredGrammarTopicExercises = useMemo(
    () =>
      filteredGrammarExercises.filter(
        (exercise) => exercise.topic === currentGrammarTopic,
      ),
    [currentGrammarTopic, filteredGrammarExercises],
  );
  const filteredGrammarContrastExercises = useMemo(
    () =>
      filteredGrammarExercises.filter((exercise) =>
        grammarContrastTopics.includes(exercise.topic),
      ),
    [filteredGrammarExercises, grammarContrastTopics],
  );
  const grammarPracticeExercises = useMemo(() => {
    if (currentGrammarLayer === "focus" || !filteredGrammarContrastExercises.length) {
      return filteredGrammarTopicExercises;
    }
    if (currentGrammarLayer === "contrast") {
      return [
        ...filteredGrammarTopicExercises,
        ...filteredGrammarTopicExercises,
        ...filteredGrammarContrastExercises,
      ];
    }
    return [
      ...filteredGrammarTopicExercises,
      ...filteredGrammarTopicExercises,
      ...filteredGrammarTopicExercises,
      ...filteredGrammarContrastExercises,
    ];
  }, [
    currentGrammarLayer,
    filteredGrammarContrastExercises,
    filteredGrammarTopicExercises,
  ]);
  const currentGrammarLayerLabel =
    currentGrammarLayer === "focus"
      ? text.grammarFocusLabel ?? "Focus"
      : currentGrammarLayer === "contrast"
        ? text.grammarContrastLabel ?? "Contrast"
        : text.grammarMixedLabel ?? "Mixed traps";
  const currentGrammarContrastLabels = grammarContrastTopics.map(
    (topic) => GRAMMAR_TOPIC_LABELS[topic],
  );
  const grammarPracticeTopicLabels = [
    currentGrammarTopicLabel,
    ...currentGrammarContrastLabels,
  ];
  const currentGrammarFlowProgress =
    currentGrammarLayer === "focus"
      ? `${currentGrammarMastery}/${GRAMMAR_LAYER_THRESHOLDS.contrast}`
      : currentGrammarLayer === "contrast"
        ? `${Math.max(
            0,
            currentGrammarMastery - GRAMMAR_LAYER_THRESHOLDS.contrast,
          )}/${GRAMMAR_LAYER_THRESHOLDS.mixed - GRAMMAR_LAYER_THRESHOLDS.contrast}`
        : `${GRAMMAR_MASTERY_MAX}/${GRAMMAR_MASTERY_MAX}`;
  const currentGrammarFlowCopy =
    currentGrammarLayer === "focus"
      ? currentGrammarTopicLabel
      : currentGrammarLayer === "contrast"
        ? [currentGrammarTopicLabel, currentGrammarContrastLabels[0]]
            .filter(Boolean)
            .join(" + ")
        : grammarPracticeTopicLabels.join(" + ");

  const articleRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "article") {
      return dailyChallengeRound.articleRound;
    }
    return createArticleRound(filteredArticleExercises, articleSeed);
  }, [articleSeed, dailyChallengeActive, dailyChallengeRound, filteredArticleExercises]);
  const grammarRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "grammar") {
      return dailyChallengeRound.grammarRound;
    }
    return createGrammarRound(grammarPracticeExercises, grammarSeed);
  }, [
    dailyChallengeActive,
    dailyChallengeRound,
    grammarPracticeExercises,
    grammarSeed,
  ]);
  const translationRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "translate") {
      return dailyChallengeRound.translationRound;
    }
    return createTranslationRound(filteredTranslationExercises, translationSeed);
  }, [
    dailyChallengeActive,
    dailyChallengeRound,
    filteredTranslationExercises,
    translationSeed,
  ]);
  const sentenceRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "sentence") {
      return dailyChallengeRound.sentenceRound;
    }
    return createSentenceRound(filteredSentenceExercises, sentenceSeed);
  }, [dailyChallengeActive, dailyChallengeRound, filteredSentenceExercises, sentenceSeed]);
  const chatRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "chat") {
      return dailyChallengeRound.chatRound;
    }
    return createChatRound(filteredChatExercises, chatSeed);
  }, [chatSeed, dailyChallengeActive, dailyChallengeRound, filteredChatExercises]);
  const storyRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "story") {
      return dailyChallengeRound.storyRound;
    }
    return createStoryRound(filteredStoryEpisodes, storySeed);
  }, [dailyChallengeActive, dailyChallengeRound, filteredStoryEpisodes, storySeed]);

  const activeStats = stats[mode];
  const currentRoundDuration = ROUND_DURATIONS[mode];
  const isArticleMode = mode === "article";
  const isGrammarMode = mode === "grammar";
  const isTranslateMode = mode === "translate";
  const isSentenceMode = mode === "sentence";
  const isChatMode = mode === "chat";
  const isStoryMode = mode === "story";
  const currentStoryEpisode = storyRound.episode;
  const currentStoryStep = currentStoryEpisode.steps[storyDecisionIndex] ?? currentStoryEpisode.steps[0];
  const currentStoryStepOptions = useMemo(
    () =>
      shuffleWithSeed(
        currentStoryStep.options,
        `${storyRound.key}-${currentStoryStep.id}-${storyDecisionIndex}`,
      ),
    [currentStoryStep.id, currentStoryStep.options, storyDecisionIndex, storyRound.key],
  );
  const isFinalStoryDecision =
    storyDecisionIndex === Math.max(0, currentStoryEpisode.steps.length - 1);
  const recoveredLivesState = recoverLivesState(livesState);
  const hasAvailableLives = recoveredLivesState.infinite || recoveredLivesState.lives > 0;
  const nextLifeCountdown = recoveredLivesState.infinite
    ? ""
    : formatCountdown(recoveredLivesState.nextRefillAt);
  const activeExercise = isArticleMode
    ? articleRound.exercise
    : isGrammarMode
      ? grammarRound.exercise
    : isTranslateMode
      ? translationRound.exercise
      : isSentenceMode
        ? sentenceRound.exercise
        : isChatMode
          ? chatRound.exercise
          : currentStoryEpisode;

  const selectedSentenceTokens = useMemo(() => {
    const tokenMap = new Map(sentenceRound.tokens.map((token) => [token.id, token]));
    return sentenceSelection
      .map((id) => tokenMap.get(id) ?? null)
      .filter((token): token is SentenceToken => token !== null);
  }, [sentenceRound.tokens, sentenceSelection]);

  const availableSentenceTokens = useMemo(() => {
    const selected = new Set(sentenceSelection);
    return sentenceRound.tokens.filter((token) => !selected.has(token.id));
  }, [sentenceRound.tokens, sentenceSelection]);

  const getErrorMessage = useCallback((error: unknown, fallback: string) => {
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return fallback;
  }, []);

  const persistUserStatePatch = useCallback(
    async (patch: Partial<MiniGameUserStateRow>) => {
      if (!sessionUserId) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from("mini_game_user_state").upsert(
        {
          user_id: sessionUserId,
          updated_at: nowIso,
          ...patch,
        },
        { onConflict: "user_id" },
      );
      if (error) {
        throw error;
      }
    },
    [sessionUserId],
  );

  const refreshLeaderboards = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAllTimeLeaderboard([]);
      setDailyLeaderboard([]);
      return;
    }
    const [allTimeResult, dailyResult] = await Promise.all([
      supabase
        .from("mini_game_user_state")
        .select("user_id,total_score,best_streak,total_correct")
        .order("total_score", { ascending: false })
        .limit(10),
      supabase
        .from("mini_game_daily_results")
        .select("challenge_date,user_id,mode,level,score,correct")
        .eq("challenge_date", todayChallengeKey)
        .order("score", { ascending: false })
        .limit(10),
    ]);
    if (allTimeResult.error || dailyResult.error) {
      throw allTimeResult.error ?? dailyResult.error;
    }

    const allTimeRows = (allTimeResult.data ?? []) as Array<
      Pick<MiniGameUserStateRow, "user_id" | "total_score" | "best_streak" | "total_correct">
    >;
    const dailyRows = (dailyResult.data ?? []) as MiniGameDailyResultRow[];
    const userIds = Array.from(
      new Set([
        ...allTimeRows.map((row) => row.user_id),
        ...dailyRows.map((row) => row.user_id),
      ]),
    );
    let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (userIds.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .in("id", userIds);
      if (profileError) throw profileError;
      profileMap = new Map(
        (profileRows ?? []).map((profile) => [
          profile.id as string,
          {
            full_name:
              typeof profile.full_name === "string" ? profile.full_name : null,
            avatar_url:
              typeof profile.avatar_url === "string" ? profile.avatar_url : null,
          },
        ]),
      );
    }

    setAllTimeLeaderboard(
      allTimeRows.map((row) => {
        const profile = profileMap.get(row.user_id);
        return {
          userId: row.user_id,
          name: profile?.full_name?.trim() || "Player",
          avatarUrl: profile?.avatar_url ?? null,
          score: row.total_score,
          detail: `${row.total_correct} / ${row.best_streak}`,
        };
      }),
    );
    setDailyLeaderboard(
      dailyRows.map((row) => {
        const profile = profileMap.get(row.user_id);
        return {
          userId: row.user_id,
          name: profile?.full_name?.trim() || "Player",
          avatarUrl: profile?.avatar_url ?? null,
          score: row.score,
          detail: `${getModeLabel(text, row.mode)} / ${row.level}`,
        };
      }),
    );
  }, [text, todayChallengeKey]);

  const syncLivesRecovery = useCallback(async () => {
    const refreshed = recoverLivesState(livesState);
    if (
      refreshed.lives === livesState.lives &&
      refreshed.lastRefillAt === livesState.lastRefillAt &&
      refreshed.nextRefillAt === livesState.nextRefillAt &&
      refreshed.infinite === livesState.infinite
    ) {
      return;
    }
    setLivesState(refreshed);
    if (sessionUserId && !refreshed.infinite) {
      try {
        await persistUserStatePatch({
          lives: refreshed.lives,
          last_life_refill_at: refreshed.lastRefillAt,
        });
      } catch {
        // Ignore background refill sync errors.
      }
    }
  }, [livesState, persistUserStatePatch, sessionUserId]);

  const playFeedbackSound = useCallback((kind: "correct" | "wrong") => {
    if (typeof window === "undefined") return;
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = context;
    const now = context.currentTime;
    const notes =
      kind === "correct"
        ? [523.25, 659.25, 783.99]
        : [220, 180, 140];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === "correct" ? "triangle" : "sawtooth";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + index * 0.08 + 0.16,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.18);
    });
  }, []);

  const resetRoundState = useCallback((nextDuration: number) => {
    setAnswerState(null);
    setAnswerAnimation(null);
    setTimeLeft(nextDuration);
    setSentenceSelection([]);
    setTranslationInput("");
  }, []);

  const resetStoryEpisodeState = useCallback(() => {
    setStoryDecisionIndex(0);
    setStoryEpisodeScore(0);
    setStoryEpisodeCorrectCount(0);
  }, []);

  const handleModeChange = (nextMode: GameMode) => {
    const nextModeExercises =
      nextMode === "article"
        ? articleExercises
        : nextMode === "grammar"
          ? grammarExercises
        : nextMode === "translate"
          ? translationExercises
          : nextMode === "sentence"
            ? SENTENCE_EXERCISES
            : nextMode === "chat"
              ? CHAT_EXERCISES
              : STORY_EPISODES;
    const nextLevels = LEVEL_OPTIONS.filter((entry) =>
      nextModeExercises.some((exercise) => exercise.level === entry),
    );
    setDailyChallengeActive(false);
    setMode(nextMode);
    resetStoryEpisodeState();
    if (!nextLevels.includes(level)) {
      setLevel(nextLevels[0] ?? "A1");
    }
    resetRoundState(ROUND_DURATIONS[nextMode]);
  };

  const handleLevelChange = (nextLevel: ExerciseLevel) => {
    if (!availableLevels.includes(nextLevel) || nextLevel === effectiveLevel) return;
    setDailyChallengeActive(false);
    setLevel(nextLevel);
    resetStoryEpisodeState();
    resetRoundState(ROUND_DURATIONS[mode]);
  };

  const handleGrammarTopicChange = (nextTopic: GrammarTopic) => {
    if (!availableGrammarTopics.includes(nextTopic) || nextTopic === currentGrammarTopic) {
      return;
    }
    setDailyChallengeActive(false);
    setGrammarTopic(nextTopic);
    resetStoryEpisodeState();
    resetRoundState(ROUND_DURATIONS.grammar);
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncTodayChallengeKey = () => {
      const nextKey = getTodayChallengeKey();
      setTodayChallengeKey((current) => (current === nextKey ? current : nextKey));
    };
    const intervalId = window.setInterval(syncTodayChallengeKey, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    resetStoryEpisodeState();
  }, [resetStoryEpisodeState, storyRound.key]);

  useEffect(() => {
    if (previousChallengeKeyRef.current === todayChallengeKey) {
      return;
    }
    previousChallengeKeyRef.current = todayChallengeKey;
    if (!dailyChallengeActive) {
      return;
    }
    setDailyChallengeActive(false);
    resetStoryEpisodeState();
    resetRoundState(ROUND_DURATIONS[mode]);
  }, [
    dailyChallengeActive,
    mode,
    resetRoundState,
    resetStoryEpisodeState,
    todayChallengeKey,
  ]);

  const resolveAnswer = useCallback(
    (
      value: string | null,
      isCorrect: boolean,
      timedOut: boolean,
      options?: ResolveAnswerOptions,
    ) => {
      const nowIso = new Date().toISOString();
      const scoreDelta = isCorrect ? ROUND_SCORE_BONUS[mode] + timeLeft : 0;
      const nextModeStats: GameStats = {
        attempts: activeStats.attempts + 1,
        correct: activeStats.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? activeStats.streak + 1 : 0,
        bestStreak: Math.max(
          activeStats.bestStreak,
          isCorrect ? activeStats.streak + 1 : 0,
        ),
      };
      const nextOverallProgress: OverallProgress = {
        totalScore: overallProgress.totalScore + scoreDelta,
        totalAttempts: overallProgress.totalAttempts + 1,
        totalCorrect: overallProgress.totalCorrect + (isCorrect ? 1 : 0),
        currentStreak: isCorrect ? overallProgress.currentStreak + 1 : 0,
        bestStreak: Math.max(
          overallProgress.bestStreak,
          isCorrect ? overallProgress.currentStreak + 1 : 0,
        ),
      };
      const nextLives = isCorrect
        ? recoverLivesState(recoveredLivesState, Date.parse(nowIso))
        : consumeLife(recoveredLivesState, nowIso);
      const shouldCompleteDaily =
        typeof options?.completeDaily === "boolean"
          ? options.completeDaily
          : dailyChallengeActive &&
            dailyChallengeState.date === todayChallengeKey &&
            !dailyChallengeState.completed;
      const dailyScore = options?.dailyScore ?? scoreDelta;
      const dailyCorrect = options?.dailyCorrect ?? isCorrect;
      const nextDailyState: DailyChallengeState = shouldCompleteDaily
        ? {
            date: todayChallengeKey,
            completed: true,
            score: dailyScore,
            correct: dailyCorrect,
            mode,
            level: effectiveLevel,
          }
        : dailyChallengeState;

      setAnswerState({ value, correct: isCorrect, timedOut });
      setAnswerAnimation(isCorrect ? "correct" : "wrong");
      setStats((current) => ({ ...current, [mode]: nextModeStats }));
      setOverallProgress(nextOverallProgress);
      setLivesState(nextLives);
      if (mode === "grammar" && !dailyChallengeActive) {
        setGrammarMastery((current) => {
          const currentValue = current[currentGrammarTopic] ?? 0;
          const nextValue = Math.max(
            0,
            Math.min(GRAMMAR_MASTERY_MAX, currentValue + (isCorrect ? 1 : -1)),
          );
          if (nextValue === currentValue) {
            return current;
          }
          return { ...current, [currentGrammarTopic]: nextValue };
        });
      }
      if (shouldCompleteDaily) {
        setDailyChallengeState(nextDailyState);
      }
      playFeedbackSound(isCorrect ? "correct" : "wrong");

      if (!sessionUserId) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;
      void (async () => {
        try {
          await persistUserStatePatch({
            total_score: nextOverallProgress.totalScore,
            total_attempts: nextOverallProgress.totalAttempts,
            total_correct: nextOverallProgress.totalCorrect,
            current_streak: nextOverallProgress.currentStreak,
            best_streak: nextOverallProgress.bestStreak,
            lives: nextLives.infinite ? MAX_LIVES : nextLives.lives,
            last_life_refill_at: nextLives.lastRefillAt,
            daily_challenge_date: nextDailyState.date,
            daily_challenge_score: nextDailyState.score,
            daily_challenge_completed: nextDailyState.completed,
          });
          const modeResult = await supabase.from("mini_game_mode_progress").upsert(
            {
              user_id: sessionUserId,
              mode,
              total_attempts: nextModeStats.attempts,
              total_correct: nextModeStats.correct,
              current_streak: nextModeStats.streak,
              best_streak: nextModeStats.bestStreak,
              updated_at: nowIso,
            },
            { onConflict: "user_id,mode" },
          );
          if (modeResult.error) throw modeResult.error;
          if (shouldCompleteDaily) {
            const dailyResult = await supabase
              .from("mini_game_daily_results")
              .upsert(
                {
                  challenge_date: todayChallengeKey,
                  user_id: sessionUserId,
                  mode,
                  level: effectiveLevel,
                  score: dailyScore,
                  correct: dailyCorrect,
                  completed_at: nowIso,
                },
                { onConflict: "challenge_date,user_id" },
              );
            if (dailyResult.error) throw dailyResult.error;
          }
          setPersistenceStatus({ type: "idle", message: "" });
          await refreshLeaderboards();
        } catch (error) {
          setPersistenceStatus({
            type: "error",
            message: getErrorMessage(error, "Failed to sync game progress."),
          });
        }
      })();
    },
    [
      activeStats,
      dailyChallengeActive,
      dailyChallengeState,
      effectiveLevel,
      getErrorMessage,
      currentGrammarTopic,
      mode,
      overallProgress,
      persistUserStatePatch,
      playFeedbackSound,
      recoveredLivesState,
      refreshLeaderboards,
      sessionUserId,
      timeLeft,
      todayChallengeKey,
    ],
  );

  const handleNextQuestion = () => {
    if (isStoryMode) {
      if (!isFinalStoryDecision) {
        setStoryDecisionIndex((value) => value + 1);
        resetRoundState(currentRoundDuration);
        return;
      }
      const wasDailyChallenge = dailyChallengeActive;
      setDailyChallengeActive(false);
      resetStoryEpisodeState();
      resetRoundState(currentRoundDuration);
      setStorySeed((value) => value + (wasDailyChallenge ? 2 : 1));
      return;
    }
    const wasDailyChallenge = dailyChallengeActive;
    setDailyChallengeActive(false);
    resetRoundState(currentRoundDuration);
    if (isArticleMode) {
      setArticleSeed((value) => value + (wasDailyChallenge ? 2 : 1));
      return;
    }
    if (isGrammarMode) {
      setGrammarSeed((value) => value + (wasDailyChallenge ? 2 : 1));
      return;
    }
    if (isTranslateMode) {
      setTranslationSeed((value) => value + (wasDailyChallenge ? 2 : 1));
      return;
    }
    if (isSentenceMode) {
      setSentenceSeed((value) => value + (wasDailyChallenge ? 2 : 1));
      return;
    }
    if (isChatMode) {
      setChatSeed((value) => value + (wasDailyChallenge ? 2 : 1));
      return;
    }
    setStorySeed((value) => value + (wasDailyChallenge ? 2 : 1));
  };

  const handlePlayDailyChallenge = () => {
    if (dailyChallengeState.completed) return;
    setDailyChallengeActive(true);
    setMode(dailyChallengeRound.mode);
    setLevel(dailyChallengeRound.level);
    resetStoryEpisodeState();
    resetRoundState(ROUND_DURATIONS[dailyChallengeRound.mode]);
  };

  const handleAnswer = (value: string) => {
    if (answerState || isSentenceMode || !hasAvailableLives) return;
    if (isStoryMode) {
      const isCorrect = value === currentStoryStep.correctAnswer;
      const scoreDelta = isCorrect ? ROUND_SCORE_BONUS.story + timeLeft : 0;
      const nextEpisodeScore = storyEpisodeScore + scoreDelta;
      const nextEpisodeCorrectCount = storyEpisodeCorrectCount + (isCorrect ? 1 : 0);
      const shouldCompleteDailyChallenge =
        dailyChallengeActive &&
        dailyChallengeState.date === todayChallengeKey &&
        !dailyChallengeState.completed &&
        isFinalStoryDecision;

      setStoryEpisodeScore(nextEpisodeScore);
      setStoryEpisodeCorrectCount(nextEpisodeCorrectCount);
      resolveAnswer(value, isCorrect, false, {
        completeDaily: shouldCompleteDailyChallenge,
        dailyScore: nextEpisodeScore,
        dailyCorrect: nextEpisodeCorrectCount === currentStoryEpisode.steps.length,
      });
      return;
    }

    const isCorrect = isArticleMode
      ? value === articleRound.exercise.article
      : isGrammarMode
        ? value === grammarRound.exercise.correctAnswer
      : isTranslateMode
        ? normalizeTranslationAnswer(value) ===
          normalizeTranslationAnswer(translationRound.exercise.target)
        : value === chatRound.exercise.correctReply;
    resolveAnswer(value, isCorrect, false);
  };

  const handleTranslationSubmit = () => {
    if (!isTranslateMode || answerState || !hasAvailableLives) return;
    const nextValue = translationInput.trim();
    if (!nextValue) return;
    handleAnswer(nextValue);
  };

  const handleSentenceTokenSelect = (tokenId: string) => {
    if (answerState || !hasAvailableLives) return;
    setSentenceSelection((current) =>
      current.includes(tokenId) ? current : [...current, tokenId],
    );
  };

  const handleSentenceTokenRemove = (tokenId: string) => {
    if (answerState || !hasAvailableLives) return;
    setSentenceSelection((current) => current.filter((id) => id !== tokenId));
  };

  const handleSentenceClear = () => {
    if (answerState || !hasAvailableLives) return;
    setSentenceSelection([]);
  };

  const handleSentenceCheck = () => {
    if (answerState || !isSentenceMode || !hasAvailableLives) return;
    if (selectedSentenceTokens.length !== sentenceRound.exercise.words.length) return;
    const builtSentence = selectedSentenceTokens.map((token) => token.word).join(" ");
    const correctSentence = sentenceRound.exercise.words.join(" ");
    resolveAnswer(builtSentence, builtSentence === correctSentence, false);
  };

  useEffect(() => {
    if (!sessionUserId) {
      setPersistenceStatus({ type: "idle", message: "" });
      setStats(INITIAL_STATS);
      setOverallProgress(INITIAL_OVERALL_PROGRESS);
      setLivesState(createInitialLivesState(isPremium));
      setDailyChallengeState({
        date: todayChallengeKey,
        completed: false,
        score: 0,
        correct: null,
        mode: dailyChallengeRound.mode,
        level: dailyChallengeRound.level,
      });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    void (async () => {
      setPersistenceStatus({ type: "loading", message: "" });
      try {
        const [stateResult, modeResult] = await Promise.all([
          supabase
            .from("mini_game_user_state")
            .select(
              "user_id,total_score,total_attempts,total_correct,current_streak,best_streak,lives,last_life_refill_at,daily_challenge_date,daily_challenge_score,daily_challenge_completed",
            )
            .eq("user_id", sessionUserId)
            .maybeSingle(),
          supabase
            .from("mini_game_mode_progress")
            .select(
              "user_id,mode,total_attempts,total_correct,current_streak,best_streak",
            )
            .eq("user_id", sessionUserId),
        ]);
        if (stateResult.error || modeResult.error) {
          throw stateResult.error ?? modeResult.error;
        }
        if (!active) return;
        const stateRow = stateResult.data as MiniGameUserStateRow | null;
        const modeRows = (modeResult.data ?? []) as MiniGameModeProgressRow[];
        const normalizedLives = recoverLivesState(
          stateRow
            ? {
                lives: stateRow.lives,
                lastRefillAt: stateRow.last_life_refill_at,
                nextRefillAt: null,
                infinite: isPremium,
              }
            : createInitialLivesState(isPremium),
        );
        setStats(buildStatsFromRows(modeRows));
        setOverallProgress(
          stateRow
            ? {
                totalScore: stateRow.total_score,
                totalAttempts: stateRow.total_attempts,
                totalCorrect: stateRow.total_correct,
                currentStreak: stateRow.current_streak,
                bestStreak: stateRow.best_streak,
              }
            : INITIAL_OVERALL_PROGRESS,
        );
        setLivesState(normalizedLives);
        setDailyChallengeState({
          date: todayChallengeKey,
          completed:
            stateRow?.daily_challenge_date === todayChallengeKey &&
            Boolean(stateRow.daily_challenge_completed),
          score:
            stateRow?.daily_challenge_date === todayChallengeKey
              ? stateRow.daily_challenge_score ?? 0
              : 0,
          correct: null,
          mode: dailyChallengeRound.mode,
          level: dailyChallengeRound.level,
        });
        if (!stateRow) {
          await persistUserStatePatch({
            lives: normalizedLives.lives,
            last_life_refill_at: normalizedLives.lastRefillAt,
            daily_challenge_date: todayChallengeKey,
            daily_challenge_score: 0,
            daily_challenge_completed: false,
          });
        } else if (
          !normalizedLives.infinite &&
          (normalizedLives.lives !== stateRow.lives ||
            normalizedLives.lastRefillAt !== stateRow.last_life_refill_at)
        ) {
          await persistUserStatePatch({
            lives: normalizedLives.lives,
            last_life_refill_at: normalizedLives.lastRefillAt,
          });
        }
        setPersistenceStatus({ type: "idle", message: "" });
      } catch (error) {
        if (!active) return;
        setPersistenceStatus({
          type: "error",
          message: getErrorMessage(error, "Failed to load game progress."),
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [
    dailyChallengeRound.level,
    dailyChallengeRound.mode,
    getErrorMessage,
    isPremium,
    persistUserStatePatch,
    sessionUserId,
    todayChallengeKey,
  ]);

  useEffect(() => {
    void refreshLeaderboards().catch((error) => {
      setPersistenceStatus((current) =>
        current.type === "error"
          ? current
          : {
              type: "error",
              message: getErrorMessage(error, "Failed to load leaderboard."),
            },
      );
    });
  }, [getErrorMessage, refreshLeaderboards]);

  useEffect(() => {
    if (recoveredLivesState.infinite || !recoveredLivesState.nextRefillAt) return;
    const intervalId = window.setInterval(() => {
      void syncLivesRecovery();
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [recoveredLivesState.infinite, recoveredLivesState.nextRefillAt, syncLivesRecovery]);

  useEffect(() => {
    if (answerState || !hasAvailableLives) return;
    const timeoutId = window.setTimeout(() => {
      if (timeLeft <= 1) {
        if (isStoryMode) {
          const nextEpisodeScore = storyEpisodeScore;
          const shouldCompleteDailyChallenge =
            dailyChallengeActive &&
            dailyChallengeState.date === todayChallengeKey &&
            !dailyChallengeState.completed &&
            isFinalStoryDecision;
          resolveAnswer(null, false, true, {
            completeDaily: shouldCompleteDailyChallenge,
            dailyScore: nextEpisodeScore,
            dailyCorrect: false,
          });
        } else {
          resolveAnswer(null, false, true);
        }
        return;
      }
      setTimeLeft((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [
    answerState,
    dailyChallengeActive,
    dailyChallengeState,
    hasAvailableLives,
    isFinalStoryDecision,
    isStoryMode,
    resolveAnswer,
    storyEpisodeScore,
    timeLeft,
    todayChallengeKey,
  ]);

  useEffect(() => {
    if (!answerState) return;
    const timeoutId = window.setTimeout(() => setAnswerAnimation(null), 700);
    return () => window.clearTimeout(timeoutId);
  }, [answerState]);

  const feedbackTitle = answerState
    ? answerState.correct
      ? text.correct
      : answerState.timedOut
        ? text.timeout
        : text.incorrect
    : isArticleMode
      ? text.chooseArticle
      : isGrammarMode
        ? text.chooseGrammar ?? "Choose the correct case form."
      : isTranslateMode
        ? text.chooseTranslation
        : isSentenceMode
          ? text.chooseSentence
          : isChatMode
            ? text.chooseChat
            : text.chooseStory ?? "Pick the answer that fits the story best.";

  const feedbackBody = answerState
    ? isArticleMode
      ? `${articleRound.exercise.article} ${articleRound.exercise.noun} (${articleRound.exercise.hint})`
      : isGrammarMode
        ? `${grammarRound.exercise.correctAnswer} (${grammarRound.exercise.explanation})`
      : isTranslateMode
        ? `${translationRound.exercise.source} = ${translationRound.exercise.target}`
        : isSentenceMode
          ? `${sentenceRound.exercise.words.join(" ")} (${sentenceRound.exercise.translation})`
          : isChatMode
            ? `${chatRound.exercise.correctReply} (${chatRound.exercise.feedback})`
            : `${currentStoryStep.correctAnswer} (${currentStoryStep.explanation})`
    : isArticleMode
      ? text.explainArticle
      : isGrammarMode
        ? text.explainGrammar ??
          "Watch the signal word: verb, preposition, and movement vs. location decide the case."
      : isTranslateMode
        ? text.explainTranslation
      : isSentenceMode
          ? text.explainSentence
          : isChatMode
            ? text.explainChat
            : text.explainStory ?? "Look for the response that solves the situation clearly and naturally.";
  const storyDecisionLabel = `${
    text.storyDecisionLabel ?? "Decision"
  } ${Math.min(storyDecisionIndex + 1, currentStoryEpisode.steps.length)}/${currentStoryEpisode.steps.length}`;
  const storyEpisodeScoreLabel = `${
    text.storyEpisodeScoreLabel ?? "Episode score"
  }: ${storyEpisodeScore}`;
  const storyEpisodeResultLabel = `${
    text.storyEpisodeResultLabel ?? "Episode result"
  }: ${storyEpisodeCorrectCount}/${currentStoryEpisode.steps.length}`;
  const storyHistory = currentStoryEpisode.steps.slice(0, storyDecisionIndex);
  const nextButtonLabel = isStoryMode
    ? isFinalStoryDecision
      ? dailyChallengeActive
        ? text.dailyChallengeBack ?? "Back to practice"
        : text.nextEpisodeLabel ?? "Next episode"
      : text.nextDecisionLabel ?? "Next decision"
    : dailyChallengeActive
      ? text.dailyChallengeBack ?? "Back to practice"
      : text.nextQuestion;

  return (
    <div className="miniGamesPage">
      <div className="miniGamesModeRow" role="tablist" aria-label={text.title}>
        <button
          className={`miniGamesModeButton${
            isArticleMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("article")}
        >
          {text.articleMode}
        </button>
        <button
          className={`miniGamesModeButton${
            isGrammarMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("grammar")}
        >
          {text.grammarMode ?? "Grammar cases"}
        </button>
        <button
          className={`miniGamesModeButton${
            isTranslateMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("translate")}
        >
          {text.translateMode}
        </button>
        <button
          className={`miniGamesModeButton${
            isSentenceMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("sentence")}
        >
          {text.sentenceMode}
        </button>
        <button
          className={`miniGamesModeButton${
            isChatMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("chat")}
        >
          {text.chatMode}
        </button>
        <button
          className={`miniGamesModeButton${
            isStoryMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("story")}
        >
          {text.storyMode ?? "Story mode"}
        </button>
      </div>

      <div className="miniGamesLevelRow" role="tablist" aria-label={text.levelFilterLabel}>
        {LEVEL_OPTIONS.map((option) => {
          const isAvailable = availableLevels.includes(option);
          const isActive = effectiveLevel === option;
          return (
            <button
              key={option}
              className={`miniGamesLevelButton${
                isActive ? " miniGamesLevelButtonActive" : ""
              }`}
              type="button"
              disabled={!isAvailable}
              onClick={() => handleLevelChange(option)}
            >
              {option}
            </button>
          );
        })}
      </div>

      {isGrammarMode ? (
        <div
          className="miniGamesLevelRow miniGamesGrammarTopicRow"
          role="tablist"
          aria-label={text.grammarTopicsLabel ?? "Grammar topics"}
        >
          {GRAMMAR_TOPIC_ORDER.map((topic) => {
            const isAvailable = availableGrammarTopics.includes(topic);
            const isActive = currentGrammarTopic === topic;
            return (
              <button
                key={topic}
                className={`miniGamesLevelButton miniGamesGrammarTopicButton${
                  isActive ? " miniGamesLevelButtonActive" : ""
                }`}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleGrammarTopicChange(topic)}
              >
                {GRAMMAR_TOPIC_LABELS[topic]}
              </button>
            );
          })}
        </div>
      ) : null}

      {persistenceStatus.type === "error" ? (
        <div className="miniGamesSyncStatus miniGamesSyncStatusError" role="status">
          {persistenceStatus.message}
        </div>
      ) : null}

      {!sessionUserId ? (
        <div className="miniGamesSyncStatus" role="status">
          {text.signInSyncHint ??
            "Sign in to save progress, daily challenge, and leaderboard results."}
        </div>
      ) : null}

      <section className="miniGamesChallengeCard">
        <div>
          <div className="miniGamesChallengeEyebrow">
            {text.dailyChallengeLabel ?? "Daily challenge"}
          </div>
          <div className="miniGamesChallengeTitle">
            {getModeLabel(text, dailyChallengeRound.mode)} / {dailyChallengeRound.level}
          </div>
          <p className="miniGamesChallengeCopy">
            {dailyChallengeState.completed
              ? text.dailyChallengeDone ??
                `Completed today with ${dailyChallengeState.score} points.`
              : text.dailyChallengeCopy ??
                "One fixed challenge every day. Finish it once to enter the daily leaderboard."}
          </p>
        </div>
        <button
          className="miniGamesChallengeButton"
          type="button"
          disabled={dailyChallengeState.completed}
          onClick={handlePlayDailyChallenge}
        >
          {dailyChallengeState.completed
            ? text.dailyChallengeComplete ?? "Completed"
            : text.dailyChallengePlay ?? "Play daily challenge"}
        </button>
      </section>

      <section
        className={`miniGamesStage${
          answerAnimation === "correct"
            ? " miniGamesStageCorrect"
            : answerAnimation === "wrong"
              ? " miniGamesStageWrong"
              : ""
        }`}
      >
        <div className="miniGamesHud">
          <div className="miniGamesHudPill">
            <span aria-hidden="true">🔥</span>
            <span>
              {text.scoreBadge}: {overallProgress.totalScore}
            </span>
          </div>
          <div className="miniGamesHudPill">
            <span aria-hidden="true">⏱️</span>
            <span>
              {text.timerBadge}: {formatTimer(timeLeft)}
            </span>
          </div>
          <div className="miniGamesHudPill">
            <span>{text.livesBadge ?? "Lives"}:</span>
            <strong>
              {recoveredLivesState.infinite
                ? text.livesInfinite ?? "Premium"
                : recoveredLivesState.lives}
            </strong>
            {!recoveredLivesState.infinite && nextLifeCountdown ? (
              <small>{nextLifeCountdown}</small>
            ) : null}
          </div>
        </div>

        <div className="miniGamesVisual">
          <div className="miniGamesVisualAura" />
          <div className="miniGamesEmoji" aria-hidden="true">
            {activeExercise.emoji}
          </div>
        </div>

        <div className="miniGamesQuestionBlock">
          {isGrammarMode && !dailyChallengeActive ? (
            <div className="miniGamesGrammarFlow">
              <span className="miniGamesGrammarFlowLabel">
                {text.grammarFlowLabel ?? "Training flow"}
              </span>
              <span className="miniGamesGrammarFlowChip">{currentGrammarLayerLabel}</span>
              <span className="miniGamesGrammarFlowProgress">{currentGrammarFlowProgress}</span>
              <span className="miniGamesGrammarFlowText">{currentGrammarFlowCopy}</span>
            </div>
          ) : null}
          {isGrammarMode ? (
            <div className="miniGamesGrammarRule">
              <span className="miniGamesGrammarRuleLabel">
                {text.grammarRuleLabel ?? "Rule"}
              </span>
              <span className="miniGamesGrammarRuleTopic">{currentGrammarTopicLabel}</span>
              <span className="miniGamesGrammarRuleText">{grammarRound.exercise.rule}</span>
            </div>
          ) : null}
          {isChatMode ? (
            <div className="miniGamesChatPreview">
              <div className="miniGamesChatMeta">
                <span>{chatRound.exercise.contact}</span>
                <span>
                  {text.chatScenarioLabel}: {chatRound.exercise.scenario}
                </span>
              </div>
              <div className="miniGamesChatBubble">
                {chatRound.exercise.incoming}
              </div>
            </div>
          ) : isStoryMode ? (
            <div className="miniGamesStoryPreview">
              <div className="miniGamesStoryTitle">
                <span>{currentStoryEpisode.title}</span>
                <small>{effectiveLevel}</small>
              </div>
              <div className="miniGamesStoryMetaRow">
                <span className="miniGamesStoryMetaChip">
                  {text.storySettingLabel ?? "Place"}: {currentStoryEpisode.setting}
                </span>
                <span className="miniGamesStoryMetaChip">{storyDecisionLabel}</span>
                <span className="miniGamesStoryMetaChip">{storyEpisodeScoreLabel}</span>
                {(currentStoryEpisode.characters ?? []).map((character) => (
                  <span className="miniGamesStoryMetaChip" key={character}>
                    {character}
                  </span>
                ))}
              </div>
              <div className="miniGamesStorySetup">{currentStoryEpisode.setup}</div>
              {storyHistory.length ? (
                <div className="miniGamesStoryBeats">
                  {storyHistory.map((step, index) => (
                    <div className="miniGamesStoryBeat" key={`${currentStoryEpisode.id}-beat-${step.id}`}>
                      <span className="miniGamesStoryBeatIndex">{index + 1}</span>
                      <span>{step.scene}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="miniGamesStoryQuestion">
                <strong>{text.storySceneLabel ?? "Scene"}:</strong> {currentStoryStep.scene}
              </div>
              <div className="miniGamesStoryQuestion">
                <strong>{text.storyQuestionLabel ?? "Question"}:</strong>{" "}
                {currentStoryStep.question}
              </div>
            </div>
          ) : (
            <div className="miniGamesWordLine">
              {isArticleMode ? (
                <>
                  <span className="miniGamesMissingArticle">___</span>
                  <span>{articleRound.exercise.noun}</span>
                </>
              ) : isGrammarMode ? (
                <span>{grammarRound.exercise.sentence}</span>
              ) : isTranslateMode ? (
                <span>{translationRound.exercise.source}</span>
              ) : (
                <span>{sentenceRound.exercise.translation}</span>
              )}
            </div>
          )}
          <p className="miniGamesInstruction">
            {isArticleMode
              ? text.articleMissingLabel
              : isGrammarMode
                ? grammarRound.exercise.question
              : isTranslateMode
                ? text.translatePrompt
                : isSentenceMode
                  ? text.sentencePrompt
                  : isChatMode
                    ? text.chatPrompt
                    : text.storyPrompt ?? "Read the scene and choose the best continuation."}
          </p>
          <p className="miniGamesHint">
            {isArticleMode ? (
              <>
                {text.hintLabel}: {articleRound.exercise.hint}
              </>
            ) : isGrammarMode ? (
              <>
                {text.hintLabel}: {grammarRound.exercise.translation} (
                {effectiveLevel} / {currentGrammarTopicLabel})
              </>
            ) : isTranslateMode ? (
              <>
                {text.levelLabel}: {effectiveLevel}
              </>
            ) : isSentenceMode ? (
              <>
                {text.sentenceHintLabel}: {sentenceRound.exercise.translation} ({effectiveLevel})
              </>
            ) : isChatMode ? (
              <>
                {text.chatHintLabel}: {chatRound.exercise.translation} ({effectiveLevel})
              </>
            ) : (
              <>
                {text.storyHintLabel ?? "Story"}: {currentStoryStep.translation} ({effectiveLevel})
              </>
            )}
          </p>
        </div>

        <div
          className={`miniGamesOptions miniGamesOptions${
            isArticleMode
              ? "Article"
              : isGrammarMode
                ? "Grammar"
              : isTranslateMode
                ? "Translate"
                : isSentenceMode
                  ? "Sentence"
                  : isChatMode
                    ? "Chat"
                    : "Story"
          }`}
        >
          {isArticleMode
            ? articleRound.options.map((option) => {
                const isCorrect = option === articleRound.exercise.article;
                const isSelected = answerState?.value === option;
                return (
                  <button
                    key={option}
                    className={`miniGamesOption miniGamesOptionArticle miniGamesOptionArticle${option[0].toUpperCase()}${option.slice(1)}${
                      answerState && isCorrect ? " miniGamesOptionCorrect" : ""
                    }${
                      answerState && isSelected && !isCorrect
                        ? " miniGamesOptionWrong"
                        : ""
                    }`}
                    type="button"
                    disabled={Boolean(answerState) || !hasAvailableLives}
                    onClick={() => handleAnswer(option)}
                  >
                    <span className="miniGamesOptionTitle">{option}</span>
                  </button>
                );
              })
            : isGrammarMode
              ? grammarRound.options.map((option) => {
                  const isCorrect = option === grammarRound.exercise.correctAnswer;
                  const isSelected = answerState?.value === option;
                  return (
                    <button
                      key={`${grammarRound.exercise.id}-${option}`}
                      className={`miniGamesOption miniGamesOptionTranslate miniGamesOptionGrammar${
                        answerState && isCorrect ? " miniGamesOptionCorrect" : ""
                      }${
                        answerState && isSelected && !isCorrect
                          ? " miniGamesOptionWrong"
                          : ""
                      }`}
                      type="button"
                      disabled={Boolean(answerState) || !hasAvailableLives}
                      onClick={() => handleAnswer(option)}
                    >
                      <span className="miniGamesOptionBody">{option}</span>
                    </button>
                  );
                })
            : isTranslateMode
              ? (
                <form
                  className="miniGamesTranslateComposer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleTranslationSubmit();
                  }}
                >
                  <input
                    className={`miniGamesTranslateInput${
                      answerState?.correct
                        ? " miniGamesTranslateInputCorrect"
                        : answerState
                          ? " miniGamesTranslateInputWrong"
                          : ""
                    }`}
                    type="text"
                    value={translationInput}
                    disabled={Boolean(answerState) || !hasAvailableLives}
                    placeholder={text.translateInputPlaceholder ?? "Type the translation"}
                    onChange={(event) => setTranslationInput(event.target.value)}
                  />
                  <button
                    className="miniGamesTranslateSubmit"
                    type="submit"
                    disabled={
                      !translationInput.trim() || Boolean(answerState) || !hasAvailableLives
                    }
                  >
                    {text.submitTranslation ?? "Check answer"}
                  </button>
                </form>
              )
              : isSentenceMode ? (
                <div className="miniGamesSentenceBoard">
                  <div className="miniGamesSentenceAnswer">
                    {selectedSentenceTokens.length ? (
                      selectedSentenceTokens.map((token) => (
                        <button
                          key={token.id}
                          className="miniGamesSentenceToken miniGamesSentenceTokenSelected"
                          type="button"
                          onClick={() => handleSentenceTokenRemove(token.id)}
                        >
                          {token.word}
                        </button>
                      ))
                    ) : (
                      <span className="miniGamesSentencePlaceholder">
                        {text.sentenceEmpty}
                      </span>
                    )}
                  </div>

                  <div className="miniGamesSentenceBank">
                    {availableSentenceTokens.map((token) => (
                      <button
                        key={token.id}
                        className="miniGamesSentenceToken"
                        type="button"
                        disabled={!hasAvailableLives}
                        onClick={() => handleSentenceTokenSelect(token.id)}
                      >
                        {token.word}
                      </button>
                    ))}
                  </div>

                  <div className="miniGamesSentenceActions">
                    <button
                      className="miniGamesSentenceAction"
                      type="button"
                      disabled={!hasAvailableLives}
                      onClick={handleSentenceClear}
                    >
                      {text.clearSentence}
                    </button>
                    <button
                      className="miniGamesSentenceAction miniGamesSentenceActionPrimary"
                      type="button"
                      disabled={
                        !hasAvailableLives ||
                        selectedSentenceTokens.length !==
                        sentenceRound.exercise.words.length
                      }
                      onClick={handleSentenceCheck}
                    >
                      {text.checkSentence}
                    </button>
                  </div>
                </div>
              ) : isChatMode ? (
                chatRound.options.map((option) => {
                  const isCorrect = option === chatRound.exercise.correctReply;
                  const isSelected = answerState?.value === option;
                  return (
                    <button
                      key={option}
                      className={`miniGamesOption miniGamesOptionTranslate miniGamesOptionChat${
                        answerState && isCorrect ? " miniGamesOptionCorrect" : ""
                      }${
                        answerState && isSelected && !isCorrect
                          ? " miniGamesOptionWrong"
                          : ""
                      }`}
                      type="button"
                      disabled={Boolean(answerState) || !hasAvailableLives}
                      onClick={() => handleAnswer(option)}
                    >
                      <span className="miniGamesOptionBody">{option}</span>
                    </button>
                  );
                })
              ) : (
                currentStoryStepOptions.map((option) => {
                  const isCorrect = option === currentStoryStep.correctAnswer;
                  const isSelected = answerState?.value === option;
                  return (
                    <button
                      key={`${currentStoryStep.id}-${option}`}
                      className={`miniGamesOption miniGamesOptionTranslate miniGamesOptionStory${
                        answerState && isCorrect ? " miniGamesOptionCorrect" : ""
                      }${
                        answerState && isSelected && !isCorrect
                          ? " miniGamesOptionWrong"
                          : ""
                      }`}
                      type="button"
                      disabled={Boolean(answerState) || !hasAvailableLives}
                      onClick={() => handleAnswer(option)}
                    >
                      <span className="miniGamesOptionBody">{option}</span>
                    </button>
                  );
                })
              )}
        </div>

        {!hasAvailableLives ? (
          <div className="miniGamesLivesEmptyCard">
            <strong>{text.livesEmptyTitle ?? "No lives left"}</strong>
            <span>
              {recoveredLivesState.infinite
                ? text.premiumLivesCopy ?? "Premium keeps your lives unlimited."
                : text.livesEmptyCopy ??
                  `You lose one life for a wrong answer or timeout. One life comes back every 2 hours${
                    nextLifeCountdown ? ` / ${nextLifeCountdown}` : ""
                  }.`}
            </span>
          </div>
        ) : null}

        <div
          className={`miniGamesResultPanel${
            answerAnimation === "correct"
              ? " miniGamesResultPanelCorrect"
              : answerAnimation === "wrong"
                ? " miniGamesResultPanelWrong"
                : ""
          }`}
        >
          <div
            className={`miniGamesFeedbackBadge${
              answerState?.correct
                ? " miniGamesFeedbackBadgeSuccess"
                : answerState
                  ? " miniGamesFeedbackBadgeError"
                  : ""
            }`}
          >
            <span aria-hidden="true">
              {answerState?.correct ? "✅" : answerState ? "⏳" : "🎯"}
            </span>
            <span>
              <strong>{feedbackTitle}</strong>
              <small>{feedbackBody}</small>
            </span>
          </div>

          <div className="miniGamesStreakRow">
            <span>
              {text.starsLabel}: {activeStats.streak}
            </span>
            <span className="miniGamesStars" aria-hidden="true">
              {renderStreakStars(activeStats.streak)}
            </span>
          </div>

          {isStoryMode && (answerState || storyDecisionIndex > 0 || storyEpisodeScore > 0) ? (
            <div className="miniGamesStoryEpisodeSummary">
              <span>{storyEpisodeResultLabel}</span>
              <strong>{storyEpisodeScoreLabel}</strong>
            </div>
          ) : null}

          <button
            className="miniGamesNextButton"
            type="button"
            disabled={!answerState}
            onClick={handleNextQuestion}
          >
            {nextButtonLabel}{" "}
            →
          </button>
        </div>
      </section>

      <div className="miniGamesStats">
        <article className="miniGamesStatCard">
          <span>{text.scoreLabel}</span>
          <strong>{overallProgress.totalScore}</strong>
        </article>
        <article className="miniGamesStatCard">
          <span>{text.statsAccuracy}</span>
          <strong>{formatAccuracy(activeStats)}</strong>
        </article>
        <article className="miniGamesStatCard">
          <span>{text.statsStreak}</span>
          <strong>{activeStats.streak}</strong>
        </article>
        <article className="miniGamesStatCard">
          <span>{text.statsBest}</span>
          <strong>{activeStats.bestStreak}</strong>
        </article>
      </div>

      <section className="miniGamesLeaderboard">
        <div className="miniGamesLeaderboardHeader">
          <div>
            <div className="miniGamesChallengeEyebrow">
              {text.leaderboardLabel ?? "Leaderboard"}
            </div>
            <div className="miniGamesChallengeTitle">
              {leaderboardTab === "daily"
                ? text.leaderboardDaily ?? "Today"
                : text.leaderboardAllTime ?? "All time"}
            </div>
          </div>
          <div className="miniGamesLeaderboardTabs">
            <button
              className={`miniGamesLeaderboardTab${
                leaderboardTab === "daily" ? " miniGamesLeaderboardTabActive" : ""
              }`}
              type="button"
              onClick={() => setLeaderboardTab("daily")}
            >
              {text.leaderboardDaily ?? "Today"}
            </button>
            <button
              className={`miniGamesLeaderboardTab${
                leaderboardTab === "allTime" ? " miniGamesLeaderboardTabActive" : ""
              }`}
              type="button"
              onClick={() => setLeaderboardTab("allTime")}
            >
              {text.leaderboardAllTime ?? "All time"}
            </button>
          </div>
        </div>
        <div className="miniGamesLeaderboardList">
          {(leaderboardTab === "daily" ? dailyLeaderboard : allTimeLeaderboard).length ? (
            (leaderboardTab === "daily" ? dailyLeaderboard : allTimeLeaderboard).map(
              (entry, index) => (
                <div className="miniGamesLeaderboardRow" key={`${entry.userId}-${index}`}>
                  <div className="miniGamesLeaderboardRank">#{index + 1}</div>
                  <div className="miniGamesLeaderboardAvatar">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.name} />
                    ) : (
                      <span>{entry.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="miniGamesLeaderboardMeta">
                    <strong>{entry.name}</strong>
                    <span>{entry.detail}</span>
                  </div>
                  <div className="miniGamesLeaderboardScore">{entry.score}</div>
                </div>
              ),
            )
          ) : (
            <div className="miniGamesLeaderboardEmpty">
              {text.leaderboardEmpty ?? "No results yet."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
