import {
  EXTRA_LESSON_TEMPLATE_TEXT,
  EXTRA_PRACTICE_TOPICS,
  EXTRA_VOICE_ASSISTANT_OVERRIDES,
} from "./voiceAssistantTextPlatformLocales";

export type VoiceAssistantText = {
  navLabel: string;
  title: string;
  subtitle: string;
  signInHint: string;
  unsupportedBrowser: string;
  languageLabel: string;
  languageHint: string;
  levelLabel: string;
  levelHint: string;
  practiceModeLabel: string;
  practiceModeHint: string;
  practiceModeDaily: string;
  practiceModeRoleplay: string;
  practiceModeTopic: string;
  practiceTopicLabel: string;
  practiceTopicHint: string;
  practiceTopicPlaceholder: string;
  progressTitle: string;
  progressFocus: string;
  progressPhrases: string;
  progressPronunciation: string;
  habitsTitle: string;
  habitsCurrentStreak: string;
  habitsLongestStreak: string;
  habitsWeeklyGoal: string;
  habitsWeeklyProgress: string;
  habitsWeeklyHint: string;
  habitsGoalOption: string;
  habitsWeeklyProgressValue: string;
  summaryTitle: string;
  summaryStrengths: string;
  summaryFocus: string;
  summaryPhrases: string;
  summaryHomework: string;
  recentSessionsTitle: string;
  recentSessionsEmpty: string;
  lessonTemplatesTitle: string;
  lessonTemplatesHint: string;
  lessonStart: string;
  lessonRestart: string;
  lessonActiveTitle: string;
  lessonProgress: string;
  lessonGoalLabel: string;
  lessonTurnsLabel: string;
  lessonScoreTitle: string;
  lessonScoreFluency: string;
  lessonScoreAccuracy: string;
  lessonScoreVocabulary: string;
  lessonScorePronunciation: string;
  lessonScoreGoal: string;
  lessonScoreFeedback: string;
  lessonReviewTitle: string;
  lessonReviewHint: string;
  lessonReviewGrammar: string;
  lessonReviewVocabulary: string;
  lessonReviewPronunciation: string;
  lessonReviewRepeat: string;
  lessonPlannerTitle: string;
  lessonPlannerHint: string;
  lessonPlannerReason: string;
  lessonPlannerFocus: string;
  lessonPlannerDifficulty: string;
  lessonPlannerStart: string;
  lessonDifficultyLabel: string;
  lessonRepeatTitle: string;
  lessonRepeatDescription: string;
  lessonRepeatTopicFallback: string;
  lessonRepeatGoal: string;
  lessonRepeatFallbackGoal: string;
  lessonFallbackFeedback: string;
  coachCorrection: string;
  coachBetterVersion: string;
  coachNextQuestion: string;
  coachPronunciation: string;
  nativeHelpLabel: string;
  nativeHelpHint: string;
  nativeHelpUnavailable: string;
  inputLabel: string;
  inputPlaceholder: string;
  holdToTalk: string;
  releaseToSend: string;
  send: string;
  clear: string;
  stopAudio: string;
  listening: string;
  thinking: string;
  speaking: string;
  idle: string;
  empty: string;
  emptyPrompt: string;
  roleUser: string;
  roleAssistant: string;
  voicePlaybackFailed: string;
  practiceProgressSyncUnavailable: string;
  practiceGoalSyncUnavailable: string;
  emptyResponse: string;
  aiRequestFailed: string;
  speechRecognitionFailed: string;
  difficultySupportive: string;
  difficultyBalanced: string;
  difficultyStretch: string;
  adaptiveReasonPronunciation: string;
  adaptiveReasonGrammar: string;
  adaptiveReasonVocabulary: string;
  adaptiveReasonFluency: string;
  adaptiveReasonStrong: string;
  adaptiveReasonMemoryPronunciation: string;
  adaptiveReasonMemoryGrammar: string;
  adaptiveReasonMemoryVocabulary: string;
  adaptiveReasonConsistency: string;
  adaptiveReasonStreak: string;
  adaptiveFocusTargets: string;
  adaptiveFocusDefault: string;
  difficultyNoteSupportive: string;
  difficultyNoteBalanced: string;
  difficultyNoteStretch: string;
};

type SupportedLocale =
  | "en"
  | "de"
  | "vi"
  | "ru"
  | "uk"
  | "fa"
  | "ar"
  | "sq"
  | "tr"
  | "fr"
  | "es"
  | "it"
  | "pl";
type PracticeTopicId =
  | "cafe"
  | "job"
  | "travel"
  | "smallTalk"
  | "doctor"
  | "presentation";
type LessonTemplateId =
  | "small-talk-loop"
  | "cafe-order"
  | "job-intro"
  | "travel-checkin"
  | "doctor-visit"
  | "presentation-opening";

export type LocalizedLessonTemplateText = {
  title: string;
  description: string;
  topic: string;
  goal: string;
};

function normalizeLocale(locale: string): SupportedLocale {
  const normalized = locale.trim().toLowerCase();
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("vi")) return "vi";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("uk")) return "uk";
  if (normalized.startsWith("ar")) return "ar";
  if (normalized.startsWith("fa")) return "fa";
  if (normalized.startsWith("sq")) return "sq";
  if (normalized.startsWith("tr")) return "tr";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("pl")) return "pl";
  return "en";
}

function fillTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

