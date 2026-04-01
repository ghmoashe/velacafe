import { getMiniGamesGloss, hasMiniGamesGloss } from "./miniGamesGlossary";

export type ArticleOption = "der" | "die" | "das";

export type ArticleExercise = {
  id: string;
  noun: string;
  article: ArticleOption;
  hint: string;
  emoji?: string;
  level: "A1" | "A2" | "B1";
};

export type TranslationExercise = {
  id: string;
  source: string;
  target: string;
  emoji: string;
  level: "A1" | "A2" | "B1";
};

export type SentenceExercise = {
  id: string;
  translation: string;
  words: string[];
  emoji: string;
  level: "A1" | "A2" | "B1";
};

export type ChatExercise = {
  id: string;
  contact: string;
  scenario: string;
  incoming: string;
  translation: string;
  correctReply: string;
  options: string[];
  feedback: string;
  emoji: string;
  level: "A1" | "A2" | "B1";
};

export type StoryExercise = {
  id: string;
  title: string;
  setup: string;
  translation: string;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  emoji: string;
  level: "A1" | "A2" | "B1";
};

type ArticleSeed = readonly [string, ArticleOption, string, string?];
type TranslationSeed = readonly [string, string, string, "A1" | "A2"];

const ARTICLE_EXERCISE_TARGET = 500;
const TRANSLATION_EXERCISE_TARGET = 1000;

const ARTICLE_A1_BASE: ReadonlyArray<ArticleSeed> = [
  ["Apfel", "der", "apple", "🍎"],
  ["Tisch", "der", "table", "🪑"],
  ["Stuhl", "der", "chair", "🪑"],
  ["Bus", "der", "bus", "🚌"],
  ["Zug", "der", "train", "🚆"],
  ["Kaffee", "der", "coffee", "☕"],
  ["Tee", "der", "tea", "🫖"],
  ["Wein", "der", "wine", "🍷"],
  ["Saft", "der", "juice", "🧃"],
  ["Salat", "der", "salad", "🥗"],
  ["Käse", "der", "cheese", "🧀"],
  ["Reis", "der", "rice", "🍚"],
  ["Fisch", "der", "fish", "🐟"],
  ["Zucker", "der", "sugar", "🧂"],
  ["Pfeffer", "der", "pepper", "🧂"],
  ["Kuchen", "der", "cake", "🍰"],
  ["Schinken", "der", "ham", "🥓"],
  ["Löffel", "der", "spoon", "🥄"],
  ["Teller", "der", "plate", "🍽️"],
  ["Herd", "der", "stove", "🍳"],
  ["Kühlschrank", "der", "refrigerator", "🧊"],
  ["Garten", "der", "garden", "🌳"],
  ["Schlüssel", "der", "key", "🔑"],
  ["Computer", "der", "computer", "💻"],
  ["Fernseher", "der", "television", "📺"],
  ["Wecker", "der", "alarm clock", "⏰"],
  ["Besen", "der", "broom", "🧹"],
  ["Eimer", "der", "bucket", "🪣"],
  ["Schalter", "der", "switch", "🎚️"],
  ["Koffer", "der", "suitcase", "🧳"],
  ["Regenschirm", "der", "umbrella", "☂️"],
  ["Bildschirm", "der", "screen", "🖥️"],
  ["Vater", "der", "father", "👨"],
  ["Bruder", "der", "brother", "👦"],
  ["Sohn", "der", "son", "👦"],
  ["Großvater", "der", "grandfather", "👴"],
  ["Mann", "der", "man", "👨"],
  ["Junge", "der", "boy", "🧒"],
  ["Freund", "der", "friend", "🤝"],
  ["Lehrer", "der", "teacher", "👨‍🏫"],
  ["Arzt", "der", "doctor", "👨‍⚕️"],
  ["Koch", "der", "cook", "👨‍🍳"],
  ["Fahrer", "der", "driver", "🚗"],
  ["Verkäufer", "der", "seller", "🛍️"],
  ["Besucher", "der", "visitor", "🚪"],
  ["Nachbar", "der", "neighbor", "🏘️"],
  ["Student", "der", "student", "🎓"],
  ["Kellner", "der", "waiter", "🍽️"],
  ["Polizist", "der", "police officer", "👮"],
  ["Kunde", "der", "customer", "🛒"],
  ["Suppe", "die", "soup", "🍲"],
  ["Banane", "die", "banana", "🍌"],
  ["Orange", "die", "orange", "🍊"],
  ["Kartoffel", "die", "potato", "🥔"],
  ["Tomate", "die", "tomato", "🍅"],
  ["Gurke", "die", "cucumber", "🥒"],
  ["Zitrone", "die", "lemon", "🍋"],
  ["Butter", "die", "butter", "🧈"],
  ["Milch", "die", "milk", "🥛"],
  ["Marmelade", "die", "jam", "🍯"],
  ["Pizza", "die", "pizza", "🍕"],
  ["Wurst", "die", "sausage", "🌭"],
  ["Gabel", "die", "fork", "🍴"],
  ["Pfanne", "die", "pan", "🍳"],
  ["Tasse", "die", "cup", "☕"],
  ["Flasche", "die", "bottle", "🍾"],
  ["Dose", "die", "can", "🥫"],
  ["Küche", "die", "kitchen", "🍽️"],
  ["Mahlzeit", "die", "meal", "🥘"],
  ["Bohne", "die", "bean", "🫘"],
  ["Lampe", "die", "lamp", "💡"],
  ["Tür", "die", "door", "🚪"],
  ["Wand", "die", "wall", "🧱"],
  ["Decke", "die", "ceiling", "🏠"],
  ["Treppe", "die", "stairs", "🪜"],
  ["Wohnung", "die", "apartment", "🏢"],
  ["Garage", "die", "garage", "🚗"],
  ["Schublade", "die", "drawer", "🗄️"],
  ["Seife", "die", "soap", "🧼"],
  ["Bürste", "die", "brush", "🪥"],
  ["Dusche", "die", "shower", "🚿"],
  ["Badewanne", "die", "bathtub", "🛁"],
  ["Klingel", "die", "doorbell", "🔔"],
  ["Matratze", "die", "mattress", "🛏️"],
  ["Uhr", "die", "clock", "🕒"],
  ["Steckdose", "die", "socket", "🔌"],
  ["Fernbedienung", "die", "remote control", "🎮"],
  ["Waschmaschine", "die", "washing machine", "🧺"],
  ["Mutter", "die", "mother", "👩"],
  ["Schwester", "die", "sister", "👧"],
  ["Tochter", "die", "daughter", "👧"],
  ["Großmutter", "die", "grandmother", "👵"],
  ["Frau", "die", "woman", "👩"],
  ["Freundin", "die", "female friend", "💁"],
  ["Lehrerin", "die", "female teacher", "👩‍🏫"],
  ["Ärztin", "die", "female doctor", "👩‍⚕️"],
  ["Verkäuferin", "die", "saleswoman", "🛍️"],
  ["Nachbarin", "die", "female neighbor", "🏘️"],
  ["Studentin", "die", "female student", "🎓"],
  ["Polizistin", "die", "female police officer", "👮‍♀️"],
  ["Brot", "das", "bread", "🍞"],
  ["Wasser", "das", "water", "💧"],
  ["Ei", "das", "egg", "🥚"],
  ["Salz", "das", "salt", "🧂"],
  ["Öl", "das", "oil", "🫒"],
  ["Gemüse", "das", "vegetables", "🥦"],
  ["Fleisch", "das", "meat", "🥩"],
  ["Brötchen", "das", "bread roll", "🥯"],
  ["Sandwich", "das", "sandwich", "🥪"],
  ["Frühstück", "das", "breakfast", "🍳"],
  ["Mittagessen", "das", "lunch", "🍛"],
  ["Abendessen", "das", "dinner", "🍽️"],
  ["Messer", "das", "knife", "🔪"],
  ["Glas", "das", "glass", "🥛"],
  ["Rezept", "das", "recipe", "📝"],
  ["Menü", "das", "menu", "📋"],
  ["Eis", "das", "ice cream", "🍨"],
  ["Müsli", "das", "muesli", "🥣"],
  ["Haus", "das", "house", "🏠"],
  ["Zimmer", "das", "room", "🛋️"],
  ["Fenster", "das", "window", "🪟"],
  ["Bett", "das", "bed", "🛏️"],
  ["Sofa", "das", "sofa", "🛋️"],
  ["Regal", "das", "shelf", "🗄️"],
  ["Handy", "das", "mobile phone", "📱"],
  ["Radio", "das", "radio", "📻"],
  ["Tablet", "das", "tablet", "📲"],
  ["Licht", "das", "light", "💡"],
  ["Bad", "das", "bathroom", "🛁"],
  ["Wohnzimmer", "das", "living room", "🛋️"],
  ["Schlafzimmer", "das", "bedroom", "🛏️"],
  ["Kissen", "das", "pillow", "🛏️"],
  ["Handtuch", "das", "towel", "🧻"],
  ["Dach", "das", "roof", "🏠"],
  ["Schloss", "das", "lock", "🔒"],
  ["Werkzeug", "das", "tool", "🛠️"],
  ["Spielzeug", "das", "toy", "🧸"],
  ["Waschbecken", "das", "sink", "🚰"],
  ["Kabel", "das", "cable", "🔌"],
  ["Foto", "das", "photo", "📷"],
  ["Bild", "das", "picture", "🖼️"],
  ["Poster", "das", "poster", "🖼️"],
  ["Paket", "das", "package", "📦"],
  ["Geschenk", "das", "gift", "🎁"],
  ["Kind", "das", "child", "🧒"],
  ["Baby", "das", "baby", "👶"],
  ["Auge", "das", "eye", "👁️"],
  ["Ohr", "das", "ear", "👂"],
  ["Gesicht", "das", "face", "🙂"],
  ["Bein", "das", "leg", "🦵"],
];

