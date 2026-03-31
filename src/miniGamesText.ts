export type MiniGamesText = {
  navLabel: string;
  title: string;
  subtitle: string;
  articleMode: string;
  translateMode: string;
  sentenceMode: string;
  chatMode: string;
  scoreBadge: string;
  timerBadge: string;
  statsAccuracy: string;
  statsStreak: string;
  statsBest: string;
  articlePrompt: string;
  translatePrompt: string;
  sentencePrompt: string;
  chatPrompt: string;
  chooseArticle: string;
  chooseTranslation: string;
  chooseSentence: string;
  chooseChat: string;
  correct: string;
  incorrect: string;
  nextQuestion: string;
  hintLabel: string;
  sourceLabel: string;
  levelLabel: string;
  scoreLabel: string;
  explainArticle: string;
  explainTranslation: string;
  explainSentence: string;
  explainChat: string;
  timeout: string;
  articleMissingLabel: string;
  starsLabel: string;
  checkSentence: string;
  clearSentence: string;
  sentenceHintLabel: string;
  sentenceEmpty: string;
  chatHintLabel: string;
  chatScenarioLabel: string;
  levelFilterLabel: string;
};

const MINI_GAMES_TEXT: MiniGamesText = {
  navLabel: "Practice",
  title: "Mini games",
  subtitle:
    "Train vocabulary with quick rounds: guess the article, translate words, build sentences, and pick natural chat replies.",
  articleMode: "Guess article",
  translateMode: "Translate words",
  sentenceMode: "Build sentence",
  chatMode: "Chat simulator",
  scoreBadge: "Score",
  timerBadge: "Time",
  statsAccuracy: "Accuracy",
  statsStreak: "Streak",
  statsBest: "Best streak",
  articlePrompt: "Choose the correct German article.",
  translatePrompt: "Choose the correct translation.",
  sentencePrompt: "Put the words in the correct order.",
  chatPrompt: "Choose the best reply in the chat.",
  chooseArticle: "Pick der, die, or das.",
  chooseTranslation: "Pick the right meaning.",
  chooseSentence: "Tap the words to build the sentence.",
  chooseChat: "Pick the most natural reply.",
  correct: "Correct",
  incorrect: "Not quite",
  nextQuestion: "Next question",
  hintLabel: "Hint",
  sourceLabel: "Word",
  levelLabel: "Level",
  scoreLabel: "Score",
  explainArticle: "Remember the noun together with its article.",
  explainTranslation: "Repeat the pair aloud to lock it in faster.",
  explainSentence: "Build the sentence from left to right and listen for the rhythm.",
  explainChat: "Focus on the goal of the message: confirm, ask, help, or respond politely.",
  timeout: "Time is up",
  articleMissingLabel: "Choose article:",
  starsLabel: "Streak",
  checkSentence: "Check sentence",
  clearSentence: "Clear",
  sentenceHintLabel: "Meaning",
  sentenceEmpty: "Tap a word below to start the sentence.",
  chatHintLabel: "Meaning",
  chatScenarioLabel: "Scenario",
  levelFilterLabel: "Level filter",
};

export function getMiniGamesText(locale: string): MiniGamesText {
  void locale;
  return MINI_GAMES_TEXT;
}
