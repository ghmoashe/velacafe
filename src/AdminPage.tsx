import EventsManager, { type EventsManagerSharedProps } from "./EventsManager";
import { extractMuxPlaybackId, MuxPlayer } from "./mux";

type Locale =
  | "de"
  | "en"
  | "vi"
  | "ru"
  | "uk"
  | "fa"
  | "ar"
  | "sq"
  | "tr"
  | "fr"
  | "es"
  | "it"
  | "pl";

type AdminTab = "users" | "events" | "posts" | "applications";

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
  is_organizer?: boolean | null;
  is_teacher?: boolean | null;
  is_admin?: boolean | null;
};

type OrganizerApplication = {
  id: string;
  user_id: string;
  application_type: "person" | "organization";
  full_name: string | null;
  org_name: string | null;
  org_id: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
  languages: string | null;
  experience: string | null;
  about: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string | null;
};

type UserPost = {
  id: string;
  user_id?: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "text";
  caption: string | null;
  created_at: string;
  cover_url?: string | null;
  mux_playback_id?: string | null;
  mux_asset_id?: string | null;
  mux_upload_id?: string | null;
  shorts_hidden?: boolean | null;
};

type LanguageLabels = Partial<Record<string, string>>;

type AdminPageProps = {
  strings: Record<string, string>;
  profileIsAdmin: boolean;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  adminUsersStatus: Status;
  adminUsers: SearchProfile[];
  adminSelectedUser: SearchProfile | null;
  adminSelectedUserId: string | null;
  setAdminSelectedUserId: (id: string) => void;
  handleAdminUpdateUserRole: (
    userId: string,
    updates: { is_organizer?: boolean; is_teacher?: boolean; is_admin?: boolean }
  ) => void;
  adminUsersBusy: boolean;
  languageLabels: LanguageLabels;
  isSupportedLocale: (value: string) => boolean;
  sessionUserId: string | null;
  adminApplicationsStatus: Status;
  adminApplications: OrganizerApplication[];
  adminApplicationsBusy: boolean;
  adminUserMap: Map<string, SearchProfile>;
  resolveLanguageListValue: (value: string, labels: LanguageLabels) => string;
  handleAdminApproveApplication: (
    application: OrganizerApplication
  ) => Promise<void> | void;
  handleAdminRejectApplication: (
    application: OrganizerApplication
  ) => Promise<void> | void;
  adminEventsStatus: Status;
  eventsManagerProps: EventsManagerSharedProps;
  adminPostsStatus: Status;
  adminPosts: UserPost[];
  adminPostEditId: string | null;
  adminPostCaption: string;
  setAdminPostCaption: (value: string) => void;
  locale: Locale;
  formatDate: (value: string, locale: Locale) => string;
  handleAdminSavePost: (post: UserPost) => Promise<void> | void;
  cancelAdminPostEdit: () => void;
  startAdminPostEdit: (post: UserPost) => void;
  handleAdminDeletePost: (post: UserPost) => Promise<void> | void;
  handleAdminToggleShortHidden: (post: UserPost) => Promise<void> | void;
};

