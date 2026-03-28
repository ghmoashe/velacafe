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

type LanguageLevel = "" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type EventFormat = "online" | "offline";

type Status = {
  type: "idle" | "loading" | "error";
  message: string;
};

type LanguageOption = {
  label: string;
  locale: Locale;
  codes: readonly string[];
  dir?: string;
};

type SearchProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
  language_level: string | null;
  bio?: string | null;
};

type EventRecord = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
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

type SearchResults = {
  events: EventRecord[];
  organizers: SearchProfile[];
  users: SearchProfile[];
};

type SearchPageProps = {
  strings: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  runSearch: () => Promise<void> | void;
  searchStatus: Status;
  searchCity: string;
  setSearchCity: (value: string) => void;
  searchLanguage: Locale | "";
  setSearchLanguage: (value: Locale | "") => void;
  languageList: readonly LanguageOption[];
  languageLabels: Partial<Record<string, string>>;
  searchLevel: LanguageLevel;
  setSearchLevel: (value: LanguageLevel) => void;
  languageLevels: readonly Exclude<LanguageLevel, "">[];
  searchDate: string;
  setSearchDate: (value: string) => void;
  searchFormat: "" | EventFormat;
  setSearchFormat: (value: "" | EventFormat) => void;
  clearSearch: () => void;
  searchTouched: boolean;
  searchResults: SearchResults;
  searchEventProfiles: Record<string, SearchProfile>;
  isSupportedLocale: (value: string) => boolean;
  formatEventLevelRange: (event: EventRecord) => string;
  formatEventDurationLabel: (minutes: number | null | undefined, unitLabel: string) => string;
  formatEventPricing: (event: EventRecord, locale: Locale, text: EventPricingText) => string;
  eventPricingText: EventPricingText;
  locale: Locale;
  formatDate: (value: string, locale: Locale) => string;
  formatEventTime: (value: string | null | undefined) => string;
  goToEvent: (id: string) => void;
  organizerFollowMap: Record<string, boolean>;
  organizerFollowLoading: Record<string, boolean>;
  organizerFollowerCounts: Record<string, number>;
  goToOrganizer: (id: string) => void;
  handleToggleOrganizerFollow: (
    organizerId: string,
    options?: { route: Route; eventId?: string; organizerId?: string }
  ) => Promise<void> | void;
  guestMode: boolean;
  sessionUserId: string | null;
};

