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
  summaryTitle: string;
  summaryStrengths: string;
  summaryFocus: string;
  summaryPhrases: string;
  summaryHomework: string;
  recentSessionsTitle: string;
  recentSessionsEmpty: string;
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
  summaryTitle: "Lesson summary",
  summaryStrengths: "What went well",
  summaryFocus: "What to improve",
  summaryPhrases: "New phrases",
  summaryHomework: "Next step",
  recentSessionsTitle: "Recent lessons",
  recentSessionsEmpty: "Your saved practice sessions will appear here.",
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
