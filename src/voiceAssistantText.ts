export type VoiceAssistantText = {
  navLabel: string;
  title: string;
  subtitle: string;
  signInHint: string;
  unsupportedBrowser: string;
  languageLabel: string;
  languageHint: string;
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
  languageHint: "Use the same language for microphone recognition, AI replies, and voice playback.",
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