export default function SearchPage(props: SearchPageProps) {
  const {
    strings,
    searchQuery,
    setSearchQuery,
    runSearch,
    searchStatus,
    searchCity,
    setSearchCity,
    searchLanguage,
    setSearchLanguage,
    languageList,
    languageLabels,
    searchLevel,
    setSearchLevel,
    languageLevels,
    searchDate,
    setSearchDate,
    searchFormat,
    setSearchFormat,
    clearSearch,
    searchTouched,
    searchResults,
    searchEventProfiles,
    isSupportedLocale,
    formatEventLevelRange,
    formatEventDurationLabel,
    formatEventPricing,
    eventPricingText,
    locale,
    formatDate,
    formatEventTime,
    goToEvent,
    organizerFollowMap,
    organizerFollowLoading,
    organizerFollowerCounts,
    goToOrganizer,
    handleToggleOrganizerFollow,
    guestMode,
    sessionUserId,
  } = props;

  return (
              <div className="searchPage">
                <div className="searchHeader">
                  <div className="searchTitle">{strings.searchTitle}</div>
                  <div className="searchSubtitle">{strings.searchSubtitle}</div>
                </div>
                <div className="searchCard">
                  <div className="searchInputRow">
                    <input
                      className="input"
                      type="search"
                      placeholder={strings.searchPlaceholder}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                    <button
                      className="searchApply"
                      type="button"
                      onClick={runSearch}
                      disabled={searchStatus.type === "loading"}
                    >
                      {strings.searchApply}
                    </button>
                  </div>
                  <div className="searchFiltersGrid">
                    <div className="field">
                      <label className="label" htmlFor="searchCity">
                        {strings.searchCityLabel}
                      </label>
                      <input
                        className="input"
                        id="searchCity"
                        type="text"
                        value={searchCity}
                        onChange={(event) => setSearchCity(event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="searchLanguage">
                        {strings.searchLanguageLabel}
                      </label>
                      <select
                        className="input"
                        id="searchLanguage"
                        value={searchLanguage}
                        onChange={(event) =>
                          setSearchLanguage(event.target.value as Locale | "")
                        }
                      >
                        <option value="">
                          {strings.profileLanguagePlaceholder}
                        </option>
                          {languageList.map((lang) => {
                          const translatedLabel =
                            languageLabels[lang.locale] ?? lang.label;
                          return (
                            <option key={lang.locale} value={lang.locale}>
                              {translatedLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="searchLevel">
                        {strings.searchLevelLabel}
                      </label>
                      <select
                        className="input"
                        id="searchLevel"
                        value={searchLevel}
                        onChange={(event) =>
                          setSearchLevel(event.target.value as LanguageLevel)
                        }
                      >
                        <option value="">
                          {strings.searchLevelLabel}
                        </option>
                        {languageLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="searchDate">
                        {strings.searchDateLabel}
                      </label>
                      <input
                        className="input"
                        id="searchDate"
                        type="date"
                        value={searchDate}
                        onChange={(event) => setSearchDate(event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="searchFormat">
                        {strings.eventFormatLabel}
                      </label>
                      <select
                        className="input"
                        id="searchFormat"
                        value={searchFormat}
                        onChange={(event) =>
                          setSearchFormat(event.target.value as "" | EventFormat)
                        }
                      >
                        <option value="">{strings.eventFormatLabel}</option>
                        <option value="online">{strings.eventFormatOnline}</option>
                        <option value="offline">{strings.eventFormatOffline}</option>
                      </select>
                    </div>
                  </div>
                  <div className="searchActions">
                    <button className="btn" type="button" onClick={clearSearch}>
                      {strings.searchClear}
                    </button>
                  </div>
                </div>
                {searchStatus.type === "loading" ? (
                  <div
                    className="authStatus authStatus--loading"
                    role="status"
                    aria-live="polite"
                  >
                    {strings.loadingLabel}
                  </div>
                ) : null}
                {searchStatus.type === "error" ? (
                  <div
                    className="authStatus authStatus--error"
                    role="status"
                    aria-live="polite"
                  >
                    {searchStatus.message}
                  </div>
                ) : null}
                {searchTouched ? (
                  <div className="searchResults">
                    <div className="searchSection">
                      <div className="searchSectionTitle">
                        {strings.searchSectionEvents}
                      </div>
                      {searchResults.events.length === 0 ? (
                        <div className="searchEmpty">{strings.searchEmpty}</div>
                      ) : (
                        <div className="searchEventList">
                        {searchResults.events.map((event) => {
                            const organizer =
                              event.organizer_id && searchEventProfiles[event.organizer_id]
                                ? searchEventProfiles[event.organizer_id]
                                : null;
                            const organizerName =
                              organizer?.full_name || strings.profileHeaderNameFallback;
                            const organizerCity = organizer?.city ?? "";
                            const eventLanguage =
                              event.language && isSupportedLocale(event.language)
                                ? languageLabels[event.language] ?? event.language
                                : event.language ?? "";
                            const levelLabel = formatEventLevelRange(event);
                            const durationLabel = formatEventDurationLabel(
                              event.duration_minutes,
                              strings.eventDurationUnit
                            );
                            const paymentLabel = formatEventPricing(
                              event,
                              locale,
                              eventPricingText
                            );
                            const participantsLabel =
                              typeof event.max_participants === "number" &&
                              Number.isFinite(event.max_participants) &&
                              event.max_participants > 0
                                ? `${eventPricingText.participantsLabel}: ${event.max_participants}`
                                : "";
                            const timeLabel = formatEventTime(event.event_time);
                            const eventMeta = [
                              event.event_date
                                ? formatDate(event.event_date, locale)
                                : "",
                              timeLabel,
                              durationLabel,
                              organizerName,
                              event.city || organizerCity,
                              eventLanguage,
                              levelLabel,
                              paymentLabel,
                              participantsLabel,
                              event.format === "online"
                                ? strings.eventFormatOnline
                                : event.format === "offline"
                                  ? strings.eventFormatOffline
                                  : "",
                            ].filter(Boolean);
                            const eventImageUrl =
                              event.image_urls?.[0] ?? event.image_url ?? null;
                            return (
                              <button
                                key={event.id}
                                className="searchEventCard"
                                type="button"
                                onClick={() => goToEvent(event.id)}
                              >
                                <div className="searchEventMedia">
                                  {eventImageUrl ? (
                                    <img
                                      src={eventImageUrl}
                                      alt={event.title}
                                    />
                                  ) : (
                                    <div className="searchEventPlaceholder" />
                                  )}
                                </div>
                                <div className="searchEventInfo">
                                  <div className="searchEventTitle">
                                    {event.title}
                                  </div>
                                  {eventMeta.length ? (
                                    <div className="searchEventMeta">
                                      {eventMeta.join(" • ")}
                                    </div>
                                  ) : null}
                                  {event.description ? (
                                    <div className="searchEventDesc">
                                      {event.description}
                                    </div>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="searchSection">
                      <div className="searchSectionTitle">
                        {strings.searchSectionOrganizers}
                      </div>
                      {searchResults.organizers.length === 0 ? (
                        <div className="searchEmpty">{strings.searchEmpty}</div>
                      ) : (
                        <div className="searchProfileGrid">
                          {searchResults.organizers.map((profile) => {
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
                            const canFollowOrganizer =
                              Boolean(profile.id) &&
                              profile.id !== sessionUserId;
                            const isFollowing =
                              organizerFollowMap[profile.id] === true;
                            const isFollowLoading =
                              organizerFollowLoading[profile.id] === true;
                            const followersCount =
                              organizerFollowerCounts[profile.id] ?? 0;
                            const openOrganizer = () => {
                              if (!profile.id) return;
                              goToOrganizer(profile.id);
                            };
                            return (
                              <div
                                key={profile.id}
                                className="searchProfileCard searchProfileCard--clickable"
                                role="button"
                                tabIndex={0}
                                onClick={openOrganizer}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openOrganizer();
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
                                  <div className="searchProfileFollowers">
                                    {strings.userStatsFollowers}: {followersCount}
                                  </div>
                                  {profile.bio ? (
                                    <div className="searchProfileBio">
                                      {profile.bio}
                                    </div>
                                  ) : null}
                                </div>
                                {canFollowOrganizer ? (
                                  <div className="searchProfileActions">
                                    <button
                                      className={`btn${
                                        isFollowing ? " btnActive" : ""
                                      }`}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleToggleOrganizerFollow(profile.id, {
                                          route: "search",
                                        });
                                      }}
                                      disabled={isFollowLoading}
                                    >
                                      {isFollowing
                                        ? strings.userActionUnfollow
                                        : strings.userActionFollow}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {!guestMode ? (
                      <div className="searchSection">
                      <div className="searchSectionTitle">
                        {strings.searchSectionUsers}
                      </div>
                      {searchResults.users.length === 0 ? (
                        <div className="searchEmpty">{strings.searchEmpty}</div>
                      ) : (
                        <div className="searchProfileGrid">
                          {searchResults.users.map((profile) => {
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
                                  {profile.bio ? (
                                    <div className="searchProfileBio">
                                      {profile.bio}
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
                  </div>
                ) : null}
              </div>
  );
}