const ENGLISH_TEXT: VoiceAssistantText = {
  navLabel: "AI Practice",
  title: "AI Practice",
  subtitle: "Speak, get coached, and keep the conversation going.",
  signInHint: "Sign in to use AI Practice.",
  unsupportedBrowser:
    "Speech recognition is available in supported browsers such as Chrome or Edge.",
  languageLabel: "Conversation language",
  languageHint:
    "Only your learning language and native language appear here, with a maximum of three choices.",
  levelLabel: "Conversation level",
  levelHint:
    "Choose one level or a close CEFR range such as A1-A2 or A2-B1. AI replies will stay on that level.",
  practiceModeLabel: "Practice mode",
  practiceModeHint:
    "Use practice mode so AI behaves like a speaking coach, not a generic chatbot.",
  practiceModeDaily: "Daily conversation",
  practiceModeRoleplay: "Role-play",
  practiceModeTopic: "Topic talk",
  practiceTopicLabel: "Scenario or topic",
  practiceTopicHint:
    "Examples: at the cafe, job interview, small talk, travel, presentation, doctor visit.",
  practiceTopicPlaceholder: "Choose a real-life situation or topic...",
  progressTitle: "Practice memory",
  progressFocus: "Focus now",
  progressPhrases: "Useful phrases",
  progressPronunciation: "Pronunciation",
  habitsTitle: "Practice rhythm",
  habitsCurrentStreak: "Current streak",
  habitsLongestStreak: "Best streak",
  habitsWeeklyGoal: "Weekly goal",
  habitsWeeklyProgress: "Weekly progress",
  habitsWeeklyHint:
    "The planner also looks at your streak and weekly goal, not only mistakes and scores.",
  habitsGoalOption: "{count} lessons",
  habitsWeeklyProgressValue: "{completed}/{target} lessons this week",
  summaryTitle: "Lesson summary",
  summaryStrengths: "What went well",
  summaryFocus: "What to improve",
  summaryPhrases: "New phrases",
  summaryHomework: "Next step",
  recentSessionsTitle: "Recent lessons",
  recentSessionsEmpty: "Your saved practice sessions will appear here.",
  lessonTemplatesTitle: "Lesson flow",
  lessonTemplatesHint:
    "Start a ready-made lesson and finish with a coaching score after a few learner turns.",
  lessonStart: "Start lesson",
  lessonRestart: "Restart lesson",
  lessonActiveTitle: "Active lesson",
  lessonProgress: "Lesson progress {progress}",
  lessonGoalLabel: "Lesson goal",
  lessonTurnsLabel: "{count} turns",
  lessonScoreTitle: "Lesson score",
  lessonScoreFluency: "Fluency",
  lessonScoreAccuracy: "Accuracy",
  lessonScoreVocabulary: "Vocabulary",
  lessonScorePronunciation: "Pronunciation",
  lessonScoreGoal: "Goal completion",
  lessonScoreFeedback: "Coach feedback",
  lessonReviewTitle: "Post-lesson review",
  lessonReviewHint:
    "Use this targeted review to repeat only the weak points from the last lesson.",
  lessonReviewGrammar: "Grammar",
  lessonReviewVocabulary: "Vocabulary",
  lessonReviewPronunciation: "Pronunciation",
  lessonReviewRepeat: "Repeat weak points only",
  lessonPlannerTitle: "Recommended next lesson",
  lessonPlannerHint:
    "This planner picks the next best lesson from your scores, review cards, and saved practice memory.",
  lessonPlannerReason: "Why this lesson",
  lessonPlannerFocus: "Focus points",
  lessonPlannerDifficulty: "Difficulty",
  lessonPlannerStart: "Start recommended lesson",
  lessonDifficultyLabel: "Difficulty mode",
  lessonRepeatTitle: "{title} review",
  lessonRepeatDescription: "Short drill focused only on your weak points from the last lesson.",
  lessonRepeatTopicFallback: "Weak-point drill",
  lessonRepeatGoal: "Fix these weak points: {points}.",
  lessonRepeatFallbackGoal:
    "Repeat the last lesson and focus only on accuracy, vocabulary, and pronunciation.",
  lessonFallbackFeedback:
    'Good work in "{title}". Repeat the lesson once more and try to sound more natural on the key phrases.',
  coachCorrection: "Quick correction",
  coachBetterVersion: "Better version",
  coachNextQuestion: "Next question",
  coachPronunciation: "Pronunciation tip",
  nativeHelpLabel: "Native help ({language})",
  nativeHelpHint:
    "The main conversation stays in your learning language. AI may add short explanations in your native language when useful.",
  nativeHelpUnavailable:
    "Native help is unavailable when the conversation language is the same as your native language.",
  inputLabel: "Message",
  inputPlaceholder: "Type a message or use the microphone...",
  holdToTalk: "Hold to talk",
  releaseToSend: "Release to send",
  send: "Send",
  clear: "Clear chat",
  stopAudio: "Stop audio",
  listening: "Listening...",
  thinking: "AI is replying...",
  speaking: "Playing voice reply...",
  idle: "Ready",
  empty: "Your conversation will appear here.",
  emptyPrompt: "Say or type something first.",
  roleUser: "You",
  roleAssistant: "AI",
  voicePlaybackFailed: "Voice playback failed.",
  practiceProgressSyncUnavailable: "Practice progress sync is temporarily unavailable.",
  practiceGoalSyncUnavailable: "Practice goal sync is temporarily unavailable.",
  emptyResponse: "AI returned an empty response.",
  aiRequestFailed: "AI request failed.",
  speechRecognitionFailed: "Speech recognition failed.",
  difficultySupportive: "Supportive",
  difficultyBalanced: "Balanced",
  difficultyStretch: "Stretch",
  adaptiveReasonPronunciation:
    "Your last lesson shows pronunciation still needs repetition under speaking pressure.",
  adaptiveReasonGrammar:
    "Your next best lesson should tighten grammar accuracy in short real-life replies.",
  adaptiveReasonVocabulary:
    "You are ready for a lesson that pushes vocabulary range and more natural phrasing.",
  adaptiveReasonFluency:
    "Your scores are solid, so the best next step is a lesson that improves flow and spontaneity.",
  adaptiveReasonStrong:
    "You handled the last lesson well, so the planner is moving you to a slightly richer speaking task.",
  adaptiveReasonMemoryPronunciation:
    "Your practice memory still shows pronunciation targets that should be recycled in a fresh scenario.",
  adaptiveReasonMemoryGrammar:
    "Your practice memory points to grammar patterns that need one more structured lesson.",
  adaptiveReasonMemoryVocabulary:
    "The planner is reusing your saved phrases to turn passive vocabulary into spoken vocabulary.",
  adaptiveReasonConsistency:
    "You are also behind your weekly goal, so the planner is choosing a shorter win to rebuild consistency.",
  adaptiveReasonStreak:
    "Your streak is strong, so the next lesson can safely push the upper edge of your selected range.",
  adaptiveFocusTargets: "Pay special attention to: {points}.",
  adaptiveFocusDefault: "Keep the lesson focused on one clear speaking objective.",
  difficultyNoteSupportive:
    "Keep the lesson at the lower edge of the selected CEFR range, with shorter questions, more scaffolding, and easier follow-up prompts.",
  difficultyNoteBalanced:
    "Keep the lesson in the middle of the selected CEFR range with normal support and natural pacing.",
  difficultyNoteStretch:
    "Keep the lesson inside the selected CEFR range but use the upper edge with richer vocabulary, less scaffolding, and slightly less predictable follow-up questions.",
};

