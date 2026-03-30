import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ARTICLE_EXERCISES,
  SENTENCE_EXERCISES,
  TRANSLATION_EXERCISES,
  type ArticleExercise,
  type ArticleOption,
  type SentenceExercise,
  type TranslationExercise,
} from "./miniGamesData";
import { getMiniGamesText } from "./miniGamesText";

type MiniGamesPageProps = {
  locale: string;
};

type GameMode = "article" | "translate" | "sentence";

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

type AnswerState = {
  value: string | null;
  correct: boolean;
  timedOut: boolean;
};

const ARTICLE_OPTIONS: ArticleOption[] = ["der", "die", "das"];
const ROUND_DURATION_SECONDS = 10;

const INITIAL_STATS: Record<GameMode, GameStats> = {
  article: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  translate: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  sentence: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
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

function createArticleRound(seed: number): ArticleRound {
  const exercise = randomItem(ARTICLE_EXERCISES);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffle(ARTICLE_OPTIONS),
  };
}

function createTranslationRound(seed: number): TranslationRound {
  const exercise = randomItem(TRANSLATION_EXERCISES);
  const distractors = shuffle(
    TRANSLATION_EXERCISES.filter((entry) => entry.id !== exercise.id)
      .map((entry) => entry.target)
      .filter((target, index, list) => list.indexOf(target) === index),
  ).slice(0, 3);
  return {
    key: `${exercise.id}-${seed}`,
    exercise,
    options: shuffle([exercise.target, ...distractors]),
  };
}

function createSentenceRound(seed: number): SentenceRound {
  const exercise = randomItem(SENTENCE_EXERCISES);
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
  const [mode, setMode] = useState<GameMode>("article");
  const [articleSeed, setArticleSeed] = useState(0);
  const [translationSeed, setTranslationSeed] = useState(0);
  const [sentenceSeed, setSentenceSeed] = useState(0);
  const [sentenceSelection, setSentenceSelection] = useState<string[]>([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_SECONDS);

  const articleRound = useMemo(
    () => createArticleRound(articleSeed),
    [articleSeed],
  );
  const translationRound = useMemo(
    () => createTranslationRound(translationSeed),
    [translationSeed],
  );
  const sentenceRound = useMemo(
    () => createSentenceRound(sentenceSeed),
    [sentenceSeed],
  );

  const activeStats = stats[mode];
  const isArticleMode = mode === "article";
  const isTranslateMode = mode === "translate";
  const isSentenceMode = mode === "sentence";
  const activeExercise = isArticleMode
    ? articleRound.exercise
    : isTranslateMode
      ? translationRound.exercise
      : sentenceRound.exercise;

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

  const handleModeChange = (nextMode: GameMode) => {
    setMode(nextMode);
    setAnswerState(null);
    setTimeLeft(ROUND_DURATION_SECONDS);
    setSentenceSelection([]);
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
    setAnswerState(null);
    setTimeLeft(ROUND_DURATION_SECONDS);
    setSentenceSelection([]);
    if (isArticleMode) {
      setArticleSeed((value) => value + 1);
      return;
    }
    if (isTranslateMode) {
      setTranslationSeed((value) => value + 1);
      return;
    }
    setSentenceSeed((value) => value + 1);
  };

  const handleAnswer = (value: string) => {
    if (answerState || isSentenceMode) return;
    const isCorrect = isArticleMode
      ? value === articleRound.exercise.article
      : value === translationRound.exercise.target;
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
        : text.chooseSentence;

  const feedbackBody = answerState
    ? isArticleMode
      ? `${articleRound.exercise.article} ${articleRound.exercise.noun} (${articleRound.exercise.hint})`
      : isTranslateMode
        ? `${translationRound.exercise.source} = ${translationRound.exercise.target}`
        : `${sentenceRound.exercise.words.join(" ")} (${sentenceRound.exercise.translation})`
    : isArticleMode
      ? text.explainArticle
      : isTranslateMode
        ? text.explainTranslation
        : text.explainSentence;

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
          <p className="miniGamesInstruction">
            {isArticleMode
              ? text.articleMissingLabel
              : isTranslateMode
                ? text.translatePrompt
                : text.sentencePrompt}
          </p>
          <p className="miniGamesHint">
            {isArticleMode ? (
              <>
                {text.hintLabel}: {articleRound.exercise.hint}
              </>
            ) : isTranslateMode ? (
              <>
                {text.levelLabel}: {translationRound.exercise.level}
              </>
            ) : (
              <>
                {text.sentenceHintLabel}: {sentenceRound.exercise.translation}
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
                : "Sentence"
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
              : (
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
