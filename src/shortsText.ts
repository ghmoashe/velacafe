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
  viewsLabel: string;
  reportLabel: string;
  reportSent: string;
  reportDuplicate: string;
  commentsTitle: string;
  commentPlaceholder: string;
  commentSend: string;
  commentBlocked: string;
  noComments: string;
  signInHint: string;
  organizerBadge: string;
  teacherBadge: string;
  viewProfile: string;
  audioOn: string;
  audioOff: string;
  tapHint: string;
  resumeHint: string;
  swipeHint: string;
  shareCopied: string;
  shareDone: string;
  notConfigured: string;
  socialSetupHint: string;
  sharePrompt: string;
  closeComments: string;
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
  viewsLabel: "Views",
  reportLabel: "Report",
  reportSent: "Report sent.",
  reportDuplicate: "Report already sent.",
  commentsTitle: "Comments",
  commentPlaceholder: "Write a comment...",
  commentSend: "Send",
  commentBlocked: "This comment contains blocked language and was not posted.",
  noComments: "No comments yet.",
  signInHint: "Sign in to like and comment.",
  organizerBadge: "Organizer",
  teacherBadge: "Teacher",
  viewProfile: "View profile",
  audioOn: "Sound on",
  audioOff: "Muted",
  tapHint: "Tap the video to pause or resume.",
  resumeHint: "Tap the video to continue playback.",
  swipeHint: "Swipe up or down for the next video.",
  shareCopied: "Video link copied to clipboard.",
  shareDone: "Video link shared.",
  notConfigured: "Supabase is not configured.",
  socialSetupHint:
    "Likes, comments, views, reports, watch analytics, ranking metrics, and custom covers need the SQL in supabase/posts_social_features.sql, supabase/posts_shorts_feed_features.sql, and supabase/posts_shorts_watch_metrics_rpc.sql.",
  sharePrompt: "Copy this video link:",
  closeComments: "Close comments",
};

export function getShortsText(locale: string): ShortsText {
  void locale;
  return SHORTS_TEXT;
}