const GERMAN_OVERRIDES: Partial<VoiceAssistantText> = {
  navLabel: "KI-Training",
  title: "KI-Training",
  subtitle: "Sprich, bekomme Coaching und halte das Gespräch am Laufen.",
  signInHint: "Melde dich an, um KI-Training zu nutzen.",
  unsupportedBrowser:
    "Spracherkennung ist in unterstützten Browsern wie Chrome oder Edge verfügbar.",
  languageLabel: "Gesprächssprache",
  languageHint:
    "Hier erscheinen nur deine Lernsprache und Muttersprache, maximal drei Optionen.",
  levelLabel: "Gesprächsniveau",
  levelHint:
    "Wähle ein Niveau oder einen CEFR-Bereich wie A1-A2 oder A2-B1. Die KI bleibt auf diesem Niveau.",
  practiceModeLabel: "Übungsmodus",
  practiceModeHint:
    "Nutze den Übungsmodus, damit die KI wie ein Sprechcoach und nicht wie ein allgemeiner Chatbot reagiert.",
  practiceModeDaily: "Alltagsgespräch",
  practiceModeRoleplay: "Rollenspiel",
  practiceModeTopic: "Themenübung",
  practiceTopicLabel: "Szenario oder Thema",
  practiceTopicHint:
    "Beispiele: im Café, Vorstellungsgespräch, Small Talk, Reise, Präsentation, Arztbesuch.",
  practiceTopicPlaceholder: "Wähle eine Alltagssituation oder ein Thema...",
  progressTitle: "Trainingsspeicher",
  progressFocus: "Fokus jetzt",
  progressPhrases: "Nützliche Redemittel",
  progressPronunciation: "Aussprache",
  habitsTitle: "Übungsrhythmus",
  habitsCurrentStreak: "Aktuelle Serie",
  habitsLongestStreak: "Beste Serie",
  habitsWeeklyGoal: "Wochenziel",
  habitsWeeklyProgress: "Wochenfortschritt",
  habitsWeeklyHint:
    "Der Planer berücksichtigt nicht nur Fehler und Punkte, sondern auch deine Serie und dein Wochenziel.",
  habitsGoalOption: "{count} Lektionen",
  habitsWeeklyProgressValue: "{completed}/{target} Lektionen diese Woche",
  summaryTitle: "Lektionszusammenfassung",
  summaryStrengths: "Das lief gut",
  summaryFocus: "Das solltest du verbessern",
  summaryPhrases: "Neue Redemittel",
  summaryHomework: "Nächster Schritt",
  recentSessionsTitle: "Letzte Lektionen",
  recentSessionsEmpty: "Deine gespeicherten Übungssitzungen erscheinen hier.",
  lessonTemplatesTitle: "Lektionsablauf",
  lessonTemplatesHint:
    "Starte eine vorbereitete Lektion und beende sie nach einigen Lernzügen mit einem Coaching-Score.",
  lessonStart: "Lektion starten",
  lessonRestart: "Lektion neu starten",
  lessonActiveTitle: "Aktive Lektion",
  lessonProgress: "Lektionsfortschritt {progress}",
  lessonGoalLabel: "Lektionsziel",
  lessonTurnsLabel: "{count} Züge",
  lessonScoreTitle: "Lektionsscore",
  lessonScoreFluency: "Flüssigkeit",
  lessonScoreAccuracy: "Genauigkeit",
  lessonScoreVocabulary: "Wortschatz",
  lessonScorePronunciation: "Aussprache",
  lessonScoreGoal: "Zielerfüllung",
  lessonScoreFeedback: "Coach-Feedback",
  lessonReviewTitle: "Nachbesprechung",
  lessonReviewHint:
    "Nutze diese gezielte Wiederholung, um nur die Schwachstellen der letzten Lektion zu trainieren.",
  lessonReviewGrammar: "Grammatik",
  lessonReviewVocabulary: "Wortschatz",
  lessonReviewPronunciation: "Aussprache",
  lessonReviewRepeat: "Nur Schwachstellen wiederholen",
  lessonPlannerTitle: "Empfohlene nächste Lektion",
  lessonPlannerHint:
    "Dieser Planer wählt die beste nächste Lektion anhand deiner Punkte, Review-Karten und deines Trainingsspeichers.",
  lessonPlannerReason: "Warum diese Lektion",
  lessonPlannerFocus: "Fokuspunkte",
  lessonPlannerDifficulty: "Schwierigkeit",
  lessonPlannerStart: "Empfohlene Lektion starten",
  lessonDifficultyLabel: "Schwierigkeitsmodus",
  lessonRepeatTitle: "{title} Wiederholung",
  lessonRepeatDescription:
    "Kurzer Drill, der sich nur auf deine Schwachstellen aus der letzten Lektion konzentriert.",
  lessonRepeatTopicFallback: "Schwachstellen-Drill",
  lessonRepeatGoal: "Arbeite an diesen Schwachstellen: {points}.",
  lessonRepeatFallbackGoal:
    "Wiederhole die letzte Lektion und achte nur auf Genauigkeit, Wortschatz und Aussprache.",
  lessonFallbackFeedback:
    'Gute Arbeit in "{title}". Wiederhole die Lektion noch einmal und versuche bei den Schlüsselsätzen natürlicher zu klingen.',
  coachCorrection: "Schnelle Korrektur",
  coachBetterVersion: "Bessere Formulierung",
  coachNextQuestion: "Nächste Frage",
  coachPronunciation: "Aussprache-Tipp",
  nativeHelpLabel: "Muttersprachliche Hilfe ({language})",
  nativeHelpHint:
    "Das Hauptgespräch bleibt in deiner Lernsprache. Die KI kann bei Bedarf kurze Erklärungen in deiner Muttersprache geben.",
  nativeHelpUnavailable:
    "Muttersprachliche Hilfe ist nicht verfügbar, wenn die Gesprächssprache deiner Muttersprache entspricht.",
  inputLabel: "Nachricht",
  inputPlaceholder: "Schreibe eine Nachricht oder nutze das Mikrofon...",
  holdToTalk: "Gedrückt halten",
  releaseToSend: "Loslassen zum Senden",
  send: "Senden",
  clear: "Chat leeren",
  stopAudio: "Audio stoppen",
  listening: "Hört zu...",
  thinking: "KI antwortet...",
  speaking: "Sprachantwort wird abgespielt...",
  idle: "Bereit",
  empty: "Dein Gespräch erscheint hier.",
  emptyPrompt: "Sag oder tippe zuerst etwas.",
  roleUser: "Du",
  voicePlaybackFailed: "Sprachausgabe konnte nicht abgespielt werden.",
  practiceProgressSyncUnavailable: "Der Trainingsfortschritt kann gerade nicht synchronisiert werden.",
  practiceGoalSyncUnavailable: "Das Übungsziel kann gerade nicht synchronisiert werden.",
  emptyResponse: "Die KI hat leer geantwortet.",
  aiRequestFailed: "Die KI-Anfrage ist fehlgeschlagen.",
  speechRecognitionFailed: "Spracherkennung fehlgeschlagen.",
  difficultySupportive: "Unterstützend",
  difficultyBalanced: "Ausgeglichen",
  difficultyStretch: "Anspruchsvoll",
  adaptiveReasonPronunciation:
    "Die letzte Lektion zeigt, dass die Aussprache unter Sprechdruck weiter wiederholt werden sollte.",
  adaptiveReasonGrammar:
    "Die nächste sinnvolle Lektion sollte die grammatische Genauigkeit in kurzen echten Antworten festigen.",
  adaptiveReasonVocabulary:
    "Du bist bereit für eine Lektion, die den Wortschatz erweitert und natürlichere Formulierungen trainiert.",
  adaptiveReasonFluency:
    "Deine Punkte sind solide, daher verbessert der nächste Schritt am besten Spontaneität und Gesprächsfluss.",
  adaptiveReasonStrong:
    "Du hast die letzte Lektion gut gemeistert, deshalb geht der Planer zu einer etwas reicheren Sprechaufgabe über.",
  adaptiveReasonMemoryPronunciation:
    "Dein Trainingsspeicher zeigt noch Ausspracheziele, die in einem neuen Szenario wiederholt werden sollten.",
  adaptiveReasonMemoryGrammar:
    "Dein Trainingsspeicher zeigt Grammatikmuster, die noch eine strukturierte Lektion brauchen.",
  adaptiveReasonMemoryVocabulary:
    "Der Planer nutzt deine gespeicherten Redemittel, um passiven Wortschatz in gesprochenen Wortschatz zu verwandeln.",
  adaptiveReasonConsistency:
    "Du liegst auch hinter deinem Wochenziel, deshalb wählt der Planer eine kürzere Lektion, um die Regelmäßigkeit wieder aufzubauen.",
  adaptiveReasonStreak:
    "Deine Serie ist stark, deshalb kann die nächste Lektion sicher an die obere Grenze deines gewählten Bereichs gehen.",
  adaptiveFocusTargets: "Achte besonders auf: {points}.",
  adaptiveFocusDefault: "Halte die Lektion auf ein klares Sprechziel fokussiert.",
  difficultyNoteSupportive:
    "Halte die Lektion am unteren Rand des gewählten CEFR-Bereichs, mit kürzeren Fragen, mehr Hilfestellung und einfacheren Anschlussfragen.",
  difficultyNoteBalanced:
    "Halte die Lektion in der Mitte des gewählten CEFR-Bereichs mit normaler Unterstützung und natürlichem Tempo.",
  difficultyNoteStretch:
    "Bleibe im gewählten CEFR-Bereich, nutze aber die obere Grenze mit reicherem Wortschatz, weniger Hilfen und etwas weniger vorhersehbaren Anschlussfragen.",
};

