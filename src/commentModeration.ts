export type CommentModerationResult = {
  blocked: boolean;
  matchedTerm: string | null;
};

const LOOKALIKE_SUBSTITUTIONS: Record<string, string> = {
  "@": "a",
  "$": "s",
  "!": "i",
  "|": "i",
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
};

// Starter blocklist for profanity and obvious prohibited/spam terms.
// Extend this list over time based on real moderation cases.
const BLOCKED_TERM_STEMS = [
  "бля",
  "бляд",
  "сук",
  "хуй",
  "хуе",
  "пизд",
  "еба",
  "ебл",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "motherf",
  "dick",
  "porn",
  "escort",
  "casino",
  "сука",
  "пиздец",
  "ебать",
  "ебан",
  "ебло",
  "ебун",
  "ебы",
  "ебу",
  "ебуще",
  "ебуч",
  "ебуче",
  "ебучий",
  "ебучка",
  "ебучко",
  "ебуш",  
  "ебыще",
  "ебуще",
  "کوس",
  "کس",
  "کون",
  "کیر",
  "قحبه",
  "قحبه‌",
  "قحبه‌گی",
  "قحبه‌خانه",
  "قحبه‌کش",
  "جنده",
  "جنده‌",
  "جنده‌گی",
  "جنده‌خانه",
  "جنده‌کش",
  "пизда",
  "пиздец",
  "пиздеть",
  "пиздит",
  "пиздюга",
  "пиздюк",
  "طالب",
  "masturbat",
  "трах",
  "трахать",
  "kunilingus",
  "cunnilingus",
  "kurva",
  "kurwa",
  "prostitut",
  "prostitute",
  "проститутк",
  "проститутк" // covers both "проститутка" and "проститутки"
];

function normalizeCommentForModeration(input: string) {
  const substituted = [...input.normalize("NFKC").toLowerCase()]
    .map((char) => LOOKALIKE_SUBSTITUTIONS[char] ?? char)
    .join("");

  const normalized = substituted
    .replace(/[^a-zа-яё0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    normalized,
    compact: normalized.replace(/\s+/g, ""),
  };
}

export function moderateComment(input: string): CommentModerationResult {
  const { normalized, compact } = normalizeCommentForModeration(input);
  if (!normalized) {
    return {
      blocked: false,
      matchedTerm: null,
    };
  }

  const matchedTerm =
    BLOCKED_TERM_STEMS.find(
      (term) => compact.includes(term) || normalized.split(" ").some((word) => word.includes(term))
    ) ?? null;

  return {
    blocked: Boolean(matchedTerm),
    matchedTerm,
  };
}
