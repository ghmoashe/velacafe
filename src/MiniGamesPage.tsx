import { useCallback, useEffect, useMemo, useState } from "react";
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

type MiniGamesPageProps = {
  locale: string;
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
  options: string[];
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

const ARTICLE_OPTIONS: ArticleOption[] = ["der", "die", "das"];
const LEVEL_OPTIONS: ExerciseLevel[] = ["A1", "A2", "B1"];
const ROUND_DURATIONS: Record<GameMode, number> = {
  article: 10,
  translate: 10,
  sentence: 15,
  chat: 20,
};

const INITIAL_STATS: Record<GameMode, GameStats> = {
  article: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  translate: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  sentence: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  chat: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
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
  const distractors = shuffle(
    exercises
      .filter((entry) => entry.id !== exercise.id)
      .map((entry) => entry.target)
      .filter((target, index, list) => list.indexOf(target) === index),
  ).slice(0, 3);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffle([exercise.target, ...distractors]),
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

export default function MiniGamesPage({ locale }: MiniGamesPageProps) {
  const text = getMiniGamesText(locale);
  const articleExercises = useMemo(() => getArticleExercises(locale), [locale]);
  const translationExercises = useMemo(
    () => getTranslationExercises(locale),
    [locale],
  );
  const [mode, setMode] = useState<GameMode>("article");
  const [level, setLevel] = useState<ExerciseLevel>("A1");
  const [articleSeed, setArticleSeed] = useState(0);
  const [translationSeed, setTranslationSeed] = useState(0);
  const [sentenceSeed, setSentenceSeed] = useState(0);
  const [chatSeed, setChatSeed] = useState(0);
  const [sentenceSelection, setSentenceSelection] = useState<string[]>([]);
  const [stats, setStats] = useState(INITIAL_STATS);
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

  const articleRound = useMemo(
    () => createArticleRound(filteredArticleExercises, articleSeed),
    [articleSeed, filteredArticleExercises],
  );
  const translationRound = useMemo(
    () => createTranslationRound(filteredTranslationExercises, translationSeed),
    [filteredTranslationExercises, translationSeed],
  );
  const sentenceRound = useMemo(
    () => createSentenceRound(filteredSentenceExercises, sentenceSeed),
    [filteredSentenceExercises, sentenceSeed],
  );
  const chatRound = useMemo(
    () => createChatRound(filteredChatExercises, chatSeed),
    [chatSeed, filteredChatExercises],
  );

  const activeStats = stats[mode];
  const currentRoundDuration = ROUND_DURATIONS[mode];
  const isArticleMode = mode === "article";
  const isTranslateMode = mode === "translate";
  const isSentenceMode = mode === "sentence";
  const isChatMode = mode === "chat";
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

  const resetRoundState = useCallback((nextDuration: number) => {
    setAnswerState(null);
    setTimeLeft(nextDuration);
    setSentenceSelection([]);
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
    setMode(nextMode);
    if (!nextLevels.includes(level)) {
      setLevel(nextLevels[0] ?? "A1");
    }
    resetRoundState(ROUND_DURATIONS[nextMode]);
  };

  const handleLevelChange = (nextLevel: ExerciseLevel) => {
    if (!availableLevels.includes(nextLevel) || nextLevel === effectiveLevel) return;
    setLevel(nextLevel);
    resetRoundState(ROUND_DURATIONS[mode]);
  };

  const resolveAnswer = useCallback(
    (value: string | null, isCorrect: boolean, timedOut: boolean) => {
      setAnswerState({ value, correct: isCorrect, timedOut });
      setStats((current) => {
        const previous = current[mode];
        const nextStreak = isCorrect ? previous.streak + 1 : 0;
        const nextCorrect = previous.correct + (isCorrect ? 1 : 0);
        return {
          ...current,
          [mode]: {
            attempts: previous.attempts + 1,
            correct: nextCorrect,
            streak: nextStreak,
            bestStreak: Math.max(previous.bestStreak, nextStreak),
          },
        };
      });
    },
    [mode],
  );

  const handleNextQuestion = () => {
    resetRoundState(currentRoundDuration);
    if (isArticleMode) {
      setArticleSeed((value) => value + 1);
      return;
    }
    if (isTranslateMode) {
      setTranslationSeed((value) => value + 1);
      return;
    }
    if (isSentenceMode) {
      setSentenceSeed((value) => value + 1);
      return;
    }
    setChatSeed((value) => value + 1);
  };

  const handleAnswer = (value: string) => {
    if (answerState || isSentenceMode) return;
    const isCorrect = isArticleMode
      ? value === articleRound.exercise.article
      : isTranslateMode
        ? value === translationRound.exercise.target
        : value === chatRound.exercise.correctReply;
    resolveAnswer(value, isCorrect, false);
  };

  const handleSentenceTokenSelect = (tokenId: string) => {
    if (answerState) return;
    setSentenceSelection((current) =>
      current.includes(tokenId) ? current : [...current, tokenId],
    );
  };

  const handleSentenceTokenRemove = (tokenId: string) => {
    if (answerState) return;
    setSentenceSelection((current) => current.filter((id) => id !== tokenId));
  };

  const handleSentenceClear = () => {
    if (answerState) return;
    setSentenceSelection([]);
  };

  const handleSentenceCheck = () => {
    if (answerState || !isSentenceMode) return;
    if (selectedSentenceTokens.length !== sentenceRound.exercise.words.length) return;
    const builtSentence = selectedSentenceTokens.map((token) => token.word).join(" ");
    const correctSentence = sentenceRound.exercise.words.join(" ");
    resolveAnswer(builtSentence, builtSentence === correctSentence, false);
  };

  useEffect(() => {
    if (answerState) return;
    const timeoutId = window.setTimeout(() => {
      if (timeLeft <= 1) {
        resolveAnswer(null, false, true);
        return;
      }
      setTimeLeft((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [answerState, resolveAnswer, timeLeft]);

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

      <section className="miniGamesStage">
        <div className="miniGamesHud">
          <div className="miniGamesHudPill">
            <span aria-hidden="true">🔥</span>
            <span>
              {text.scoreBadge}: {activeStats.correct}
            </span>
          </div>
          <div className="miniGamesHudPill">
            <span aria-hidden="true">⏱️</span>
            <span>
              {text.timerBadge}: {formatTimer(timeLeft)}
            </span>
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
                    onClick={() => handleAnswer(option)}
                  >
                    <span className="miniGamesOptionTitle">{option}</span>
                  </button>
                );
              })
            : isTranslateMode
              ? translationRound.options.map((option) => {
                  const isCorrect = option === translationRound.exercise.target;
                  const isSelected = answerState?.value === option;
                  return (
                    <button
                      key={option}
                      className={`miniGamesOption miniGamesOptionTranslate${
                        answerState && isCorrect ? " miniGamesOptionCorrect" : ""
                      }${
                        answerState && isSelected && !isCorrect
                          ? " miniGamesOptionWrong"
                          : ""
                      }`}
                      type="button"
                      onClick={() => handleAnswer(option)}
                    >
                      <span className="miniGamesOptionBody">{option}</span>
                    </button>
                  );
                })
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
                      onClick={handleSentenceClear}
                    >
                      {text.clearSentence}
                    </button>
                    <button
                      className="miniGamesSentenceAction miniGamesSentenceActionPrimary"
                      type="button"
                      disabled={
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
                      onClick={() => handleAnswer(option)}
                    >
                      <span className="miniGamesOptionBody">{option}</span>
                    </button>
                  );
                })
              )}
        </div>

        <div className="miniGamesResultPanel">
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
            {text.nextQuestion} →
          </button>
        </div>
      </section>

      <div className="miniGamesStats">
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
    </div>
  );
}