const RUSSIAN_OVERRIDES: Partial<VoiceAssistantText> = {
  navLabel: "AI Практика",
  title: "AI Практика",
  subtitle: "Говорите, получайте коучинг и поддерживайте разговор.",
  signInHint: "Войдите, чтобы пользоваться AI Practice.",
  unsupportedBrowser:
    "Распознавание речи доступно в поддерживаемых браузерах, например Chrome или Edge.",
  languageLabel: "Язык разговора",
  languageHint:
    "Здесь показываются только язык обучения и родной язык, максимум три варианта.",
  levelLabel: "Уровень разговора",
  levelHint:
    "Выберите один уровень или диапазон CEFR, например A1-A2 или A2-B1. Ответы ИИ будут оставаться на этом уровне.",
  practiceModeLabel: "Режим практики",
  practiceModeHint:
    "Используйте режим практики, чтобы ИИ вел себя как разговорный коуч, а не как обычный чат-бот.",
  practiceModeDaily: "Повседневный разговор",
  practiceModeRoleplay: "Ролевая ситуация",
  practiceModeTopic: "Разговор по теме",
  practiceTopicLabel: "Сценарий или тема",
  practiceTopicHint:
    "Примеры: в кафе, собеседование, small talk, путешествие, презентация, визит к врачу.",
  practiceTopicPlaceholder: "Выберите жизненную ситуацию или тему...",
  progressTitle: "Память практики",
  progressFocus: "Текущий фокус",
  progressPhrases: "Полезные фразы",
  progressPronunciation: "Произношение",
  habitsTitle: "Ритм практики",
  habitsCurrentStreak: "Текущая серия",
  habitsLongestStreak: "Лучшая серия",
  habitsWeeklyGoal: "Цель на неделю",
  habitsWeeklyProgress: "Прогресс за неделю",
  habitsWeeklyHint:
    "Планировщик смотрит не только на ошибки и баллы, но и на вашу серию и недельную цель.",
  habitsGoalOption: "{count} занятий",
  habitsWeeklyProgressValue: "{completed}/{target} занятий на этой неделе",
  summaryTitle: "Итог урока",
  summaryStrengths: "Что получилось хорошо",
  summaryFocus: "Что улучшить",
  summaryPhrases: "Новые фразы",
  summaryHomework: "Следующий шаг",
  recentSessionsTitle: "Недавние уроки",
  recentSessionsEmpty: "Здесь появятся сохраненные занятия.",
  lessonTemplatesTitle: "Сценарии уроков",
  lessonTemplatesHint:
    "Запустите готовый урок и получите итоговую оценку после нескольких реплик ученика.",
  lessonStart: "Начать урок",
  lessonRestart: "Начать заново",
  lessonActiveTitle: "Текущий урок",
  lessonProgress: "Прогресс урока {progress}",
  lessonGoalLabel: "Цель урока",
  lessonTurnsLabel: "{count} реплики",
  lessonScoreTitle: "Оценка урока",
  lessonScoreFluency: "Беглость",
  lessonScoreAccuracy: "Точность",
  lessonScoreVocabulary: "Словарь",
  lessonScorePronunciation: "Произношение",
  lessonScoreGoal: "Достижение цели",
  lessonScoreFeedback: "Комментарий коуча",
  lessonReviewTitle: "Разбор после урока",
  lessonReviewHint:
    "Используйте этот целевой разбор, чтобы повторить только слабые места из последнего урока.",
  lessonReviewGrammar: "Грамматика",
  lessonReviewVocabulary: "Словарь",
  lessonReviewPronunciation: "Произношение",
  lessonReviewRepeat: "Повторить только слабые места",
  lessonPlannerTitle: "Рекомендованный следующий урок",
  lessonPlannerHint:
    "Этот планировщик выбирает лучший следующий урок по вашим баллам, карточкам разбора и памяти практики.",
  lessonPlannerReason: "Почему этот урок",
  lessonPlannerFocus: "Точки внимания",
  lessonPlannerDifficulty: "Сложность",
  lessonPlannerStart: "Начать рекомендованный урок",
  lessonDifficultyLabel: "Режим сложности",
  lessonRepeatTitle: "Разбор: {title}",
  lessonRepeatDescription:
    "Короткая тренировка, которая фокусируется только на слабых местах последнего урока.",
  lessonRepeatTopicFallback: "Тренировка слабых мест",
  lessonRepeatGoal: "Исправьте эти слабые места: {points}.",
  lessonRepeatFallbackGoal:
    "Повторите последний урок и сосредоточьтесь только на точности, словаре и произношении.",
  lessonFallbackFeedback:
    'Хорошая работа в уроке "{title}". Повторите его еще раз и постарайтесь звучать естественнее в ключевых фразах.',
  coachCorrection: "Быстрая коррекция",
  coachBetterVersion: "Лучший вариант",
  coachNextQuestion: "Следующий вопрос",
  coachPronunciation: "Подсказка по произношению",
  nativeHelpLabel: "Подсказки на родном языке ({language})",
  nativeHelpHint:
    "Основной разговор остается на языке обучения. При необходимости ИИ может дать короткие пояснения на родном языке.",
  nativeHelpUnavailable:
    "Подсказки на родном языке недоступны, если язык разговора совпадает с родным языком.",
  inputLabel: "Сообщение",
  inputPlaceholder: "Напишите сообщение или используйте микрофон...",
  holdToTalk: "Удерживать для речи",
  releaseToSend: "Отпустите, чтобы отправить",
  send: "Отправить",
  clear: "Очистить чат",
  stopAudio: "Остановить аудио",
  listening: "Слушаю...",
  thinking: "ИИ отвечает...",
  speaking: "Воспроизводится голосовой ответ...",
  idle: "Готово",
  empty: "Здесь появится ваш разговор.",
  emptyPrompt: "Сначала скажите или напишите что-нибудь.",
  roleUser: "Вы",
  voicePlaybackFailed: "Не удалось воспроизвести голосовой ответ.",
  practiceProgressSyncUnavailable: "Сейчас недоступна синхронизация прогресса практики.",
  practiceGoalSyncUnavailable: "Сейчас недоступна синхронизация цели практики.",
  emptyResponse: "ИИ вернул пустой ответ.",
  aiRequestFailed: "Запрос к ИИ не выполнен.",
  speechRecognitionFailed: "Не удалось распознать речь.",
  difficultySupportive: "Поддерживающий",
  difficultyBalanced: "Сбалансированный",
  difficultyStretch: "Продвинутый",
  adaptiveReasonPronunciation:
    "Последний урок показывает, что произношение еще нужно повторять под разговорной нагрузкой.",
  adaptiveReasonGrammar:
    "Следующий лучший урок должен укрепить грамматическую точность в коротких реальных ответах.",
  adaptiveReasonVocabulary:
    "Вы готовы к уроку, который расширит словарь и сделает формулировки естественнее.",
  adaptiveReasonFluency:
    "Ваши баллы уже хорошие, поэтому лучший следующий шаг — усилить спонтанность и плавность речи.",
  adaptiveReasonStrong:
    "Вы хорошо справились с прошлым уроком, поэтому планировщик предлагает чуть более богатую разговорную задачу.",
  adaptiveReasonMemoryPronunciation:
    "Память практики все еще показывает цели по произношению, которые стоит повторить в новом сценарии.",
  adaptiveReasonMemoryGrammar:
    "Память практики указывает на грамматические шаблоны, которым нужен еще один структурированный урок.",
  adaptiveReasonMemoryVocabulary:
    "Планировщик снова использует ваши сохраненные фразы, чтобы превратить пассивный словарь в активную речь.",
  adaptiveReasonConsistency:
    "Вы также отстаете от недельной цели, поэтому планировщик выбирает более короткий урок, чтобы восстановить регулярность.",
  adaptiveReasonStreak:
    "У вас сильная серия, поэтому следующий урок может безопасно выйти к верхней границе выбранного диапазона.",
  adaptiveFocusTargets: "Обратите особое внимание на: {points}.",
  adaptiveFocusDefault: "Сделайте урок сфокусированным на одной четкой разговорной цели.",
  difficultyNoteSupportive:
    "Держите урок у нижней границы выбранного диапазона CEFR: более короткие вопросы, больше опоры и более простые уточнения.",
  difficultyNoteBalanced:
    "Держите урок в середине выбранного диапазона CEFR с обычной поддержкой и естественным темпом.",
  difficultyNoteStretch:
    "Оставайтесь в выбранном диапазоне CEFR, но используйте его верхнюю границу: более богатый словарь, меньше опоры и чуть менее предсказуемые уточняющие вопросы.",
};

