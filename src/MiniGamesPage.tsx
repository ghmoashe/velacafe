import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_EXERCISES,
  SENTENCE_EXERCISES,
  getArticleExercises,
  getTranslationExercises,
  type ArticleExercise,
  type ArticleOption,
  type ChatExercise,
  type SentenceExercise,
  type TranslationExercise,
} from "./miniGamesData";
import { getMiniGamesText } from "./miniGamesText";
import { getSupabaseClient } from "./supabaseClient";

type MiniGamesPageProps = {
  locale: string;
  sessionUserId?: string | null;
  isPremium?: boolean;
};

type GameMode = "article" | "translate" | "sentence" | "chat";
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
  | {
      mode: "translate";
      level: ExerciseLevel;
      key: string;
      translationRound: TranslationRound;
    }
  | { mode: "sentence"; level: ExerciseLevel; key: string; sentenceRound: SentenceRound }
  | { mode: "chat"; level: ExerciseLevel; key: string; chatRound: ChatRound };

const ARTICLE_OPTIONS: ArticleOption[] = ["der", "die", "das"];
const LEVEL_OPTIONS: ExerciseLevel[] = ["A1", "A2", "B1"];
const GAME_MODE_ORDER: GameMode[] = ["article", "translate", "sentence", "chat"];
const ROUND_DURATIONS: Record<GameMode, number> = {
  article: 10,
  translate: 30,
  sentence: 15,
  chat: 20,
};
const ROUND_SCORE_BONUS: Record<GameMode, number> = {
  article: 10,
  translate: 14,
  sentence: 18,
  chat: 20,
};
const MAX_LIVES = 10;
const LIFE_REFILL_MS = 2 * 60 * 60 * 1000;