export default function AdminPage(props: AdminPageProps) {
  const {
    strings,
    profileIsAdmin,
    adminTab,
    setAdminTab,
    adminUsersStatus,
    adminUsers,
    adminSelectedUser,
    adminSelectedUserId,
    setAdminSelectedUserId,
    handleAdminUpdateUserRole,
    adminUsersBusy,
    languageLabels,
    isSupportedLocale,
    sessionUserId,
    adminApplicationsStatus,
    adminApplications,
    adminApplicationsBusy,
    adminUserMap,
    resolveLanguageListValue,
    handleAdminApproveApplication,
    handleAdminRejectApplication,
    adminEventsStatus,
    eventsManagerProps,
    adminPostsStatus,
    adminPosts,
    adminPostEditId,
    adminPostCaption,
    setAdminPostCaption,
    locale,
    formatDate,
    handleAdminSavePost,
    cancelAdminPostEdit,
    startAdminPostEdit,
    handleAdminDeletePost,
    handleAdminToggleShortHidden,
  } = props;
  const teacherRoleLabel =
    locale === "ru" ? "Преподаватель" : locale === "uk" ? "Викладач" : "Teacher";
  const makeTeacherLabel =
    locale === "ru"
      ? "Сделать преподавателем"
      : locale === "uk"
        ? "Зробити викладачем"
        : "Make teacher";

  return (
              <div className="adminPage">
                <div className="adminHeader">
                  <div className="adminTitle">{strings.adminTitle}</div>
                  <div className="adminSubtitle">{strings.adminSubtitle}</div>
                </div>
                {!profileIsAdmin ? (
                  <div
                    className="authStatus authStatus--error"
                    role="status"
                    aria-live="polite"
                  >
                    {strings.adminAccessDenied}
                  </div>
                ) : (
                  <>
                    <div className="adminTabs">
                      <button
                        className={`btn${adminTab === "users" ? " btnActive" : ""}`}
                        type="button"
                        onClick={() => setAdminTab("users")}
                      >
                        {strings.adminTabUsers}
                      </button>
                      <button
                        className={`btn${
                          adminTab === "applications" ? " btnActive" : ""
                        }`}
                        type="button"
                        onClick={() => setAdminTab("applications")}
                      >
                        {strings.adminTabApplications}
                      </button>
                      <button
                        className={`btn${adminTab === "events" ? " btnActive" : ""}`}
                        type="button"
                        onClick={() => setAdminTab("events")}
                      >
                        {strings.adminTabEvents}
                      </button>
                      <button
                        className={`btn${adminTab === "posts" ? " btnActive" : ""}`}
                        type="button"
                        onClick={() => setAdminTab("posts")}
                      >
                        {strings.adminTabPosts}
                      </button>
                    </div>
                    {adminTab === "users" ? (
                      <div className="adminSection">
                        {adminUsersStatus.type === "loading" ? (
                          <div
                            className="authStatus authStatus--loading"
                            role="status"
                            aria-live="polite"
                          >
                            {strings.loadingLabel}
                          </div>
                        ) : adminUsersStatus.type === "error" ? (
                          <div
                            className="authStatus authStatus--error"
                            role="status"
                            aria-live="polite"
                          >
                            {adminUsersStatus.message}
                          </div>
                        ) : adminUsers.length === 0 ? (
                          <div className="searchEmpty">
                            {strings.adminUsersEmpty}
                          </div>
                        ) : (
                          <>
                            <div className="adminUserToolbar">
                              <div className="adminUserSelection">
                                <span className="adminUserSelectionLabel">
                                  {strings.adminSelectUserLabel}
                                </span>
                                <span className="adminUserSelectionValue">
                                  {adminSelectedUser
                                    ? adminSelectedUser.full_name ??
                                      strings.profileHeaderNameFallback
                                    : strings.adminSelectUserEmpty}
                                </span>
                              </div>
                              <button
                                className="btn"
                                type="button"
                                onClick={() => {
                                  if (adminSelectedUserId) {
                                    handleAdminUpdateUserRole(
                                      adminSelectedUserId,
                                      { is_organizer: true }
                                    );
                                  }
                                }}
                                disabled={
                                  !adminSelectedUserId ||
                                  adminUsersBusy ||
                                  Boolean(adminSelectedUser?.is_organizer)
                                }
                                >
                                  {strings.adminMakeOrganizer}
                                </button>
                                <button
                                  className="btn"
                                  type="button"
                                  onClick={() => {
                                    if (adminSelectedUserId) {
                                      handleAdminUpdateUserRole(adminSelectedUserId, {
                                        is_teacher: true,
                                      });
                                    }
                                  }}
                                  disabled={
                                    !adminSelectedUserId ||
                                    adminUsersBusy ||
                                    Boolean(adminSelectedUser?.is_teacher)
                                  }
                                >
                                  {makeTeacherLabel}
                                </button>
                              </div>
                            <div className="searchProfileGrid adminUsersGrid">
                            {adminUsers.map((profile) => {
                              const profileLanguage =
                                profile.language &&
                                isSupportedLocale(profile.language)
                                  ? languageLabels[profile.language] ??
                                    profile.language
                                  : profile.language ?? "";
                                const meta = [
                                  profile.city,
                                  profileLanguage,
                                  profile.language_level,
                                ].filter(Boolean);
                                const isSelf = profile.id === sessionUserId;
                                const isOrganizer = Boolean(profile.is_organizer);
                                const isTeacher = Boolean(profile.is_teacher);
                                const isAdmin = Boolean(profile.is_admin);
                              const isSelected =
                                adminSelectedUserId === profile.id;
                                return (
                                  <div
                                    key={profile.id}
                                    className={`searchProfileCard adminUserCard${
                                      isSelected ? " adminUserCard--selected" : ""
                                    }`}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                      setAdminSelectedUserId(profile.id)
                                    }
                                    onKeyDown={(event) => {
                                      if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                      ) {
                                        event.preventDefault();
                                        setAdminSelectedUserId(profile.id);
                                      }
                                    }}
                                  >
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
                                    <div className="adminUserId">
                                      {profile.id}
                                    </div>
                                  </div>
                                  <div className="adminUserActions">
                                    <button
                                      className={`btn${
                                        isOrganizer ? " btnActive" : ""
                                      }`}
                                      type="button"
                                      onClick={() =>
                                        handleAdminUpdateUserRole(profile.id, {
                                          is_organizer: !isOrganizer,
                                        })
                                      }
                                      disabled={adminUsersBusy}
                                      >
                                        {strings.adminRoleOrganizer}
                                      </button>
                                      <button
                                        className={`btn${isTeacher ? " btnActive" : ""}`}
                                        type="button"
                                        onClick={() =>
                                          handleAdminUpdateUserRole(profile.id, {
                                            is_teacher: !isTeacher,
                                          })
                                        }
                                        disabled={adminUsersBusy}
                                      >
                                        {teacherRoleLabel}
                                      </button>
                                      <button
                                        className={`btn${isAdmin ? " btnActive" : ""}`}
                                        type="button"
                                      onClick={() =>
                                        handleAdminUpdateUserRole(profile.id, {
                                          is_admin: !isAdmin,
                                        })
                                      }
                                      disabled={
                                        adminUsersBusy || isSelf
                                      }
                                    >
                                      {strings.adminRoleAdmin}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          </>
                        )}
                      </div>
                    ) : adminTab === "applications" ? (
                      <div className="adminSection">
                        {adminApplicationsStatus.type === "loading" ? (
                          <div
                            className="authStatus authStatus--loading"
                            role="status"
                            aria-live="polite"
                          >
                            {strings.loadingLabel}
                          </div>
                        ) : adminApplicationsStatus.type === "error" ? (
                          <div
                            className="authStatus authStatus--error"
                            role="status"
                            aria-live="polite"
                          >
                            {adminApplicationsStatus.message}
                          </div>
                        ) : adminApplications.length === 0 ? (
                          <div className="searchEmpty">
                            {strings.adminApplicationsEmpty}
                          </div>
                        ) : (
                          <div className="adminApplicationsGrid">
                            {adminApplications.map((application) => {
                              const applicant = adminUserMap.get(
                                application.user_id
                              );
                              const displayName =
                                application.application_type === "organization"
                                  ? application.org_name ??
                                    application.contact_name ??
                                    strings.profileHeaderNameFallback
                                  : application.full_name ??
                                    application.contact_name ??
                                    applicant?.full_name ??
                                    strings.profileHeaderNameFallback;
                              const typeLabel =
                                application.application_type === "organization"
                                  ? strings.organizerApplyTypeOrganization
                                  : strings.organizerApplyTypePerson;
                              const location = [
                                application.city,
                                application.country,
                              ]
                                .filter(Boolean)
                                .join(" • ");
                              const languagesValue = application.languages
                                ? resolveLanguageListValue(
                                    application.languages,
                                    languageLabels
                                  )
                                : null;
                              const statusLabel =
                                application.status === "approved"
                                  ? strings.adminApplicationStatusApproved
                                  : application.status === "rejected"
                                    ? strings.adminApplicationStatusRejected
                                    : strings.adminApplicationStatusPending;
                              const details = [
                                application.application_type === "organization" &&
                                application.org_id
                                  ? {
                                      label: strings.organizerApplyOrgIdLabel,
                                      value: application.org_id,
                                    }
                                  : null,
                                application.application_type === "organization" &&
                                application.contact_name
                                  ? {
                                      label: strings.organizerApplyContactLabel,
                                      value: application.contact_name,
                                    }
                                  : null,
                                application.phone
                                  ? {
                                      label: strings.organizerApplyPhoneLabel,
                                      value: application.phone,
                                    }
                                  : null,
                                application.email
                                  ? {
                                      label: strings.organizerApplyEmailLabel,
                                      value: application.email,
                                    }
                                  : null,
                                application.website
                                  ? {
                                      label: strings.organizerApplyWebsiteLabel,
                                      value: application.website,
                                    }
                                  : null,
                                application.facebook_url
                                  ? {
                                      label: strings.organizerApplyFacebookLabel,
                                      value: application.facebook_url,
                                    }
                                  : null,
                                application.instagram_url
                                  ? {
                                      label: strings.organizerApplyInstagramLabel,
                                      value: application.instagram_url,
                                    }
                                  : null,
                                application.tiktok_url
                                  ? {
                                      label: strings.organizerApplyTiktokLabel,
                                      value: application.tiktok_url,
                                    }
                                  : null,
                                application.linkedin_url
                                  ? {
                                      label: strings.organizerApplyLinkedInLabel,
                                      value: application.linkedin_url,
                                    }
                                  : null,
                                application.languages
                                  ? {
                                      label: strings.organizerApplyLanguagesLabel,
                                      value: languagesValue ?? application.languages,
                                    }
                                  : null,
                                application.experience
                                  ? {
                                      label: strings.organizerApplyExperienceLabel,
                                      value: application.experience,
                                    }
                                  : null,
                                application.about
                                  ? {
                                      label: strings.organizerApplyAboutLabel,
                                      value: application.about,
                                    }
                                  : null,
                              ].filter(Boolean) as { label: string; value: string }[];
                              return (
                                <div
                                  key={application.id}
                                  className="adminApplicationCard"
                                >
                                  <div className="adminApplicationHeader">
                                    <div className="searchProfileAvatar">
                                      {applicant?.avatar_url ? (
                                        <img
                                          src={applicant.avatar_url}
                                          alt={displayName}
                                        />
                                      ) : (
                                        <span>
                                          {(displayName ?? "?")
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="adminApplicationInfo">
                                      <div className="adminApplicationName">
                                        {displayName}
                                      </div>
                                      <div className="adminApplicationMeta">
                                        {[typeLabel, location]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </div>
                                      {application.email || application.phone ? (
                                        <div className="adminApplicationMeta">
                                          {[application.email, application.phone]
                                            .filter(Boolean)
                                            .join(" • ")}
                                        </div>
                                      ) : null}
                                    </div>
                                    <span
                                      className={`adminApplicationStatus adminApplicationStatus--${application.status}`}
                                    >
                                      {statusLabel}
                                    </span>
                                  </div>
                                  {details.length ? (
                                    <div className="adminApplicationDetails">
                                      {details.map((detail) => (
                                        <div
                                          key={`${application.id}-${detail.label}`}
                                          className="adminApplicationDetail"
                                        >
                                          <span className="adminApplicationDetailLabel">
                                            {detail.label}:
                                          </span>
                                          <span className="adminApplicationDetailValue">
                                            {detail.value}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                  {application.status === "pending" ? (
                                    <div className="adminApplicationActions">
                                      <button
                                        className="btn"
                                        type="button"
                                        onClick={() =>
                                          handleAdminApproveApplication(application)
                                        }
                                        disabled={adminApplicationsBusy}
                                      >
                                        {strings.adminApplicationApprove}
                                      </button>
                                      <button
                                        className="btn btnGhost"
                                        type="button"
                                        onClick={() =>
                                          handleAdminRejectApplication(application)
                                        }
                                        disabled={adminApplicationsBusy}
                                      >
                                        {strings.adminApplicationReject}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : adminTab === "events" ? (
                      <div className="adminSection">
                        {adminEventsStatus.type === "loading" ? (
                          <div
                            className="authStatus authStatus--loading"
                            role="status"
                            aria-live="polite"
                          >
                            {strings.loadingLabel}
                          </div>
                        ) : adminEventsStatus.type === "error" ? (
                          <div
                            className="authStatus authStatus--error"
                            role="status"
                            aria-live="polite"
                          >
                            {adminEventsStatus.message}
                          </div>
                        ) : (
                          <EventsManager
                            {...eventsManagerProps}
                            showOrganizerHint={false}
                            showEditor
                            canEditItems
                            listTitle={strings.adminTabEvents}
                            emptyLabel={strings.adminEventsEmpty}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="adminSection">
                        {adminPostsStatus.type === "loading" ? (
                          <div
                            className="authStatus authStatus--loading"
                            role="status"
                            aria-live="polite"
                          >
                            {strings.loadingLabel}
                          </div>
                        ) : adminPostsStatus.type === "error" ? (
                          <div
                            className="authStatus authStatus--error"
                            role="status"
                            aria-live="polite"
                          >
                            {adminPostsStatus.message}
                          </div>
                        ) : adminPosts.length === 0 ? (
                          <div className="searchEmpty">
                            {strings.adminPostsEmpty}
                          </div>
                        ) : (
                          <div className="adminPostsGrid">
                            {adminPosts.map((post) => {
                              const owner = post.user_id
                                ? adminUserMap.get(post.user_id)
                                : undefined;
                              const ownerName =
                                owner?.full_name ??
                                strings.profileHeaderNameFallback;
                              const isEditing = adminPostEditId === post.id;
                              return (
                                <div
                                  key={post.id}
                                  className="userPostCard adminPostCard"
                                >
                                  <div className="adminPostHeader">
                                    <div className="adminPostOwner">
                                      {ownerName}
                                    </div>
                                    <div className="adminPostDate">
                                      {post.created_at
                                        ? formatDate(post.created_at, locale)
                                        : ""}
                                    </div>
                                  </div>
                                  {post.media_type === "image" &&
                                  post.media_url ? (
                                    <img
                                      className="userPostMedia"
                                      src={post.media_url}
                                      alt={post.caption || strings.userTabPhotos}
                                    />
                                  ) : null}
                                  {post.media_type === "video" &&
                                  post.media_url ? (
                                    (() => {
                                      const muxPlaybackId =
                                        post.mux_playback_id ??
                                        extractMuxPlaybackId(post.media_url);
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
                                  {isEditing ? (
                                    <textarea
                                      className="input adminPostInput"
                                      value={adminPostCaption}
                                      onChange={(event) =>
                                        setAdminPostCaption(event.target.value)
                                      }
                                    />
                                  ) : post.caption ? (
                                    <div className="userPostCaption">
                                      {post.caption}
                                    </div>
                                  ) : null}
                                  <div className="userPostActions">
                                    {isEditing ? (
                                      <>
                                        <button
                                          className="btn"
                                          type="button"
                                          onClick={() => handleAdminSavePost(post)}
                                          disabled={adminPostsStatus.type === "loading"}
                                        >
                                          {strings.eventUpdate}
                                        </button>
                                        <button
                                          className="btn btnGhost"
                                          type="button"
                                          onClick={cancelAdminPostEdit}
                                          disabled={adminPostsStatus.type === "loading"}
                                        >
                                          {strings.eventCancelEdit}
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          className="btn"
                                          type="button"
                                          onClick={() => startAdminPostEdit(post)}
                                        >
                                          {strings.eventEdit}
                                        </button>
                                        {post.media_type === "video" ? (
                                          <button
                                            className="btn btnGhost"
                                            type="button"
                                            onClick={() => void handleAdminToggleShortHidden(post)}
                                            disabled={adminPostsStatus.type === "loading"}
                                          >
                                            {post.shorts_hidden
                                              ? "Show in Shorts"
                                              : "Hide from Shorts"}
                                          </button>
                                        ) : null}
                                        <button
                                          className="userPostDelete"
                                          type="button"
                                          onClick={() => handleAdminDeletePost(post)}
                                          disabled={adminPostsStatus.type === "loading"}
                                        >
                                          {strings.userPostDelete}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
  );
}
