import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  buildMuxThumbnailUrl,
  extractMuxPlaybackId,
  MuxPlayer,
  type MuxPlayerElement,
} from "./mux";
import { getShortsText } from "./shortsText";
import { getSupabaseClient } from "./supabaseClient";

type Status = {
  type: "idle" | "loading" | "error";
  message: string;
};

type OrganizerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
  bio: string | null;
  is_organizer?: boolean | null;
};

type VideoPostRow = {
  id: string;
  user_id: string | null;
  media_url: string | null;
  caption: string | null;
  created_at: string;
  cover_url?: string | null;
  mux_playback_id?: string | null;
  mux_thumbnail_url?: string | null;
  shorts_visibility?: string | null;
  shorts_hidden?: boolean | null;
  shorts_deleted_at?: string | null;
};

type VideoFeedItem = VideoPostRow & {
  author: OrganizerProfile;
};

type LikeRow = {
  post_id: string;
  user_id: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string | null;
  comment: string;
  created_at: string;
};

type ShareRow = {
  post_id: string;
};

type ViewRow = {
  post_id: string;
};

type ReportRow = {
  post_id: string;
};

type FeedComment = {
  id: string;
  post_id: string;
  user_id: string | null;
  comment: string;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
};

type PlayableMediaElement = HTMLVideoElement | MuxPlayerElement;

type ShortsPageProps = {
  locale: string;
  languageLabels: Partial<Record<string, string>>;
  guestMode: boolean;
  sessionUserId: string | null;
  viewerLanguage: string | null;
  viewerCity: string | null;
  followingOrganizerIds: string[];
  requireAuth: () => void;
  goToOrganizer: (organizerId: string) => void;
  sharePath: string;
};

const RECENT_VIEWS_STORAGE_KEY = "vela-shorts-recent-views";
const RECENT_VIEW_COOLDOWN_MS = 1000 * 60 * 60 * 18;

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return "Unexpected error";
}

function isSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function getRequestedPostId() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("post");
  return id && id.trim() ? id.trim() : null;
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "?";
}

function getAuthorName(author: OrganizerProfile) {
  return author.full_name?.trim() || "Organizer";
}

function formatRelativeTime(value: string, locale: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (absoluteSeconds < 60) return formatter.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");
  const diffHours = Math.round(diffSeconds / 3600);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");
  const diffDays = Math.round(diffSeconds / 86400);
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, "day");
  const diffMonths = Math.round(diffSeconds / 2_592_000);
  if (Math.abs(diffMonths) < 12) return formatter.format(diffMonths, "month");
  const diffYears = Math.round(diffSeconds / 31_536_000);
  return formatter.format(diffYears, "year");
}

function buildCountMap(ids: string[]) {
  return ids.reduce<Record<string, number>>((accumulator, id) => {
    accumulator[id] = 0;
    return accumulator;
  }, {});
}

function getFeedViewerKey(sessionUserId: string | null) {
  if (sessionUserId) {
    return `user:${sessionUserId}`;
  }
  if (typeof window === "undefined") {
    return "guest:server";
  }
  const storageKey = "vela-shorts-viewer-key";
  const stored = window.localStorage.getItem(storageKey);
  if (stored?.trim()) {
    return `guest:${stored.trim()}`;
  }
  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(storageKey, generated);
  return `guest:${generated}`;
}

function getRecentViewedAtMap() {
  if (typeof window === "undefined") {
    return new Map<string, number>();
  }
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(RECENT_VIEWS_STORAGE_KEY) ?? "{}"
    ) as Record<string, unknown>;
    const now = Date.now();
    const entries = Object.entries(parsed).filter(([, value]) => {
      return typeof value === "number" && now - value < RECENT_VIEW_COOLDOWN_MS;
    });
    const map = new Map<string, number>(
      entries.map(([postId, value]) => [postId, value as number])
    );
    window.localStorage.setItem(
      RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(map))
    );
    return map;
  } catch {
    return new Map<string, number>();
  }
}

function persistRecentViewedAt(postId: string) {
  if (typeof window === "undefined") return;
  const map = getRecentViewedAtMap();
  map.set(postId, Date.now());
  window.localStorage.setItem(
    RECENT_VIEWS_STORAGE_KEY,
    JSON.stringify(Object.fromEntries(map))
  );
}

