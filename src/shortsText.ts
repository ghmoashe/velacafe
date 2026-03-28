export type ShortsText = {
  navLabel: string;
  title: string;
  subtitle: string;
  empty: string;
  loading: string;
  retry: string;
  likeLabel: string;
  commentLabel: string;
  shareLabel: string;
  commentsTitle: string;
  commentPlaceholder: string;
  commentSend: string;
  noComments: string;
  signInHint: string;
  organizerBadge: string;
  viewProfile: string;
  audioOn: string;
  audioOff: string;
  tapHint: string;
  resumeHint: string;
  shareCopied: string;
  shareDone: string;
  notConfigured: string;
  socialSetupHint: string;
  sharePrompt: string;
};

const SHORTS_TEXT: ShortsText = {
  navLabel: "Shorts",
  title: "Organizer video feed",
  subtitle:
    "A vertical stream of organizer and teacher videos with likes, comments, and sharing.",
  empty: "No organizer videos yet. Published video posts will appear here.",
  loading: "Loading videos...",
  retry: "Try again",
  likeLabel: "Like",
  commentLabel: "Comment",
  shareLabel: "Share",
  commentsTitle: "Comments",
  commentPlaceholder: "Write a comment...",
  commentSend: "Send",
  noComments: "No comments yet.",
  signInHint: "Sign in to like and comment.",
  organizerBadge: "Organizer",
  viewProfile: "View profile",
  audioOn: "Sound on",
  audioOff: "Muted",
  tapHint: "Tap the video to pause or resume.",
  resumeHint: "Tap the video to continue playback.",
  shareCopied: "Video link copied to clipboard.",
  shareDone: "Video link shared.",
  notConfigured: "Supabase is not configured.",
  socialSetupHint:
    "Likes and comments need the SQL in supabase/posts_social_features.sql to be enabled.",
  sharePrompt: "Copy this video link:",
};

export function getShortsText(locale: string): ShortsText {
  void locale;
  return SHORTS_TEXT;
}
