import { useState } from "react";
import { buildMuxThumbnailUrl, extractMuxPlaybackId, MuxPlayer } from "./mux";

type Route =
  | "login"
  | "register"
  | "forgot"
  | "search"
  | "events"
  | "event"
  | "organizer"
  | "profile"
  | "me"
  | "admin"
  | "partners"
  | "privacy"
  | "impressum"
  | "terms";

type Status = {
  type: "idle" | "loading" | "error";
  message: string;
};

type SearchProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  language: string | null;
  language_level: string | null;
  bio?: string | null;
  pinned_short_post_id?: string | null;
};

type OrganizerShortPost = {
  id: string;
  media_url: string | null;
  caption: string | null;
  created_at: string;
  cover_url?: string | null;
  mux_playback_id?: string | null;
  mux_thumbnail_url?: string | null;
};

type OrganizerPageProps = {
  strings: Record<string, string>;
  organizerDetailsStatus: Status;
  organizerDetails: SearchProfile | null;
  organizerShortsStatus: Status;
  organizerShorts: OrganizerShortPost[];
  isSupportedLocale: (value: string) => boolean;
  languageLabels: Partial<Record<string, string>>;
  organizerFollowerCounts: Record<string, number>;
  sessionUserId: string | null;
  organizerFollowMap: Record<string, boolean>;
  organizerFollowLoading: Record<string, boolean>;
  handleToggleOrganizerFollow: (
    organizerId: string,
    options?: { route: Route; eventId?: string; organizerId?: string }
  ) => Promise<void> | void;
  organizerFollowersStatus: Status;
  organizerFollowers: SearchProfile[];
};