function getVideoRankScore(
  post: VideoFeedItem,
  metrics: { likes: number; comments: number; shares: number; views: number },
  context: {
    viewerLanguage: string | null;
    viewerCity: string | null;
    followingOrganizerIds: Set<string>;
    recentViewedAt: Map<string, number>;
  }
) {
  const createdAt = new Date(post.created_at).getTime();
  const ageHours = Number.isNaN(createdAt)
    ? 72
    : Math.max(1, (Date.now() - createdAt) / 3_600_000);
  const freshnessBoost = Math.max(0, 72 - ageHours) * 1.4;
  const engagementBoost =
    metrics.likes * 4 +
    metrics.comments * 6 +
    metrics.shares * 8 +
    Math.log10(metrics.views + 1) * 18;
  const languageBoost =
    context.viewerLanguage &&
    post.author.language &&
    context.viewerLanguage === post.author.language
      ? 26
      : 0;
  const cityBoost =
    context.viewerCity &&
    post.author.city &&
    context.viewerCity.trim().toLowerCase() === post.author.city.trim().toLowerCase()
      ? 18
      : 0;
  const followBoost = context.followingOrganizerIds.has(post.author.id) ? 42 : 0;
  const viewedAt = context.recentViewedAt.get(post.id);
  const cooldownPenalty = viewedAt
    ? Math.max(
        8,
        Math.round((RECENT_VIEW_COOLDOWN_MS - (Date.now() - viewedAt)) / 3_600_000) * 10
      )
    : 0;
  return freshnessBoost + engagementBoost + languageBoost + cityBoost + followBoost - cooldownPenalty;
}