function slugifyWord(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildArticleExercises(locale: string): ArticleExercise[] {
  const localizedBase = ARTICLE_A1_BASE.filter(([, , hint]) =>
    hasMiniGamesGloss(hint, locale),
  );
  const base = localizedBase.length ? localizedBase : ARTICLE_A1_BASE;
  return Array.from({ length: ARTICLE_EXERCISE_TARGET }, (_, index) => {
    const seed = base[index % base.length];
    const [noun, article, hint, emoji] = seed;
    const variant = Math.floor(index / base.length) + 1;
    return {
      id: `artikel-${slugifyWord(noun)}-${variant}`,
      noun,
      article,
      hint: getMiniGamesGloss(hint, locale),
      emoji,
      level: "A1",
    };
  });
}

const ARTICLE_EXERCISE_CACHE = new Map<string, ArticleExercise[]>();

export function getArticleExercises(locale: string): ArticleExercise[] {
  const cacheKey = locale || "en";
  const cached = ARTICLE_EXERCISE_CACHE.get(cacheKey);
  if (cached) return cached;
  const built = buildArticleExercises(cacheKey);
  ARTICLE_EXERCISE_CACHE.set(cacheKey, built);
  return built;
}

export const ARTICLE_EXERCISES: ArticleExercise[] = getArticleExercises("en");

const TRANSLATION_GENERAL_BASE: ReadonlyArray<TranslationSeed> = [
  ["gehen", "go", "🚶", "A1"],
  ["kommen", "come", "➡️", "A1"],
  ["machen", "do", "🛠️", "A1"],
  ["haben", "have", "🧩", "A1"],
  ["sein", "be", "✨", "A1"],
  ["wohnen", "live", "🏘️", "A1"],
  ["lernen", "learn", "📚", "A1"],
  ["sprechen", "speak", "🗣️", "A1"],
  ["hören", "hear", "👂", "A1"],
  ["sehen", "see", "👀", "A1"],
  ["lesen", "read", "📖", "A1"],
  ["schreiben", "write", "✍️", "A1"],
  ["trinken", "drink", "🥤", "A1"],
  ["essen", "eat", "🍽️", "A1"],
  ["kochen", "cook", "👨‍🍳", "A1"],
  ["kaufen", "buy", "🛒", "A1"],
  ["bezahlen", "pay", "💶", "A1"],
  ["arbeiten", "work", "💼", "A1"],
  ["spielen", "play", "⚽", "A1"],
  ["fragen", "ask", "❓", "A1"],
  ["antworten", "answer", "💬", "A1"],
  ["warten", "wait", "⏳", "A1"],
  ["öffnen", "open", "🚪", "A1"],
  ["schließen", "close", "🔒", "A1"],
  ["beginnen", "begin", "🏁", "A1"],
  ["enden", "end", "🛑", "A1"],
  ["fahren", "drive", "🚗", "A1"],
  ["fliegen", "fly", "✈️", "A1"],
  ["schlafen", "sleep", "😴", "A1"],
  ["aufstehen", "get up", "🌅", "A1"],
  ["helfen", "help", "🤝", "A1"],
  ["finden", "find", "🔎", "A1"],
  ["zeigen", "show", "👉", "A1"],
  ["bringen", "bring", "📦", "A2"],
  ["mitnehmen", "take along", "🧳", "A2"],
  ["erklären", "explain", "🧠", "A2"],
  ["vergessen", "forget", "🤔", "A2"],
  ["erinnern", "remember", "📝", "A2"],
  ["besuchen", "visit", "🏠", "A2"],
  ["anmachen", "turn on", "💡", "A2"],
  ["ausmachen", "turn off", "🔌", "A2"],
  ["sauber", "clean", "🧼", "A1"],
  ["schmutzig", "dirty", "🧹", "A1"],
  ["schnell", "fast", "⚡", "A1"],
  ["langsam", "slow", "🐢", "A1"],
  ["groß", "big", "📏", "A1"],
  ["klein", "small", "🔹", "A1"],
  ["neu", "new", "🆕", "A1"],
  ["alt", "old", "🕰️", "A1"],
  ["jung", "young", "🌱", "A1"],
  ["teuer", "expensive", "💎", "A1"],
  ["billig", "cheap", "🪙", "A1"],
  ["schön", "beautiful", "🌸", "A1"],
  ["hässlich", "ugly", "🙈", "A2"],
  ["leicht", "easy", "🪶", "A1"],
  ["schwer", "difficult", "🏋️", "A1"],
  ["hungrig", "hungry", "🍽️", "A1"],
  ["durstig", "thirsty", "🥤", "A1"],
  ["krank", "sick", "🤒", "A1"],
  ["gesund", "healthy", "💚", "A1"],
  ["wichtig", "important", "⭐", "A2"],
  ["fertig", "finished", "✅", "A2"],
  ["leer", "empty", "🫙", "A1"],
  ["voll", "full", "🧺", "A1"],
  ["heute", "today", "📅", "A1"],
  ["morgen", "tomorrow", "🌤️", "A1"],
  ["gestern", "yesterday", "🗓️", "A1"],
  ["immer", "always", "♾️", "A1"],
  ["nie", "never", "🚫", "A1"],
  ["oft", "often", "🔁", "A1"],
  ["manchmal", "sometimes", "🔄", "A1"],
  ["später", "later", "⌛", "A1"],
  ["früh", "early", "🌄", "A1"],
  ["direkt", "directly", "🎯", "A2"],
  ["vielleicht", "maybe", "🤷", "A1"],
  ["wirklich", "really", "💯", "A1"],
  ["zusammen", "together", "🫶", "A1"],
  ["allein", "alone", "🧍", "A1"],
  ["drinnen", "inside", "🏠", "A1"],
  ["draußen", "outside", "🌳", "A1"],
  ["links", "left", "⬅️", "A1"],
  ["rechts", "right", "➡️", "A1"],
  ["oben", "up", "⬆️", "A1"],
  ["unten", "down", "⬇️", "A1"],
  ["Frühling", "spring", "🌷", "A1"],
  ["Herbst", "autumn", "🍂", "A1"],
  ["Winter", "winter", "❄️", "A1"],
  ["Wetter", "weather", "🌦️", "A1"],
  ["Regen", "rain", "🌧️", "A1"],
  ["Schnee", "snow", "🌨️", "A1"],
  ["Wind", "wind", "💨", "A1"],
  ["Wolke", "cloud", "☁️", "A1"],
  ["Sonne", "sun", "☀️", "A1"],
  ["Berg", "mountain", "⛰️", "A1"],
  ["Meer", "sea", "🌊", "A1"],
  ["Fluss", "river", "🏞️", "A2"],
  ["Baum", "tree", "🌳", "A1"],
  ["Blume", "flower", "🌼", "A1"],
  ["Straße", "street", "🛣️", "A1"],
  ["Platz", "square", "📍", "A2"],
  ["Bahnhof", "station", "🚉", "A1"],
  ["Flughafen", "airport", "🛫", "A2"],
  ["Hotel", "hotel", "🏨", "A1"],
  ["Zimmernummer", "room number", "🔢", "A2"],
  ["Ausweis", "identity card", "🪪", "A2"],
  ["Ticketkontrolle", "ticket inspection", "🎫", "A2"],
  ["Fahrrad", "bicycle", "🚲", "A1"],
  ["Auto", "car", "🚗", "A1"],
  ["Taxi", "taxi", "🚕", "A1"],
  ["Ampel", "traffic light", "🚦", "A2"],
  ["Karte", "map", "🗺️", "A1"],
  ["Plan", "plan", "🗓️", "A2"],
  ["Termin", "appointment", "📌", "A2"],
  ["Geburtstag", "birthday", "🎂", "A1"],
  ["Feier", "party", "🥳", "A1"],
  ["Musik", "music", "🎵", "A1"],
  ["Lied", "song", "🎶", "A1"],
  ["Film", "movie", "🎬", "A1"],
  ["Büro", "office", "🏢", "A1"],
  ["Firma", "company", "🏭", "A2"],
  ["Kollege", "colleague", "👥", "A2"],
  ["Pause", "break", "☕", "A2"],
  ["Urlaub", "vacation", "🏖️", "A2"],
  ["Aufgabe", "task", "📋", "A2"],
  ["Prüfung", "exam", "📝", "A2"],
  ["Übung", "exercise", "🏋️", "A2"],
  ["Antwort", "answer", "💬", "A1"],
  ["Fragebogen", "questionnaire", "📄", "A2"],
  ["Farbe", "color", "🎨", "A1"],
  ["rot", "red", "🔴", "A1"],
  ["blau", "blue", "🔵", "A1"],
  ["grün", "green", "🟢", "A1"],
  ["gelb", "yellow", "🟡", "A1"],
  ["schwarz", "black", "⚫", "A1"],
  ["weiß", "white", "⚪", "A1"],
  ["braun", "brown", "🟤", "A1"],
  ["grau", "gray", "◻️", "A1"],
  ["rosa", "pink", "🩷", "A1"],
  ["glücklich", "happy", "😊", "A1"],
  ["traurig", "sad", "😢", "A1"],
  ["müde", "tired", "🥱", "A1"],
  ["nervös", "nervous", "😬", "A2"],
  ["ruhig", "calm", "🧘", "A2"],
  ["laut", "loud", "📣", "A1"],
  ["leise", "quiet", "🤫", "A1"],
  ["klar", "clear", "🔍", "A2"],
  ["bald", "soon", "🕐", "A2"],
];

function buildTranslationExercises(locale: string): TranslationExercise[] {
  const localizedArticleBase = ARTICLE_A1_BASE.filter(([, , hint]) =>
    hasMiniGamesGloss(hint, locale),
  ).map(([noun, , hint, emoji]) => [
    noun,
    getMiniGamesGloss(hint, locale),
    emoji ?? "рџ“ќ",
    "A1",
  ] as const);
  const localizedTranslationBase = TRANSLATION_GENERAL_BASE.filter(([, target]) =>
    hasMiniGamesGloss(target, locale),
  ).map(([source, target, emoji, level]) => [
    source,
    getMiniGamesGloss(target, locale),
    emoji,
    level,
  ] as const);
  void localizedArticleBase;
  void localizedTranslationBase;
  const base: TranslationSeed[] = [
    ...ARTICLE_A1_BASE.map(([noun, , hint, emoji]) => [
      noun,
      getMiniGamesGloss(hint, locale),
      emoji ?? "📝",
      "A1",
    ] as const),
    ...TRANSLATION_GENERAL_BASE.map(([source, target, emoji, level]) => [
      source,
      getMiniGamesGloss(target, locale),
      emoji,
      level,
    ] as const),
  ];

  return Array.from({ length: TRANSLATION_EXERCISE_TARGET }, (_, index) => {
    const seed = base[index % base.length];
    const [source, target, emoji, level] = seed;
    const variant = Math.floor(index / base.length) + 1;
    return {
      id: `wort-${slugifyWord(source)}-${variant}`,
      source,
      target,
      emoji,
      level,
    };
  });
}

function buildTranslationExercisesLocalized(locale: string): TranslationExercise[] {
  const localizedArticleBase = ARTICLE_A1_BASE.filter(([, , hint]) =>
    hasMiniGamesGloss(hint, locale),
  ).map(([noun, , hint, emoji]) => [
    noun,
    getMiniGamesGloss(hint, locale),
    emoji ?? "📝",
    "A1",
  ] as const);

  const localizedTranslationBase = TRANSLATION_GENERAL_BASE.filter(([, target]) =>
    hasMiniGamesGloss(target, locale),
  ).map(([source, target, emoji, level]) => [
    source,
    getMiniGamesGloss(target, locale),
    emoji,
    level,
  ] as const);

  const base: TranslationSeed[] = [
    ...(localizedArticleBase.length
      ? localizedArticleBase
      : ARTICLE_A1_BASE.map(([noun, , hint, emoji]) => [
          noun,
          getMiniGamesGloss(hint, locale),
          emoji ?? "📝",
          "A1",
        ] as const)),
    ...(localizedTranslationBase.length
      ? localizedTranslationBase
      : TRANSLATION_GENERAL_BASE.map(([source, target, emoji, level]) => [
          source,
          getMiniGamesGloss(target, locale),
          emoji,
          level,
        ] as const)),
  ];

  return Array.from({ length: TRANSLATION_EXERCISE_TARGET }, (_, index) => {
    const seed = base[index % base.length];
    const [source, target, emoji, level] = seed;
    const variant = Math.floor(index / base.length) + 1;
    return {
      id: `wort-${slugifyWord(source)}-${variant}`,
      source,
      target,
      emoji,
      level,
    };
  });
}

const TRANSLATION_EXERCISE_CACHE = new Map<string, TranslationExercise[]>();

export function getTranslationExercises(locale: string): TranslationExercise[] {
  const cacheKey = locale || "en";
  const cached = TRANSLATION_EXERCISE_CACHE.get(cacheKey);
  if (cached) return cached;
  const localized = buildTranslationExercisesLocalized(cacheKey);
  const built = localized.length ? localized : buildTranslationExercises(cacheKey);
  TRANSLATION_EXERCISE_CACHE.set(cacheKey, built);
  return built;
}

export const TRANSLATION_EXERCISES: TranslationExercise[] = getTranslationExercises("en");

type SentenceStem = {
  words: string[];
  translation: string;
  emoji: string;
};

type SentenceTail = {
  words: string[];
  translation: string;
};

function composeSentenceExercises(
  prefix: string,
  level: SentenceExercise["level"],
  stems: readonly SentenceStem[],
  tails: readonly SentenceTail[],
): SentenceExercise[] {
  return stems.flatMap((stem, stemIndex) =>
    tails.map((tail, tailIndex) => ({
      id: `${prefix}-${stemIndex + 1}-${tailIndex + 1}`,
      translation: `${stem.translation} ${tail.translation}`,
      words: [...stem.words, ...tail.words],
      emoji: stem.emoji,
      level,
    })),
  );
}

const A1_LEARN_STEMS: SentenceStem[] = [
  { words: ["Ich", "lerne"], translation: "I learn", emoji: "📚" },
  { words: ["Wir", "lernen"], translation: "We learn", emoji: "📚" },
  { words: ["Der", "Student", "lernt"], translation: "The student learns", emoji: "🎓" },
  { words: ["Meine", "Freundin", "lernt"], translation: "My friend learns", emoji: "👭" },
  { words: ["Der", "Lehrer", "lernt"], translation: "The teacher learns", emoji: "👨‍🏫" },
];

const A1_LEARN_TAILS: SentenceTail[] = [
  { words: ["heute", "Deutsch"], translation: "German today." },
  { words: ["am", "Abend", "neue", "Wörter"], translation: "new words in the evening." },
  { words: ["in", "der", "Schule", "Grammatik"], translation: "grammar at school." },
  { words: ["mit", "der", "Klasse", "Dialoge"], translation: "dialogues with the class." },
];

const A1_DRINK_STEMS: SentenceStem[] = [
  { words: ["Ich", "trinke"], translation: "I drink", emoji: "🥤" },
  { words: ["Wir", "trinken"], translation: "We drink", emoji: "🥤" },
  { words: ["Mein", "Bruder", "trinkt"], translation: "My brother drinks", emoji: "🥤" },
  { words: ["Die", "Besucherin", "trinkt"], translation: "The visitor drinks", emoji: "🥤" },
  { words: ["Das", "Kind", "trinkt"], translation: "The child drinks", emoji: "🥤" },
];

const A1_DRINK_TAILS: SentenceTail[] = [
  { words: ["am", "Morgen", "Kaffee"], translation: "coffee in the morning." },
  { words: ["in", "der", "Pause", "Tee"], translation: "tea during the break." },
  { words: ["im", "Cafe", "Wasser"], translation: "water in the cafe." },
  { words: ["heute", "Saft"], translation: "juice today." },
];

const A1_EAT_STEMS: SentenceStem[] = [
  { words: ["Ich", "esse"], translation: "I eat", emoji: "🍽️" },
  { words: ["Wir", "essen"], translation: "We eat", emoji: "🍽️" },
  { words: ["Meine", "Familie", "isst"], translation: "My family eats", emoji: "🍽️" },
  { words: ["Der", "Tourist", "isst"], translation: "The tourist eats", emoji: "🍽️" },
  { words: ["Die", "Studentin", "isst"], translation: "The student eats", emoji: "🍽️" },
];

const A1_EAT_TAILS: SentenceTail[] = [
  { words: ["zum", "Frühstück", "Brot"], translation: "bread for breakfast." },
  { words: ["am", "Mittag", "Suppe"], translation: "soup at lunch." },
  { words: ["am", "Abend", "Pizza"], translation: "pizza in the evening." },
  { words: ["heute", "Salat"], translation: "salad today." },
];

const A1_GO_STEMS: SentenceStem[] = [
  { words: ["Ich", "gehe"], translation: "I go", emoji: "🚶" },
  { words: ["Wir", "gehen"], translation: "We go", emoji: "🚶" },
  { words: ["Meine", "Freunde", "gehen"], translation: "My friends go", emoji: "🚶" },
  { words: ["Der", "Gast", "geht"], translation: "The guest goes", emoji: "🚶" },
  { words: ["Die", "Familie", "geht"], translation: "The family goes", emoji: "🚶" },
];

const A1_GO_TAILS: SentenceTail[] = [
  { words: ["heute", "zum", "Bahnhof"], translation: "to the station today." },
  { words: ["am", "Abend", "ins", "Kino"], translation: "to the cinema in the evening." },
  { words: ["morgen", "in", "die", "Stadt"], translation: "to the city tomorrow." },
  { words: ["am", "Wochenende", "in", "den", "Park"], translation: "to the park on the weekend." },
];

const A1_LIVE_STEMS: SentenceStem[] = [
  { words: ["Ich", "wohne"], translation: "I live", emoji: "🏠" },
  { words: ["Wir", "wohnen"], translation: "We live", emoji: "🏠" },
  { words: ["Meine", "Freundin", "wohnt"], translation: "My friend lives", emoji: "🏠" },
  { words: ["Der", "Lehrer", "wohnt"], translation: "The teacher lives", emoji: "🏠" },
  { words: ["Die", "Familie", "wohnt"], translation: "The family lives", emoji: "🏠" },
];

const A1_LIVE_TAILS: SentenceTail[] = [
  { words: ["in", "Berlin"], translation: "in Berlin." },
  { words: ["in", "einer", "kleinen", "Wohnung"], translation: "in a small apartment." },
  { words: ["nahe", "der", "Schule"], translation: "near the school." },
  { words: ["bei", "der", "Familie"], translation: "with the family." },
];

const A2_BUY_STEMS: SentenceStem[] = [
  { words: ["Ich", "möchte"], translation: "I would like to", emoji: "🛒" },
  { words: ["Wir", "möchten"], translation: "We would like to", emoji: "🛒" },
  { words: ["Meine", "Freundin", "möchte"], translation: "My friend would like to", emoji: "🛒" },
  { words: ["Der", "Tourist", "möchte"], translation: "The tourist would like to", emoji: "🛒" },
  { words: ["Die", "Besucherin", "möchte"], translation: "The visitor would like to", emoji: "🛒" },
];

const A2_BUY_TAILS: SentenceTail[] = [
  { words: ["ein", "Ticket", "kaufen"], translation: "buy a ticket." },
  { words: ["heute", "Obst", "kaufen"], translation: "buy fruit today." },
  { words: ["im", "Markt", "Brot", "kaufen"], translation: "buy bread at the market." },
  { words: ["am", "Abend", "ein", "Geschenk", "kaufen"], translation: "buy a gift in the evening." },
];

const A2_MUST_STEMS: SentenceStem[] = [
  { words: ["Ich", "muss"], translation: "I must", emoji: "📝" },
  { words: ["Wir", "müssen"], translation: "We must", emoji: "📝" },
  { words: ["Mein", "Bruder", "muss"], translation: "My brother must", emoji: "📝" },
  { words: ["Die", "Studentin", "muss"], translation: "The student must", emoji: "📝" },
  { words: ["Der", "Lehrer", "muss"], translation: "The teacher must", emoji: "📝" },
];

const A2_MUST_TAILS: SentenceTail[] = [
  { words: ["heute", "lange", "arbeiten"], translation: "work a long time today." },
  { words: ["morgen", "früh", "aufstehen"], translation: "get up early tomorrow." },
  { words: ["am", "Abend", "Deutsch", "üben"], translation: "practice German in the evening." },
  { words: ["pünktlich", "zu", "Hause", "sein"], translation: "be at home on time." },
];

const A2_CAN_STEMS: SentenceStem[] = [
  { words: ["Ich", "kann"], translation: "I can", emoji: "💡" },
  { words: ["Wir", "können"], translation: "We can", emoji: "💡" },
  { words: ["Meine", "Freundin", "kann"], translation: "My friend can", emoji: "💡" },
  { words: ["Der", "Student", "kann"], translation: "The student can", emoji: "💡" },
  { words: ["Die", "Familie", "kann"], translation: "The family can", emoji: "💡" },
];

const A2_CAN_TAILS: SentenceTail[] = [
  { words: ["dir", "morgen", "helfen"], translation: "help you tomorrow." },
  { words: ["das", "Problem", "gut", "erklären"], translation: "explain the problem well." },
  { words: ["mit", "dem", "Zug", "fahren"], translation: "travel by train." },
  { words: ["am", "Abend", "länger", "bleiben"], translation: "stay longer in the evening." },
];

const A2_MEET_STEMS: SentenceStem[] = [
  { words: ["Wir", "treffen", "uns"], translation: "We meet", emoji: "🤝" },
  { words: ["Meine", "Freunde", "treffen", "sich"], translation: "My friends meet", emoji: "🤝" },
  { words: ["Der", "Kurs", "trifft", "sich"], translation: "The course meets", emoji: "🤝" },
  { words: ["Die", "Gruppe", "trifft", "sich"], translation: "The group meets", emoji: "🤝" },
  { words: ["Die", "Familie", "trifft", "sich"], translation: "The family meets", emoji: "🤝" },
];

const A2_MEET_TAILS: SentenceTail[] = [
  { words: ["um", "acht", "im", "Cafe"], translation: "at eight in the cafe." },
  { words: ["morgen", "vor", "dem", "Kino"], translation: "tomorrow in front of the cinema." },
  { words: ["heute", "nach", "der", "Arbeit"], translation: "today after work." },
  { words: ["am", "Wochenende", "im", "Park"], translation: "in the park on the weekend." },
];

const A2_TRAVEL_STEMS: SentenceStem[] = [
  { words: ["Ich", "fahre"], translation: "I travel", emoji: "✈️" },
  { words: ["Wir", "reisen"], translation: "We travel", emoji: "✈️" },
  { words: ["Meine", "Freundin", "fährt"], translation: "My friend travels", emoji: "✈️" },
  { words: ["Der", "Tourist", "reist"], translation: "The tourist travels", emoji: "✈️" },
  { words: ["Die", "Familie", "fährt"], translation: "The family travels", emoji: "✈️" },
];

const A2_TRAVEL_TAILS: SentenceTail[] = [
  { words: ["morgen", "nach", "Hamburg"], translation: "to Hamburg tomorrow." },
  { words: ["im", "Sommer", "ans", "Meer"], translation: "to the sea in summer." },
  { words: ["mit", "dem", "Zug", "nach", "München"], translation: "to Munich by train." },
  { words: ["für", "zwei", "Tage", "nach", "Wien"], translation: "to Vienna for two days." },
];

const A2_EXPLAIN_STEMS: SentenceStem[] = [
  { words: ["Ich", "erkläre"], translation: "I explain", emoji: "🧠" },
  { words: ["Wir", "besprechen"], translation: "We discuss", emoji: "🧠" },
  { words: ["Meine", "Lehrerin", "erklärt"], translation: "My teacher explains", emoji: "🧠" },
  { words: ["Der", "Trainer", "zeigt"], translation: "The trainer shows", emoji: "🧠" },
  { words: ["Die", "Studentin", "beschreibt"], translation: "The student describes", emoji: "🧠" },
];

const A2_EXPLAIN_TAILS: SentenceTail[] = [
  { words: ["heute", "die", "neue", "Grammatik"], translation: "the new grammar today." },
  { words: ["im", "Kurs", "eine", "wichtige", "Regel"], translation: "an important rule in class." },
  { words: ["am", "Abend", "den", "Plan", "für", "morgen"], translation: "the plan for tomorrow in the evening." },
  { words: ["meiner", "Gruppe", "die", "Aufgabe"], translation: "the task to my group." },
];

const B1_OPINION_STEMS: SentenceStem[] = [
  { words: ["Ich", "denke", "dass"], translation: "I think that", emoji: "💭" },
  { words: ["Wir", "glauben", "dass"], translation: "We believe that", emoji: "💭" },
  { words: ["Meine", "Lehrerin", "sagt", "dass"], translation: "My teacher says that", emoji: "💭" },
  { words: ["Der", "Kurs", "merkt", "dass"], translation: "The course notices that", emoji: "💭" },
  { words: ["Die", "Gruppe", "findet", "dass"], translation: "The group thinks that", emoji: "💭" },
];

const B1_OPINION_TAILS: SentenceTail[] = [
  { words: ["wir", "mehr", "Deutsch", "sprechen", "müssen"], translation: "we must speak more German." },
  { words: ["das", "Thema", "heute", "sehr", "wichtig", "ist"], translation: "the topic is very important today." },
  { words: ["die", "Aufgabe", "leichter", "als", "gestern", "ist"], translation: "the task is easier than yesterday." },
  { words: ["unsere", "Aussprache", "schon", "besser", "geworden", "ist"], translation: "our pronunciation has already improved." },
];

const B1_IF_STEMS: SentenceStem[] = [
  { words: ["Wenn", "ich", "früh", "aufstehe"], translation: "If I get up early", emoji: "🌅" },
  { words: ["Wenn", "wir", "zusammen", "lernen"], translation: "If we study together", emoji: "🌅" },
  { words: ["Wenn", "meine", "Freundin", "Zeit", "hat"], translation: "If my friend has time", emoji: "🌅" },
  { words: ["Wenn", "der", "Kurs", "pünktlich", "beginnt"], translation: "If the course starts on time", emoji: "🌅" },
  { words: ["Wenn", "die", "Lehrerin", "langsam", "spricht"], translation: "If the teacher speaks slowly", emoji: "🌅" },
];

const B1_IF_TAILS: SentenceTail[] = [
  { words: ["verstehe", "ich", "mehr"], translation: "I understand more." },
  { words: ["machen", "wir", "schneller", "Fortschritte"], translation: "we make faster progress." },
  { words: ["gehen", "wir", "später", "noch", "ins", "Cafe"], translation: "we go to the cafe later." },
  { words: ["fühlen", "sich", "alle", "sicherer"], translation: "everyone feels more confident." },
];

export const SENTENCE_EXERCISES: SentenceExercise[] = [
  ...composeSentenceExercises("satz-a1-lernen", "A1", A1_LEARN_STEMS, A1_LEARN_TAILS),
  ...composeSentenceExercises("satz-a1-trinken", "A1", A1_DRINK_STEMS, A1_DRINK_TAILS),
  ...composeSentenceExercises("satz-a1-essen", "A1", A1_EAT_STEMS, A1_EAT_TAILS),
  ...composeSentenceExercises("satz-a1-gehen", "A1", A1_GO_STEMS, A1_GO_TAILS),
  ...composeSentenceExercises("satz-a1-wohnen", "A1", A1_LIVE_STEMS, A1_LIVE_TAILS),
  ...composeSentenceExercises("satz-a2-kaufen", "A2", A2_BUY_STEMS, A2_BUY_TAILS),
  ...composeSentenceExercises("satz-a2-muessen", "A2", A2_MUST_STEMS, A2_MUST_TAILS),
  ...composeSentenceExercises("satz-a2-koennen", "A2", A2_CAN_STEMS, A2_CAN_TAILS),
  ...composeSentenceExercises("satz-a2-treffen", "A2", A2_MEET_STEMS, A2_MEET_TAILS),
  ...composeSentenceExercises("satz-a2-reisen", "A2", A2_TRAVEL_STEMS, A2_TRAVEL_TAILS),
  ...composeSentenceExercises("satz-a2-erklaeren", "A2", A2_EXPLAIN_STEMS, A2_EXPLAIN_TAILS),
  ...composeSentenceExercises("satz-b1-meinung", "B1", B1_OPINION_STEMS, B1_OPINION_TAILS),
  ...composeSentenceExercises("satz-b1-wenn", "B1", B1_IF_STEMS, B1_IF_TAILS),
];

export const CHAT_EXERCISES: ChatExercise[] = [
  {
    id: "chat-a1-1",
    contact: "Anna",
    scenario: "Language cafe",
    incoming: "Hallo! Kommst du heute ins Sprachcafe?",
    translation: "Hi! Are you coming to the language cafe today?",
    correctReply: "Ja, ich komme um 18 Uhr.",
    options: [
      "Ja, ich komme um 18 Uhr.",
      "Nein, mein Name ist Kaffee.",
      "Ich bin ein Tisch im Cafe.",
      "Die Banane lernt heute Deutsch.",
    ],
    feedback: "Confirm the plan with a short and natural answer.",
    emoji: "\u{1F44B}",
    level: "A1",
  },
  {
    id: "chat-a1-2",
    contact: "Lukas",
    scenario: "First meeting",
    incoming: "Wie hei\u00dft du?",
    translation: "What is your name?",
    correctReply: "Ich hei\u00dfe Sara.",
    options: [
      "Ich hei\u00dfe Sara.",
      "Ich komme aus dem Bahnhof.",
      "Heute ist die Lampe blau.",
      "Wir trinken ein Handy.",
    ],
    feedback: "Introduce yourself directly.",
    emoji: "\u{1F464}",
    level: "A1",
  },
  {
    id: "chat-a1-3",
    contact: "Mia",
    scenario: "Class time",
    incoming: "Wann beginnt der Kurs?",
    translation: "When does the course start?",
    correctReply: "Der Kurs beginnt um neun Uhr.",
    options: [
      "Der Kurs beginnt um neun Uhr.",
      "Der Kurs ist ein Apfel.",
      "Ich lese den Bahnhof.",
      "Meine Schwester ist morgen klein.",
    ],
    feedback: "Answer the question with a time.",
    emoji: "\u{23F0}",
    level: "A1",
  },
  {
    id: "chat-a1-4",
    contact: "Noah",
    scenario: "Vocabulary help",
    incoming: "Kannst du mir mit diesem Wort helfen?",
    translation: "Can you help me with this word?",
    correctReply: "Ja, nat\u00fcrlich. Welches Wort?",
    options: [
      "Ja, nat\u00fcrlich. Welches Wort?",
      "Nein, das Wort trinkt Tee.",
      "Ich wohne in der Suppe.",
      "Der Stuhl ist mein Bruder.",
    ],
    feedback: "A good chat reply accepts the request and asks for the detail.",
    emoji: "\u{1F4DA}",
    level: "A1",
  },
  {
    id: "chat-a1-5",
    contact: "Elif",
    scenario: "Meeting point",
    incoming: "Wo bist du jetzt?",
    translation: "Where are you right now?",
    correctReply: "Ich bin vor dem Cafe.",
    options: [
      "Ich bin vor dem Cafe.",
      "Ich bin um 18 Uhr.",
      "Ich esse der Bahnhof.",
      "Meine Wohnung hei\u00dft Milch.",
    ],
    feedback: "Reply with a place.",
    emoji: "\u{1F4CD}",
    level: "A1",
  },
  {
    id: "chat-a1-6",
    contact: "Ben",
    scenario: "Order",
    incoming: "M\u00f6chtest du Kaffee oder Tee?",
    translation: "Would you like coffee or tea?",
    correctReply: "Ich nehme Tee, bitte.",
    options: [
      "Ich nehme Tee, bitte.",
      "Ich bin Tee um acht Uhr.",
      "Das Brot f\u00e4hrt nach Berlin.",
      "Wir lernen die Flasche.",
    ],
    feedback: "Choose one option politely.",
    emoji: "\u{2615}",
    level: "A1",
  },
  {
    id: "chat-a1-7",
    contact: "Sofia",
    scenario: "Attendance",
    incoming: "Bist du heute im Kurs?",
    translation: "Are you in class today?",
    correctReply: "Ja, ich bin heute im Kurs.",
    options: [
      "Ja, ich bin heute im Kurs.",
      "Nein, ich hei\u00dfe im Kurs.",
      "Das Kurszimmer trinkt Wasser.",
      "Meine Mutter ist ein Bahnhof.",
    ],
    feedback: "Confirm your attendance clearly.",
    emoji: "\u{1F4DD}",
    level: "A1",
  },
  {
    id: "chat-a1-8",
    contact: "Paul",
    scenario: "Station",
    incoming: "Treffen wir uns am Bahnhof?",
    translation: "Shall we meet at the station?",
    correctReply: "Ja, wir treffen uns am Bahnhof.",
    options: [
      "Ja, wir treffen uns am Bahnhof.",
      "Nein, der Bahnhof ist ein Messer.",
      "Ich trinke den Bahnhof heute.",
      "Die Uhr lernt im Garten.",
    ],
    feedback: "Mirror the meeting plan in a simple confirmation.",
    emoji: "\u{1F686}",
    level: "A1",
  },
  {
    id: "chat-a1-9",
    contact: "Lea",
    scenario: "Free seat",
    incoming: "Ist dieser Platz frei?",
    translation: "Is this seat free?",
    correctReply: "Ja, du kannst hier sitzen.",
    options: [
      "Ja, du kannst hier sitzen.",
      "Ja, ich sitze den Kaffee.",
      "Nein, das Fenster ist hungrig.",
      "Wir gehen den Platz um Tee.",
    ],
    feedback: "Offer the seat in a friendly way.",
    emoji: "\u{1FA91}",
    level: "A1",
  },
  {
    id: "chat-a1-10",
    contact: "Emir",
    scenario: "Language choice",
    incoming: "Sprichst du Deutsch oder Englisch?",
    translation: "Do you speak German or English?",
    correctReply: "Ich spreche Deutsch und ein bisschen Englisch.",
    options: [
      "Ich spreche Deutsch und ein bisschen Englisch.",
      "Ich spreche die Wohnung mit Brot.",
      "Englisch ist mein Bahnhof heute.",
      "Der Garten spricht mich um neun.",
    ],
    feedback: "State the languages you speak.",
    emoji: "\u{1F5E3}",
    level: "A1",
  },
  {
    id: "chat-a1-11",
    contact: "Nina",
    scenario: "Classroom",
    incoming: "Hast du den Klassenraum gefunden?",
    translation: "Did you find the classroom?",
    correctReply: "Ja, ich habe ihn gefunden.",
    options: [
      "Ja, ich habe ihn gefunden.",
      "Nein, ich bin ein Klassenraum.",
      "Das Buch geht nach Wasser.",
      "Wir trinken die Treppe.",
    ],
    feedback: "A short yes-answer works well here.",
    emoji: "\u{1F50D}",
    level: "A1",
  },
  {
    id: "chat-a1-12",
    contact: "Tom",
    scenario: "Address",
    incoming: "Kannst du mir die Adresse schicken?",
    translation: "Can you send me the address?",
    correctReply: "Ja, ich schicke sie dir gleich.",
    options: [
      "Ja, ich schicke sie dir gleich.",
      "Die Adresse trinkt gleich Kaffee.",
      "Ich bin Adresse mit dem Sofa.",
      "Wir kochen das Handy heute.",
    ],
    feedback: "A natural reply promises the action.",
    emoji: "\u{1F4E9}",
    level: "A1",
  },
  {
    id: "chat-a2-1",
    contact: "Clara",
    scenario: "Late arrival",
    incoming: "Ich bin zehn Minuten sp\u00e4ter. Ist das okay?",
    translation: "I am ten minutes late. Is that okay?",
    correctReply: "Ja, kein Problem. Ich warte vor dem Eingang.",
    options: [
      "Ja, kein Problem. Ich warte vor dem Eingang.",
      "Nein, ich bin heute ein Eingang.",
      "Der Kurs f\u00e4hrt zehn Minuten Kaffee.",
      "Ich lerne mit der Lampe sp\u00e4ter.",
    ],
    feedback: "A supportive reply accepts the delay and shares your location.",
    emoji: "\u{23F3}",
    level: "A2",
  },
  {
    id: "chat-a2-2",
    contact: "Jonas",
    scenario: "Bring notebook",
    incoming: "Kannst du bitte dein Notizbuch mitbringen?",
    translation: "Can you bring your notebook, please?",
    correctReply: "Ja, ich bringe es mit.",
    options: [
      "Ja, ich bringe es mit.",
      "Ich bringe den Bahnhof mit Tee.",
      "Nein, mein Notizbuch ist ein Bruder.",
      "Wir wohnen im Notizbuch morgen.",
    ],
    feedback: "Reply by confirming the request.",
    emoji: "\u{1F4D3}",
    level: "A2",
  },
  {
    id: "chat-a2-3",
    contact: "Marta",
    scenario: "After work",
    incoming: "Hast du nach der Arbeit noch Zeit?",
    translation: "Do you still have time after work?",
    correctReply: "Ja, ich habe ab 19 Uhr Zeit.",
    options: [
      "Ja, ich habe ab 19 Uhr Zeit.",
      "Ich arbeite die Zeit im Garten.",
      "Mein Kaffee hat morgen Sprache.",
      "Die Arbeit ist ein kleiner Tisch.",
    ],
    feedback: "A precise answer with time is best.",
    emoji: "\u{1F4C5}",
    level: "A2",
  },
  {
    id: "chat-a2-4",
    contact: "David",
    scenario: "Reservation",
    incoming: "Kannst du zwei Pl\u00e4tze reservieren?",
    translation: "Can you reserve two seats?",
    correctReply: "Ja, ich reserviere zwei Pl\u00e4tze.",
    options: [
      "Ja, ich reserviere zwei Pl\u00e4tze.",
      "Zwei Pl\u00e4tze trinken Wasser.",
      "Ich reserviere den Kaffee am Bahnhof.",
      "Meine Tasche ist reserviert Deutsch.",
    ],
    feedback: "Confirm the task directly.",
    emoji: "\u{1F4CB}",
    level: "A2",
  },
  {
    id: "chat-a2-5",
    contact: "Sara",
    scenario: "Train arrival",
    incoming: "Wei\u00dft du, wann der Zug ankommt?",
    translation: "Do you know when the train arrives?",
    correctReply: "Ja, der Zug kommt um 17:20 Uhr an.",
    options: [
      "Ja, der Zug kommt um 17:20 Uhr an.",
      "Ja, der Zug ist mein Bruder heute.",
      "Wir trinken den Zug im Cafe.",
      "Das Fenster kommt aus der Suppe.",
    ],
    feedback: "Give the arrival time if you know it.",
    emoji: "\u{1F68A}",
    level: "A2",
  },
  {
    id: "chat-a2-6",
    contact: "Yara",
    scenario: "Homework",
    incoming: "Kannst du mir die Hausaufgabe erkl\u00e4ren?",
    translation: "Can you explain the homework to me?",
    correctReply: "Ja, ich erkl\u00e4re sie dir nach dem Kurs.",
    options: [
      "Ja, ich erkl\u00e4re sie dir nach dem Kurs.",
      "Die Hausaufgabe wohnt im Bahnhof.",
      "Ich erkl\u00e4re den Kaffee in der Wohnung.",
      "Wir kaufen Hausaufgabe um neun.",
    ],
    feedback: "Offer help and set a realistic moment.",
    emoji: "\u{1F4DA}",
    level: "A2",
  },
  {
    id: "chat-a2-7",
    contact: "Felix",
    scenario: "New day",
    incoming: "Wir treffen uns jetzt am Donnerstag statt am Mittwoch.",
    translation: "We meet on Thursday instead of Wednesday now.",
    correctReply: "Danke, Donnerstag passt f\u00fcr mich.",
    options: [
      "Danke, Donnerstag passt f\u00fcr mich.",
      "Donnerstag ist eine kleine Kartoffel.",
      "Ich passe den Tisch mit Wasser.",
      "Mittwoch spricht mein Messer langsam.",
    ],
    feedback: "Acknowledge the change and confirm.",
    emoji: "\u{1F4C6}",
    level: "A2",
  },
  {
    id: "chat-a2-8",
    contact: "Lina",
    scenario: "Study group",
    incoming: "M\u00f6chtest du in unsere Lerngruppe kommen?",
    translation: "Would you like to join our study group?",
    correctReply: "Ja, gern. Wann trefft ihr euch?",
    options: [
      "Ja, gern. Wann trefft ihr euch?",
      "Nein, die Lerngruppe trinkt die Uhr.",
      "Ich wohne die Gruppe im Kaffee.",
      "Der Kurs isst meine Adresse.",
    ],
    feedback: "A natural reply shows interest and asks for details.",
    emoji: "\u{1F465}",
    level: "A2",
  },
  {
    id: "chat-a2-9",
    contact: "Omar",
    scenario: "Call me",
    incoming: "Ruf mich bitte an, wenn du da bist.",
    translation: "Please call me when you are there.",
    correctReply: "Okay, ich rufe dich an, wenn ich ankomme.",
    options: [
      "Okay, ich rufe dich an, wenn ich ankomme.",
      "Ich komme mit dem Telefon in die Suppe.",
      "Der Anruf ist ein Bahnhof heute.",
      "Wir lesen die Uhr mit Brot.",
    ],
    feedback: "Repeat the action to confirm it.",
    emoji: "\u{1F4DE}",
    level: "A2",
  },
  {
    id: "chat-a2-10",
    contact: "Emma",
    scenario: "Tickets",
    incoming: "Hast du die Tickets schon gekauft?",
    translation: "Have you bought the tickets already?",
    correctReply: "Ja, ich habe sie gestern gekauft.",
    options: [
      "Ja, ich habe sie gestern gekauft.",
      "Nein, ich bin das Ticket im Garten.",
      "Die Tickets trinken heute Kaffee.",
      "Wir kochen die Reise im Bett.",
    ],
    feedback: "Use the perfect tense to report a finished action.",
    emoji: "\u{1F3AB}",
    level: "A2",
  },
  {
    id: "chat-a2-11",
    contact: "Mila",
    scenario: "Take a photo",
    incoming: "Kannst du schnell ein Foto von uns machen?",
    translation: "Can you quickly take a photo of us?",
    correctReply: "Ja, klar. Stellt euch bitte hierhin.",
    options: [
      "Ja, klar. Stellt euch bitte hierhin.",
      "Das Foto wohnt im Messer.",
      "Ich trinke das Foto nach Hause.",
      "Wir lernen den Garten im Bild.",
    ],
    feedback: "Accept the request and guide the people.",
    emoji: "\u{1F4F8}",
    level: "A2",
  },
  {
    id: "chat-a2-12",
    contact: "Kai",
    scenario: "Documents",
    incoming: "Vergiss bitte die Unterlagen nicht.",
    translation: "Please do not forget the documents.",
    correctReply: "Keine Sorge, ich habe sie schon in meiner Tasche.",
    options: [
      "Keine Sorge, ich habe sie schon in meiner Tasche.",
      "Die Unterlagen fahren heute mit dem Sofa.",
      "Ich vergesse die Tasche im Kaffee.",
      "Mein Dokument ist ein kleiner Apfel.",
    ],
    feedback: "Reassure the person and mention where the documents are.",
    emoji: "\u{1F4C1}",
    level: "A2",
  },
  {
    id: "chat-b1-1",
    contact: "Laura",
    scenario: "Event feedback",
    incoming: "Wie fandest du den heutigen Sprachabend?",
    translation: "How did you like today's language evening?",
    correctReply: "Ich fand ihn sehr lebendig, besonders die Gruppengespr\u00e4che.",
    options: [
      "Ich fand ihn sehr lebendig, besonders die Gruppengespr\u00e4che.",
      "Der Sprachabend trinkt heute sehr lebendig.",
      "Ich bin der Gruppenabend im Kaffee.",
      "Die Gespr\u00e4che wohnen unter dem Tisch.",
    ],
    feedback: "A strong reply gives a clear opinion plus one detail.",
    emoji: "\u{1F389}",
    level: "B1",
  },
  {
    id: "chat-b1-2",
    contact: "Daniel",
    scenario: "Bad weather",
    incoming: "Es soll morgen stark regnen. Sollen wir das Treffen verschieben?",
    translation: "It should rain heavily tomorrow. Should we postpone the meeting?",
    correctReply: "Ja, das ist wahrscheinlich besser. Lass uns einen neuen Termin suchen.",
    options: [
      "Ja, das ist wahrscheinlich besser. Lass uns einen neuen Termin suchen.",
      "Der Regen ist mein Termin im Bahnhof.",
      "Wir verschieben die Suppe mit dem Messer.",
      "Ich suche morgen den Regen im Tisch.",
    ],
    feedback: "Accept the suggestion and move the conversation forward.",
    emoji: "\u{1F327}",
    level: "B1",
  },
  {
    id: "chat-b1-3",
    contact: "Hannah",
    scenario: "Regular practice",
    incoming: "Wie k\u00f6nnen wir unser Deutsch au\u00dferhalb des Unterrichts regelm\u00e4\u00dfig \u00fcben?",
    translation: "How can we practise our German regularly outside class?",
    correctReply: "Wir k\u00f6nnten zweimal pro Woche kurze Sprachnachrichten austauschen.",
    options: [
      "Wir k\u00f6nnten zweimal pro Woche kurze Sprachnachrichten austauschen.",
      "Unser Deutsch wohnt au\u00dferhalb der Flasche.",
      "Wir \u00fcben die Nachricht mit einem Apfel.",
      "Das Unterrichtswochenende trinkt zweimal Kaffee.",
    ],
    feedback: "Offer a concrete and realistic idea.",
    emoji: "\u{1F4F1}",
    level: "B1",
  },
  {
    id: "chat-b1-4",
    contact: "Nora",
    scenario: "Summary",
    incoming: "Kannst du die wichtigsten Punkte kurz zusammenfassen?",
    translation: "Can you briefly summarize the most important points?",
    correctReply: "Ja. Wir treffen uns um 18 Uhr, bringen die Materialien mit und arbeiten in Teams.",
    options: [
      "Ja. Wir treffen uns um 18 Uhr, bringen die Materialien mit und arbeiten in Teams.",
      "Die wichtigsten Punkte trinken zusammen Kaffee.",
      "Ich fasse den Bahnhof unter dem Sofa.",
      "Wir arbeiten die Materialien in einer Banane.",
    ],
    feedback: "A summary should be short and structured.",
    emoji: "\u{1F4CC}",
    level: "B1",
  },
  {
    id: "chat-b1-5",
    contact: "Ibrahim",
    scenario: "Polite decline",
    incoming: "Kannst du am Samstag beim Event mithelfen?",
    translation: "Can you help at the event on Saturday?",
    correctReply: "Leider nicht. Ich bin schon verplant, aber ich kann am Freitag vorbereiten helfen.",
    options: [
      "Leider nicht. Ich bin schon verplant, aber ich kann am Freitag vorbereiten helfen.",
      "Samstag ist leider ein gro\u00dfer K\u00fchlschrank.",
      "Ich helfe dem Event mit Kaffee und Fenster.",
      "Der Freitag ist schon in meiner Suppe.",
    ],
    feedback: "A polite decline often includes an alternative.",
    emoji: "\u{1F647}",
    level: "B1",
  },
  {
    id: "chat-b1-6",
    contact: "Zeynep",
    scenario: "Clarification",
    incoming: "Ich bin nicht sicher, wie wir die Gruppen einteilen sollen.",
    translation: "I am not sure how we should divide the groups.",
    correctReply: "Wir k\u00f6nnen sie zuerst nach Niveau und dann nach Interessen aufteilen.",
    options: [
      "Wir k\u00f6nnen sie zuerst nach Niveau und dann nach Interessen aufteilen.",
      "Die Gruppe teilt den Kaffee in drei Tische.",
      "Ich bin das Niveau im Bahnhof heute.",
      "Interessen wohnen unter der Lampe.",
    ],
    feedback: "A useful answer proposes a simple method.",
    emoji: "\u{1F9E9}",
    level: "B1",
  },
  {
    id: "chat-b1-7",
    contact: "Max",
    scenario: "Improve the course",
    incoming: "Was k\u00f6nnten wir im Kurs verbessern?",
    translation: "What could we improve in the course?",
    correctReply: "Vielleicht sollten wir mehr kurze Sprech\u00fcbungen in kleinen Gruppen machen.",
    options: [
      "Vielleicht sollten wir mehr kurze Sprech\u00fcbungen in kleinen Gruppen machen.",
      "Der Kurs verbessert heute die Kartoffel im Garten.",
      "Ich mache die \u00dcbung in einem Kissen Kaffee.",
      "Die kleine Gruppe wohnt im Lehrbuch.",
    ],
    feedback: "Give one practical improvement instead of a vague opinion.",
    emoji: "\u{1F4A1}",
    level: "B1",
  },
  {
    id: "chat-b1-8",
    contact: "Aylin",
    scenario: "Complaint",
    incoming: "Das Video l\u00e4dt bei mir sehr langsam. Hast du auch das Problem?",
    translation: "The video loads very slowly for me. Do you have the same problem?",
    correctReply: "Bei mir auch. Wir sollten es dem Organisator melden.",
    options: [
      "Bei mir auch. Wir sollten es dem Organisator melden.",
      "Das Video wohnt langsam in meiner Tasse.",
      "Ich lade das Problem mit einem Messer.",
      "Der Organisator trinkt das Internet heute.",
    ],
    feedback: "A good reply confirms the issue and suggests the next step.",
    emoji: "\u{1F4F9}",
    level: "B1",
  },
  {
    id: "chat-b1-9",
    contact: "Peter",
    scenario: "Collaboration",
    incoming: "Kannst du den ersten Teil vorbereiten, wenn ich die Moderation \u00fcbernehme?",
    translation: "Can you prepare the first part if I take over the moderation?",
    correctReply: "Ja, das passt gut. Ich schicke dir den Entwurf heute Abend.",
    options: [
      "Ja, das passt gut. Ich schicke dir den Entwurf heute Abend.",
      "Die Moderation f\u00e4hrt heute Abend zum Tisch.",
      "Ich \u00fcbernehme den Entwurf in der Suppe.",
      "Der erste Teil ist mein Kaffee im Garten.",
    ],
    feedback: "Confirm the division of tasks and mention the deliverable.",
    emoji: "\u{1F91D}",
    level: "B1",
  },
  {
    id: "chat-b1-10",
    contact: "Mina",
    scenario: "Need more time",
    incoming: "Schaffst du den Text heute noch?",
    translation: "Will you manage the text today?",
    correctReply: "Wahrscheinlich nicht ganz. Ich brauche noch etwa eine Stunde.",
    options: [
      "Wahrscheinlich nicht ganz. Ich brauche noch etwa eine Stunde.",
      "Der Text schafft heute meinen Bahnhof.",
      "Ich brauche die Stunde in einer Banane.",
      "Der Garten schreibt den Text mit Wasser.",
    ],
    feedback: "An honest progress update with a time estimate works best.",
    emoji: "\u{23F1}",
    level: "B1",
  },
  {
    id: "chat-b1-11",
    contact: "Yusuf",
    scenario: "Appreciation",
    incoming: "Danke noch mal f\u00fcr deine Hilfe gestern.",
    translation: "Thanks again for your help yesterday.",
    correctReply: "Gern. Ich freue mich, wenn ich helfen konnte.",
    options: [
      "Gern. Ich freue mich, wenn ich helfen konnte.",
      "Deine Hilfe wohnt gestern im Sofa.",
      "Ich danke den Bahnhof mit der Lampe.",
      "Gestern war die Freude ein K\u00fchlschrank.",
    ],
    feedback: "A warm and modest answer is natural here.",
    emoji: "\u{1F60A}",
    level: "B1",
  },
  {
    id: "chat-b1-12",
    contact: "Selin",
    scenario: "Different opinion",
    incoming: "Ich glaube, wir brauchen noch eine weitere Probe.",
    translation: "I think we need one more rehearsal.",
    correctReply: "Da stimme ich dir zu. Danach f\u00fchlen sich wahrscheinlich alle sicherer.",
    options: [
      "Da stimme ich dir zu. Danach f\u00fchlen sich wahrscheinlich alle sicherer.",
      "Die Probe stimmt dem Kaffee im Garten zu.",
      "Ich brauche die Sicherheit in einer Suppe.",
      "Alle f\u00fchlen den Bahnhof mit der Gabel.",
    ],
    feedback: "Show agreement and explain the benefit.",
    emoji: "\u{1F3AD}",
    level: "B1",
  },
];

export const STORY_EXERCISES: StoryExercise[] = [
  {
    id: "story-a1-1",
    title: "Im Cafe",
    setup: "Du bist im Sprachcafe. Die Kellnerin fragt: 'Was moechtest du trinken?'",
    translation: "You are in the language cafe. The waitress asks what you would like to drink.",
    question: "Welche Antwort passt am besten?",
    correctAnswer: "Ich nehme einen Tee, bitte.",
    options: [
      "Ich nehme einen Tee, bitte.",
      "Der Tee ist heute mein Tisch.",
      "Ich gehe mit dem Fenster um acht Uhr.",
      "Die Lampe trinkt im Garten.",
    ],
    explanation: "The best reply is a polite order.",
    emoji: "\u{2615}",
    level: "A1",
  },
  {
    id: "story-a1-2",
    title: "Am Bahnhof",
    setup: "Du wartest am Bahnhof auf deinen Freund. Er schreibt: 'Ich bin in fuenf Minuten da.'",
    translation: "You are waiting at the station. Your friend writes that he will be there in five minutes.",
    question: "Was antwortest du?",
    correctAnswer: "Okay, ich warte vor dem Eingang.",
    options: [
      "Okay, ich warte vor dem Eingang.",
      "Der Eingang lernt heute Deutsch.",
      "Ich trinke fuenf Minuten im Bahnhof.",
      "Die Uhr ist mein Bruder.",
    ],
    explanation: "A short confirmation with the meeting point fits the story.",
    emoji: "\u{1F686}",
    level: "A1",
  },
  {
    id: "story-a1-3",
    title: "Im Kurs",
    setup: "Heute ist dein erster Kurstag. Die Lehrerin sagt: 'Bitte stell dich kurz vor.'",
    translation: "It is your first day in class. The teacher asks you to introduce yourself briefly.",
    question: "Was sagst du?",
    correctAnswer: "Hallo, ich heisse Omar und ich komme aus Syrien.",
    options: [
      "Hallo, ich heisse Omar und ich komme aus Syrien.",
      "Der Kurs ist heute sehr Banane.",
      "Ich bin der Tisch neben der Tuer.",
      "Das Wasser schreibt meinen Namen.",
    ],
    explanation: "You should greet the class and give basic information about yourself.",
    emoji: "\u{1F393}",
    level: "A1",
  },
  {
    id: "story-a1-4",
    title: "Im Supermarkt",
    setup: "Du bist an der Kasse. Die Verkaeuferin fragt: 'Brauchst du eine Tuete?'",
    translation: "You are at the checkout. The cashier asks if you need a bag.",
    question: "Welche Antwort ist richtig?",
    correctAnswer: "Ja, bitte. Eine Tuete waere gut.",
    options: [
      "Ja, bitte. Eine Tuete waere gut.",
      "Die Tuete wohnt in meinem Kaffee.",
      "Ich brauche heute einen Bahnhof aus Brot.",
      "Das Regal geht mit der Gabel.",
    ],
    explanation: "The natural answer is a polite yes.",
    emoji: "\u{1F6D2}",
    level: "A1",
  },
  {
    id: "story-a1-5",
    title: "Zu Hause",
    setup: "Du kannst deinen Schluessel nicht finden. Deine Schwester sagt: 'Vielleicht liegt er auf dem Tisch.'",
    translation: "You cannot find your key. Your sister says it might be on the table.",
    question: "Was antwortest du?",
    correctAnswer: "Danke, ich schaue sofort nach.",
    options: [
      "Danke, ich schaue sofort nach.",
      "Der Schluessel trinkt auf dem Tisch.",
      "Ich bin heute eine schnelle Lampe.",
      "Der Tisch kommt aus dem Kaffee.",
    ],
    explanation: "A thankful response that shows your next action fits best.",
    emoji: "\u{1F511}",
    level: "A1",
  },
  {
    id: "story-a1-6",
    title: "In der Bibliothek",
    setup: "Du lernst in der Bibliothek. Ein Student fragt: 'Ist dieser Platz frei?'",
    translation: "You are studying in the library. A student asks if the seat is free.",
    question: "Wie antwortest du?",
    correctAnswer: "Ja, du kannst hier sitzen.",
    options: [
      "Ja, du kannst hier sitzen.",
      "Der Platz spricht heute mit dem Buch.",
      "Ich sitze um neun Uhr im Fenster.",
      "Die Bibliothek trinkt mein Handy.",
    ],
    explanation: "Offer the seat directly and simply.",
    emoji: "\u{1F4DA}",
    level: "A1",
  },
  {
    id: "story-a1-7",
    title: "An der Bushaltestelle",
    setup: "Du bist neu in der Stadt. Du fragst eine Frau: 'Faehrt dieser Bus ins Zentrum?'",
    translation: "You are new in town. You ask a woman whether this bus goes to the center.",
    question: "Welche Antwort hilft dir?",
    correctAnswer: "Ja, aber du musst an der dritten Haltestelle aussteigen.",
    options: [
      "Ja, aber du musst an der dritten Haltestelle aussteigen.",
      "Das Zentrum ist heute eine Kartoffel.",
      "Der Bus isst im Garten zu Abend.",
      "Ich wohne mit der Haltestelle im Tee.",
    ],
    explanation: "A useful answer confirms the route and gives one extra detail.",
    emoji: "\u{1F68C}",
    level: "A1",
  },
  {
    id: "story-a1-8",
    title: "Beim Arzt",
    setup: "Du kommst zum Termin. Die Assistentin sagt: 'Bitte warten Sie einen Moment.'",
    translation: "You arrive for your appointment. The assistant asks you to wait a moment.",
    question: "Was sagst du?",
    correctAnswer: "Natuerlich, kein Problem.",
    options: [
      "Natuerlich, kein Problem.",
      "Der Moment ist mein Fenster.",
      "Ich warte den Arzt mit Kaffee.",
      "Die Assistentin wohnt im Stuhl.",
    ],
    explanation: "A calm polite response is best here.",
    emoji: "\u{2695}",
    level: "A1",
  },
  {
    id: "story-a2-1",
    title: "Picknick am Wochenende",
    setup: "Du planst ein Picknick mit Freunden. Jetzt regnet es und jemand fragt, ob ihr den Plan aendern sollt.",
    translation: "You are planning a picnic with friends. Now it is raining and someone asks whether you should change the plan.",
    question: "Welche Antwort passt am besten?",
    correctAnswer: "Ja, wir koennen uns stattdessen im Cafe treffen.",
    options: [
      "Ja, wir koennen uns stattdessen im Cafe treffen.",
      "Der Regen schreibt heute das Picknick.",
      "Ich nehme den Plan in einer Kartoffel mit.",
      "Das Wochenende ist mein Stuhl im Garten.",
    ],
    explanation: "Offer a practical alternative to the original plan.",
    emoji: "\u{2614}",
    level: "A2",
  },
  {
    id: "story-a2-2",
    title: "Mitbewohner",
    setup: "Dein Mitbewohner schreibt: 'Die Kueche ist noch unordentlich. Kannst du sie heute Abend aufraeumen?'",
    translation: "Your roommate asks whether you can clean the kitchen this evening.",
    question: "Wie antwortest du sinnvoll?",
    correctAnswer: "Ja, ich mache das nach dem Kurs.",
    options: [
      "Ja, ich mache das nach dem Kurs.",
      "Die Kueche lernt heute am Abend.",
      "Ich raeume den Kurs in meiner Tasse auf.",
      "Der Mitbewohner ist eine schnelle Banane.",
    ],
    explanation: "A good answer accepts the request and gives a time.",
    emoji: "\u{1F9F9}",
    level: "A2",
  },
  {
    id: "story-a2-3",
    title: "Zu spaet mit den Hausaufgaben",
    setup: "Du hast die Hausaufgaben nicht fertig. Der Lehrer fragt nach dem Grund.",
    translation: "You have not finished the homework. The teacher asks for the reason.",
    question: "Welche Antwort ist am besten?",
    correctAnswer: "Es tut mir leid, ich hatte gestern einen langen Arbeitstag.",
    options: [
      "Es tut mir leid, ich hatte gestern einen langen Arbeitstag.",
      "Die Hausaufgaben sind heute mein Kaffee.",
      "Ich schreibe den Grund in einem Fenster.",
      "Der Lehrer geht mit der Suppe nach Hause.",
    ],
    explanation: "Apologize and explain the reason briefly.",
    emoji: "\u{1F4D8}",
    level: "A2",
  },
  {
    id: "story-a2-4",
    title: "Sprachcafe helfen",
    setup: "Der Organisator sucht noch jemanden fuer den Empfang und fragt, ob du frueher kommen kannst.",
    translation: "The organizer is still looking for someone for reception and asks whether you can come earlier.",
    question: "Was ist eine gute Antwort?",
    correctAnswer: "Ja, ich kann eine halbe Stunde frueher da sein.",
    options: [
      "Ja, ich kann eine halbe Stunde frueher da sein.",
      "Der Empfang trinkt heute meine Uhr.",
      "Ich bin die halbe Stunde im Schluessel.",
      "Das Sprachcafe wohnt im Busbahnhof.",
    ],
    explanation: "Confirm the help and give a concrete time.",
    emoji: "\u{1F91D}",
    level: "A2",
  },
  {
    id: "story-a2-5",
    title: "Laute Musik",
    setup: "Dein Nachbar sagt, dass deine Musik gestern Abend zu laut war.",
    translation: "Your neighbor says your music was too loud yesterday evening.",
    question: "Wie reagierst du passend?",
    correctAnswer: "Entschuldigung, ich mache sie naechstes Mal leiser.",
    options: [
      "Entschuldigung, ich mache sie naechstes Mal leiser.",
      "Die Musik war gestern eine Kartoffel.",
      "Ich hoere den Nachbarn im Kuehlschrank.",
      "Der Abend wohnt unter meiner Lampe.",
    ],
    explanation: "A polite apology and a promise to improve is the best response.",
    emoji: "\u{1F50A}",
    level: "A2",
  },
  {
    id: "story-a2-6",
    title: "Termin verschieben",
    setup: "Du hast morgen einen Arzttermin, aber du musst arbeiten und kannst nicht kommen.",
    translation: "You have a doctor's appointment tomorrow, but you have to work and cannot come.",
    question: "Welche Nachricht passt?",
    correctAnswer: "Koennen wir bitte einen neuen Termin fuer naechste Woche vereinbaren?",
    options: [
      "Koennen wir bitte einen neuen Termin fuer naechste Woche vereinbaren?",
      "Der Termin arbeitet morgen in meinem Tee.",
      "Ich komme mit dem Arzt in einer Gabel.",
      "Die Woche wohnt im Bahnhof heute.",
    ],
    explanation: "Ask politely for a new appointment.",
    emoji: "\u{1F4C5}",
    level: "A2",
  },
  {
    id: "story-a2-7",
    title: "Im Hotel",
    setup: "Im Hotel merkst du am Morgen, dass das Fruehstueck nicht inklusive ist.",
    translation: "At the hotel, you notice in the morning that breakfast is not included.",
    question: "Was fragst du an der Rezeption?",
    correctAnswer: "Wie viel kostet das Fruehstueck pro Person?",
    options: [
      "Wie viel kostet das Fruehstueck pro Person?",
      "Das Hotel fruehstueckt heute mein Fenster.",
      "Ich esse die Rezeption fuer acht Uhr.",
      "Die Person wohnt in einer Banane.",
    ],
    explanation: "You should ask for the price clearly.",
    emoji: "\u{1F3E8}",
    level: "A2",
  },
  {
    id: "story-a2-8",
    title: "Verschobenes Treffen",
    setup: "Deine Kollegin schreibt, dass das Meeting wegen eines Problems spaeter beginnt.",
    translation: "Your colleague writes that the meeting will start later because of a problem.",
    question: "Wie antwortest du sinnvoll?",
    correctAnswer: "Danke fuer die Info. Sag mir bitte Bescheid, wenn ihr anfangen koennt.",
    options: [
      "Danke fuer die Info. Sag mir bitte Bescheid, wenn ihr anfangen koennt.",
      "Das Problem beginnt heute mein Meeting.",
      "Ich danke der Kollegin in einem Messer.",
      "Der Start wohnt spaeter im Wasser.",
    ],
    explanation: "Thank the person and ask for the next update.",
    emoji: "\u{1F4E7}",
    level: "A2",
  },
  {
    id: "story-b1-1",
    title: "Projektprioritaeten",
    setup: "Dein Team hat zu viele Aufgaben fuer diese Woche und ihr muesst entscheiden, was zuerst erledigt wird.",
    translation: "Your team has too many tasks for this week and must decide what to do first.",
    question: "Welche Aussage passt am besten in die Situation?",
    correctAnswer: "Lass uns zuerst die dringendsten Aufgaben mit festem Termin erledigen.",
    options: [
      "Lass uns zuerst die dringendsten Aufgaben mit festem Termin erledigen.",
      "Die Aufgabe trinkt heute ihren Termin im Garten.",
      "Ich erledige die Woche in einer Lampe Kaffee.",
      "Das Team wohnt zuerst im Bahnhof der Suppe.",
    ],
    explanation: "A strong B1 answer sets a clear priority rule.",
    emoji: "\u{1F4CB}",
    level: "B1",
  },
  {
    id: "story-b1-2",
    title: "Missverstaendnis im Chat",
    setup: "In eurer Gruppe denkt jemand, dass das Event abgesagt ist, obwohl es nur verschoben wurde.",
    translation: "Someone in your group thinks the event is cancelled, but it was only postponed.",
    question: "Wie klaerst du die Situation?",
    correctAnswer: "Nur zur Klarstellung: Das Event findet statt, aber eine Stunde spaeter.",
    options: [
      "Nur zur Klarstellung: Das Event findet statt, aber eine Stunde spaeter.",
      "Die Klarstellung wohnt abgesagt im Event.",
      "Ich verschiebe den Chat mit einer Kartoffel.",
      "Die Stunde trinkt heute unsere Gruppe.",
    ],
    explanation: "Clarify the misunderstanding directly and precisely.",
    emoji: "\u{1F4AC}",
    level: "B1",
  },
  {
    id: "story-b1-3",
    title: "Kursfeedback",
    setup: "Am Ende des Monats bittet euch die Schule um ehrliches Feedback zum Kurs.",
    translation: "At the end of the month, the school asks for honest feedback about the course.",
    question: "Welche Antwort ist am nuetzlichsten?",
    correctAnswer: "Die Themen sind interessant, aber ich wuensche mir mehr Sprechzeit in kleinen Gruppen.",
    options: [
      "Die Themen sind interessant, aber ich wuensche mir mehr Sprechzeit in kleinen Gruppen.",
      "Der Kurs ist heute ein interessanter Kuehlschrank.",
      "Ich spreche die Schule in einer Banane.",
      "Die Gruppe wuenscht sich den Tisch aus Kaffee.",
    ],
    explanation: "Balanced feedback should mention both a positive point and a concrete improvement.",
    emoji: "\u{1F4DD}",
    level: "B1",
  },
  {
    id: "story-b1-4",
    title: "Deadline verpasst",
    setup: "Du merkst, dass du einen Teil des Projekts nicht rechtzeitig abschliessen wirst.",
    translation: "You realize you will not finish part of the project on time.",
    question: "Wie informierst du dein Team am besten?",
    correctAnswer: "Ich schaffe meinen Teil heute nicht ganz, aber ich kann ihn morgen Vormittag fertigstellen.",
    options: [
      "Ich schaffe meinen Teil heute nicht ganz, aber ich kann ihn morgen Vormittag fertigstellen.",
      "Der Teil fertigt heute meinen Morgen im Kaffee.",
      "Ich vergesse die Deadline in einem Fenster Suppe.",
      "Das Projekt wohnt nicht rechtzeitig im Bus.",
    ],
    explanation: "A good response is honest and includes a realistic new timeline.",
    emoji: "\u{23F3}",
    level: "B1",
  },
  {
    id: "story-b1-5",
    title: "Programm aendern",
    setup: "Wegen des Wetters muss euer Ausflug anders geplant werden, damit die Gruppe trotzdem etwas machen kann.",
    translation: "Because of the weather, your trip needs to be planned differently so the group can still do something.",
    question: "Welche Loesung klingt am besten?",
    correctAnswer: "Wir koennten das Museum besuchen und den Spaziergang auf morgen verschieben.",
    options: [
      "Wir koennten das Museum besuchen und den Spaziergang auf morgen verschieben.",
      "Das Wetter besucht heute mein Spaziergangmuseum.",
      "Ich plane die Gruppe in einer Gabel morgen.",
      "Der Ausflug wohnt jetzt im Kaffeehaus der Kartoffel.",
    ],
    explanation: "You should propose a practical replacement and mention the original plan later.",
    emoji: "\u{1F3DB}",
    level: "B1",
  },
  {
    id: "story-b1-6",
    title: "Vor einer Praesentation",
    setup: "Eine Freundin ist vor ihrer Praesentation sehr nervoes und schreibt dir kurz vorher.",
    translation: "A friend is very nervous before her presentation and writes to you shortly before it starts.",
    question: "Was antwortest du am besten?",
    correctAnswer: "Atme tief durch und fang mit dem Punkt an, den du am sichersten kannst.",
    options: [
      "Atme tief durch und fang mit dem Punkt an, den du am sichersten kannst.",
      "Die Praesentation atmet heute meinen Bahnhof.",
      "Ich kann die Nervositaet in einer Tasse anfangen.",
      "Der Punkt wohnt sicher unter dem Fenster.",
    ],
    explanation: "A supportive answer gives calm and one practical strategy.",
    emoji: "\u{1F3A4}",
    level: "B1",
  },
  {
    id: "story-b1-7",
    title: "Freiwillige gesucht",
    setup: "Der Organisator braucht spontan zwei Helfer fuer den Check-in, weil jemand abgesagt hat.",
    translation: "The organizer suddenly needs two helpers for check-in because someone cancelled.",
    question: "Welche Reaktion hilft wirklich weiter?",
    correctAnswer: "Ich kann die erste Stunde uebernehmen, wenn noch jemand fuer spaeter einspringt.",
    options: [
      "Ich kann die erste Stunde uebernehmen, wenn noch jemand fuer spaeter einspringt.",
      "Der Check-in springt heute in meine Banane.",
      "Ich uebernehme die Stunde mit einem Kissen Kaffee.",
      "Die Absage wohnt spaeter im Bahnhof.",
    ],
    explanation: "A strong answer offers concrete help and sets a workable condition.",
    emoji: "\u{1F465}",
    level: "B1",
  },
  {
    id: "story-b1-8",
    title: "Unzufriedener Gast",
    setup: "Ein Gast sagt, dass er die Informationen zum Event zu spaet bekommen hat.",
    translation: "A guest says he received the event information too late.",
    question: "Welche Antwort ist professionell?",
    correctAnswer: "Danke fuer den Hinweis. Wir pruefen, wie wir die Infos beim naechsten Mal frueher schicken koennen.",
    options: [
      "Danke fuer den Hinweis. Wir pruefen, wie wir die Infos beim naechsten Mal frueher schicken koennen.",
      "Der Hinweis schickt heute mein Event in die Suppe.",
      "Ich bekomme die Information mit einem Messer Bahnhof.",
      "Das naechste Mal wohnt frueher im Kaffee.",
    ],
    explanation: "A professional reply thanks the person and focuses on improvement.",
    emoji: "\u{1F4E3}",
    level: "B1",
  },
];
