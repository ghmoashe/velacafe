import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ARTICLE_EXERCISES,
  TRANSLATION_EXERCISES,
  type ArticleExercise,
  type ArticleOption,
  type TranslationExercise,
} from "./miniGamesData";
import { getMiniGamesText } from "./miniGamesText";

type MiniGamesPageProps = {
  locale: string;
};

type GameMode = "article" | "translate";

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
  const activeStats = stats[mode];
  const isArticleMode = mode === "article";
  const activeExercise = isArticleMode
    ? articleRound.exercise
    : translationRound.exercise;

  const handleModeChange = (nextMode: GameMode) => {
    setMode(nextMode);
    setAnswerState(null);
    setTimeLeft(ROUND_DURATION_SECONDS);
  };

  const resolveAnswer = useCallback((
    value: string | null,
    isCorrect: boolean,
    timedOut: boolean,
  ) => {
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
  }, [mode]);

  const handleNextQuestion = () => {
    setAnswerState(null);
    setTimeLeft(ROUND_DURATION_SECONDS);
    if (isArticleMode) {
      setArticleSeed((value) => value + 1);
      return;
    }
    setTranslationSeed((value) => value + 1);
  };

  const handleAnswer = (value: string) => {
    if (answerState) return;
    const isCorrect = isArticleMode
      ? value === articleRound.exercise.article
      : value === translationRound.exercise.target;
    resolveAnswer(value, isCorrect, false);
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
      : text.chooseTranslation;

  const feedbackBody = answerState
    ? isArticleMode
      ? `${articleRound.exercise.article} ${articleRound.exercise.noun} (${articleRound.exercise.hint})`
      : `${translationRound.exercise.source} = ${translationRound.exercise.target}`
    : isArticleMode
      ? text.explainArticle
      : text.explainTranslation;

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
            !isArticleMode ? " miniGamesModeButtonActive" : ""
          }`}
          type="button"
          onClick={() => handleModeChange("translate")}
        >
          {text.translateMode}
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
            ) : (
              <span>{translationRound.exercise.source}</span>
            )}
          </div>
          <p className="miniGamesInstruction">
            {isArticleMode ? text.articleMissingLabel : text.translatePrompt}
          </p>
          <p className="miniGamesHint">
            {text.hintLabel}:{" "}
            {isArticleMode
              ? articleRound.exercise.hint
              : translationRound.exercise.target}
          </p>
        </div>

        <div className={`miniGamesOptions miniGamesOptions${isArticleMode ? "Article" : "Translate"}`}>
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
            : translationRound.options.map((option) => {
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
              })}
        </div>

        <div className="miniGamesResultPanel">
          <div className={`miniGamesFeedbackBadge${answerState?.correct ? " miniGamesFeedbackBadgeSuccess" : answerState ? " miniGamesFeedbackBadgeError" : ""}`}>
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
