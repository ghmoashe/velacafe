import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";

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

type LanguageLevel = "" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type EventFormat = "online" | "offline";

type Status = {
  type: "idle" | "loading" | "error";
  message: string;
};

type SuccessStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

type SearchProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type EventRecord = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  online_url?: string | null;
  address?: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
  language_level: string | null;
  language_level_min?: LanguageLevel | null;
  language_level_max?: LanguageLevel | null;
  event_date: string | null;
  event_time?: string | null;
  duration_minutes?: number | null;
  is_paid?: boolean | null;
  price_amount?: number | null;
  max_participants?: number | null;
  format: EventFormat | null;
  created_at: string;
};

type EventRsvpRecord = {
  user_id: string;
  status: "going" | "interested";
  check_in_token?: string | null;
  checked_in_at?: string | null;
};

type EventPricingText = {
  paymentTypeLabel: string;
  paymentTypePlaceholder: string;
  paymentTypeFree: string;
  paymentTypePaid: string;
  priceLabel: string;
  pricePlaceholder: string;
  participantsLabel: string;
  participantsPlaceholder: string;
};

type EventCheckInText = {
  myQrTitle: string;
  myQrHint: string;
  myQrCodeLabel: string;
  qrCheckInTitle: string;
  qrCheckInHint: string;
  qrInputPlaceholder: string;
  qrCheckInSubmit: string;
  qrScanFromPhoto: string;
  qrCheckedInBadge: string;
  qrNotCheckedInBadge: string;
  qrMarkButton: string;
  qrUnmarkButton: string;
};

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

type EventDetailPageProps = {
  strings: Record<string, string>;
  eventDetailsStatus: Status;
  eventDetails: EventRecord | null;
  eventDetailImageUrl: string | null;
  eventDetailImages: string[];
  eventDetailSlideIndex: number;
  setEventDetailSlideIndex: Dispatch<SetStateAction<number>>;
  formatEventPricing: (event: EventRecord, locale: Locale, pricingText: EventPricingText) => string;
  locale: Locale;
  eventPricingText: EventPricingText;
  formatDate: (value: string, locale: Locale) => string;
  formatEventTime: (value: string | null | undefined) => string;
  formatEventDurationLabel: (minutes: number | null | undefined, unitLabel: string) => string;
  isSupportedLocale: (value: string) => boolean;
  languageLabels: Partial<Record<string, string>>;
  formatEventLevelRange: (event: EventRecord) => string;
  eventOrganizer: SearchProfile | null;
  goToOrganizer: (id: string) => void;
  organizerFollowerCounts: Record<string, number>;
  formatPriceEur: (value: number | null | undefined, locale: Locale) => string;
  eventRsvpStatus: "going" | "interested" | null;
  handleEventRsvp: (status: "going" | "interested") => Promise<void> | void;
  eventRsvpLoading: boolean;
  organizerFollowMap: Record<string, boolean>;
  handleToggleOrganizerFollow: (organizerId: string, intent?: { route: Route; eventId?: string; organizerId?: string }) => Promise<void> | void;
  organizerFollowLoading: Record<string, boolean>;
  currentEventCheckInQrUrl: string | null;
  canManageEventCheckIn: boolean;
  eventCheckInText: EventCheckInText;
  currentEventRsvp: EventRsvpRecord | null | undefined;
  handleEventCheckInSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  eventCheckInCode: string;
  setEventCheckInCode: (value: string) => void;
  eventCheckInLoading: boolean;
  handleEventCheckInScanFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  eventQrScanLoading: boolean;
  eventCheckInStatus: SuccessStatus;
  sortedEventRsvps: EventRsvpRecord[];
  eventRsvpProfiles: Record<string, SearchProfile>;
  eventGoingCount: number;
  eventInterestedCount: number;
  eventCheckedInCount: number;
  eventCheckInUpdating: Record<string, boolean>;
  updateEventParticipantCheckIn: (userId: string, checkedIn: boolean) => Promise<void> | void;
  sessionUserId: string | null;
};

