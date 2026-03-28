import type { CSSProperties, ChangeEventHandler, RefObject } from "react";
import { extractMuxPlaybackId, MuxPlayer } from "./mux";

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

type UserTab = "about" | "following" | "posts" | "photos" | "videos" | "tagged";

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
};

type UserPost = {
  id: string;
  user_id?: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "text";
  caption: string | null;
  created_at: string;
  mux_playback_id?: string | null;
  mux_asset_id?: string | null;
  mux_upload_id?: string | null;
};

type UserPageProps = {
  strings: Record<string, string>;
  profileCoverDisplay: string | null;
  profileCoverStyle: CSSProperties | undefined;
  navigateToSelf: () => void;
  profileHeaderAvatar: string | null;
  profileHeaderName: string;
  profileHeaderInitial: string;
  followerInitials: string[];
  userStats: { label: string; value: string | number }[];
  userTabs: { id: UserTab; label: string }[];
  userTab: UserTab;
  setUserTab: (tab: UserTab) => void;
  profileBio: string;
  emptyProfileValue: string;
  profileBirthDate: string;
  profileGenderLabel: string;
  profileCountry: string;
  profileCity: string;
  profileLanguageLabel: string;
  profileLevel: string;
  profileLearningLabels: string;
  profilePracticeLabels: string;
  profileInterestsLabel: string;
  profileTelegram: string;
  profileInstagram: string;
  followingStatus: Status;
  followingSearch: string;
  setFollowingSearch: (value: string) => void;
  filteredFollowingOrganizers: SearchProfile[];
  followingEmptyMessage: string;
  isSupportedLocale: (value: string) => boolean;
  languageLabels: Partial<Record<string, string>>;
  organizerFollowerCounts: Record<string, number>;
  organizerFollowMap: Record<string, boolean>;
  organizerFollowLoading: Record<string, boolean>;
  handleToggleOrganizerFollow: (
    organizerId: string,
    options?: { route: Route; eventId?: string; organizerId?: string }
  ) => Promise<void> | void;
  postCaption: string;
  updatePostCaption: (value: string) => void;
  postFileInputRef: RefObject<HTMLInputElement | null>;
  handlePostFileChange: ChangeEventHandler<HTMLInputElement>;
  handlePostPublish: () => Promise<void> | void;
  postActionStatus: Status;
  postHasContent: boolean;
  postPreviewUrl: string | null;
  postPreviewIsVideo: boolean;
  postsStatus: Status;
  userPosts: UserPost[];
  handleDeletePost: (post: UserPost) => Promise<void> | void;
  photoPosts: UserPost[];
  videoPosts: UserPost[];
};