const ARABIC_OVERRIDES: Partial<VoiceAssistantText> = {
  navLabel: "تدريب الذكاء الاصطناعي",
  title: "تدريب الذكاء الاصطناعي",
  subtitle: "تحدث، واحصل على تدريب، وواصل المحادثة.",
  signInHint: "سجل الدخول لاستخدام تدريب الذكاء الاصطناعي.",
  unsupportedBrowser: "التعرّف على الكلام متاح في المتصفحات المدعومة مثل Chrome وEdge.",
  languageLabel: "لغة المحادثة",
  languageHint: "هنا تظهر فقط لغة التعلّم واللغة الأم، وبحد أقصى ثلاثة خيارات.",
  levelLabel: "مستوى المحادثة",
  levelHint:
    "اختر مستوى واحدًا أو نطاق CEFR قريبًا مثل A1-A2 أو A2-B1. ستبقى ردود الذكاء الاصطناعي ضمن هذا المستوى.",
  practiceModeLabel: "وضع التمرين",
  practiceModeHint:
    "استخدم وضع التمرين لكي يتصرف الذكاء الاصطناعي كمدرب محادثة لا كروبوت دردشة عام.",
  practiceModeDaily: "محادثة يومية",
  practiceModeRoleplay: "تمثيل أدوار",
  practiceModeTopic: "حديث حول موضوع",
  practiceTopicLabel: "سيناريو أو موضوع",
  practiceTopicHint:
    "أمثلة: في المقهى، مقابلة عمل، حديث قصير، سفر، عرض تقديمي، زيارة طبيب.",
  practiceTopicPlaceholder: "اختر موقفًا واقعيًا أو موضوعًا...",
  progressTitle: "ذاكرة التمرين",
  progressFocus: "التركيز الآن",
  progressPhrases: "عبارات مفيدة",
  progressPronunciation: "النطق",
  habitsTitle: "إيقاع التمرين",
  habitsCurrentStreak: "السلسلة الحالية",
  habitsLongestStreak: "أفضل سلسلة",
  habitsWeeklyGoal: "الهدف الأسبوعي",
  habitsWeeklyProgress: "التقدم الأسبوعي",
  habitsWeeklyHint:
    "يأخذ المخطط في الاعتبار السلسلة والهدف الأسبوعي، وليس الأخطاء والدرجات فقط.",
  habitsGoalOption: "{count} دروس",
  habitsWeeklyProgressValue: "{completed}/{target} دروس هذا الأسبوع",
  summaryTitle: "ملخص الدرس",
  summaryStrengths: "ما سار جيدًا",
  summaryFocus: "ما الذي يحتاج إلى تحسين",
  summaryPhrases: "عبارات جديدة",
  summaryHomework: "الخطوة التالية",
  recentSessionsTitle: "الدروس الأخيرة",
  recentSessionsEmpty: "ستظهر هنا جلسات التمرين المحفوظة.",
  lessonTemplatesTitle: "مسار الدرس",
  lessonTemplatesHint:
    "ابدأ درسًا جاهزًا وأنهه بدرجة تدريب بعد عدة ردود من المتعلم.",
  lessonStart: "ابدأ الدرس",
  lessonRestart: "أعد الدرس",
  lessonActiveTitle: "الدرس الحالي",
  lessonProgress: "تقدم الدرس {progress}",
  lessonGoalLabel: "هدف الدرس",
  lessonTurnsLabel: "{count} أدوار",
  lessonScoreTitle: "درجة الدرس",
  lessonScoreFluency: "الطلاقة",
  lessonScoreAccuracy: "الدقة",
  lessonScoreVocabulary: "المفردات",
  lessonScorePronunciation: "النطق",
  lessonScoreGoal: "تحقيق الهدف",
  lessonScoreFeedback: "ملاحظات المدرب",
  lessonReviewTitle: "مراجعة بعد الدرس",
  lessonReviewHint:
    "استخدم هذه المراجعة المركزة لتكرار نقاط الضعف فقط من آخر درس.",
  lessonReviewGrammar: "القواعد",
  lessonReviewVocabulary: "المفردات",
  lessonReviewPronunciation: "النطق",
  lessonReviewRepeat: "كرّر نقاط الضعف فقط",
  lessonPlannerTitle: "الدرس المقترح التالي",
  lessonPlannerHint:
    "يختار هذا المخطط أفضل درس تالي بناءً على درجاتك وبطاقات المراجعة وذاكرة التمرين.",
  lessonPlannerReason: "سبب اختيار هذا الدرس",
  lessonPlannerFocus: "نقاط التركيز",
  lessonPlannerDifficulty: "الصعوبة",
  lessonPlannerStart: "ابدأ الدرس المقترح",
  lessonDifficultyLabel: "وضع الصعوبة",
  lessonRepeatTitle: "مراجعة: {title}",
  lessonRepeatDescription: "تدريب قصير يركز فقط على نقاط ضعفك من آخر درس.",
  lessonRepeatTopicFallback: "تدريب نقاط الضعف",
  lessonRepeatGoal: "عالج نقاط الضعف التالية: {points}.",
  lessonRepeatFallbackGoal:
    "أعد الدرس الأخير وركز فقط على الدقة والمفردات والنطق.",
  lessonFallbackFeedback:
    'عمل جيد في "{title}". أعد الدرس مرة أخرى وحاول أن تبدو أكثر طبيعية في العبارات الأساسية.',
  coachCorrection: "تصحيح سريع",
  coachBetterVersion: "صياغة أفضل",
  coachNextQuestion: "السؤال التالي",
  coachPronunciation: "ملاحظة نطق",
  nativeHelpLabel: "مساعدة باللغة الأم ({language})",
  nativeHelpHint:
    "تبقى المحادثة الأساسية بلغة التعلّم. وقد يضيف الذكاء الاصطناعي شرحًا قصيرًا بلغتك الأم عند الحاجة.",
  nativeHelpUnavailable:
    "المساعدة باللغة الأم غير متاحة عندما تكون لغة المحادثة هي نفسها لغتك الأم.",
  inputLabel: "الرسالة",
  inputPlaceholder: "اكتب رسالة أو استخدم الميكروفون...",
  holdToTalk: "اضغط للتحدث",
  releaseToSend: "اترك للإرسال",
  send: "إرسال",
  clear: "مسح الدردشة",
  stopAudio: "إيقاف الصوت",
  listening: "جارٍ الاستماع...",
  thinking: "الذكاء الاصطناعي يرد...",
  speaking: "جارٍ تشغيل الرد الصوتي...",
  idle: "جاهز",
  empty: "ستظهر هنا محادثتك.",
  emptyPrompt: "قل شيئًا أو اكتبه أولًا.",
  roleUser: "أنت",
  roleAssistant: "AI",
  voicePlaybackFailed: "فشل تشغيل الرد الصوتي.",
  practiceProgressSyncUnavailable: "تعذر مزامنة تقدم التمرين حاليًا.",
  practiceGoalSyncUnavailable: "تعذر مزامنة هدف التمرين حاليًا.",
  emptyResponse: "أعاد الذكاء الاصطناعي ردًا فارغًا.",
  aiRequestFailed: "فشل طلب الذكاء الاصطناعي.",
  speechRecognitionFailed: "فشل التعرف على الكلام.",
  difficultySupportive: "مدعوم",
  difficultyBalanced: "متوازن",
  difficultyStretch: "متقدم",
  adaptiveReasonPronunciation:
    "يُظهر الدرس الأخير أن النطق ما زال يحتاج إلى تكرار تحت ضغط المحادثة.",
  adaptiveReasonGrammar:
    "ينبغي أن يشدّد الدرس التالي على دقة القواعد في الردود القصيرة الواقعية.",
  adaptiveReasonVocabulary:
    "أنت جاهز لدرس يوسع المفردات ويدفعك إلى تعبير أكثر طبيعية.",
  adaptiveReasonFluency:
    "درجاتك جيدة، لذا فإن أفضل خطوة تالية هي تحسين السلاسة والعفوية.",
  adaptiveReasonStrong:
    "أديت الدرس الأخير جيدًا، لذلك ينقلك المخطط إلى مهمة كلامية أغنى قليلًا.",
  adaptiveReasonMemoryPronunciation:
    "ما زالت ذاكرة التمرين تظهر أهدافًا في النطق ينبغي إعادة استخدامها في سيناريو جديد.",
  adaptiveReasonMemoryGrammar:
    "تشير ذاكرة التمرين إلى أن بعض أنماط القواعد تحتاج إلى درس منظم إضافي.",
  adaptiveReasonMemoryVocabulary:
    "يعيد المخطط استخدام عباراتك المحفوظة لتحويل المفردات السلبية إلى مفردات منطوقة.",
  adaptiveReasonConsistency:
    "أنت أيضًا متأخر عن هدفك الأسبوعي، لذلك يختار المخطط فوزًا قصيرًا لإعادة الانتظام.",
  adaptiveReasonStreak:
    "سلسلتك قوية، لذا يمكن للدرس التالي أن يدفعك بأمان إلى الحد الأعلى من نطاقك المختار.",
  adaptiveFocusTargets: "ركز بشكل خاص على: {points}.",
  adaptiveFocusDefault: "أبقِ الدرس مركزًا على هدف كلامي واحد واضح.",
  difficultyNoteSupportive:
    "اجعل الدرس عند الحد الأدنى من نطاق CEFR المختار، مع أسئلة أقصر ودعم أكثر وأسئلة متابعة أسهل.",
  difficultyNoteBalanced:
    "اجعل الدرس في منتصف نطاق CEFR المختار مع دعم عادي وإيقاع طبيعي.",
  difficultyNoteStretch:
    "ابق داخل نطاق CEFR المختار، لكن استخدم حدّه الأعلى مع مفردات أغنى ودعم أقل وأسئلة متابعة أقل توقعًا.",
};