export default function OrganizerPage(props: OrganizerPageProps) {
  const {
    strings,
    organizerDetailsStatus,
    organizerDetails,
    organizerShortsStatus,
    organizerShorts,
    isSupportedLocale,
    languageLabels,
    organizerFollowerCounts,
    sessionUserId,
    organizerFollowMap,
    organizerFollowLoading,
    handleToggleOrganizerFollow,
    organizerFollowersStatus,
    organizerFollowers,
  } = props;
  const [activeTab, setActiveTab] = useState<"about" | "shorts">("shorts");
  const effectiveTab = organizerShorts.length > 0 ? activeTab : "about";

  return (
    <div className="organizerPage">
      <div className="organizerHeader">
        <div className="organizerTitle">{strings.organizerPageTitle}</div>
      </div>
      {organizerDetailsStatus.type === "loading" ? (
        <div
          className="authStatus authStatus--loading"
          role="status"
          aria-live="polite"
        >
          {strings.loadingLabel}
        </div>
      ) : null}
      {organizerDetailsStatus.type === "error" ? (
        <div
          className="authStatus authStatus--error"
          role="status"
          aria-live="polite"
        >
          {organizerDetailsStatus.message}
        </div>
      ) : null}
      {organizerDetails
        ? (() => {
            const organizerLanguage =
              organizerDetails.language &&
              isSupportedLocale(organizerDetails.language)
                ? languageLabels[organizerDetails.language] ??
                  organizerDetails.language
                : organizerDetails.language ?? "";
            const organizerMeta = [
              organizerDetails.city,
              organizerLanguage,
              organizerDetails.language_level ?? "",
            ].filter(Boolean);
            const followersCount =
              organizerFollowerCounts[organizerDetails.id] ?? 0;
            const canFollow = organizerDetails.id !== sessionUserId;
            const isFollowing =
              organizerFollowMap[organizerDetails.id] === true;
            const isFollowLoading =
              organizerFollowLoading[organizerDetails.id] === true;
            const pinnedShortId = organizerDetails.pinned_short_post_id ?? null;
            const pinnedShort = pinnedShortId
              ? organizerShorts.find((post) => post.id === pinnedShortId) ?? null
              : null;
            const remainingShorts = organizerShorts.filter(
              (post) => post.id !== pinnedShortId
            );

            return (
              <>
                <div className="organizerCard">
                  <div className="organizerAvatar">
                    {organizerDetails.avatar_url ? (
                      <img
                        src={organizerDetails.avatar_url}
                        alt={organizerDetails.full_name ?? ""}
                      />
                    ) : (
                      <span>
                        {(organizerDetails.full_name ??
                          strings.profileHeaderNameFallback)
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="organizerInfo">
                    <div className="organizerName">
                      {organizerDetails.full_name ??
                        strings.profileHeaderNameFallback}
                    </div>
                    {organizerMeta.length ? (
                      <div className="organizerMeta">
                        {organizerMeta.join(" • ")}
                      </div>
                    ) : null}
                    <div className="organizerFollowersCount">
                      {strings.userStatsFollowers}: {followersCount}
                    </div>
                    {organizerDetails.bio ? (
                      <div className="organizerBio">{organizerDetails.bio}</div>
                    ) : null}
                  </div>
                  {canFollow ? (
                    <div className="organizerActions">
                      <button
                        className={`btn${isFollowing ? " btnActive" : ""}`}
                        type="button"
                        onClick={() =>
                          handleToggleOrganizerFollow(organizerDetails.id, {
                            route: "organizer",
                            organizerId: organizerDetails.id,
                          })
                        }
                        disabled={isFollowLoading}
                      >
                        {isFollowing
                          ? strings.userActionUnfollow
                          : strings.userActionFollow}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="userTabsRow organizerTabsRow">
                  <button
                    className={`userTab${effectiveTab === "about" ? " userTab--active" : ""}`}
                    type="button"
                    onClick={() => setActiveTab("about")}
                  >
                    {strings.userTabAbout}
                  </button>
                  <button
                    className={`userTab${effectiveTab === "shorts" ? " userTab--active" : ""}`}
                    type="button"
                    onClick={() => setActiveTab("shorts")}
                  >
                    {strings.userTabShorts}
                  </button>
                </div>
                {effectiveTab === "shorts" ? (
                  <div className="organizerShortsSection">
                    {organizerShortsStatus.type === "loading" ? (
                      <div
                        className="authStatus authStatus--loading"
                        role="status"
                        aria-live="polite"
                      >
                        {strings.loadingLabel}
                      </div>
                    ) : organizerShortsStatus.type === "error" ? (
                      <div
                        className="authStatus authStatus--error"
                        role="status"
                        aria-live="polite"
                      >
                        {organizerShortsStatus.message}
                      </div>
                    ) : organizerShorts.length === 0 ? (
                      <div className="userPostEmpty">{strings.organizerShortsEmpty}</div>
                    ) : (
                      <>
                        {pinnedShort ? (
                          <div className="userPostCard organizerPinnedShort">
                            <div className="userShortMeta">
                              <span className="userInfoLabel">{strings.userTabShorts}</span>
                              <span className="userShortBadge">
                                {strings.userPinnedShortLabel}
                              </span>
                            </div>
                            {(() => {
                              const coverUrl =
                                pinnedShort.cover_url?.trim() ||
                                pinnedShort.mux_thumbnail_url?.trim() ||
                                (() => {
                                  const playbackId =
                                    pinnedShort.mux_playback_id ??
                                    extractMuxPlaybackId(pinnedShort.media_url);
                                  return playbackId ? buildMuxThumbnailUrl(playbackId) : null;
                                })();
                              return coverUrl ? (
                                <div className="userShortCover">
                                  <img
                                    src={coverUrl}
                                    alt={pinnedShort.caption || strings.userTabShorts}
                                  />
                                </div>
                              ) : null;
                            })()}
                            {(() => {
                              const muxPlaybackId =
                                pinnedShort.mux_playback_id ??
                                extractMuxPlaybackId(pinnedShort.media_url);
                              return muxPlaybackId ? (
                                <MuxPlayer
                                  className="userPostMedia"
                                  playbackId={muxPlaybackId}
                                  controls
                                />
                              ) : pinnedShort.media_url ? (
                                <video
                                  className="userPostMedia"
                                  src={pinnedShort.media_url}
                                  controls
                                />
                              ) : null;
                            })()}
                            {pinnedShort.caption ? (
                              <div className="userPostCaption">{pinnedShort.caption}</div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="organizerShortsGrid">
                          {(pinnedShort ? remainingShorts : organizerShorts).map((post) => {
                            const muxPlaybackId =
                              post.mux_playback_id ?? extractMuxPlaybackId(post.media_url);
                            return (
                              <div key={post.id} className="userMediaItem organizerShortItem">
                                {muxPlaybackId ? (
                                  <MuxPlayer
                                    className="userPostMedia"
                                    playbackId={muxPlaybackId}
                                    controls
                                  />
                                ) : post.media_url ? (
                                  <video className="userPostMedia" src={post.media_url} controls />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
                {effectiveTab === "about" ? (
                <div className="organizerFollowersSection">
                  <div className="organizerFollowersTitle">
                    {strings.userStatsFollowers}
                  </div>
                  {organizerFollowersStatus.type === "loading" ? (
                    <div
                      className="authStatus authStatus--loading"
                      role="status"
                      aria-live="polite"
                    >
                      {strings.loadingLabel}
                    </div>
                  ) : null}
                  {organizerFollowersStatus.type === "error" ? (
                    <div
                      className="authStatus authStatus--error"
                      role="status"
                      aria-live="polite"
                    >
                      {organizerFollowersStatus.message}
                    </div>
                  ) : null}
                  {organizerFollowers.length === 0 ? (
                    <div className="searchEmpty">
                      {strings.organizerFollowersEmpty}
                    </div>
                  ) : (
                    <div className="searchProfileGrid organizerFollowersGrid">
                      {organizerFollowers.map((profile) => {
                        const profileLanguage =
                          profile.language && isSupportedLocale(profile.language)
                            ? languageLabels[profile.language] ??
                              profile.language
                            : profile.language ?? "";
                        const meta = [
                          profile.city,
                          profileLanguage,
                          profile.language_level,
                        ].filter(Boolean);

                        return (
                          <div key={profile.id} className="searchProfileCard">
                            <div className="searchProfileAvatar">
                              {profile.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={profile.full_name ?? ""}
                                />
                              ) : (
                                <span>
                                  {(profile.full_name ?? "?")
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="searchProfileInfo">
                              <div className="searchProfileName">
                                {profile.full_name ??
                                  strings.profileHeaderNameFallback}
                              </div>
                              {meta.length ? (
                                <div className="searchProfileMeta">
                                  {meta.join(" • ")}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                </div>
                ) : null}
              </>
            );
          })()
        : null}
    </div>
  );
}
