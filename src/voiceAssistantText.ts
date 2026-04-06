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
  navLabel: "AI Voice",
  title: "AI Voice Assistant",
  subtitle: "Speak, get an AI reply, and hear the answer back.",
  signInHint: "Sign in to use the AI voice assistant.",
  unsupportedBrowser:
    "Speech recognition is available in supported browsers such as Chrome or Edge.",
  languageLabel: "Conversation language",
  languageHint:
    "Only your learning language and native language appear here, with a maximum of three choices.",
  levelLabel: "Conversation level",
  levelHint:
    "Choose one level or a close CEFR range such as A1-A2 or A2-B1. AI replies will stay on that level.",
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