export default function EventDetailPage(props: EventDetailPageProps) {
  const {
    strings,
    eventDetailsStatus,
    eventDetails,
    eventDetailImageUrl,
    eventDetailImages,
    eventDetailSlideIndex,
    setEventDetailSlideIndex,
    formatEventPricing,
    locale,
    eventPricingText,
    formatDate,
    formatEventTime,
    formatEventDurationLabel,
    isSupportedLocale,
    languageLabels,
    formatEventLevelRange,
    eventOrganizer,
    goToOrganizer,
    organizerFollowerCounts,
    formatPriceEur,
    eventRsvpStatus,
    handleEventRsvp,
    eventRsvpLoading,
    organizerFollowMap,
    handleToggleOrganizerFollow,
    organizerFollowLoading,
    currentEventCheckInQrUrl,
    canManageEventCheckIn,
    eventCheckInText,
    currentEventRsvp,
    handleEventCheckInSubmit,
    eventCheckInCode,
    setEventCheckInCode,
    eventCheckInLoading,
    handleEventCheckInScanFile,
    eventQrScanLoading,
    eventCheckInStatus,
    sortedEventRsvps,
    eventRsvpProfiles,
    eventGoingCount,
    eventInterestedCount,
    eventCheckedInCount,
    eventCheckInUpdating,
    updateEventParticipantCheckIn,
    sessionUserId,
  } = props;

  return (
              <div className="eventDetailPage">
                <div className="eventDetailHeader">
                  <div className="eventDetailTitle">
                    {strings.eventDetailsTitle}
                  </div>
                </div>
                {eventDetailsStatus.type === "loading" ? (
                  <div
                    className="authStatus authStatus--loading"
                    role="status"
                    aria-live="polite"
                  >
                    {strings.loadingLabel}
                  </div>
                ) : null}
                {eventDetailsStatus.type === "error" ? (
                  <div
                    className="authStatus authStatus--error"
                    role="status"
                    aria-live="polite"
                  >
                    {eventDetailsStatus.message}
                  </div>
                ) : null}
                {eventDetails ? (
                  <div className="eventDetailCard">
                    <div className="eventDetailMedia">
                      {eventDetailImageUrl ? (
                        <img
                          src={eventDetailImageUrl}
                          alt={eventDetails.title}
                        />
                      ) : (
                        <div className="searchEventPlaceholder" />
                      )}
                      {eventDetailImages.length > 1 ? (
                        <>
                          <button
                            className="eventDetailNav eventDetailNav--prev"
                            type="button"
                            onClick={() =>
                              setEventDetailSlideIndex((prev) =>
                                prev === 0
                                  ? eventDetailImages.length - 1
                                  : prev - 1
                              )
                            }
                            aria-label="Previous image"
                          >
                            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                              <path
                                d="M15 6l-6 6 6 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            className="eventDetailNav eventDetailNav--next"
                            type="button"
                            onClick={() =>
                              setEventDetailSlideIndex((prev) =>
                                prev === eventDetailImages.length - 1
                                  ? 0
                                  : prev + 1
                              )
                            }
                            aria-label="Next image"
                          >
                            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                              <path
                                d="M9 6l6 6-6 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <div className="eventDetailDots">
                            {eventDetailImages.map((_, index) => (
                              <button
                                key={`event-dot-${index}`}
                                className={`eventDetailDot${
                                  index === eventDetailSlideIndex
                                    ? " eventDetailDot--active"
                                    : ""
                                }`}
                                type="button"
                                onClick={() => setEventDetailSlideIndex(index)}
                                aria-label={`Image ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="eventDetailBody">
                      {(() => {
                        const eventPaymentLabel = formatEventPricing(
                          eventDetails,
                          locale,
                          eventPricingText
                        );
                        const eventParticipantsLabel =
                          typeof eventDetails.max_participants === "number" &&
                          Number.isFinite(eventDetails.max_participants) &&
                          eventDetails.max_participants > 0
                            ? `${eventPricingText.participantsLabel}: ${eventDetails.max_participants}`
                            : "";
                        return (
                          <>
                      <div className="eventDetailHeadline">
                        {eventDetails.title}
                      </div>
                      <div className="eventDetailMeta">
                        {[
                          eventDetails.event_date
                            ? formatDate(eventDetails.event_date, locale)
                            : "",
                          formatEventTime(eventDetails.event_time),
                          formatEventDurationLabel(
                            eventDetails.duration_minutes,
                            strings.eventDurationUnit
                          ),
                          eventDetails.city,
                          eventDetails.language &&
                          isSupportedLocale(eventDetails.language)
                            ? languageLabels[eventDetails.language] ??
                              eventDetails.language
                            : eventDetails.language ?? "",
                          formatEventLevelRange(eventDetails),
                          eventDetails.format === "online"
                            ? strings.eventFormatOnline
                            : eventDetails.format === "offline"
                              ? strings.eventFormatOffline
                              : "",
                          eventPaymentLabel,
                          eventParticipantsLabel,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                      {eventDetails.description ? (
                        <div className="eventDetailDescription">
                          {eventDetails.description}
                        </div>
                      ) : null}
                      <div className="eventDetailInfo">
                        <div className="eventDetailInfoRow">
                          <span className="eventDetailInfoLabel">
                            {strings.eventOrganizerLabel}
                          </span>
                          {eventOrganizer?.id ? (
                            <button
                              className="eventDetailInfoValue eventDetailLink eventDetailOrganizerLink"
                              type="button"
                              onClick={() => goToOrganizer(eventOrganizer.id)}
                            >
                              {eventOrganizer.full_name ??
                                strings.profileHeaderNameFallback}
                            </button>
                          ) : (
                            <span className="eventDetailInfoValue">
                              {eventOrganizer?.full_name ??
                                strings.profileHeaderNameFallback}
                            </span>
                          )}
                        </div>
                        {eventDetails.event_time ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {strings.eventTimeLabel}
                            </span>
                            <span className="eventDetailInfoValue">
                              {formatEventTime(eventDetails.event_time)}
                            </span>
                          </div>
                        ) : null}
                        {eventDetails.duration_minutes ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {strings.eventDurationLabel}
                            </span>
                            <span className="eventDetailInfoValue">
                              {formatEventDurationLabel(
                                eventDetails.duration_minutes,
                                strings.eventDurationUnit
                              )}
                            </span>
                          </div>
                        ) : null}
                        {eventDetails.is_paid ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {eventPricingText.priceLabel}
                            </span>
                            <span className="eventDetailInfoValue">
                              {formatPriceEur(eventDetails.price_amount, locale) ||
                                eventPricingText.paymentTypePaid}
                            </span>
                          </div>
                        ) : (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {eventPricingText.paymentTypeLabel}
                            </span>
                            <span className="eventDetailInfoValue">
                              {eventPricingText.paymentTypeFree}
                            </span>
                          </div>
                        )}
                        {eventDetails.max_participants ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {eventPricingText.participantsLabel}
                            </span>
                            <span className="eventDetailInfoValue">
                              {eventDetails.max_participants}
                            </span>
                          </div>
                        ) : null}
                        {eventOrganizer?.id ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {strings.userStatsFollowers}
                            </span>
                            <span className="eventDetailInfoValue">
                              {organizerFollowerCounts[eventOrganizer.id] ?? 0}
                            </span>
                          </div>
                        ) : null}
                        {eventDetails.address ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {strings.eventAddressLabel}
                            </span>
                            <span className="eventDetailInfoValue">
                              {eventDetails.address}
                            </span>
                          </div>
                        ) : null}
                        {eventDetails.online_url ? (
                          <div className="eventDetailInfoRow">
                            <span className="eventDetailInfoLabel">
                              {strings.eventOnlineLabel}
                            </span>
                            <a
                              className="eventDetailInfoValue eventDetailLink"
                              href={eventDetails.online_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {eventDetails.online_url}
                            </a>
                          </div>
                        ) : null}
                      </div>
                          </>
                        );
                      })()}
                      <div className="eventEngagementPanel">
                        <div className="eventDetailActions">
                          <button
                            className={`btn${
                              eventRsvpStatus === "going" ? " btnActive" : ""
                            }`}
                            type="button"
                            onClick={() => handleEventRsvp("going")}
                            disabled={eventRsvpLoading}
                          >
                            {strings.eventJoin}
                          </button>
                          <button
                            className={`btn${
                              eventRsvpStatus === "interested" ? " btnActive" : ""
                            }`}
                            type="button"
                            onClick={() => handleEventRsvp("interested")}
                            disabled={eventRsvpLoading}
                          >
                            {strings.eventInterested}
                          </button>
                          {eventOrganizer?.id &&
                          eventOrganizer.id !== sessionUserId ? (
                            <button
                              className={`btn${
                                organizerFollowMap[eventOrganizer.id]
                                  ? " btnActive"
                                  : ""
                              }`}
                              type="button"
                              onClick={() =>
                                handleToggleOrganizerFollow(
                                  eventOrganizer.id,
                                  {
                                    route: "event",
                                    eventId: eventDetails?.id,
                                  }
                                )
                              }
                              disabled={
                                organizerFollowLoading[eventOrganizer.id] === true
                              }
                            >
                              {organizerFollowMap[eventOrganizer.id]
                                ? strings.userActionUnfollow
                                : strings.userActionFollow}
                            </button>
                          ) : null}
                        </div>
                        {(currentEventCheckInQrUrl &&
                          eventRsvpStatus === "going") ||
                        canManageEventCheckIn ? (
                          <div className="eventCheckInGrid">
                            {currentEventCheckInQrUrl &&
                            eventRsvpStatus === "going" ? (
                              <div className="eventCheckInSelfCard">
                                <div className="eventCheckInSelfTitle">
                                  {eventCheckInText.myQrTitle}
                                </div>
                                <div className="eventCheckInSelfHint">
                                  {eventCheckInText.myQrHint}
                                </div>
                                <img
                                  className="eventCheckInSelfQr"
                                  src={currentEventCheckInQrUrl}
                                  alt={eventCheckInText.myQrTitle}
                                />
                                <div className="eventCheckInSelfCode">
                                  <span>{eventCheckInText.myQrCodeLabel}:</span>
                                  <strong>{currentEventRsvp?.check_in_token}</strong>
                                </div>
                              </div>
                            ) : null}
                            {canManageEventCheckIn ? (
                              <div className="eventCheckInManageCard">
                                <div className="eventCheckInManageTitle">
                                  {eventCheckInText.qrCheckInTitle}
                                </div>
                                <div className="eventCheckInManageHint">
                                  {eventCheckInText.qrCheckInHint}
                                </div>
                                <form
                                  className="eventCheckInManageForm"
                                  onSubmit={handleEventCheckInSubmit}
                                >
                                  <input
                                    className="input eventCheckInInput"
                                    value={eventCheckInCode}
                                    onChange={(event) =>
                                      setEventCheckInCode(event.target.value)
                                    }
                                    placeholder={eventCheckInText.qrInputPlaceholder}
                                  />
                                  <button
                                    className="btn eventCheckInSubmit"
                                    type="submit"
                                    disabled={eventCheckInLoading}
                                  >
                                    {eventCheckInText.qrCheckInSubmit}
                                  </button>
                                  <label className="eventCheckInScanLabel">
                                    {eventCheckInText.qrScanFromPhoto}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={handleEventCheckInScanFile}
                                      disabled={
                                        eventQrScanLoading || eventCheckInLoading
                                      }
                                    />
                                  </label>
                                </form>
                                {eventCheckInStatus.type === "error" ? (
                                  <div className="authStatus authStatus--error">
                                    {eventCheckInStatus.message}
                                  </div>
                                ) : null}
                                {eventCheckInStatus.type === "success" ? (
                                  <div className="authStatus authStatus--success">
                                    {eventCheckInStatus.message}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="eventParticipants">
                        <div className="eventParticipantsHeader">
                          <div className="eventParticipantsTitle">
                            {strings.eventParticipantsTitle}
                          </div>
                          <div className="eventParticipantsStats">
                            <span className="eventParticipantsBadge">
                              {strings.eventGoingLabel}: {eventGoingCount}
                            </span>
                            <span className="eventParticipantsBadge">
                              {strings.eventInterestedLabel}: {eventInterestedCount}
                            </span>
                            <span className="eventParticipantsBadge">
                              {eventCheckInText.qrCheckedInBadge}: {eventCheckedInCount}
                            </span>
                          </div>
                        </div>
                        {sortedEventRsvps.length ? (
                          <div className="eventParticipantsGrid">
                            {sortedEventRsvps.map((rsvp) => {
                              const profile = eventRsvpProfiles[rsvp.user_id];
                              const name =
                                profile?.full_name ??
                                strings.profileHeaderNameFallback;
                              const checkedIn = Boolean(rsvp.checked_in_at);
                              const statusLabel =
                                rsvp.status === "going"
                                  ? strings.eventGoingLabel
                                  : strings.eventInterestedLabel;
                              return (
                                <div
                                  key={`${rsvp.user_id}-${rsvp.status}`}
                                  className="eventParticipantCard"
                                >
                                  <div className="eventParticipantAvatar">
                                    {profile?.avatar_url ? (
                                      <img
                                        src={profile.avatar_url}
                                        alt={name}
                                      />
                                    ) : (
                                      <span>{name.trim().charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="eventParticipantInfo">
                                    <div className="eventParticipantName">
                                      {name}
                                    </div>
                                    <div className="eventParticipantStatus">
                                      {statusLabel}
                                    </div>
                                    {rsvp.status === "going" ? (
                                      <div
                                        className={`eventParticipantCheckInBadge${
                                          checkedIn
                                            ? " eventParticipantCheckInBadge--ok"
                                            : ""
                                        }`}
                                      >
                                        {checkedIn
                                          ? eventCheckInText.qrCheckedInBadge
                                          : eventCheckInText.qrNotCheckedInBadge}
                                      </div>
                                    ) : null}
                                  </div>
                                  {canManageEventCheckIn && rsvp.status === "going" ? (
                                    <button
                                      className={`eventParticipantCheckInButton${
                                        checkedIn
                                          ? " eventParticipantCheckInButton--checked"
                                          : ""
                                      }`}
                                      type="button"
                                      disabled={eventCheckInUpdating[rsvp.user_id] === true}
                                      onClick={() =>
                                        updateEventParticipantCheckIn(
                                          rsvp.user_id,
                                          !checkedIn
                                        )
                                      }
                                    >
                                      {checkedIn
                                        ? eventCheckInText.qrUnmarkButton
                                        : eventCheckInText.qrMarkButton}
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="searchEmpty">{strings.searchEmpty}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
  );
}
