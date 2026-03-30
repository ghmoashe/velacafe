export type ArticleOption = "der" | "die" | "das";

export type ArticleExercise = {
  id: string;
  noun: string;
  article: ArticleOption;
  hint: string;
  emoji: string;
  level: "A1" | "A2" | "B1";
};

export type TranslationExercise = {
  id: string;
  source: string;
  target: string;
  emoji: string;
  level: "A1" | "A2" | "B1";
};

export const ARTICLE_EXERCISES: ArticleExercise[] = [
  { id: "artikel-tisch", noun: "Tisch", article: "der", hint: "table", emoji: "🪑", level: "A1" },
  { id: "artikel-apfel", noun: "Apfel", article: "der", hint: "apple", emoji: "🍎", level: "A1" },
  { id: "artikel-zug", noun: "Zug", article: "der", hint: "train", emoji: "🚆", level: "A1" },
  { id: "artikel-schuh", noun: "Schuh", article: "der", hint: "shoe", emoji: "👟", level: "A1" },
  { id: "artikel-kaffee", noun: "Kaffee", article: "der", hint: "coffee", emoji: "☕", level: "A2" },
  { id: "artikel-lampe", noun: "Lampe", article: "die", hint: "lamp", emoji: "💡", level: "A1" },
  { id: "artikel-schule", noun: "Schule", article: "die", hint: "school", emoji: "🏫", level: "A1" },
  { id: "artikel-tasche", noun: "Tasche", article: "die", hint: "bag", emoji: "👜", level: "A1" },
  { id: "artikel-sprache", noun: "Sprache", article: "die", hint: "language", emoji: "🗣️", level: "A2" },
  { id: "artikel-reise", noun: "Reise", article: "die", hint: "trip", emoji: "🧳", level: "A2" },
  { id: "artikel-buch", noun: "Buch", article: "das", hint: "book", emoji: "📘", level: "A1" },
  { id: "artikel-fenster", noun: "Fenster", article: "das", hint: "window", emoji: "🪟", level: "A1" },
  { id: "artikel-brot", noun: "Brot", article: "das", hint: "bread", emoji: "🍞", level: "A1" },
  { id: "artikel-kind", noun: "Kind", article: "das", hint: "child", emoji: "🧒", level: "A1" },
  { id: "artikel-foto", noun: "Foto", article: "das", hint: "photo", emoji: "📷", level: "A2" },
];

export const TRANSLATION_EXERCISES: TranslationExercise[] = [
  { id: "wort-haus", source: "Haus", target: "house", emoji: "🏠", level: "A1" },
  { id: "wort-wasser", source: "Wasser", target: "water", emoji: "💧", level: "A1" },
  { id: "wort-familie", source: "Familie", target: "family", emoji: "👨‍👩‍👧‍👦", level: "A1" },
  { id: "wort-stadt", source: "Stadt", target: "city", emoji: "🌆", level: "A1" },
  { id: "wort-zeit", source: "Zeit", target: "time", emoji: "⏰", level: "A1" },
  { id: "wort-freund", source: "Freund", target: "friend", emoji: "🤝", level: "A1" },
  { id: "wort-frage", source: "Frage", target: "question", emoji: "❓", level: "A1" },
  { id: "wort-arbeit", source: "Arbeit", target: "work", emoji: "💼", level: "A2" },
  { id: "wort-sprache", source: "Sprache", target: "language", emoji: "🗣️", level: "A2" },
  { id: "wort-reise", source: "Reise", target: "trip", emoji: "✈️", level: "A2" },
  { id: "wort-markt", source: "Markt", target: "market", emoji: "🛍️", level: "A2" },
  { id: "wort-lehrer", source: "Lehrer", target: "teacher", emoji: "👨‍🏫", level: "A2" },
  { id: "wort-sommer", source: "Sommer", target: "summer", emoji: "☀️", level: "A1" },
  { id: "wort-ticket", source: "Ticket", target: "ticket", emoji: "🎫", level: "A1" },
  { id: "wort-essen", source: "Essen", target: "food", emoji: "🍽️", level: "A1" },
];
