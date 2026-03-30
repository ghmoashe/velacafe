export type MiniGamesText = {
  navLabel: string;
  title: string;
  subtitle: string;
  articleMode: string;
  translateMode: string;
  scoreBadge: string;
  timerBadge: string;
  statsAccuracy: string;
  statsStreak: string;
  statsBest: string;
  articlePrompt: string;
  translatePrompt: string;
  chooseArticle: string;
  chooseTranslation: string;
  correct: string;
  incorrect: string;
  nextQuestion: string;
  hintLabel: string;
  sourceLabel: string;
  levelLabel: string;
  scoreLabel: string;
  explainArticle: string;
  explainTranslation: string;
  timeout: string;
  articleMissingLabel: string;
  starsLabel: string;
};

const MINI_GAMES_TEXT: MiniGamesText = {
  navLabel: "Practice",
  title: "Mini games",
  subtitle:
    "Train vocabulary with quick rounds: guess the article and translate common words.",
  articleMode: "Guess article",
  translateMode: "Translate words",
  scoreBadge: "Score",
  timerBadge: "Time",
  statsAccuracy: "Accuracy",
  statsStreak: "Streak",
  statsBest: "Best streak",
  articlePrompt: "Choose the correct German article.",
  translatePrompt: "Choose the correct translation.",
  chooseArticle: "Pick der, die, or das.",
  chooseTranslation: "Pick the right meaning.",
  correct: "Correct",
  incorrect: "Not quite",
  nextQuestion: "Next question",
  hintLabel: "Hint",
  sourceLabel: "Word",
  levelLabel: "Level",
  scoreLabel: "Score",
  explainArticle: "Remember the noun together with its article.",
  explainTranslation: "Repeat the pair aloud to lock it in faster.",
  timeout: "Time is up",
  articleMissingLabel: "Choose article:",
  starsLabel: "Streak",
};

export function getMiniGamesText(locale: string): MiniGamesText {
  void locale;
  return MINI_GAMES_TEXT;
}