export default function UserPage(props: UserPageProps) {
  const {
    strings,
    profileCoverDisplay,
    profileCoverStyle,
    navigateToSelf,
    profileHeaderAvatar,
    profileHeaderName,
    profileHeaderInitial,
    followerInitials,
    userStats,
    userTabs,
    userTab,
    setUserTab,
    profileBio,
    emptyProfileValue,
    profileBirthDate,
    profileGenderLabel,
    profileCountry,
    profileCity,
    profileLanguageLabel,
    profileLevel,
    profileLearningLabels,
    profilePracticeLabels,
    profileInterestsLabel,
    profileTelegram,
    profileInstagram,
    followingStatus,
    followingSearch,
    setFollowingSearch,
    filteredFollowingOrganizers,
    followingEmptyMessage,
    isSupportedLocale,
    languageLabels,
    organizerFollowerCounts,
    organizerFollowMap,
    organizerFollowLoading,
    handleToggleOrganizerFollow,
    postCaption,
    updatePostCaption,
    postFileInputRef,
    handlePostFileChange,
    handlePostPublish,
    postActionStatus,
    postHasContent,
    postPreviewUrl,
    postPreviewIsVideo,
    postsStatus,
    userPosts,
    handleDeletePost,
    photoPosts,
    videoPosts,
  } = props;

  return (
    <div className="userPage">
      <div className="userHero">
        <div
          className={`userCover${profileCoverDisplay ? " userCover--image" : ""}`}
          style={profileCoverStyle}
        />
        <button
          className="userAvatarWrap"
          type="button"
          onClick={navigateToSelf}
          aria-label={strings.userPageTitle}
        >
          {profileHeaderAvatar ? (
            <img
              className="userAvatarLarge"
              src={profileHeaderAvatar}
              alt={profileHeaderName}
            />
          ) : (
            <div className="userAvatarLarge userAvatarLarge--placeholder">
              <span>{profileHeaderInitial}</span>
            </div>
          )}
        </button>
        <div className="userFollowers">
          <div className="avatarStack">
            {followerInitials.map((initial, index) => (
              <div
                key={`${initial}-${index}`}
                className="avatarMini avatarMini--text"
              >
                {initial}
              </div>
            ))}
          </div>
          <span className="avatarMore">+23</span>
        </div>
        <div className="userHeroName">{profileHeaderName}</div>
      </div>

      <div className="userPrimary">
        <div className="userStatsRow">
          {userStats.map((stat) => (
            <div key={stat.label} className="userStat">
              <div className="userStatValue">{stat.value}</div>
              <div className="userStatLabel">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="userTabsRow">
          {userTabs.map((tab) => (
            <button
              key={tab.id}
              className={`userTab${userTab === tab.id ? " userTab--active" : ""}`}
              type="button"
              onClick={() => setUserTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {userTab === "about" ? (
        <div className="userAboutCard">
          <div className="userBio">
            {profileBio.trim() ? profileBio : strings.userBioPlaceholder}
          </div>
          <div className="userInfoGrid">
            <div className="userInfoItem">
              <span className="userInfoLabel">{strings.profileBirthLabel}</span>
              <span className="userInfoValue">
                {profileBirthDate || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem">
              <span className="userInfoLabel">{strings.profileGenderLabel}</span>
              <span className="userInfoValue">
                {profileGenderLabel || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem">
              <span className="userInfoLabel">{strings.profileCountryLabel}</span>
              <span className="userInfoValue">
                {profileCountry || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem">
              <span className="userInfoLabel">{strings.profileCityLabel}</span>
              <span className="userInfoValue">
                {profileCity || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem userInfoItem--full">
              <span className="userInfoLabel">{strings.profileLanguageLabel}</span>
              <span className="userInfoValue">
                {profileLanguageLabel || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem">
              <span className="userInfoLabel">{strings.profileLevelLabel}</span>
              <span className="userInfoValue">
                {profileLevel || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem userInfoItem--full">
              <span className="userInfoLabel">{strings.profileLearningLabel}</span>
              <span className="userInfoValue">
                {profileLearningLabels || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem userInfoItem--full">
              <span className="userInfoLabel">{strings.profilePracticeLabel}</span>
              <span className="userInfoValue">
                {profilePracticeLabels || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem userInfoItem--full">
              <span className="userInfoLabel">
                {strings.profileInterestsLabel}
              </span>
              <span className="userInfoValue">
                {profileInterestsLabel || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem">
              <span className="userInfoLabel">{strings.profileTelegramLabel}</span>
              <span className="userInfoValue">
                {profileTelegram.trim() || emptyProfileValue}
              </span>
            </div>
            <div className="userInfoItem">
              <span className="userInfoLabel">
                {strings.profileInstagramLabel}
              </span>
              <span className="userInfoValue">
                {profileInstagram.trim() || emptyProfileValue}
              </span>
            </div>
          </div>
        </div>
      ) : userTab === "following" ? (
        <div className="userFollowing">
          {followingStatus.type === "loading" ? (
            <div
              className="authStatus authStatus--loading"
              role="status"
              aria-live="polite"
            >
              {strings.loadingLabel}
            </div>
          ) : null}
          {followingStatus.type === "error" ? (
            <div
              className="authStatus authStatus--error"
              role="status"
              aria-live="polite"
            >
              {followingStatus.message}
            </div>
          ) : null}
          <div className="userFollowingSearch">
            <input
              className="input"
              type="search"
              placeholder={strings.userFollowingSearchPlaceholder}
              value={followingSearch}
              onChange={(event) => setFollowingSearch(event.target.value)}
            />
          </div>
          {filteredFollowingOrganizers.length === 0 ? (
            <div className="searchEmpty">{followingEmptyMessage}</div>
          ) : (
            <div className="searchProfileGrid userFollowingGrid">
              {filteredFollowingOrganizers.map((profile) => {
                const profileLanguage =
                  profile.language && isSupportedLocale(profile.language)
                    ? languageLabels[profile.language] ?? profile.language
                    : profile.language ?? "";
                const meta = [
                  profile.city,
                  profileLanguage,
                  profile.language_level,
                ].filter(Boolean);
                const followersCount = organizerFollowerCounts[profile.id] ?? 0;

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
                        {profile.full_name ?? strings.profileHeaderNameFallback}
                      </div>
                      {meta.length ? (
                        <div className="searchProfileMeta">
                          {meta.join(" • ")}
                        </div>
                      ) : null}
                      <div className="searchProfileFollowers">
                        {strings.userStatsFollowers}: {followersCount}
                      </div>
                    </div>
                    <div className="searchProfileActions">
                      <button
                        className={`btn${
                          organizerFollowMap[profile.id] ? " btnActive" : ""
                        }`}
                        type="button"
                        onClick={() =>
                          handleToggleOrganizerFollow(profile.id, {
                            route: "me",
                          })
                        }
                        disabled={organizerFollowLoading[profile.id] === true}
                      >
                        {organizerFollowMap[profile.id]
                          ? strings.userActionUnfollow
                          : strings.userActionFollow}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : userTab === "posts" ? (
        <div className="userPosts">
          <div className="userPostComposer">
            <textarea
              className="input userPostInput"
              placeholder={strings.userPostCaptionPlaceholder}
              value={postCaption}
              onChange={(event) => updatePostCaption(event.target.value)}
            />
            <div className="userPostFooter">
              <label className="userPostUpload">
                <input
                  ref={postFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handlePostFileChange}
                />
                <span className="userPostUploadText">
                  {strings.userPostFileHint}
                </span>
              </label>
              <button
                className="userAction userAction--primary userPostPublish"
                type="button"
                onClick={handlePostPublish}
                disabled={
                  postActionStatus.type === "loading" || !postHasContent
                }
              >
                {postActionStatus.type === "loading"
                  ? strings.loadingLabel
                  : strings.userPostPublish}
              </button>
            </div>
            {postPreviewUrl ? (
              <div className="userPostPreview">
                {postPreviewIsVideo ? (
                  <video
                    className="userPostMedia"
                    src={postPreviewUrl}
                    controls
                  />
                ) : (
                  <img
                    className="userPostMedia"
                    src={postPreviewUrl}
                    alt={strings.userTabPhotos}
                  />
                )}
              </div>
            ) : null}
            {postActionStatus.type === "error" ? (
              <div
                className="authStatus authStatus--error"
                role="status"
                aria-live="polite"
              >
                {postActionStatus.message}
              </div>
            ) : null}
          </div>
          {postsStatus.type === "loading" ? (
            <div
              className="authStatus authStatus--loading"
              role="status"
              aria-live="polite"
            >
              {strings.loadingLabel}
            </div>
          ) : postsStatus.type === "error" ? (
            <div
              className="authStatus authStatus--error"
              role="status"
              aria-live="polite"
            >
              {postsStatus.message}
            </div>
          ) : userPosts.length === 0 ? (
            <div className="userPostEmpty">{strings.userPostEmpty}</div>
          ) : (
            <div className="userPostList">
              {userPosts.map((post) => (
                <div key={post.id} className="userPostCard">
                  {post.media_type === "image" && post.media_url ? (
                    <img
                      className="userPostMedia"
                      src={post.media_url}
                      alt={post.caption || strings.userTabPhotos}
                    />
                  ) : null}
                  {post.media_type === "video" && post.media_url ? (
                    (() => {
                      const muxPlaybackId =
                        post.mux_playback_id ?? extractMuxPlaybackId(post.media_url);
                      return muxPlaybackId ? (
                        <MuxPlayer
                          className="userPostMedia"
                          playbackId={muxPlaybackId}
                          controls
                        />
                      ) : (
                        <video
                          className="userPostMedia"
                          src={post.media_url}
                          controls
                        />
                      );
                    })()
                  ) : null}
                  {post.caption ? (
                    <div className="userPostCaption">{post.caption}</div>
                  ) : null}
                  <div className="userPostActions">
                    <button
                      className="userPostDelete"
                      type="button"
                      onClick={() => handleDeletePost(post)}
                      disabled={postActionStatus.type === "loading"}
                    >
                      {strings.userPostDelete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : userTab === "photos" ? (
        postsStatus.type === "loading" ? (
          <div
            className="authStatus authStatus--loading"
            role="status"
            aria-live="polite"
          >
            {strings.loadingLabel}
          </div>
        ) : postsStatus.type === "error" ? (
          <div
            className="authStatus authStatus--error"
            role="status"
            aria-live="polite"
          >
            {postsStatus.message}
          </div>
        ) : photoPosts.length === 0 ? (
          <div className="userPostEmpty">{strings.userPostEmpty}</div>
        ) : (
          <div className="userMediaGrid">
            {photoPosts.map((post) =>
              post.media_url ? (
                <div key={post.id} className="userMediaItem">
                  <img
                    src={post.media_url}
                    alt={post.caption || strings.userTabPhotos}
                  />
                </div>
              ) : null
            )}
          </div>
        )
      ) : userTab === "videos" ? (
        postsStatus.type === "loading" ? (
          <div
            className="authStatus authStatus--loading"
            role="status"
            aria-live="polite"
          >
            {strings.loadingLabel}
          </div>
        ) : postsStatus.type === "error" ? (
          <div
            className="authStatus authStatus--error"
            role="status"
            aria-live="polite"
          >
            {postsStatus.message}
          </div>
        ) : videoPosts.length === 0 ? (
          <div className="userPostEmpty">{strings.userPostEmpty}</div>
        ) : (
          <div className="userMediaGrid">
            {videoPosts.map((post) =>
              post.media_url ? (
                <div key={post.id} className="userMediaItem">
                  {(() => {
                    const muxPlaybackId =
                      post.mux_playback_id ?? extractMuxPlaybackId(post.media_url);
                    return muxPlaybackId ? (
                      <MuxPlayer
                        className="userPostMedia"
                        playbackId={muxPlaybackId}
                        controls
                      />
                    ) : (
                      <video src={post.media_url} controls />
                    );
                  })()}
                </div>
              ) : null
            )}
          </div>
        )
      ) : (
        <div className="userPostEmpty">{strings.userPostEmpty}</div>
      )}
    </div>
  );
}