const PERSIAN_OVERRIDES: Partial<VoiceAssistantText> = {
  navLabel: "تمرین هوش مصنوعی",
  title: "تمرین هوش مصنوعی",
  subtitle: "صحبت کن، بازخورد بگیر و مکالمه را ادامه بده.",
  signInHint: "برای استفاده از تمرین هوش مصنوعی وارد شوید.",
  unsupportedBrowser: "تشخیص گفتار در مرورگرهای پشتیبانی‌شده مانند Chrome و Edge در دسترس است.",
  languageLabel: "زبان مکالمه",
  languageHint: "اینجا فقط زبان یادگیری و زبان مادری شما نمایش داده می‌شود، حداکثر سه گزینه.",
  levelLabel: "سطح مکالمه",
  levelHint:
    "یک سطح یا بازه CEFR مانند A1-A2 یا A2-B1 را انتخاب کنید. پاسخ‌های هوش مصنوعی در همان سطح می‌ماند.",
  practiceModeLabel: "حالت تمرین",
  practiceModeHint:
    "از حالت تمرین استفاده کنید تا هوش مصنوعی مثل مربی گفت‌وگو رفتار کند، نه یک چت‌بات عمومی.",
  practiceModeDaily: "مکالمه روزمره",
  practiceModeRoleplay: "نقش‌آفرینی",
  practiceModeTopic: "گفت‌وگو درباره موضوع",
  practiceTopicLabel: "سناریو یا موضوع",
  practiceTopicHint:
    "مثال‌ها: در کافه، مصاحبه شغلی، گفت‌وگوی کوتاه، سفر، ارائه، ویزیت پزشک.",
  practiceTopicPlaceholder: "یک موقعیت واقعی یا موضوع را انتخاب کنید...",
  progressTitle: "حافظه تمرین",
  progressFocus: "تمرکز فعلی",
  progressPhrases: "عبارت‌های مفید",
  progressPronunciation: "تلفظ",
  habitsTitle: "ریتم تمرین",
  habitsCurrentStreak: "رشته فعلی",
  habitsLongestStreak: "بهترین رشته",
  habitsWeeklyGoal: "هدف هفتگی",
  habitsWeeklyProgress: "پیشرفت هفتگی",
  habitsWeeklyHint:
    "برنامه‌ریز فقط به خطاها و امتیازها نگاه نمی‌کند، بلکه رشته تمرین و هدف هفتگی شما را هم در نظر می‌گیرد.",
  habitsGoalOption: "{count} درس",
  habitsWeeklyProgressValue: "{completed}/{target} درس در این هفته",
  summaryTitle: "خلاصه درس",
  summaryStrengths: "نکات مثبت",
  summaryFocus: "موارد نیازمند بهبود",
  summaryPhrases: "عبارت‌های جدید",
  summaryHomework: "گام بعدی",
  recentSessionsTitle: "درس‌های اخیر",
  recentSessionsEmpty: "جلسه‌های ذخیره‌شده تمرین اینجا نمایش داده می‌شوند.",
  lessonTemplatesTitle: "جریان درس",
  lessonTemplatesHint:
    "یک درس آماده را شروع کنید و بعد از چند پاسخ زبان‌آموز، امتیاز مربی‌گری بگیرید.",
  lessonStart: "شروع درس",
  lessonRestart: "شروع دوباره درس",
  lessonActiveTitle: "درس فعال",
  lessonProgress: "پیشرفت درس {progress}",
  lessonGoalLabel: "هدف درس",
  lessonTurnsLabel: "{count} نوبت",
  lessonScoreTitle: "امتیاز درس",
  lessonScoreFluency: "روانی",
  lessonScoreAccuracy: "دقت",
  lessonScoreVocabulary: "واژگان",
  lessonScorePronunciation: "تلفظ",
  lessonScoreGoal: "تحقق هدف",
  lessonScoreFeedback: "بازخورد مربی",
  lessonReviewTitle: "مرور بعد از درس",
  lessonReviewHint:
    "از این مرور هدفمند استفاده کنید تا فقط نقاط ضعف درس قبلی را تکرار کنید.",
  lessonReviewGrammar: "گرامر",
  lessonReviewVocabulary: "واژگان",
  lessonReviewPronunciation: "تلفظ",
  lessonReviewRepeat: "فقط نقاط ضعف را تکرار کن",
  lessonPlannerTitle: "درس پیشنهادی بعدی",
  lessonPlannerHint:
    "این برنامه‌ریز بهترین درس بعدی را با توجه به امتیازها، کارت‌های مرور و حافظه تمرین شما انتخاب می‌کند.",
  lessonPlannerReason: "چرا این درس",
  lessonPlannerFocus: "نقاط تمرکز",
  lessonPlannerDifficulty: "سختی",
  lessonPlannerStart: "شروع درس پیشنهادی",
  lessonDifficultyLabel: "حالت سختی",
  lessonRepeatTitle: "مرور: {title}",
  lessonRepeatDescription: "یک تمرین کوتاه که فقط روی نقاط ضعف شما از درس قبلی تمرکز می‌کند.",
  lessonRepeatTopicFallback: "تمرین نقاط ضعف",
  lessonRepeatGoal: "این نقاط ضعف را برطرف کن: {points}.",
  lessonRepeatFallbackGoal:
    "درس قبلی را تکرار کن و فقط روی دقت، واژگان و تلفظ تمرکز داشته باش.",
  lessonFallbackFeedback:
    'در "{title}" خوب عمل کردی. یک بار دیگر درس را تکرار کن و سعی کن در عبارت‌های کلیدی طبیعی‌تر به نظر برسی.',
  coachCorrection: "اصلاح سریع",
  coachBetterVersion: "نسخه بهتر",
  coachNextQuestion: "سؤال بعدی",
  coachPronunciation: "نکته تلفظ",
  nativeHelpLabel: "کمک به زبان مادری ({language})",
  nativeHelpHint:
    "مکالمه اصلی در زبان یادگیری شما باقی می‌ماند. هوش مصنوعی در صورت نیاز می‌تواند توضیح کوتاهی به زبان مادری بدهد.",
  nativeHelpUnavailable:
    "وقتی زبان مکالمه با زبان مادری یکی باشد، کمک به زبان مادری در دسترس نیست.",
  inputLabel: "پیام",
  inputPlaceholder: "پیام بنویسید یا از میکروفون استفاده کنید...",
  holdToTalk: "برای صحبت نگه دارید",
  releaseToSend: "برای ارسال رها کنید",
  send: "ارسال",
  clear: "پاک کردن چت",
  stopAudio: "توقف صدا",
  listening: "در حال گوش دادن...",
  thinking: "هوش مصنوعی در حال پاسخ است...",
  speaking: "در حال پخش پاسخ صوتی...",
  idle: "آماده",
  empty: "مکالمه شما اینجا نمایش داده می‌شود.",
  emptyPrompt: "اول چیزی بگویید یا بنویسید.",
  roleUser: "شما",
  roleAssistant: "AI",
  voicePlaybackFailed: "پخش پاسخ صوتی ناموفق بود.",
  practiceProgressSyncUnavailable: "همگام‌سازی پیشرفت تمرین موقتاً در دسترس نیست.",
  practiceGoalSyncUnavailable: "همگام‌سازی هدف تمرین موقتاً در دسترس نیست.",
  emptyResponse: "هوش مصنوعی پاسخ خالی برگرداند.",
  aiRequestFailed: "درخواست هوش مصنوعی انجام نشد.",
  speechRecognitionFailed: "تشخیص گفتار ناموفق بود.",
  difficultySupportive: "حمایتی",
  difficultyBalanced: "متعادل",
  difficultyStretch: "چالشی",
  adaptiveReasonPronunciation:
    "درس قبلی نشان می‌دهد که تلفظ هنوز زیر فشار مکالمه نیاز به تکرار دارد.",
  adaptiveReasonGrammar:
    "بهترین درس بعدی باید دقت گرامری را در پاسخ‌های کوتاه و واقعی تقویت کند.",
  adaptiveReasonVocabulary:
    "شما برای درسی آماده‌اید که دامنه واژگان را بیشتر کند و بیان طبیعی‌تری بسازد.",
  adaptiveReasonFluency:
    "امتیازهای شما خوب است، پس بهترین گام بعدی بهبود روانی و خودانگیختگی در گفتار است.",
  adaptiveReasonStrong:
    "درس قبلی را خوب انجام دادید، بنابراین برنامه‌ریز شما را به یک تمرین گفتاری غنی‌تر می‌برد.",
  adaptiveReasonMemoryPronunciation:
    "حافظه تمرین هنوز هدف‌های تلفظی را نشان می‌دهد که باید در یک سناریوی تازه تکرار شوند.",
  adaptiveReasonMemoryGrammar:
    "حافظه تمرین نشان می‌دهد که بعضی الگوهای گرامری هنوز به یک درس ساختاری دیگر نیاز دارند.",
  adaptiveReasonMemoryVocabulary:
    "برنامه‌ریز از عبارت‌های ذخیره‌شده شما استفاده می‌کند تا واژگان غیرفعال را به واژگان گفتاری تبدیل کند.",
  adaptiveReasonConsistency:
    "شما از هدف هفتگی عقب هستید، بنابراین برنامه‌ریز یک پیروزی کوتاه انتخاب می‌کند تا نظم تمرین برگردد.",
  adaptiveReasonStreak:
    "رشته تمرین شما قوی است، پس درس بعدی می‌تواند با خیال راحت به لبه بالایی بازه انتخابی برود.",
  adaptiveFocusTargets: "به‌طور خاص روی این موارد تمرکز کن: {points}.",
  adaptiveFocusDefault: "درس را روی یک هدف گفتاری روشن نگه دار.",
  difficultyNoteSupportive:
    "درس را در لبه پایین بازه CEFR انتخابی نگه دار، با سؤال‌های کوتاه‌تر، حمایت بیشتر و پیگیری‌های ساده‌تر.",
  difficultyNoteBalanced:
    "درس را در میانه بازه CEFR انتخابی با حمایت معمولی و ریتم طبیعی نگه دار.",
  difficultyNoteStretch:
    "در بازه CEFR انتخابی بمان، اما از لبه بالایی آن با واژگان غنی‌تر، حمایت کمتر و سؤال‌های پیگیری کم‌پیش‌بینی‌تر استفاده کن.",
};

