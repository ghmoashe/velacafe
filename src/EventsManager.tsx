import type {
  ChangeEvent,
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";

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
type EventPaymentType = "" | "free" | "paid";
type EventRecurrence = "none" | "daily" | "monday" | "wednesday" | "thursday";
type EventDuration = 60 | 90 | 120 | "";

type Status = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
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

type EventScheduleText = {
  recurrenceLabel: string;
  recurrencePlaceholder: string;
  recurrenceDaily: string;
  recurrenceMonday: string;
  recurrenceWednesday: string;
  recurrenceThursday: string;
  recurrenceHint: string;
  recurrenceCountLabel: string;
  recurrenceCountHint: string;
};

type EventImageEditorText = {
  editButton: string;
};

type LanguageOption = {
  label: string;
  locale: Locale;
  codes: readonly string[];
  dir?: string;
};

type LanguageLabels = Partial<Record<string, string>>;

export type EventsManagerSharedProps = {
  strings: Record<string, string>;
  profileIsOrganizer: boolean;
  handleBecomeOrganizer: () => Promise<void> | void;
  eventEditingId: string | null;
  withRequiredMark: (label: string) => ReactNode;
  eventTitle: string;
  setEventTitle: (value: string) => void;
  eventDescription: string;
  setEventDescription: (value: string) => void;
  eventImageInputRef: RefObject<HTMLInputElement | null>;
  handleEventImageChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  eventImagePreviews: string[];
  eventImageFiles: File[];
  eventImageLimit: number;
  handleStartEventImageCrop: (index: number) => void;
  eventImageEditorText: EventImageEditorText;
  handleRemoveEventImageAt: (index: number) => void;
  handleRemoveEventImage: () => void;
  eventScheduleText: EventScheduleText;
  eventRecurrence: EventRecurrence;
  handleEventRecurrenceChange: (value: EventRecurrence) => void;
  eventRecurrenceCount: string;
  setEventRecurrenceCount: (value: string) => void;
  eventRecurrenceMaxOccurrences: number;
  eventDate: string;
  setEventDate: (value: string) => void;
  eventTime: string;
  setEventTime: (value: string) => void;
  eventFormat: "" | EventFormat;
  setEventFormat: (value: "" | EventFormat) => void;
  eventDuration: EventDuration;
  setEventDuration: Dispatch<SetStateAction<EventDuration>>;
  eventDurations: readonly Exclude<EventDuration, "">[];
  eventPaymentType: EventPaymentType;
  handleEventPaymentTypeChange: (value: EventPaymentType) => void;
  eventPricingText: EventPricingText;
  eventMaxParticipants: string;
  setEventMaxParticipants: (value: string) => void;
  eventPrice: string;
  setEventPrice: (value: string) => void;
  eventCity: string;
  setEventCity: (value: string) => void;
  eventAddress: string;
  setEventAddress: (value: string) => void;
  eventCountry: string;
  setEventCountry: (value: string) => void;
  eventLanguage: Locale | "";
  setEventLanguage: (value: Locale | "") => void;
  languageList: readonly LanguageOption[];
  languageLabels: LanguageLabels;
  eventLevelFrom: LanguageLevel;
  handleEventLevelFromChange: (value: LanguageLevel) => void;
  eventLevelTo: LanguageLevel;
  handleEventLevelToChange: (value: LanguageLevel) => void;
  languageLevels: readonly Exclude<LanguageLevel, "">[];
  eventOnlineUrl: string;
  setEventOnlineUrl: (value: string) => void;
  eventStatus: Status;
  handleSaveEvent: () => Promise<void> | void;
  canManageEvents: boolean;
  resetEventForm: () => void;
  eventsList: EventRecord[];
  formatEventLevelRange: (event: EventRecord) => string;
  formatEventDurationLabel: (minutes: number | null | undefined, unitLabel: string) => string;
  locale: Locale;
  formatEventPricing: (event: EventRecord, locale: Locale, text: EventPricingText) => string;
  formatEventTime: (value: string | null | undefined) => string;
  formatDate: (value: string, locale: Locale) => string;
  isSupportedLocale: (value: string) => boolean;
  goToEvent: (id: string) => void;
  handleEditEvent: (event: EventRecord) => Promise<void> | void;
  handleDeleteEvent: (event: EventRecord) => Promise<void> | void;
};

type EventsManagerProps = EventsManagerSharedProps & {
  showOrganizerHint: boolean;
  showEditor: boolean;
  canEditItems: boolean;
  listTitle: string;
  emptyLabel: string;
};

export default function EventsManager(props: EventsManagerProps) {
  const {
    showOrganizerHint,
    showEditor,
    canEditItems,
    listTitle,
    emptyLabel,
    strings,
    profileIsOrganizer,
    handleBecomeOrganizer,
    eventEditingId,
    withRequiredMark,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventImageInputRef,
    handleEventImageChange,
    eventImagePreviews,
    eventImageFiles,
    eventImageLimit,
    handleStartEventImageCrop,
    eventImageEditorText,
    handleRemoveEventImageAt,
    handleRemoveEventImage,
    eventScheduleText,
    eventRecurrence,
    handleEventRecurrenceChange,
    eventRecurrenceCount,
    setEventRecurrenceCount,
    eventRecurrenceMaxOccurrences,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    eventFormat,
    setEventFormat,
    eventDuration,
    setEventDuration,
    eventDurations,
    eventPaymentType,
    handleEventPaymentTypeChange,
    eventPricingText,
    eventMaxParticipants,
    setEventMaxParticipants,
    eventPrice,
    setEventPrice,
    eventCity,
    setEventCity,
    eventAddress,
    setEventAddress,
    eventCountry,
    setEventCountry,
    eventLanguage,
    setEventLanguage,
    languageList,
    languageLabels,
    eventLevelFrom,
    handleEventLevelFromChange,
    eventLevelTo,
    handleEventLevelToChange,
    languageLevels,
    eventOnlineUrl,
    setEventOnlineUrl,
    eventStatus,
    handleSaveEvent,
    canManageEvents,
    resetEventForm,
    eventsList,
    formatEventLevelRange,
    formatEventDurationLabel,
    locale,
    formatEventPricing,
    formatEventTime,
    formatDate,
    isSupportedLocale,
    goToEvent,
    handleEditEvent,
    handleDeleteEvent,
  } = props;

  return (
    <>
      {showOrganizerHint && !profileIsOrganizer ? (
        <div className="eventsHint">
          <div className="eventsHintText">{strings.userActionOrganizer}</div>
          <button className="btn" type="button" onClick={handleBecomeOrganizer}>
            {strings.userActionOrganizer}
          </button>
        </div>
      ) : null}
      {showEditor ? (
        <div className="eventsCard">
          <div className="eventsCardTitle">
            {eventEditingId ? strings.eventEdit : strings.eventCreateTitle}
          </div>
          <div className="eventsForm">
            <div className="field">
              <label className="label" htmlFor="eventTitle">
                {withRequiredMark(strings.eventNameLabel)}
              </label>
              <input
                className="input"
                id="eventTitle"
                type="text"
                required
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="eventDescription">
                {withRequiredMark(strings.eventDescriptionLabel)}
              </label>
              <textarea
                className="input eventsTextarea"
                id="eventDescription"
                required
                value={eventDescription}
                onChange={(event) => setEventDescription(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="eventImage">
                {strings.eventImageLabel}
              </label>
              <input
                ref={eventImageInputRef}
                className="input"
                id="eventImage"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif"
                multiple
                onChange={handleEventImageChange}
              />
              <span className="fieldHint">
                {strings.eventImageHint} (max {eventImageLimit})
              </span>
              {eventImagePreviews.length ? (
                <div className="eventImageWrap">
                  <div className="eventImageGrid">
                    {eventImagePreviews.map((preview, index) => (
                      <div key={`${preview}-${index}`} className="eventImageItem">
                        <img
                          className="eventImagePreview"
                          src={preview}
                          alt={strings.eventImageLabel}
                        />
                        {eventImageFiles.length > 0 ? (
                          <button
                            className="eventImageEditOne"
                            type="button"
                            onClick={() => handleStartEventImageCrop(index)}
                            aria-label={eventImageEditorText.editButton}
                          >
                            {eventImageEditorText.editButton}
                          </button>
                        ) : null}
                        <button
                          className="eventImageRemoveOne"
                          type="button"
                          onClick={() => handleRemoveEventImageAt(index)}
                          aria-label={strings.eventImageRemove}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btnGhost eventImageRemove"
                    type="button"
                    onClick={handleRemoveEventImage}
                  >
                    {strings.eventImageRemove}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="eventsGrid">
              <div className="field">
                <label className="label" htmlFor="eventRecurrence">
                  {eventScheduleText.recurrenceLabel}
                </label>
                <select
                  className="input"
                  id="eventRecurrence"
                  value={eventRecurrence}
                  onChange={(event) =>
                    handleEventRecurrenceChange(
                      event.target.value as EventRecurrence
                    )
                  }
                >
                  <option value="none">
                    {eventScheduleText.recurrencePlaceholder}
                  </option>
                  <option value="daily">
                    {eventScheduleText.recurrenceDaily}
                  </option>
                  <option value="monday">
                    {eventScheduleText.recurrenceMonday}
                  </option>
                  <option value="wednesday">
                    {eventScheduleText.recurrenceWednesday}
                  </option>
                  <option value="thursday">
                    {eventScheduleText.recurrenceThursday}
                  </option>
                </select>
                {eventRecurrence !== "none" ? (
                  <span className="fieldHint">
                    {eventScheduleText.recurrenceHint}
                  </span>
                ) : null}
              </div>
              {!eventEditingId && eventRecurrence !== "none" ? (
                <div className="field">
                  <label className="label" htmlFor="eventRecurrenceCount">
                    {withRequiredMark(eventScheduleText.recurrenceCountLabel)}
                  </label>
                  <input
                    className="input"
                    id="eventRecurrenceCount"
                    type="number"
                    required
                    min={1}
                    max={eventRecurrenceMaxOccurrences}
                    step={1}
                    inputMode="numeric"
                    value={eventRecurrenceCount}
                    onChange={(event) =>
                      setEventRecurrenceCount(event.target.value)
                    }
                  />
                  <span className="fieldHint">
                    {eventScheduleText.recurrenceCountHint}
                  </span>
                </div>
              ) : null}
              <div className="field">
                <label className="label" htmlFor="eventDate">
                  {withRequiredMark(strings.searchDateLabel)}
                </label>
                <input
                  className="input"
                  id="eventDate"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="eventTime">
                  {withRequiredMark(strings.eventTimeLabel)}
                </label>
                <input
                  className="input"
                  id="eventTime"
                  type="time"
                  required
                  value={eventTime}
                  onChange={(event) => setEventTime(event.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="eventFormat">
                  {withRequiredMark(strings.eventFormatLabel)}
                </label>
                <select
                  className="input"
                  id="eventFormat"
                  required
                  value={eventFormat}
                  onChange={(event) =>
                    setEventFormat(event.target.value as "" | EventFormat)
                  }
                >
                  <option value="">{strings.eventFormatLabel}</option>
                  <option value="online">{strings.eventFormatOnline}</option>
                  <option value="offline">{strings.eventFormatOffline}</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="eventDuration">
                  {withRequiredMark(strings.eventDurationLabel)}
                </label>
                <select
                  className="input"
                  id="eventDuration"
                  required
                  value={eventDuration}
                  onChange={(event) =>
                    setEventDuration(
                      event.target.value
                        ? (Number(event.target.value) as EventDuration)
                        : ""
                    )
                  }
                >
                  <option value="">{strings.eventDurationLabel}</option>
                  {eventDurations.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} {strings.eventDurationUnit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="eventPaymentType">
                  {withRequiredMark(eventPricingText.paymentTypeLabel)}
                </label>
                <select
                  className="input"
                  id="eventPaymentType"
                  required
                  value={eventPaymentType}
                  onChange={(event) =>
                    handleEventPaymentTypeChange(
                      event.target.value as EventPaymentType
                    )
                  }
                >
                  <option value="">
                    {eventPricingText.paymentTypePlaceholder}
                  </option>
                  <option value="free">
                    {eventPricingText.paymentTypeFree}
                  </option>
                  <option value="paid">
                    {eventPricingText.paymentTypePaid}
                  </option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="eventMaxParticipants">
                  {withRequiredMark(eventPricingText.participantsLabel)}
                </label>
                <input
                  className="input"
                  id="eventMaxParticipants"
                  type="number"
                  required
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder={eventPricingText.participantsPlaceholder}
                  value={eventMaxParticipants}
                  onChange={(event) =>
                    setEventMaxParticipants(event.target.value)
                  }
                />
              </div>
              {eventPaymentType === "paid" ? (
                <div className="field">
                  <label className="label" htmlFor="eventPrice">
                    {withRequiredMark(eventPricingText.priceLabel)}
                  </label>
                  <input
                    className="input"
                    id="eventPrice"
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    inputMode="decimal"
                    placeholder={eventPricingText.pricePlaceholder}
                    value={eventPrice}
                    onChange={(event) => setEventPrice(event.target.value)}
                  />
                </div>
              ) : null}
              <div className="field">
                <label className="label" htmlFor="eventCity">
                  {withRequiredMark(strings.profileCityLabel)}
                </label>
                <input
                  className="input"
                  id="eventCity"
                  type="text"
                  required
                  value={eventCity}
                  onChange={(event) => setEventCity(event.target.value)}
                />
              </div>
              {eventFormat === "offline" ? (
                <div className="field">
                  <label className="label" htmlFor="eventAddress">
                    {withRequiredMark(strings.eventAddressLabel)}
                  </label>
                  <input
                    className="input"
                    id="eventAddress"
                    type="text"
                    required
                    value={eventAddress}
                    onChange={(event) => setEventAddress(event.target.value)}
                  />
                </div>
              ) : null}
              <div className="field">
                <label className="label" htmlFor="eventCountry">
                  {withRequiredMark(strings.profileCountryLabel)}
                </label>
                <input
                  className="input"
                  id="eventCountry"
                  type="text"
                  required
                  value={eventCountry}
                  onChange={(event) => setEventCountry(event.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="eventLanguage">
                  {withRequiredMark(strings.searchLanguageLabel)}
                </label>
                <select
                  className="input"
                  id="eventLanguage"
                  required
                  value={eventLanguage}
                  onChange={(event) =>
                    setEventLanguage(event.target.value as Locale | "")
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
                <label className="label" htmlFor="eventLevelFrom">
                  {withRequiredMark(strings.eventLevelFromLabel)}
                </label>
                <select
                  className="input"
                  id="eventLevelFrom"
                  required
                  value={eventLevelFrom}
                  onChange={(event) =>
                    handleEventLevelFromChange(
                      event.target.value as LanguageLevel
                    )
                  }
                >
                  <option value="">{strings.eventLevelFromLabel}</option>
                  {languageLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="eventLevelTo">
                  {withRequiredMark(strings.eventLevelToLabel)}
                </label>
                <select
                  className="input"
                  id="eventLevelTo"
                  required
                  value={eventLevelTo}
                  onChange={(event) =>
                    handleEventLevelToChange(
                      event.target.value as LanguageLevel
                    )
                  }
                >
                  <option value="">{strings.eventLevelToLabel}</option>
                  {languageLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              {eventFormat === "online" ? (
                <div className="field">
                  <label className="label" htmlFor="eventOnlineUrl">
                    {withRequiredMark(strings.eventOnlineLabel)}
                  </label>
                  <input
                    className="input"
                    id="eventOnlineUrl"
                    type="url"
                    required
                    value={eventOnlineUrl}
                    onChange={(event) => setEventOnlineUrl(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
            {eventStatus.type !== "idle" ? (
              <div
                className={`authStatus authStatus--${eventStatus.type}`}
                role="status"
                aria-live="polite"
              >
                {eventStatus.type === "success"
                  ? strings.eventSaved
                  : eventStatus.message}
              </div>
            ) : null}
            <div className="eventsActions">
              <button
                className="eventsSave"
                type="button"
                onClick={handleSaveEvent}
                disabled={eventStatus.type === "loading" || !canManageEvents}
              >
                {eventStatus.type === "loading"
                  ? strings.loadingLabel
                  : eventEditingId
                    ? strings.eventUpdate
                    : strings.eventSave}
              </button>
              {eventEditingId ? (
                <button
                  className="btn btnGhost eventsCancel"
                  type="button"
                  onClick={resetEventForm}
                  disabled={eventStatus.type === "loading"}
                >
                  {strings.eventCancelEdit}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <div className="eventsList">
        <div className="eventsListTitle">{listTitle}</div>
        {eventsList.length === 0 ? (
          <div className="searchEmpty">{emptyLabel}</div>
        ) : (
          <div className="eventsGridList">
            {eventsList.map((event) => {
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
              const meta = [
                event.event_date ? formatDate(event.event_date, locale) : "",
                timeLabel,
                event.city,
                event.language && isSupportedLocale(event.language)
                  ? languageLabels[event.language] ?? event.language
                  : event.language ?? "",
                levelLabel,
                durationLabel,
                paymentLabel,
                participantsLabel,
                event.format === "online"
                  ? strings.eventFormatOnline
                  : event.format === "offline"
                    ? strings.eventFormatOffline
                    : "",
              ].filter(Boolean);
              const details = [
                event.address
                  ? {
                      label: strings.eventAddressLabel,
                      value: event.address,
                      isLink: false,
                    }
                  : null,
                event.online_url
                  ? {
                      label: strings.eventOnlineLabel,
                      value: event.online_url,
                      isLink: true,
                    }
                  : null,
              ].filter(Boolean) as {
                label: string;
                value: string;
                isLink: boolean;
              }[];
              const eventImageUrl =
                event.image_urls?.[0] ?? event.image_url ?? null;

              return (
                <div
                  key={event.id}
                  className={`eventCard${
                    canEditItems && eventEditingId === event.id
                      ? " eventCard--editing"
                      : ""
                  }`}
                >
                  <div className="eventCardMedia">
                    {eventImageUrl ? (
                      <img src={eventImageUrl} alt={event.title} />
                    ) : (
                      <div className="eventCardPlaceholder" />
                    )}
                  </div>
                  <div className="eventCardBody">
                    <div className="eventCardTitle">{event.title}</div>
                    {meta.length ? (
                      <div className="eventCardMeta">{meta.join(" • ")}</div>
                    ) : null}
                    {event.description ? (
                      <div className="eventCardDesc">{event.description}</div>
                    ) : null}
                    {details.length ? (
                      <div className="eventCardDetails">
                        {details.map((detail) => (
                          <div
                            key={`${detail.label}-${detail.value}`}
                            className="eventCardDetail"
                          >
                            <span className="eventCardDetailLabel">
                              {detail.label}:
                            </span>
                            {detail.isLink ? (
                              <a
                                className="eventCardLink"
                                href={detail.value}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {detail.value}
                              </a>
                            ) : (
                              <span className="eventCardDetailValue">
                                {detail.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="eventCardActions">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => goToEvent(event.id)}
                      >
                        {strings.eventView}
                      </button>
                      {canEditItems ? (
                        <>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => handleEditEvent(event)}
                          >
                            {strings.eventEdit}
                          </button>
                          <button
                            className="btnDanger"
                            type="button"
                            onClick={() => handleDeleteEvent(event)}
                          >
                            {strings.eventDelete}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