const INITIAL_STATS: Record<GameMode, GameStats> = {
  article: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  translate: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  sentence: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  chat: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
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
    case "translate":
      return text.translateMode;
    case "sentence":
      return text.sentenceMode;
    case "chat":
      return text.chatMode;
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
  translationExercises: readonly TranslationExercise[];
  sentenceExercises: readonly SentenceExercise[];
  chatExercises: readonly ChatExercise[];
}): DailyChallengeRound {
  const { challengeKey, articleExercises, translationExercises, sentenceExercises, chatExercises } =
    params;
  const mode = GAME_MODE_ORDER[hashString(`${challengeKey}-mode`) % GAME_MODE_ORDER.length];
  const levelPools: Record<
    GameMode,
    Record<ExerciseLevel, readonly ArticleExercise[] | readonly TranslationExercise[] | readonly SentenceExercise[] | readonly ChatExercise[]>
  > = {
    article: {
      A1: articleExercises.filter((exercise) => exercise.level === "A1"),
      A2: articleExercises.filter((exercise) => exercise.level === "A2"),
      B1: articleExercises.filter((exercise) => exercise.level === "B1"),
    },
    translate: {
      A1: translationExercises.filter((exercise) => exercise.level === "A1"),
      A2: translationExercises.filter((exercise) => exercise.level === "A2"),
      B1: translationExercises.filter((exercise) => exercise.level === "B1"),
    },
    sentence: {
      A1: sentenceExercises.filter((exercise) => exercise.level === "A1"),
      A2: sentenceExercises.filter((exercise) => exercise.level === "A2"),
      B1: sentenceExercises.filter((exercise) => exercise.level === "B1"),
    },
    chat: {
      A1: chatExercises.filter((exercise) => exercise.level === "A1"),
      A2: chatExercises.filter((exercise) => exercise.level === "A2"),
      B1: chatExercises.filter((exercise) => exercise.level === "B1"),
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
  const translationExercises = useMemo(
    () => getTranslationExercises(locale),
    [locale],
  );
  const todayChallengeKey = useMemo(() => getTodayChallengeKey(), []);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [mode, setMode] = useState<GameMode>("article");
  const [level, setLevel] = useState<ExerciseLevel>("A1");
  const [articleSeed, setArticleSeed] = useState(0);
  const [translationSeed, setTranslationSeed] = useState(0);
  const [sentenceSeed, setSentenceSeed] = useState(0);
  const [chatSeed, setChatSeed] = useState(0);
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
      case "translate":
        return translationExercises;
      case "sentence":
        return SENTENCE_EXERCISES;
      case "chat":
        return CHAT_EXERCISES;
    }
  }, [articleExercises, mode, translationExercises]);

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

  const dailyChallengeRound = useMemo(
    () =>
      buildDailyChallengeRound({
        challengeKey: todayChallengeKey,
        articleExercises,
        translationExercises,
        sentenceExercises: SENTENCE_EXERCISES,
        chatExercises: CHAT_EXERCISES,
      }),
    [articleExercises, todayChallengeKey, translationExercises],
  );

  const articleRound = useMemo(() => {
    if (dailyChallengeActive && dailyChallengeRound.mode === "article") {
      return dailyChallengeRound.articleRound;
    }
    return createArticleRound(filteredArticleExercises, articleSeed);
  }, [articleSeed, dailyChallengeActive, dailyChallengeRound, filteredArticleExercises]);
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

  const activeStats = stats[mode];
  const currentRoundDuration = ROUND_DURATIONS[mode];
  const isArticleMode = mode === "article";
  const isTranslateMode = mode === "translate";
  const isSentenceMode = mode === "sentence";
  const isChatMode = mode === "chat";
  const recoveredLivesState = recoverLivesState(livesState);
  const hasAvailableLives = recoveredLivesState.infinite || recoveredLivesState.lives > 0;
  const nextLifeCountdown = recoveredLivesState.infinite
    ? ""
    : formatCountdown(recoveredLivesState.nextRefillAt);
  const activeExercise = isArticleMode
    ? articleRound.exercise
    : isTranslateMode
      ? translationRound.exercise
      : isSentenceMode
        ? sentenceRound.exercise
        : chatRound.exercise;

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

  const handleModeChange = (nextMode: GameMode) => {
    const nextModeExercises =
      nextMode === "article"
        ? articleExercises
        : nextMode === "translate"
          ? translationExercises
          : nextMode === "sentence"
            ? SENTENCE_EXERCISES
            : CHAT_EXERCISES;
    const nextLevels = LEVEL_OPTIONS.filter((entry) =>
      nextModeExercises.some((exercise) => exercise.level === entry),
    );
    setDailyChallengeActive(false);
    setMode(nextMode);
    if (!nextLevels.includes(level)) {
      setLevel(nextLevels[0] ?? "A1");
    }
    resetRoundState(ROUND_DURATIONS[nextMode]);
  };

  const handleLevelChange = (nextLevel: ExerciseLevel) => {
    if (!availableLevels.includes(nextLevel) || nextLevel === effectiveLevel) return;
    setDailyChallengeActive(false);
    setLevel(nextLevel);
    resetRoundState(ROUND_DURATIONS[mode]);
  };

  const resolveAnswer = useCallback(
    (value: string | null, isCorrect: boolean, timedOut: boolean) => {
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
        dailyChallengeActive &&
        dailyChallengeState.date === todayChallengeKey &&
        !dailyChallengeState.completed;
      const nextDailyState: DailyChallengeState = shouldCompleteDaily
        ? {
            date: todayChallengeKey,
            completed: true,
            score: scoreDelta,
            correct: isCorrect,
            mode,
            level: effectiveLevel,
          }
        : dailyChallengeState;

      setAnswerState({ value, correct: isCorrect, timedOut });
      setAnswerAnimation(isCorrect ? "correct" : "wrong");
      setStats((current) => ({ ...current, [mode]: nextModeStats }));
      setOverallProgress(nextOverallProgress);
      setLivesState(nextLives);
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
                  score: scoreDelta,
                  correct: isCorrect,
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
    const wasDailyChallenge = dailyChallengeActive;
    setDailyChallengeActive(false);
    resetRoundState(currentRoundDuration);
    if (isArticleMode) {
      setArticleSeed((value) => value + (wasDailyChallenge ? 2 : 1));
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
    setChatSeed((value) => value + (wasDailyChallenge ? 2 : 1));
  };

  const handlePlayDailyChallenge = () => {
    if (dailyChallengeState.completed) return;
    setDailyChallengeActive(true);
    setMode(dailyChallengeRound.mode);
    setLevel(dailyChallengeRound.level);
    resetRoundState(ROUND_DURATIONS[dailyChallengeRound.mode]);
  };

  const handleAnswer = (value: string) => {
    if (answerState || isSentenceMode || !hasAvailableLives) return;
    const isCorrect = isArticleMode
      ? value === articleRound.exercise.article
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
        resolveAnswer(null, false, true);
        return;
      }
      setTimeLeft((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [answerState, hasAvailableLives, resolveAnswer, timeLeft]);

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
      : isTranslateMode
        ? text.chooseTranslation
        : isSentenceMode
          ? text.chooseSentence
          : text.chooseChat;

  const feedbackBody = answerState
    ? isArticleMode
      ? `${articleRound.exercise.article} ${articleRound.exercise.noun} (${articleRound.exercise.hint})`
      : isTranslateMode
        ? `${translationRound.exercise.source} = ${translationRound.exercise.target}`
        : isSentenceMode
          ? `${sentenceRound.exercise.words.join(" ")} (${sentenceRound.exercise.translation})`
          : `${chatRound.exercise.correctReply} (${chatRound.exercise.feedback})`
    : isArticleMode
      ? text.explainArticle
      : isTranslateMode
        ? text.explainTranslation
        : isSentenceMode
          ? text.explainSentence
          : text.explainChat;

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
          ) : (
            <div className="miniGamesWordLine">
              {isArticleMode ? (
                <>
                  <span className="miniGamesMissingArticle">___</span>
                  <span>{articleRound.exercise.noun}</span>
                </>
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
              : isTranslateMode
                ? text.translatePrompt
                : isSentenceMode
                  ? text.sentencePrompt
                  : text.chatPrompt}
          </p>
          <p className="miniGamesHint">
            {isArticleMode ? (
              <>
                {text.hintLabel}: {articleRound.exercise.hint}
              </>
            ) : isTranslateMode ? (
              <>
                {text.levelLabel}: {effectiveLevel}
              </>
            ) : isSentenceMode ? (
              <>
                {text.sentenceHintLabel}: {sentenceRound.exercise.translation} ({effectiveLevel})
              </>
            ) : (
              <>
                {text.chatHintLabel}: {chatRound.exercise.translation} ({effectiveLevel})
              </>
            )}
          </p>
        </div>

        <div
          className={`miniGamesOptions miniGamesOptions${
            isArticleMode
              ? "Article"
              : isTranslateMode
                ? "Translate"
                : isSentenceMode
                  ? "Sentence"
                  : "Chat"
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
              ) : (
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

          <button
            className="miniGamesNextButton"
            type="button"
            onClick={handleNextQuestion}
          >
            {dailyChallengeActive
              ? text.dailyChallengeBack ?? "Back to practice"
              : text.nextQuestion}{" "}
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