const PRACTICE_TOPICS: Record<PracticeTopicId, Record<SupportedLocale, string>> = {
  cafe: {
    en: "At the cafe",
    de: "Im Café",
    ru: "В кафе",
    ar: "في المقهى",
    fa: "در کافه",
    ...EXTRA_PRACTICE_TOPICS.cafe,
  },
  job: {
    en: "Job interview",
    de: "Vorstellungsgespräch",
    ru: "Собеседование",
    ar: "مقابلة عمل",
    fa: "مصاحبه شغلی",
    ...EXTRA_PRACTICE_TOPICS.job,
  },
  travel: {
    en: "Travel",
    de: "Reise",
    ru: "Путешествие",
    ar: "السفر",
    fa: "سفر",
    ...EXTRA_PRACTICE_TOPICS.travel,
  },
  smallTalk: {
    en: "Small talk",
    de: "Small Talk",
    ru: "Небольшой разговор",
    ar: "حديث قصير",
    fa: "گفت‌وگوی کوتاه",
    ...EXTRA_PRACTICE_TOPICS.smallTalk,
  },
  doctor: {
    en: "Doctor visit",
    de: "Arztbesuch",
    ru: "Визит к врачу",
    ar: "زيارة طبيب",
    fa: "ویزیت پزشک",
    ...EXTRA_PRACTICE_TOPICS.doctor,
  },
  presentation: {
    en: "Presentation",
    de: "Präsentation",
    ru: "Презентация",
    ar: "عرض تقديمي",
    fa: "ارائه",
    ...EXTRA_PRACTICE_TOPICS.presentation,
  },
};

const PRACTICE_TOPIC_ORDER: PracticeTopicId[] = [
  "cafe",
  "job",
  "travel",
  "smallTalk",
  "doctor",
  "presentation",
];

const LESSON_TEMPLATE_TEXT: Record<
  LessonTemplateId,
  {
    topic: PracticeTopicId;
    title: Partial<Record<SupportedLocale, string>>;
    description: Partial<Record<SupportedLocale, string>>;
    goal: Partial<Record<SupportedLocale, string>>;
  }