function rankFeedVideos(
  items: VideoFeedItem[],
  likeCounts: Record<string, number>,
  commentCounts: Record<string, number>,
  shareCounts: Record<string, number>,
  viewCounts: Record<string, number>,
  requestedPostId: string | null,
  context: {
    viewerLanguage: string | null;
    viewerCity: string | null;
    followingOrganizerIds: Set<string>;
    recentViewedAt: Map<string, number>;
  }
) {
  return [...items].sort((left, right) => {
    if (requestedPostId) {
      if (left.id === requestedPostId) return -1;
      if (right.id === requestedPostId) return 1;
    }
    const scoreDiff =
      getVideoRankScore(right, {
        likes: likeCounts[right.id] ?? 0,
        comments: commentCounts[right.id] ?? 0,
        shares: shareCounts[right.id] ?? 0,
        views: viewCounts[right.id] ?? 0,
      }, context) -
      getVideoRankScore(left, {
        likes: likeCounts[left.id] ?? 0,
        comments: commentCounts[left.id] ?? 0,
        shares: shareCounts[left.id] ?? 0,
        views: viewCounts[left.id] ?? 0,
      }, context);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

function getVideoCoverUrl(post: VideoPostRow) {
  const playbackId = post.mux_playback_id ?? extractMuxPlaybackId(post.media_url);
  if (post.cover_url?.trim()) {
    return post.cover_url.trim();
  }
  if (post.mux_thumbnail_url?.trim()) {
    return post.mux_thumbnail_url.trim();
  }
  return playbackId ? buildMuxThumbnailUrl(playbackId) : null;
}

function updateRefMap<T>(
  refMap: MutableRefObject<Record<string, T | null>>,
  id: string,
  node: T | null
) {
  if (node) {
    refMap.current[id] = node;
    return;
  }
  delete refMap.current[id];
}

function ShortsActionButton(props: {
  label: string;
  count: string;
  active?: boolean;
  busy?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { label, count, active = false, busy = false, onClick, children } = props;
  const interactive = typeof onClick === "function";
  return (
    <button
      className={`shortsAction${active ? " shortsAction--active" : ""}${interactive ? "" : " shortsAction--metric"}`}
      type="button"
      onClick={onClick}
      disabled={busy || !interactive}
      aria-label={label}
      title={label}
    >
      <span className="shortsActionIcon" aria-hidden="true">
        {children}
      </span>
      {count ? <span className="shortsActionCount">{count}</span> : null}
      <span className="shortsActionLabel">{label}</span>
    </button>
  );
}

export default function ShortsPage(props: ShortsPageProps) {
  const {
    locale,
    languageLabels,
    guestMode,
    sessionUserId,
    viewerLanguage,
    viewerCity,
    followingOrganizerIds,
    requireAuth,
    goToOrganizer,
    sharePath,
  } = props;
  const text = useMemo(() => getShortsText(locale), [locale]);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [feedStatus, setFeedStatus] = useState<Status>({
    type: "loading",
    message: "",
  });
  const [videos, setVideos] = useState<VideoFeedItem[]>([]);
  const [socialNotice, setSocialNotice] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [socialReady, setSocialReady] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<string, FeedComment[]>
  >({});
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState<string | null>(
    null
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSubmittingPostId, setCommentSubmittingPostId] = useState<
    string | null
  >(null);
  const [likeLoadingPostId, setLikeLoadingPostId] = useState<string | null>(null);
  const [shareLoadingPostId, setShareLoadingPostId] = useState<string | null>(null);
  const [reportLoadingPostId, setReportLoadingPostId] = useState<string | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [soundOnPostId, setSoundOnPostId] = useState<string | null>(null);
  const [pausedPostIds, setPausedPostIds] = useState<Record<string, boolean>>({});
  const feedRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const videoRefs = useRef<Record<string, PlayableMediaElement | null>>({});
  const recordedViewIdsRef = useRef<Set<string>>(new Set());
  const watchSessionRef = useRef<{
    postId: string;
    startedAt: number;
    startedPlaybackTime: number;
  } | null>(null);
  const followingOrganizerIdSet = useMemo(
    () => new Set(followingOrganizerIds),
    [followingOrganizerIds]
  );
  const likedPostIdSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const reportedPostIdSet = useMemo(() => new Set(reportedPostIds), [reportedPostIds]);

  const setNotice = useCallback((message: string) => {
    setActionNotice(message);
  }, []);

  const loadInteractionSummary = useCallback(
    async (postIds: string[], items?: VideoFeedItem[]) => {
      const supabase = getSupabaseClient();
      if (!supabase || postIds.length === 0) {
        setLikeCounts(buildCountMap(postIds));
        setCommentCounts(buildCountMap(postIds));
        setShareCounts(buildCountMap(postIds));
        setViewCounts(buildCountMap(postIds));
        setLikedPostIds([]);
        setReportedPostIds([]);
        return;
      }
      const viewerKey = getFeedViewerKey(sessionUserId);
      const [likesResult, commentsResult, sharesResult, viewsResult, reportsResult] =
        await Promise.all([
          supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
          supabase.from("post_comments").select("post_id").in("post_id", postIds),
          supabase
            .from("post_share_events")
            .select("post_id")
            .in("post_id", postIds),
          supabase.from("post_view_events").select("post_id").in("post_id", postIds),
          supabase
            .from("post_reports")
            .select("post_id")
            .eq("viewer_key", viewerKey)
            .in("post_id", postIds),
        ]);
      const interactionError =
        likesResult.error ??
        commentsResult.error ??
        sharesResult.error ??
        viewsResult.error ??
        reportsResult.error;
      if (interactionError) {
        setSocialReady(false);
        setSocialNotice(
          isSchemaError(interactionError)
            ? text.socialSetupHint
            : getErrorMessage(interactionError)
        );
        setLikeCounts(buildCountMap(postIds));
        setCommentCounts(buildCountMap(postIds));
        setShareCounts(buildCountMap(postIds));
        setViewCounts(buildCountMap(postIds));
        setLikedPostIds([]);
        setReportedPostIds([]);
        return;
      }

      const nextLikeCounts = buildCountMap(postIds);
      const nextCommentCounts = buildCountMap(postIds);
      const nextShareCounts = buildCountMap(postIds);
      const nextViewCounts = buildCountMap(postIds);
      const nextLiked = new Set<string>();

      for (const row of (likesResult.data ?? []) as LikeRow[]) {
        nextLikeCounts[row.post_id] = (nextLikeCounts[row.post_id] ?? 0) + 1;
        if (sessionUserId && row.user_id === sessionUserId) {
          nextLiked.add(row.post_id);
        }
      }

      for (const row of (commentsResult.data ?? []) as Array<{ post_id: string }>) {
        nextCommentCounts[row.post_id] = (nextCommentCounts[row.post_id] ?? 0) + 1;
      }

      for (const row of (sharesResult.data ?? []) as ShareRow[]) {
        nextShareCounts[row.post_id] = (nextShareCounts[row.post_id] ?? 0) + 1;
      }

      for (const row of (viewsResult.data ?? []) as ViewRow[]) {
        nextViewCounts[row.post_id] = (nextViewCounts[row.post_id] ?? 0) + 1;
      }

      const nextReportedPostIds = ((reportsResult.data ?? []) as ReportRow[]).map(
        (row) => row.post_id
      );

      const requestedPostId = getRequestedPostId();
      if (items?.length) {
        const recentViewedAt = getRecentViewedAtMap();
        const rankedItems = rankFeedVideos(
          items,
          nextLikeCounts,
          nextCommentCounts,
          nextShareCounts,
          nextViewCounts,
          requestedPostId,
          {
            viewerLanguage,
            viewerCity,
            followingOrganizerIds: followingOrganizerIdSet,
            recentViewedAt,
          }
        );
        setVideos(rankedItems);
        setActivePostId(rankedItems[0]?.id ?? null);
      }

      setSocialReady(true);
      setSocialNotice("");
      setLikeCounts(nextLikeCounts);
      setCommentCounts(nextCommentCounts);
      setShareCounts(nextShareCounts);
      setViewCounts(nextViewCounts);
      setLikedPostIds([...nextLiked]);
      setReportedPostIds(nextReportedPostIds);
    },
    [followingOrganizerIdSet, sessionUserId, text.socialSetupHint, viewerCity, viewerLanguage]
  );

  const loadFeed = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedStatus({ type: "error", message: text.notConfigured });
      setVideos([]);
      setViewCounts({});
      return;
    }

    setFeedStatus({ type: "loading", message: "" });
    const primaryPostsResult = await supabase
      .from("posts")
      .select(
        "id,user_id,media_url,caption,created_at,cover_url,mux_playback_id,mux_thumbnail_url,shorts_visibility,shorts_hidden,shorts_deleted_at"
      )
      .eq("media_type", "video")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(36);
    const fallbackPostsResult =
      primaryPostsResult.error && isSchemaError(primaryPostsResult.error)
        ? await supabase
        .from("posts")
        .select("id,user_id,media_url,caption,created_at")
        .eq("media_type", "video")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(36)
        : null;
    const postRows = (fallbackPostsResult?.data ?? primaryPostsResult.data) as
      | VideoPostRow[]
      | null;
    const postError = fallbackPostsResult?.error ?? primaryPostsResult.error;

    if (postError) {
      setFeedStatus({ type: "error", message: getErrorMessage(postError) });
      setVideos([]);
      setViewCounts({});
      return;
    }

    const posts = (postRows ?? []) as VideoPostRow[];
    const organizerIds = [
      ...new Set(
        posts
          .map((item) => item.user_id)
          .filter((value): value is string => Boolean(value))
      ),
    ];

    if (organizerIds.length === 0) {
      setVideos([]);
      setFeedStatus({ type: "idle", message: "" });
      setLikeCounts({});
      setCommentCounts({});
      setShareCounts({});
      setViewCounts({});
      return;
    }

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url,city,country,language,bio,is_organizer")
      .in("id", organizerIds)
      .eq("is_organizer", true);

    if (profileError) {
      setFeedStatus({ type: "error", message: getErrorMessage(profileError) });
      setVideos([]);
      setViewCounts({});
      return;
    }

    const profileMap = new Map(
      ((profileRows ?? []) as OrganizerProfile[]).map((profile) => [profile.id, profile])
    );
    const filteredVideos = posts
      .filter((post): post is VideoPostRow & { user_id: string } =>
        Boolean(
          post.user_id &&
            profileMap.has(post.user_id) &&
            (post.mux_playback_id || post.media_url)
        )
      )
      .filter((post) => {
        if (post.shorts_deleted_at || post.shorts_hidden) {
          return false;
        }
        if (!post.shorts_visibility || post.shorts_visibility === "public") {
          return true;
        }
        if (post.shorts_visibility === "followers") {
          return followingOrganizerIdSet.has(post.user_id);
        }
        return false;
      })
      .map((post) => ({
        ...post,
        author: profileMap.get(post.user_id)!,
      }));

    setVideos(filteredVideos);
    setActivePostId(filteredVideos[0]?.id ?? null);
    setFeedStatus({ type: "idle", message: "" });
    await loadInteractionSummary(
      filteredVideos.map((item) => item.id),
      filteredVideos
    );
  }, [followingOrganizerIdSet, loadInteractionSummary, text.notConfigured]);

  const loadComments = useCallback(
    async (postId: string) => {
      if (!socialReady) {
        setNotice(text.socialSetupHint);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotice(text.notConfigured);
        return;
      }

      setCommentsLoadingPostId(postId);
      const { data: commentRows, error: commentError } = await supabase
        .from("post_comments")
        .select("id,post_id,user_id,comment,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentError) {
        setCommentsLoadingPostId(null);
        setNotice(
          isSchemaError(commentError)
            ? text.socialSetupHint
            : getErrorMessage(commentError)
        );
        return;
      }

      const comments = (commentRows ?? []) as CommentRow[];
      const userIds = [
        ...new Set(
          comments
            .map((item) => item.user_id)
            .filter((value): value is string => Boolean(value))
        ),
      ];
      let profileMap = new Map<string, OrganizerProfile>();
      if (userIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id,full_name,avatar_url")
          .in("id", userIds);
        if (!profileError) {
          profileMap = new Map(
            ((profileRows ?? []) as OrganizerProfile[]).map((profile) => [
              profile.id,
              profile,
            ])
          );
        }
      }

      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: comments.map((comment) => {
          const profile = comment.user_id ? profileMap.get(comment.user_id) : null;
          return {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            comment: comment.comment,
            created_at: comment.created_at,
            authorName: profile?.full_name?.trim() || "Member",
            authorAvatar: profile?.avatar_url ?? null,
          };
        }),
      }));
      setCommentsLoadingPostId(null);
    },
    [setNotice, socialReady, text.notConfigured, text.socialSetupHint]
  );

  const recordView = useCallback(
    async (postId: string) => {
      if (!socialReady || recordedViewIdsRef.current.has(postId)) {
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const viewerKey = getFeedViewerKey(sessionUserId);
      const { error } = await supabase.from("post_view_events").upsert(
        {
          post_id: postId,
          user_id: sessionUserId,
          viewer_key: viewerKey,
        },
        {
          onConflict: "post_id,viewer_key",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        const message =
          typeof error.message === "string" ? error.message.toLowerCase() : "";
        if (error.code === "23505" || message.includes("duplicate key")) {
          recordedViewIdsRef.current.add(postId);
          return;
        }
        if (isSchemaError(error)) {
          setSocialReady(false);
          setSocialNotice(text.socialSetupHint);
        }
        return;
      }

      recordedViewIdsRef.current.add(postId);
      persistRecentViewedAt(postId);
      setViewCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + 1,
      }));
    },
    [sessionUserId, socialReady, text.socialSetupHint]
  );

  const flushWatchSession = useCallback(
    async (postId?: string | null) => {
      const current = watchSessionRef.current;
      if (!current) return;
      if (postId && current.postId !== postId) return;
      watchSessionRef.current = null;

      const element = videoRefs.current[current.postId];
      const currentTime =
        typeof element?.currentTime === "number" && Number.isFinite(element.currentTime)
          ? element.currentTime
          : current.startedPlaybackTime;
      const duration =
        typeof element?.duration === "number" && Number.isFinite(element.duration) && element.duration > 0
          ? element.duration
          : null;
      const watchedSeconds = Math.max(0, currentTime - current.startedPlaybackTime);
      if (watchedSeconds < 1.2) {
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) return;
      const completionRatio = duration
        ? Math.min(1, Math.max(0, currentTime / duration))
        : 0;
      const { error } = await supabase.from("post_watch_sessions").insert({
        post_id: current.postId,
        user_id: sessionUserId,
        viewer_key: getFeedViewerKey(sessionUserId),
        watched_seconds: watchedSeconds,
        completion_ratio: completionRatio,
        completed: completionRatio >= 0.85,
        source: "shorts",
        started_at: new Date(current.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
      });
      if (error && isSchemaError(error)) {
        setSocialReady(false);
        setSocialNotice(text.socialSetupHint);
      }
    },
    [sessionUserId, text.socialSetupHint]
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadFeed();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadFeed]);

  useEffect(() => {
    if (!actionNotice || typeof window === "undefined") return undefined;
    const id = window.setTimeout(() => setActionNotice(""), 3200);
    return () => window.clearTimeout(id);
  }, [actionNotice]);

  useEffect(() => {
    if (typeof window === "undefined" || videos.length === 0 || !feedRef.current) {
      return undefined;
    }
    const feedNode = feedRef.current;
    let frameId = 0;

    const syncActiveCard = () => {
      frameId = 0;
      const viewportCenter = feedNode.scrollTop + feedNode.clientHeight / 2;
      let nearestId: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const video of videos) {
        const node = cardRefs.current[video.id];
        if (!node) continue;
        const cardCenter = node.offsetTop + node.offsetHeight / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = video.id;
        }
      }

      if (nearestId) {
        setActivePostId((current) => (current === nearestId ? current : nearestId));
        setOpenCommentsPostId((current) =>
          current && current !== nearestId ? null : current
        );
      }
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(syncActiveCard);
    };

    syncActiveCard();
    feedNode.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      feedNode.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [videos]);

  useEffect(() => {
    for (const video of videos) {
      const element = videoRefs.current[video.id];
      if (!element) continue;
      if ("muted" in element) {
        element.muted = soundOnPostId !== video.id;
      }
      if (typeof element.play !== "function" || typeof element.pause !== "function") {
        continue;
      }
      if (video.id === activePostId && !pausedPostIds[video.id]) {
        const playResult = element.play();
        if (playResult && typeof playResult.catch === "function") {
          playResult.catch(() => {});
        }
      } else {
        element.pause();
      }
    }
  }, [activePostId, pausedPostIds, soundOnPostId, videos]);

  useEffect(() => {
    const currentSession = watchSessionRef.current;
    if (currentSession?.postId && currentSession.postId !== activePostId) {
      void flushWatchSession(currentSession.postId);
    }
    if (!activePostId) return;
    if (watchSessionRef.current?.postId === activePostId) return;
    const element = videoRefs.current[activePostId];
    watchSessionRef.current = {
      postId: activePostId,
      startedAt: Date.now(),
      startedPlaybackTime:
        typeof element?.currentTime === "number" && Number.isFinite(element.currentTime)
          ? element.currentTime
          : 0,
    };
  }, [activePostId, flushWatchSession]);

  useEffect(() => {
    if (!activePostId || typeof window === "undefined") return undefined;
    const id = window.setTimeout(() => {
      void recordView(activePostId);
    }, 1400);
    return () => window.clearTimeout(id);
  }, [activePostId, recordView]);

  useEffect(() => {
    return () => {
      const activeSessionPostId = watchSessionRef.current?.postId ?? null;
      if (activeSessionPostId) {
        void flushWatchSession(activeSessionPostId);
      }
    };
  }, [flushWatchSession]);

  const handleToggleComments = useCallback(
    async (postId: string) => {
      if (openCommentsPostId === postId) {
        setOpenCommentsPostId(null);
        return;
      }
      setOpenCommentsPostId(postId);
      if (!commentsByPostId[postId]) {
        await loadComments(postId);
      }
    },
    [commentsByPostId, loadComments, openCommentsPostId]
  );

  const handleToggleLike = useCallback(
    async (postId: string) => {
      if (!sessionUserId) {
        requireAuth();
        return;
      }
      if (!socialReady) {
        setNotice(text.socialSetupHint);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotice(text.notConfigured);
        return;
      }

      const liked = likedPostIdSet.has(postId);
      setLikeLoadingPostId(postId);
      if (liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", sessionUserId);
        setLikeLoadingPostId(null);
        if (error) {
          setNotice(
            isSchemaError(error) ? text.socialSetupHint : getErrorMessage(error)
          );
          return;
        }
        setLikedPostIds((prev) => prev.filter((id) => id !== postId));
        setLikeCounts((prev) => ({
          ...prev,
          [postId]: Math.max(0, (prev[postId] ?? 0) - 1),
        }));
        return;
      }

      const { error } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: sessionUserId,
      });
      setLikeLoadingPostId(null);
      if (error) {
        setNotice(isSchemaError(error) ? text.socialSetupHint : getErrorMessage(error));
        return;
      }
      setLikedPostIds((prev) => [...prev, postId]);
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + 1,
      }));
    },
    [
      likedPostIdSet,
      requireAuth,
      sessionUserId,
      setNotice,
      socialReady,
      text.notConfigured,
      text.socialSetupHint,
    ]
  );

  const handleCommentSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>, postId: string) => {
      event.preventDefault();
      if (!sessionUserId) {
        requireAuth();
        return;
      }
      if (!socialReady) {
        setNotice(text.socialSetupHint);
        return;
      }
      const draft = commentDrafts[postId]?.trim() ?? "";
      if (!draft) return;
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotice(text.notConfigured);
        return;
      }

      setCommentSubmittingPostId(postId);
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: sessionUserId,
        comment: draft,
      });
      setCommentSubmittingPostId(null);

      if (error) {
        setNotice(isSchemaError(error) ? text.socialSetupHint : getErrorMessage(error));
        return;
      }

      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setCommentCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + 1,
      }));
      await loadComments(postId);
      setOpenCommentsPostId(postId);
    },
    [
      commentDrafts,
      loadComments,
      requireAuth,
      sessionUserId,
      setNotice,
      socialReady,
      text.notConfigured,
      text.socialSetupHint,
    ]
  );

  const handleShare = useCallback(
    async (post: VideoFeedItem) => {
      if (typeof window === "undefined") return;
      const shareUrl = new URL(window.location.href);
      shareUrl.pathname = sharePath;
      shareUrl.search = "";
      shareUrl.searchParams.set("post", post.id);

      const payload = {
        title: `${getAuthorName(post.author)} - ${text.navLabel}`,
        text: post.caption?.trim() || text.subtitle,
        url: shareUrl.toString(),
      };

      let shared = false;
      try {
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          await navigator.share(payload);
          setNotice(text.shareDone);
          shared = true;
        } else if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(payload.url);
          setNotice(text.shareCopied);
          shared = true;
        } else {
          window.prompt(text.sharePrompt, payload.url);
          shared = true;
        }
      } catch (error) {
        const message = getErrorMessage(error);
        if (!message.toLowerCase().includes("abort")) {
          setNotice(message);
        }
        return;
      }

      if (!shared) return;
      setShareLoadingPostId(post.id);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from("post_share_events").insert({
          post_id: post.id,
          user_id: sessionUserId,
          channel:
            typeof navigator !== "undefined" && typeof navigator.share === "function"
              ? "native_share"
              : "copy_link",
        });
        if (!error) {
          setShareCounts((prev) => ({
            ...prev,
            [post.id]: (prev[post.id] ?? 0) + 1,
          }));
        } else if (!isSchemaError(error)) {
          setNotice(getErrorMessage(error));
        }
      }
      setShareLoadingPostId(null);
    },
    [
      sessionUserId,
      setNotice,
      sharePath,
      text.navLabel,
      text.shareCopied,
      text.shareDone,
      text.sharePrompt,
      text.subtitle,
    ]
  );

  const handleReport = useCallback(
    async (post: VideoFeedItem) => {
      if (reportedPostIdSet.has(post.id)) {
        setNotice(text.reportDuplicate);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotice(text.notConfigured);
        return;
      }
      setReportLoadingPostId(post.id);
      const viewerKey = getFeedViewerKey(sessionUserId);
      const { error } = await supabase.from("post_reports").upsert(
        {
          post_id: post.id,
          user_id: sessionUserId,
          viewer_key: viewerKey,
        },
        {
          onConflict: "post_id,viewer_key",
          ignoreDuplicates: true,
        }
      );
      setReportLoadingPostId(null);
      if (error) {
        const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
        if (error.code === "23505" || message.includes("duplicate key")) {
          setReportedPostIds((prev) => (prev.includes(post.id) ? prev : [...prev, post.id]));
          setNotice(text.reportDuplicate);
          return;
        }
        if (isSchemaError(error)) {
          setNotice(text.socialSetupHint);
          return;
        }
        setNotice(getErrorMessage(error));
        return;
      }
      setReportedPostIds((prev) => [...prev, post.id]);
      setNotice(text.reportSent);
    },
    [
      reportedPostIdSet,
      sessionUserId,
      setNotice,
      text.notConfigured,
      text.reportDuplicate,
      text.reportSent,
      text.socialSetupHint,
    ]
  );

  const handleTogglePlayback = useCallback((postId: string) => {
    const element = videoRefs.current[postId];
    if (
      !element ||
      typeof element.play !== "function" ||
      typeof element.pause !== "function"
    ) {
      return;
    }
    setActivePostId(postId);
    if (!("paused" in element) || element.paused) {
      setPausedPostIds((prev) => ({ ...prev, [postId]: false }));
      const playResult = element.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {});
      }
      return;
    }
    element.pause();
    setPausedPostIds((prev) => ({ ...prev, [postId]: true }));
  }, []);

  const handleToggleSound = useCallback((postId: string) => {
    setSoundOnPostId((prev) => (prev === postId ? null : postId));
  }, []);

  const activeVideoIndex = activePostId
    ? videos.findIndex((item) => item.id === activePostId)
    : -1;

  return (
    <div className="shortsPage">
      <div className="shortsHud">
        <div className="shortsHeader">
          <div className="shortsTitle">{text.title}</div>
          <div className="shortsSubtitle">{text.subtitle}</div>
        </div>

        {socialNotice ? (
          <div className="shortsNotice shortsNotice--warning">{socialNotice}</div>
        ) : null}
        {actionNotice ? <div className="shortsNotice">{actionNotice}</div> : null}
        {guestMode ? (
          <div className="shortsNotice shortsNotice--ghost">{text.signInHint}</div>
        ) : null}
      </div>

      {feedStatus.type === "loading" ? (
        <div className="shortsFeedState">
          <div className="shortsEmptyCard shortsEmptyCard--viewport">{text.loading}</div>
        </div>
      ) : feedStatus.type === "error" ? (
        <div className="shortsFeedState">
          <div className="shortsEmptyCard shortsEmptyCard--viewport">
            <div>{feedStatus.message}</div>
            <button className="btn" type="button" onClick={() => void loadFeed()}>
              {text.retry}
            </button>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="shortsFeedState">
          <div className="shortsEmptyCard shortsEmptyCard--viewport">{text.empty}</div>
        </div>
      ) : (
        <div className="shortsFeed" ref={feedRef}>
          {videos.map((post, index) => {
            const authorName = getAuthorName(post.author);
            const authorInitial = getInitial(authorName);
            const muxPlaybackId =
              post.mux_playback_id ?? extractMuxPlaybackId(post.media_url);
            const coverUrl = getVideoCoverUrl(post);
            const locationLabel = [post.author.city, post.author.country]
              .filter(Boolean)
              .join(", ");
            const languageLabel =
              post.author.language &&
              (languageLabels[post.author.language] ?? post.author.language);
            const comments = commentsByPostId[post.id] ?? [];
            const commentsOpen = openCommentsPostId === post.id;
            const paused = Boolean(pausedPostIds[post.id]);
            const preloadMode =
              activeVideoIndex === -1 || Math.abs(index - activeVideoIndex) <= 1
                ? "auto"
                : "metadata";
            const showCover = Boolean(coverUrl && activePostId !== post.id);
            const playbackHint = paused
              ? `${text.resumeHint} ${text.swipeHint}`
              : `${text.tapHint} ${text.swipeHint}`;

            return (
              <article
                key={post.id}
                ref={(node) => updateRefMap(cardRefs, post.id, node)}
                className={`shortsCard${commentsOpen ? " shortsCard--commentsOpen" : ""}`}
                data-post-id={post.id}
              >
                <div className="shortsStage">
                  {muxPlaybackId ? (
                    <MuxPlayer
                      playerRef={(node) => updateRefMap(videoRefs, post.id, node)}
                      className="shortsVideo"
                      playbackId={muxPlaybackId}
                      preload={preloadMode}
                      loop
                      muted
                      onClick={() => handleTogglePlayback(post.id)}
                    />
                  ) : (
                    <video
                      ref={(node) => updateRefMap(videoRefs, post.id, node)}
                      className="shortsVideo"
                      src={post.media_url ?? undefined}
                      loop
                      muted
                      playsInline
                      preload={preloadMode}
                      onClick={() => handleTogglePlayback(post.id)}
                    />
                  )}
                  {showCover ? (
                    <img className="shortsCover" src={coverUrl ?? undefined} alt={authorName} />
                  ) : null}
                  <div className="shortsStageShade" />
                  <div className="shortsStageTop">
                    <button
                      className="shortsAuthor"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToOrganizer(post.author.id);
                      }}
                      title={text.viewProfile}
                    >
                      {post.author.avatar_url ? (
                        <img
                          className="shortsAuthorAvatar"
                          src={post.author.avatar_url}
                          alt={authorName}
                        />
                      ) : (
                        <span className="shortsAuthorAvatar shortsAuthorAvatar--placeholder">
                          {authorInitial}
                        </span>
                      )}
                      <span className="shortsAuthorCopy">
                        <span className="shortsBadge">{text.organizerBadge}</span>
                        <span className="shortsAuthorName">{authorName}</span>
                        {locationLabel || languageLabel ? (
                          <span className="shortsAuthorMeta">
                            {[locationLabel, languageLabel].filter(Boolean).join(" • ")}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    <button
                      className="shortsSoundButton"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleSound(post.id);
                      }}
                    >
                      {soundOnPostId === post.id ? text.audioOn : text.audioOff}
                    </button>
                  </div>
                  <div className="shortsRail">
                    <ShortsActionButton
                      label={text.likeLabel}
                      count={numberFormatter.format(likeCounts[post.id] ?? 0)}
                      active={likedPostIdSet.has(post.id)}
                      busy={likeLoadingPostId === post.id}
                      onClick={() => void handleToggleLike(post.id)}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path
                          d="M12 21s-6.7-4.2-9.2-8C1.3 10.2 2.2 6.8 5.2 5.5c2.1-.9 4.3-.1 5.4 1.5 1.1-1.6 3.4-2.4 5.4-1.5 3 1.3 3.9 4.7 2.4 7.5C18.7 16.8 12 21 12 21Z"
                          fill="currentColor"
                        />
                      </svg>
                    </ShortsActionButton>
                    <ShortsActionButton
                      label={text.commentLabel}
                      count={numberFormatter.format(commentCounts[post.id] ?? 0)}
                      active={commentsOpen}
                      onClick={() => void handleToggleComments(post.id)}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path
                          d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </ShortsActionButton>
                    <ShortsActionButton
                      label={text.shareLabel}
                      count={numberFormatter.format(shareCounts[post.id] ?? 0)}
                      busy={shareLoadingPostId === post.id}
                      onClick={() => void handleShare(post)}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path
                          d="M15 5l5 4.5-5 4.5V11c-5 0-8.2 1.7-11 6 1-6.7 4.7-10 11-10V5Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </ShortsActionButton>
                    <ShortsActionButton
                      label={text.viewsLabel}
                      count={numberFormatter.format(viewCounts[post.id] ?? 0)}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path
                          d="M2.5 12s3.7-6 9.5-6 9.5 6 9.5 6-3.7 6-9.5 6-9.5-6-9.5-6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </ShortsActionButton>
                    <ShortsActionButton
                      label={text.reportLabel}
                      count=""
                      active={reportedPostIdSet.has(post.id)}
                      busy={reportLoadingPostId === post.id}
                      onClick={() => void handleReport(post)}
                    >
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path
                          d="M6 3.5h9.5L14 8l1.5 4.5H6v8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </ShortsActionButton>
                  </div>
                  <div className="shortsStageBottom">
                    <div className="shortsTime">
                      {formatRelativeTime(post.created_at, locale)}
                    </div>
                    {post.caption?.trim() ? (
                      <div className="shortsCaption">{post.caption.trim()}</div>
                    ) : null}
                    {post.author.bio?.trim() ? (
                      <div className="shortsBio">{post.author.bio.trim()}</div>
                    ) : null}
                    <div className="shortsHint">{playbackHint}</div>
                  </div>
                  {commentsOpen ? (
                    <>
                      <button
                        className="shortsCommentsBackdrop"
                        type="button"
                        aria-label={text.closeComments}
                        onClick={() => setOpenCommentsPostId(null)}
                      />
                      <div
                        className="shortsComments"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="shortsCommentsBar">
                          <div className="shortsCommentsHeader">{text.commentsTitle}</div>
                          <button
                            className="shortsCommentsClose"
                            type="button"
                            onClick={() => setOpenCommentsPostId(null)}
                            aria-label={text.closeComments}
                          >
                            x
                          </button>
                        </div>
                        <div className="shortsCommentsBody">
                          {commentsLoadingPostId === post.id ? (
                            <div className="shortsCommentsEmpty">{text.loading}</div>
                          ) : comments.length === 0 ? (
                            <div className="shortsCommentsEmpty">{text.noComments}</div>
                          ) : (
                            <div className="shortsCommentsList">
                              {comments.map((comment) => (
                                <div key={comment.id} className="shortsComment">
                                  {comment.authorAvatar ? (
                                    <img
                                      className="shortsCommentAvatar"
                                      src={comment.authorAvatar}
                                      alt={comment.authorName}
                                    />
                                  ) : (
                                    <div className="shortsCommentAvatar shortsCommentAvatar--placeholder">
                                      {getInitial(comment.authorName)}
                                    </div>
                                  )}
                                  <div className="shortsCommentBody">
                                    <div className="shortsCommentMeta">
                                      <span className="shortsCommentAuthor">
                                        {comment.authorName}
                                      </span>
                                      <span className="shortsCommentTime">
                                        {formatRelativeTime(comment.created_at, locale)}
                                      </span>
                                    </div>
                                    <div className="shortsCommentText">
                                      {comment.comment}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <form
                          className="shortsCommentForm"
                          onSubmit={(event) => void handleCommentSubmit(event, post.id)}
                        >
                          <textarea
                            className="input shortsCommentInput"
                            rows={2}
                            placeholder={text.commentPlaceholder}
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(event) =>
                              setCommentDrafts((prev) => ({
                                ...prev,
                                [post.id]: event.target.value,
                              }))
                            }
                            maxLength={280}
                            disabled={commentSubmittingPostId === post.id}
                          />
                          <div className="shortsCommentFooter">
                            {!sessionUserId ? (
                              <button className="btn" type="button" onClick={requireAuth}>
                                {text.signInHint}
                              </button>
                            ) : null}
                            <button
                              className="btn shortsCommentSend"
                              type="submit"
                              disabled={commentSubmittingPostId === post.id}
                            >
                              {text.commentSend}
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
