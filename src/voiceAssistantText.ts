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
};

const VOICE_ASSISTANT_TEXT: VoiceAssistantText = {
  navLabel: "AI Practice",
  title: "AI Practice",
  subtitle: "Speak, get coached, and keep the conversation going.",
  signInHint: "Sign in to use the AI voice assistant.",
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
};

export function getVoiceAssistantText(locale: string): VoiceAssistantText {
  void locale;
  return VOICE_ASSISTANT_TEXT;
}