> = {
  "small-talk-loop": {
    topic: "smallTalk",
    title: {
      en: "Small talk loop",
      de: "Small-Talk-Runde",
      ru: "Цикл small talk",
      ar: "حلقة حديث قصير",
      fa: "چرخه گفت‌وگوی کوتاه",
    },
    description: {
      en: "Practice friendly small talk, react naturally, and keep the exchange moving.",
      de: "Übe freundlichen Small Talk, reagiere natürlich und halte das Gespräch in Gang.",
      ru: "Тренируйте дружелюбный small talk, реагируйте естественно и поддерживайте диалог.",
      ar: "تدرّب على الحديث القصير الودي، واستجب بشكل طبيعي، وحافظ على سير الحوار.",
      fa: "گفت‌وگوی کوتاه دوستانه را تمرین کن، طبیعی واکنش نشان بده و جریان مکالمه را حفظ کن.",
    },
    goal: {
      en: "Keep a casual conversation going for several short turns.",
      de: "Halte ein lockeres Gespräch über mehrere kurze Züge am Laufen.",
      ru: "Поддерживайте непринужденный разговор в нескольких коротких репликах.",
      ar: "حافظ على محادثة خفيفة عبر عدة أدوار قصيرة.",
      fa: "یک گفت‌وگوی سبک را در چند نوبت کوتاه ادامه بده.",
    },
  },
  "cafe-order": {
    topic: "cafe",
    title: {
      en: "Cafe order",
      de: "Bestellung im Café",
      ru: "Заказ в кафе",
      ar: "طلب في المقهى",
      fa: "سفارش در کافه",
    },
    description: {
      en: "Order a drink, answer one follow-up question, and pay politely.",
      de: "Bestelle ein Getränk, beantworte eine Rückfrage und bezahle höflich.",
      ru: "Закажите напиток, ответьте на один уточняющий вопрос и вежливо оплатите.",
      ar: "اطلب مشروبًا، وأجب عن سؤال متابعة واحد، وادفع بأدب.",
      fa: "یک نوشیدنی سفارش بده، به یک سؤال پیگیری پاسخ بده و مودبانه پرداخت کن.",
    },
    goal: {
      en: "Order confidently and handle one simple follow-up question.",
      de: "Bestelle sicher und beantworte eine einfache Rückfrage.",
      ru: "Уверенно сделайте заказ и справьтесь с одним простым уточняющим вопросом.",
      ar: "اطلب بثقة وتعامل مع سؤال متابعة بسيط واحد.",
      fa: "با اطمینان سفارش بده و از پس یک سؤال پیگیری ساده بربیای.",
    },
  },
  "job-intro": {
    topic: "job",
    title: {
      en: "Job interview intro",
      de: "Einstieg ins Vorstellungsgespräch",
      ru: "Начало собеседования",
      ar: "مقدمة مقابلة العمل",
      fa: "شروع مصاحبه شغلی",
    },
    description: {
      en: "Introduce yourself, explain your background, and answer why you want the role.",
      de: "Stelle dich vor, erkläre deinen Hintergrund und beantworte, warum du die Stelle willst.",
      ru: "Представьтесь, расскажите о своем опыте и ответьте, почему хотите эту роль.",
      ar: "قدّم نفسك، واشرح خلفيتك، وأجب لماذا تريد هذا الدور.",
      fa: "خودت را معرفی کن، پیشینه‌ات را توضیح بده و بگو چرا این موقعیت را می‌خواهی.",
    },
    goal: {
      en: "Introduce yourself clearly and answer one motivation question.",
      de: "Stelle dich klar vor und beantworte eine Motivationsfrage.",
      ru: "Четко представьтесь и ответьте на один вопрос о мотивации.",
      ar: "قدّم نفسك بوضوح وأجب عن سؤال واحد عن الدافع.",
      fa: "خودت را شفاف معرفی کن و به یک سؤال درباره انگیزه پاسخ بده.",
    },
  },
  "travel-checkin": {
    topic: "travel",
    title: {
      en: "Travel check-in",
      de: "Check-in auf Reisen",
      ru: "Заселение в поездке",
      ar: "تسجيل الوصول في السفر",
      fa: "پذیرش در سفر",
    },
    description: {
      en: "Check into a hotel and answer a practical travel question.",
      de: "Checke in ein Hotel ein und beantworte eine praktische Reisefrage.",
      ru: "Заселитесь в отель и ответьте на практический вопрос о поездке.",
      ar: "قم بتسجيل الدخول في فندق وأجب عن سؤال عملي متعلق بالسفر.",
      fa: "در یک هتل پذیرش انجام بده و به یک سؤال کاربردی درباره سفر پاسخ بده.",
    },
    goal: {
      en: "Handle a hotel check-in with clear, practical language.",
      de: "Bewältige einen Hotel-Check-in mit klarer, praktischer Sprache.",
      ru: "Справьтесь с заселением в отель с помощью четкой практической речи.",
      ar: "أدر تسجيل الدخول في الفندق بلغة واضحة وعملية.",
      fa: "پذیرش هتل را با زبان روشن و کاربردی مدیریت کن.",
    },
  },
  "doctor-visit": {
    topic: "doctor",
    title: {
      en: "Doctor visit",
      de: "Arztbesuch",
      ru: "Визит к врачу",
      ar: "زيارة طبيب",
      fa: "ویزیت پزشک",
    },
    description: {
      en: "Describe symptoms and answer basic follow-up questions.",
      de: "Beschreibe Symptome und beantworte einfache Rückfragen.",
      ru: "Опишите симптомы и ответьте на базовые уточняющие вопросы.",
      ar: "اشرح الأعراض وأجب عن أسئلة متابعة أساسية.",
      fa: "علائم را توضیح بده و به سؤال‌های پایه پیگیری پاسخ بده.",
    },
    goal: {
      en: "Explain symptoms simply and answer one or two health questions.",
      de: "Erkläre Symptome einfach und beantworte ein oder zwei Gesundheitsfragen.",
      ru: "Просто объясните симптомы и ответьте на один-два вопроса о здоровье.",
      ar: "اشرح الأعراض ببساطة وأجب عن سؤال أو سؤالين صحيين.",
      fa: "علائم را ساده توضیح بده و به یک یا دو سؤال پزشکی جواب بده.",
    },
  },
  "presentation-opening": {
    topic: "presentation",
    title: {
      en: "Presentation opening",
      de: "Start einer Präsentation",
      ru: "Открытие презентации",
      ar: "افتتاح العرض التقديمي",
      fa: "شروع ارائه",
    },
    description: {
      en: "Open a presentation, explain the topic, and guide the listener into the talk.",
      de: "Eröffne eine Präsentation, erkläre das Thema und führe die Zuhörer in den Vortrag ein.",
      ru: "Начните презентацию, объясните тему и введите слушателя в выступление.",
      ar: "ابدأ عرضًا تقديميًا، واشرح الموضوع، وادخل المستمع في العرض.",
      fa: "یک ارائه را شروع کن، موضوع را توضیح بده و شنونده را وارد بحث کن.",
    },
    goal: {
      en: "Open a short presentation with structure and confidence.",
      de: "Eröffne eine kurze Präsentation strukturiert und sicher.",
      ru: "Откройте короткую презентацию структурно и уверенно.",
      ar: "ابدأ عرضًا قصيرًا بشكل منظم وواثق.",
      fa: "یک ارائه کوتاه را ساختاریافته و با اعتمادبه‌نفس شروع کن.",
    },
  },
};

export function getVoiceAssistantText(locale: string): VoiceAssistantText {
  const normalized = normalizeLocale(locale);
  const builtInOverrides: Partial<Record<SupportedLocale, Partial<VoiceAssistantText>>> = {
    de: GERMAN_OVERRIDES,
    ru: RUSSIAN_OVERRIDES,
    ar: ARABIC_OVERRIDES,
    fa: PERSIAN_OVERRIDES,
  };
  const overrides =
    builtInOverrides[normalized] ??
    (EXTRA_VOICE_ASSISTANT_OVERRIDES[
      normalized as keyof typeof EXTRA_VOICE_ASSISTANT_OVERRIDES
    ] as Partial<VoiceAssistantText> | undefined);
  return overrides ? { ...ENGLISH_TEXT, ...overrides } : ENGLISH_TEXT;
}

export function getPracticeTopicSuggestions(locale: string) {
  const normalized = normalizeLocale(locale);
  return PRACTICE_TOPIC_ORDER.map((topicId) => PRACTICE_TOPICS[topicId][normalized]);
}

export function localizePracticeTopic(topic: string, locale: string) {
  const trimmed = topic.trim();
  if (!trimmed) return topic;
  const normalized = normalizeLocale(locale);
  const lower = trimmed.toLowerCase();
  const match = PRACTICE_TOPIC_ORDER.find((topicId) =>
    Object.values(PRACTICE_TOPICS[topicId]).some((value) => value.toLowerCase() === lower)
  );
  return match ? PRACTICE_TOPICS[match][normalized] : topic;
}

export function getPracticeModeLabel(mode: string, text: VoiceAssistantText) {
  if (mode === "roleplay") return text.practiceModeRoleplay;
  if (mode === "topic") return text.practiceModeTopic;
  return text.practiceModeDaily;
}

export function getLocalizedLessonTemplateText(
  templateId: string,
  locale: string
): LocalizedLessonTemplateText | null {
  const entry = LESSON_TEMPLATE_TEXT[templateId as LessonTemplateId];
  if (!entry) return null;
  const normalized = normalizeLocale(locale);
  const extraEntry =
    EXTRA_LESSON_TEMPLATE_TEXT[
      templateId as keyof typeof EXTRA_LESSON_TEMPLATE_TEXT
    ];
  return {
    title:
      (extraEntry?.title?.[
        normalized as keyof typeof extraEntry.title
      ] as string | undefined) ??
      entry.title[normalized] ??
      entry.title.en ??
      "",
    description:
      (extraEntry?.description?.[
        normalized as keyof typeof extraEntry.description
      ] as string | undefined) ??
      entry.description[normalized] ??
      entry.description.en ??
      "",
    topic: PRACTICE_TOPICS[entry.topic][normalized],
    goal:
      (extraEntry?.goal?.[
        normalized as keyof typeof extraEntry.goal
      ] as string | undefined) ??
      entry.goal[normalized] ??
      entry.goal.en ??
      "",
  };
}

export function formatVoiceAssistantText(
  template: string,
  values: Record<string, string | number>
) {
  return fillTemplate(template, values);
}
