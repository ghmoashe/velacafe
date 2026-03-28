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
};

type OrganizerPageProps = {
  strings: Record<string, string>;
  organizerDetailsStatus: Status;
  organizerDetails: SearchProfile | null;
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
              </>
            );
          })()
        : null}
    </div>
  );
}
