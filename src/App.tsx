import {
  Suspense,
  useCallback,
  useEffect,
  lazy,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  buildMuxPlaybackUrl,
  buildMuxThumbnailUrl,
  createMuxDirectUpload,
  deleteMuxAsset,
  extractMuxPlaybackId,
  uploadFileToMux,
  waitForMuxPlayback,
} from "./mux";
import {
  CHANGE_LANGUAGE_BUTTON_LABELS,
  LANGUAGE_LABELS,
  MESSAGES,
} from "./i18nData";
import { openKlaroSettings, setupKlaro } from "./klaro";
import { getMiniGamesText } from "./miniGamesText";
import { getShortsText } from "./shortsText";
import { getSupabaseClient } from "./supabaseClient";
import { getVoiceAssistantText } from "./voiceAssistantText";

const LANGUAGE_LIST = [
  { label: "Deutsch", locale: "de", codes: ["DE"] },
  { label: "English", locale: "en", codes: ["GB"] },
  { label: "Tiếng Việt", locale: "vi", codes: ["VN"] },
  { label: "Русский", locale: "ru", codes: ["RU"] },
  { label: "Українська", locale: "uk", codes: ["UA"] },
  { label: "فارسی", locale: "fa", codes: ["IR", "AF"], dir: "rtl" },
  { label: "العربية", locale: "ar", codes: ["SA", "AE", "EG"], dir: "rtl" },
  { label: "Shqip", locale: "sq", codes: ["AL"] },
  { label: "Türkçe", locale: "tr", codes: ["TR"] },
  { label: "Français", locale: "fr", codes: ["FR"] },
  { label: "Español", locale: "es", codes: ["ES"] },
  { label: "Italiano", locale: "it", codes: ["IT"] },
  { label: "Polski", locale: "pl", codes: ["PL"] },
] as const;

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const EVENT_DURATIONS = [60, 90, 120] as const;
const EVENT_IMAGE_LIMIT = 3;
const EVENT_DEFAULT_TIME = "19:00";
const EVENT_RECURRENCE_DEFAULT_OCCURRENCES = 8;
const EVENT_RECURRENCE_MAX_OCCURRENCES = 52;
const EVENT_IMAGE_CROP_SIZE = 220;
const EVENT_IMAGE_OUTPUT_SIZE = 1200;

type LanguagePref = (typeof LANGUAGE_LIST)[number];
type Locale = LanguagePref["locale"];
type LanguageLevel = (typeof LANGUAGE_LEVELS)[number] | "";
type EventDuration = (typeof EVENT_DURATIONS)[number] | "";
type EventPaymentType = "free" | "paid" | "";
type EventRecurrence = "none" | "daily" | "monday" | "wednesday" | "thursday";

const INTEREST_PRESETS = [
  {
    key: "travel",
    labels: {
      de: "Reisen",
      en: "Travel",
      ru: "Путешествия",
      uk: "Подорожі",
      fa: "سفر",
      ar: "السفر",
      sq: "Udhëtime",
      tr: "Seyahat",
      fr: "Voyage",
      es: "Viajes",
      it: "Viaggi",
      pl: "Podróże",
    },
  },
  {
    key: "music",
    labels: {
      de: "Musik",
      en: "Music",
      ru: "Музыка",
      uk: "Музика",
      fa: "موسیقی",
      ar: "الموسيقى",
      sq: "Muzikë",
      tr: "Müzik",
      fr: "Musique",
      es: "Música",
      it: "Musica",
      pl: "Muzyka",
    },
  },
  {
    key: "movies",
    labels: {
      de: "Filme",
      en: "Movies",
      ru: "Кино",
      uk: "Кіно",
      fa: "فیلم",
      ar: "الأفلام",
      sq: "Filma",
      tr: "Filmler",
      fr: "Films",
      es: "Películas",
      it: "Film",
      pl: "Filmy",
    },
  },
  {
    key: "books",
    labels: {
      de: "Bücher",
      en: "Books",
      ru: "Книги",
      uk: "Книги",
      fa: "کتاب",
      ar: "الكتب",
      sq: "Libra",
      tr: "Kitaplar",
      fr: "Livres",
      es: "Libros",
      it: "Libri",
      pl: "Książki",
    },
  },
  {
    key: "cooking",
    labels: {
      de: "Kochen",
      en: "Cooking",
      ru: "Кулинария",
      uk: "Кулінарія",
      fa: "آشپزی",
      ar: "الطبخ",
      sq: "Gatim",
      tr: "Yemek",
      fr: "Cuisine",
      es: "Cocina",
      it: "Cucina",
      pl: "Gotowanie",
    },
  },
  {
    key: "sports",
    labels: {
      de: "Sport",
      en: "Sports",
      ru: "Спорт",
      uk: "Спорт",
      fa: "ورزش",
      ar: "الرياضة",
      sq: "Sport",
      tr: "Spor",
      fr: "Sport",
      es: "Deporte",
      it: "Sport",
      pl: "Sport",
    },
  },
  {
    key: "art",
    labels: {
      de: "Kunst",
      en: "Art",
      ru: "Искусство",
      uk: "Мистецтво",
      fa: "هنر",
      ar: "الفن",
      sq: "Art",
      tr: "Sanat",
      fr: "Art",
      es: "Arte",
      it: "Arte",
      pl: "Sztuka",
    },
  },
  {
    key: "photography",
    labels: {
      de: "Fotografie",
      en: "Photography",
      ru: "Фотография",
      uk: "Фотографія",
      fa: "عکاسی",
      ar: "التصوير",
      sq: "Fotografi",
      tr: "Fotoğrafçılık",
      fr: "Photo",
      es: "Fotografía",
      it: "Fotografia",
      pl: "Fotografia",
    },
  },
  {
    key: "gaming",
    labels: {
      de: "Games",
      en: "Gaming",
      ru: "Игры",
      uk: "Ігри",
      fa: "بازی",
      ar: "الألعاب",
      sq: "Lojëra",
      tr: "Oyunlar",
      fr: "Jeux",
      es: "Juegos",
      it: "Giochi",
      pl: "Gry",
    },
  },
  {
    key: "nature",
    labels: {
      de: "Natur",
      en: "Nature",
      ru: "Природа",
      uk: "Природа",
      fa: "طبیعت",
      ar: "الطبيعة",
      sq: "Natyrë",
      tr: "Doğa",
      fr: "Nature",
      es: "Naturaleza",
      it: "Natura",
      pl: "Natura",
    },
  },
] as const;
type Route =
  | "login"
  | "register"
  | "forgot"
  | "search"
  | "games"
  | "voice"
  | "shorts"
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

type SessionUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type UserTab =
  | "about"
  | "following"
  | "photos"
  | "videos"
  | "shorts"
  | "posts"
  | "tagged";

type PostMediaType = "image" | "video" | "text";

type UserPost = {
  id: string;
  user_id?: string | null;
  media_url: string | null;
  media_type: PostMediaType;
  caption: string | null;
  created_at: string;
  cover_url?: string | null;
  mux_upload_id?: string | null;
  mux_asset_id?: string | null;
  mux_playback_id?: string | null;
  mux_asset_status?: string | null;
  mux_thumbnail_url?: string | null;
  mux_duration_seconds?: number | null;
  mux_aspect_ratio?: number | null;
  shorts_visibility?: string | null;
  shorts_hidden?: boolean | null;
  shorts_hidden_reason?: string | null;
  shorts_deleted_at?: string | null;
};

type EventFormat = "online" | "offline";

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
  recurrence_group_id?: string | null;
  recurrence_rule?: EventRecurrence | null;
  recurrence_occurrence?: number | null;
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
  checked_in_by?: string | null;
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

type ProfileRecord = {
  full_name: string | null;
  birth_date: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  avatar_url: string | null;
  language_level?: string | null;
  learning_languages?: string[] | null;
  practice_languages?: string[] | null;
  teaches_languages?: string[] | null;
  bio?: string | null;
  interests?: string[] | null;
  telegram?: string | null;
  instagram?: string | null;
  cover_url?: string | null;
  is_organizer?: boolean | null;
  is_teacher?: boolean | null;
  is_admin?: boolean | null;
  is_premium?: boolean | null;
  pinned_short_post_id?: string | null;
};

type SearchProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
  language_level: string | null;
  learning_languages?: string[] | null;
  practice_languages?: string[] | null;
  bio?: string | null;
  is_organizer?: boolean | null;
  is_teacher?: boolean | null;
  is_admin?: boolean | null;
  pinned_short_post_id?: string | null;
};

type MessageKey =
  | "brandTag"
  | "brandSub"
  | "emailPlaceholder"
  | "passwordPlaceholder"
  | "confirmPasswordPlaceholder"
  | "loginButton"
  | "registerButton"
  | "gmailButton"
  | "resetButton"
  | "forgotPassword"
  | "createAccount"
  | "backToLogin"
  | "backButton"
  | "guestButton"
  | "loadingLabel"
  | "successLogin"
  | "successRegister"
  | "successReset"
  | "errorRequired"
  | "errorPasswordShort"
  | "errorPasswordMismatch"
  | "languageSubtitle"
  | "cookieSettings"
  | "privacyButton"
  | "impressumButton"
  | "termsButton"
  | "searchButton"
  | "searchTitle"
  | "searchSubtitle"
  | "searchPlaceholder"
  | "searchCityLabel"
  | "searchLanguageLabel"
  | "searchDateLabel"
  | "searchLevelLabel"
  | "searchApply"
  | "searchClear"
  | "searchSectionEvents"
  | "searchSectionOrganizers"
  | "searchSectionUsers"
  | "searchEmpty"
  | "eventsButton"
  | "logoutButton"
  | "adminButton"
  | "adminTitle"
  | "adminSubtitle"
  | "adminTabUsers"
  | "adminTabEvents"
  | "adminTabPosts"
  | "adminRoleOrganizer"
  | "adminRoleAdmin"
  | "adminSelectUserLabel"
  | "adminSelectUserEmpty"
  | "adminMakeOrganizer"
  | "adminTabApplications"
  | "adminApplicationsEmpty"
  | "adminApplicationApprove"
  | "adminApplicationReject"
  | "adminApplicationStatusPending"
  | "adminApplicationStatusApproved"
  | "adminApplicationStatusRejected"
  | "adminOrganizerIdLabel"
  | "adminAccessDenied"
  | "adminUsersEmpty"
  | "adminEventsEmpty"
  | "adminPostsEmpty"
  | "eventsTitle"
  | "eventsSubtitle"
  | "eventCreateTitle"
  | "eventNameLabel"
  | "eventDescriptionLabel"
  | "eventFormatLabel"
  | "eventFormatOnline"
  | "eventFormatOffline"
  | "eventTimeLabel"
  | "eventDurationLabel"
  | "eventDurationUnit"
  | "eventLevelFromLabel"
  | "eventLevelToLabel"
  | "eventImageLabel"
  | "eventImageHint"
  | "eventOnlineLabel"
  | "eventAddressLabel"
  | "eventJoin"
  | "eventInterested"
  | "eventOrganizerLabel"
  | "eventDetailsTitle"
  | "eventEdit"
  | "eventUpdate"
  | "eventDelete"
  | "eventDeleteConfirm"
  | "eventImageRemove"
  | "eventCancelEdit"
  | "eventView"
  | "eventParticipantsTitle"
  | "eventGoingLabel"
  | "eventInterestedLabel"
  | "eventSave"
  | "eventSaved"
  | "eventListTitle"
  | "eventEmpty"
  | "partnersTitle"
  | "profileTitle"
  | "profileSubtitle"
  | "userPageTitle"
  | "userPageSubtitle"
  | "profileEditButton"
  | "userStatsPosts"
  | "userStatsFollowers"
  | "userStatsFollowing"
  | "userActionFollow"
  | "userActionUnfollow"
  | "userActionMessage"
  | "userTabAbout"
  | "userTabPhotos"
  | "userTabVideos"
  | "userTabShorts"
  | "userTabPosts"
  | "userTabTagged"
  | "userTabFollowing"
  | "userFollowingEmpty"
  | "userFollowingSearchPlaceholder"
  | "organizerPageTitle"
  | "organizerShortsEmpty"
  | "userPinnedShortLabel"
  | "userPinShort"
  | "userUnpinShort"
  | "organizerFollowersEmpty"
  | "userBioPlaceholder"
  | "userActionOrganizer"
  | "organizerApplyTitle"
  | "organizerApplySubtitle"
  | "organizerApplyTypeLabel"
  | "organizerApplyTypePerson"
  | "organizerApplyTypeOrganization"
  | "organizerApplyNameLabel"
  | "organizerApplyOrgNameLabel"
  | "organizerApplyOrgIdLabel"
  | "organizerApplyContactLabel"
  | "organizerApplyPhoneLabel"
  | "organizerApplyEmailLabel"
  | "organizerApplyWebsiteLabel"
  | "organizerApplyFacebookLabel"
  | "organizerApplyInstagramLabel"
  | "organizerApplyTiktokLabel"
  | "organizerApplyLinkedInLabel"
  | "organizerApplyLanguagesLabel"
  | "organizerApplyExperienceLabel"
  | "organizerApplyAboutLabel"
  | "organizerApplySubmit"
  | "organizerApplyCancel"
  | "organizerApplyRequired"
  | "organizerApplyRequiredHint"
  | "organizerApplyInvalidUrl"
  | "organizerApplySuccess"
  | "userPostCaptionPlaceholder"
  | "userPostPublish"
  | "userPostFileHint"
  | "userPostCoverHint"
  | "userPostCoverClear"
  | "userPostEmpty"
  | "userPostDelete"
  | "userPostDeleteConfirm"
  | "profileHeaderLabel"
  | "profileHeaderNameFallback"
  | "profileNameLabel"
  | "profileBirthLabel"
  | "profileGenderLabel"
  | "profileGenderFemale"
  | "profileGenderMale"
  | "profileGenderOther"
  | "profileCountryLabel"
  | "profileCityLabel"
  | "profileLanguageLabel"
  | "profileLanguagePlaceholder"
  | "profileLevelLabel"
  | "profileLearningLabel"
  | "profilePracticeLabel"
  | "profileBioLabel"
  | "profileBioPlaceholder"
  | "profileInterestsLabel"
  | "profileInterestsPlaceholder"
  | "profileInterestsAdd"
  | "profileInterestsSuggestions"
  | "profileSocialLabel"
  | "profileTelegramLabel"
  | "profileInstagramLabel"
  | "profileCoverLabel"
  | "profileCoverHint"
  | "profileCoverRemove"
  | "profileCoverClear"
  | "profilePhotoLabel"
  | "profilePhotoHint"
  | "profilePhotoRemove"
  | "profilePhotoClear"
  | "profilePhotoRemoveConfirm"
  | "profileSave"
  | "profileSuccess"
  | "profileAuthRequired";

function isSupportedLocale(value: string): value is Locale {
  return LANGUAGE_LIST.some((lang) => lang.locale === value);
}

function getFlagEmoji(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return code;
  const base = 127397;
  const first = normalized.charCodeAt(0) + base;
  const second = normalized.charCodeAt(1) + base;
  return String.fromCodePoint(first, second);
}

function resolveLanguageListValue(
  value: string,
  labels: Partial<Record<Locale, string>>
): string {
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.length) return value;
  if (!tokens.every((token) => isSupportedLocale(token))) return value;
  return tokens
    .map(
      (locale) =>
        labels[locale] ??
        LANGUAGE_LIST.find((lang) => lang.locale === locale)?.label ??
        locale
    )
    .join(", ");
}

function normalizeUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isAllowedSocialUrl(value: string, domains: string[]): boolean {
  if (!value) return true;
  const normalized = normalizeUrl(value);
  if (!isValidUrl(normalized)) return false;
  try {
    const hostname = new URL(normalized).hostname.replace(/^www\./, "");
    return domains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function resolveInterestLabel(value: string, locale: Locale): string {
  const preset = INTEREST_PRESETS.find((item) => item.key === value);
  if (!preset) return value;
  const labels = preset.labels as Partial<Record<Locale, string>>;
  return labels[locale] ?? preset.labels.en;
}

function matchInterestPreset(value: string, locale: Locale): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  for (const preset of INTEREST_PRESETS) {
    const labels = preset.labels as Partial<Record<Locale, string>>;
    const localized = (labels[locale] ?? preset.labels.en).toLowerCase();
    const english = preset.labels.en.toLowerCase();
    if (normalized === localized || normalized === english) {
      return preset.key;
    }
  }
  return null;
}

function formatDate(value: string, locale: Locale): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStorageObjectFromPublicUrl(
  url: string
): { bucket: string; path: string } | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const value = url.slice(index + marker.length).split("?")[0];
  const slashIndex = value.indexOf("/");
  if (slashIndex < 1) return null;
  const bucket = value.slice(0, slashIndex);
  const path = value.slice(slashIndex + 1);
  if (!bucket || !path) return null;
  return { bucket, path };
}

function isStorageBucketNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    message?: unknown;
    error?: unknown;
    statusCode?: unknown;
    status?: unknown;
  };
  const messageParts: string[] = [];
  if (typeof candidate.message === "string") {
    messageParts.push(candidate.message);
  }
  if (typeof candidate.error === "string") {
    messageParts.push(candidate.error);
  }
  const message = messageParts.join(" ").toLowerCase();
  const statusCode =
    typeof candidate.statusCode === "number"
      ? candidate.statusCode
      : typeof candidate.status === "number"
        ? candidate.status
        : null;
  return (
    message.includes("bucket not found") ||
    (message.includes("bucket") && message.includes("not found")) ||
    statusCode === 404
  );
}

function profileMatchesLanguage(profile: SearchProfile, language: Locale): boolean {
  if (!language) return true;
  if (profile.language === language) return true;
  if (Array.isArray(profile.learning_languages)) {
    if (profile.learning_languages.includes(language)) return true;
  }
  if (Array.isArray(profile.practice_languages)) {
    if (profile.practice_languages.includes(language)) return true;
  }
  return false;
}

function isLanguageLevel(
  value: string | null
): value is (typeof LANGUAGE_LEVELS)[number] {
  return Boolean(
    value &&
      LANGUAGE_LEVELS.includes(value as (typeof LANGUAGE_LEVELS)[number])
  );
}

function getLevelIndex(level: LanguageLevel | null | undefined): number {
  if (!level) return -1;
  const index = LANGUAGE_LEVELS.indexOf(
    level as (typeof LANGUAGE_LEVELS)[number]
  );
  return index;
}

function normalizeLevelRange(
  from: LanguageLevel,
  to: LanguageLevel
): { from: LanguageLevel; to: LanguageLevel } {
  let start: LanguageLevel = isLanguageLevel(from) ? from : "";
  let end: LanguageLevel = isLanguageLevel(to) ? to : "";
  if (!start && end) start = end;
  if (start && !end) end = start;
  if (start && end) {
    const startIndex = getLevelIndex(start);
    const endIndex = getLevelIndex(end);
    if (startIndex > -1 && endIndex > -1 && startIndex > endIndex) {
      [start, end] = [end, start];
    }
  }
  return { from: start, to: end };
}

function parseLevelRange(value: string | null | undefined): {
  from: LanguageLevel;
  to: LanguageLevel;
} {
  if (!value) return { from: "", to: "" };
  const trimmed = value.trim();
  if (!trimmed) return { from: "", to: "" };
  const parts = trimmed
    .split(/[-вЂ“вЂ”]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const from = isLanguageLevel(parts[0]) ? (parts[0] as LanguageLevel) : "";
    const to = isLanguageLevel(parts[1]) ? (parts[1] as LanguageLevel) : "";
    return normalizeLevelRange(from, to);
  }
  if (isLanguageLevel(trimmed)) {
    return normalizeLevelRange(trimmed as LanguageLevel, "");
  }
  return { from: "", to: "" };
}

function formatLevelRange(from: LanguageLevel, to: LanguageLevel): string {
  if (from && to && from !== to) return `${from}-${to}`;
  return from || to || "";
}

function getEventLevelRange(event: EventRecord): {
  from: LanguageLevel;
  to: LanguageLevel;
} {
  const from = isLanguageLevel(event.language_level_min ?? null)
    ? (event.language_level_min as LanguageLevel)
    : "";
  const to = isLanguageLevel(event.language_level_max ?? null)
    ? (event.language_level_max as LanguageLevel)
    : "";
  if (from || to) {
    return normalizeLevelRange(from, to);
  }
  return parseLevelRange(event.language_level);
}

function formatEventLevelRange(event: EventRecord): string {
  const range = getEventLevelRange(event);
  return formatLevelRange(range.from, range.to);
}

function formatEventDurationLabel(
  duration: number | null | undefined,
  unit: string
): string {
  if (!duration) return "";
  return `${duration} ${unit}`;
}

function formatEventTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function withRequiredMark(label: string): string {
  return `${label} *`;
}

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
  qrNotFound: string;
  qrWrongEvent: string;
  qrOnlyGoing: string;
  qrCheckInMarked: string;
  qrCheckInUnmarked: string;
  qrCheckInAlready: string;
  qrScannerUnsupported: string;
  qrScannerNoCode: string;
  qrCheckedInBadge: string;
  qrNotCheckedInBadge: string;
  qrMarkButton: string;
  qrUnmarkButton: string;
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
  recurrenceCountError: string;
};

type EventImageEditorText = {
  editButton: string;
  cropTitle: string;
  cropHint: string;
  cropApply: string;
  cropCancel: string;
};

function getEventPricingText(locale: Locale): EventPricingText {
  if (locale === "vi") {
    return {
      paymentTypeLabel: "Hình thức tham gia",
      paymentTypePlaceholder: "Hình thức tham gia",
      paymentTypeFree: "Miễn phí",
      paymentTypePaid: "Có phí",
      priceLabel: "Giá (EUR)",
      pricePlaceholder: "Ví dụ 10",
      participantsLabel: "Số lượng người tham gia",
      participantsPlaceholder: "Ví dụ 20",
    };
  }
  if (locale === "ru") {
    return {
      paymentTypeLabel: "Тип участия",
      paymentTypePlaceholder: "Тип участия",
      paymentTypeFree: "Бесплатно",
      paymentTypePaid: "Платно",
      priceLabel: "Цена (EUR)",
      pricePlaceholder: "Например 10",
      participantsLabel: "Количество участников",
      participantsPlaceholder: "Например 20",
    };
  }
  if (locale === "uk") {
    return {
      paymentTypeLabel: "Тип участі",
      paymentTypePlaceholder: "Тип участі",
      paymentTypeFree: "Безкоштовно",
      paymentTypePaid: "Платно",
      priceLabel: "Ціна (EUR)",
      pricePlaceholder: "Наприклад 10",
      participantsLabel: "Кількість учасників",
      participantsPlaceholder: "Наприклад 20",
    };
  }
  if (locale === "fa") {
    return {
      paymentTypeLabel: "نوع شرکت",
      paymentTypePlaceholder: "نوع شرکت",
      paymentTypeFree: "رایگان",
      paymentTypePaid: "پولی",
      priceLabel: "قیمت (EUR)",
      pricePlaceholder: "مثلاً 10",
      participantsLabel: "تعداد شرکت‌کنندگان",
      participantsPlaceholder: "مثلاً 20",
    };
  }
  return {
    paymentTypeLabel: "Participation type",
    paymentTypePlaceholder: "Participation type",
    paymentTypeFree: "Free",
    paymentTypePaid: "Paid",
    priceLabel: "Price (EUR)",
    pricePlaceholder: "For example 10",
    participantsLabel: "Participants limit",
    participantsPlaceholder: "For example 20",
  };
}

function getEventCheckInText(locale: Locale): EventCheckInText {
  if (locale === "vi") {
    return {
      myQrTitle: "Mã QR check-in của tôi",
      myQrHint: "Hiển thị mã QR này cho người tổ chức tại cổng vào.",
      myQrCodeLabel: "Mã",
      qrCheckInTitle: "Check-in người tham gia bằng QR",
      qrCheckInHint: "Quét QR hoặc dán mã người tham gia.",
      qrInputPlaceholder: "Dán nội dung QR hoặc mã token",
      qrCheckInSubmit: "Check-in",
      qrScanFromPhoto: "Quét từ ảnh",
      qrNotFound: "Không tìm thấy mã QR cho sự kiện này.",
      qrWrongEvent: "Mã QR này thuộc sự kiện khác.",
      qrOnlyGoing: "Chỉ check-in cho người có trạng thái Sẽ tham gia.",
      qrCheckInMarked: "Đã check-in người tham gia.",
      qrCheckInUnmarked: "Đã hủy check-in.",
      qrCheckInAlready: "Người tham gia đã được check-in.",
      qrScannerUnsupported: "Trình duyệt này không hỗ trợ quét QR.",
      qrScannerNoCode: "Không tìm thấy mã QR trong ảnh.",
      qrCheckedInBadge: "Đã check-in",
      qrNotCheckedInBadge: "Chưa check-in",
      qrMarkButton: "Đánh dấu",
      qrUnmarkButton: "Bỏ đánh dấu",
    };
  }
  if (locale === "ru") {
    return {
      myQrTitle: "Мой QR для check-in",
      myQrHint: "Покажите этот QR организатору на входе.",
      myQrCodeLabel: "Код",
      qrCheckInTitle: "QR check-in участников",
      qrCheckInHint: "Сканируйте QR или вставьте код участника.",
      qrInputPlaceholder: "Вставьте QR-код или токен",
      qrCheckInSubmit: "Отметить",
      qrScanFromPhoto: "Сканировать из фото",
      qrNotFound: "QR-код не найден для этого события.",
      qrWrongEvent: "Этот QR-код относится к другому событию.",
      qrOnlyGoing: "Check-in доступен только для статуса «Идут».",
      qrCheckInMarked: "Участник отмечен как пришедший.",
      qrCheckInUnmarked: "Отметка посещения снята.",
      qrCheckInAlready: "Участник уже отмечен.",
      qrScannerUnsupported: "Сканер QR не поддерживается в этом браузере.",
      qrScannerNoCode: "На изображении не найден QR-код.",
      qrCheckedInBadge: "Пришел",
      qrNotCheckedInBadge: "Не отмечен",
      qrMarkButton: "Отметить",
      qrUnmarkButton: "Снять",
    };
  }
  if (locale === "uk") {
    return {
      myQrTitle: "Мій QR для check-in",
      myQrHint: "Покажіть цей QR організатору на вході.",
      myQrCodeLabel: "Код",
      qrCheckInTitle: "QR check-in учасників",
      qrCheckInHint: "Скануйте QR або вставте код учасника.",
      qrInputPlaceholder: "Вставте QR-код або токен",
      qrCheckInSubmit: "Відмітити",
      qrScanFromPhoto: "Сканувати з фото",
      qrNotFound: "QR-код не знайдено для цієї події.",
      qrWrongEvent: "Цей QR-код належить іншій події.",
      qrOnlyGoing: "Check-in доступний лише для статусу «Йдуть».",
      qrCheckInMarked: "Учасника відмічено як присутнього.",
      qrCheckInUnmarked: "Відмітку відвідування знято.",
      qrCheckInAlready: "Учасника вже відмічено.",
      qrScannerUnsupported: "Сканер QR не підтримується у цьому браузері.",
      qrScannerNoCode: "На зображенні не знайдено QR-код.",
      qrCheckedInBadge: "Прийшов",
      qrNotCheckedInBadge: "Не відмічено",
      qrMarkButton: "Відмітити",
      qrUnmarkButton: "Зняти",
    };
  }
  if (locale === "fa") {
    return {
      myQrTitle: "QR من برای ورود",
      myQrHint: "این QR را هنگام ورود به برگزارکننده نشان دهید.",
      myQrCodeLabel: "کد",
      qrCheckInTitle: "ثبت ورود شرکت‌کنندگان با QR",
      qrCheckInHint: "QR را اسکن کنید یا کد شرکت‌کننده را وارد کنید.",
      qrInputPlaceholder: "کد QR یا توکن را وارد کنید",
      qrCheckInSubmit: "ثبت ورود",
      qrScanFromPhoto: "اسکن از عکس",
      qrNotFound: "کد QR برای این رویداد پیدا نشد.",
      qrWrongEvent: "این کد QR مربوط به رویداد دیگری است.",
      qrOnlyGoing: "ثبت ورود فقط برای وضعیت «می‌آیند» فعال است.",
      qrCheckInMarked: "شرکت‌کننده ثبت ورود شد.",
      qrCheckInUnmarked: "ثبت ورود لغو شد.",
      qrCheckInAlready: "این شرکت‌کننده قبلاً ثبت ورود شده است.",
      qrScannerUnsupported: "اسکنر QR در این مرورگر پشتیبانی نمی‌شود.",
      qrScannerNoCode: "در تصویر کد QR پیدا نشد.",
      qrCheckedInBadge: "حاضر",
      qrNotCheckedInBadge: "ثبت نشده",
      qrMarkButton: "ثبت",
      qrUnmarkButton: "لغو",
    };
  }
  return {
    myQrTitle: "My check-in QR",
    myQrHint: "Show this QR to the organizer at the entrance.",
    myQrCodeLabel: "Code",
    qrCheckInTitle: "Participant QR check-in",
    qrCheckInHint: "Scan a QR or paste the participant code.",
    qrInputPlaceholder: "Paste QR payload or token",
    qrCheckInSubmit: "Check in",
    qrScanFromPhoto: "Scan from photo",
    qrNotFound: "QR code not found for this event.",
    qrWrongEvent: "This QR code belongs to another event.",
    qrOnlyGoing: "Check-in is available only for users with Going status.",
    qrCheckInMarked: "Participant checked in.",
    qrCheckInUnmarked: "Check-in removed.",
    qrCheckInAlready: "Participant is already checked in.",
    qrScannerUnsupported: "QR scanner is not supported in this browser.",
    qrScannerNoCode: "No QR code found in the image.",
    qrCheckedInBadge: "Checked in",
    qrNotCheckedInBadge: "Not checked in",
    qrMarkButton: "Mark",
    qrUnmarkButton: "Unmark",
  };
}

function getEventScheduleText(locale: Locale): EventScheduleText {
  if (locale === "ru") {
    return {
      recurrenceLabel: "Повторение",
      recurrencePlaceholder: "Без повторения",
      recurrenceDaily: "Каждый день",
      recurrenceMonday: "Каждый понедельник",
      recurrenceWednesday: "Каждую среду",
      recurrenceThursday: "Каждый четверг",
      recurrenceHint: "Дата и время подставлены автоматически.",
      recurrenceCountLabel: "Количество событий",
      recurrenceCountHint: "Сколько отдельных событий создать в серии.",
      recurrenceCountError: `Укажите число от 1 до ${EVENT_RECURRENCE_MAX_OCCURRENCES}.`,
    };
  }
  if (locale === "uk") {
    return {
      recurrenceLabel: "Повторення",
      recurrencePlaceholder: "Без повторення",
      recurrenceDaily: "Щодня",
      recurrenceMonday: "Щопонеділка",
      recurrenceWednesday: "Щосереди",
      recurrenceThursday: "Щочетверга",
      recurrenceHint: "Дату й час підставлено автоматично.",
      recurrenceCountLabel: "Кількість подій",
      recurrenceCountHint: "Скільки окремих подій створити в серії.",
      recurrenceCountError: `Вкажіть число від 1 до ${EVENT_RECURRENCE_MAX_OCCURRENCES}.`,
    };
  }
  if (locale === "vi") {
    return {
      recurrenceLabel: "Lặp lại",
      recurrencePlaceholder: "Không lặp lại",
      recurrenceDaily: "Mỗi ngày",
      recurrenceMonday: "Mỗi thứ Hai",
      recurrenceWednesday: "Mỗi thứ Tư",
      recurrenceThursday: "Mỗi thứ Năm",
      recurrenceHint: "Ngày và giờ được điền tự động.",
      recurrenceCountLabel: "Số sự kiện",
      recurrenceCountHint: "Tạo bao nhiêu sự kiện riêng trong chuỗi này.",
      recurrenceCountError: `Nhập số từ 1 đến ${EVENT_RECURRENCE_MAX_OCCURRENCES}.`,
    };
  }
  if (locale === "fa") {
    return {
      recurrenceLabel: "تکرار",
      recurrencePlaceholder: "بدون تکرار",
      recurrenceDaily: "هر روز",
      recurrenceMonday: "هر دوشنبه",
      recurrenceWednesday: "هر چهارشنبه",
      recurrenceThursday: "هر پنج‌شنبه",
      recurrenceHint: "تاریخ و ساعت به‌صورت خودکار تنظیم شد.",
      recurrenceCountLabel: "تعداد رویدادها",
      recurrenceCountHint: "چند رویداد جداگانه در این سری ساخته شود.",
      recurrenceCountError: `عدد بین 1 تا ${EVENT_RECURRENCE_MAX_OCCURRENCES} وارد کنید.`,
    };
  }
  return {
    recurrenceLabel: "Repeat",
    recurrencePlaceholder: "No repeat",
    recurrenceDaily: "Every day",
    recurrenceMonday: "Every Monday",
    recurrenceWednesday: "Every Wednesday",
    recurrenceThursday: "Every Thursday",
    recurrenceHint: "Date and time were filled automatically.",
    recurrenceCountLabel: "Events in series",
    recurrenceCountHint: "How many separate events should be created.",
    recurrenceCountError: `Enter a number from 1 to ${EVENT_RECURRENCE_MAX_OCCURRENCES}.`,
  };
}

function getEventImageEditorText(): EventImageEditorText {
  return {
    editButton: "Crop",
    cropTitle: "Crop event image",
    cropHint: "Move and zoom the image before saving.",
    cropApply: "Apply",
    cropCancel: "Cancel",
  };
}

function formatDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDateForWeekday(weekday: number, from = new Date()): string {
  const target = new Date(from);
  target.setHours(0, 0, 0, 0);
  const offset = (weekday - target.getDay() + 7) % 7;
  target.setDate(target.getDate() + offset);
  return formatDateInputValue(target);
}

function getDateForRecurrence(
  recurrence: EventRecurrence,
  from = new Date()
): string {
  switch (recurrence) {
    case "daily":
      return formatDateInputValue(from);
    case "monday":
      return getNextDateForWeekday(1, from);
    case "wednesday":
      return getNextDateForWeekday(3, from);
    case "thursday":
      return getNextDateForWeekday(4, from);
    default:
      return "";
  }
}

function parseDateInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  const candidate = new Date(year, month - 1, day);
  candidate.setHours(0, 0, 0, 0);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return candidate;
}

function getWeeklyRecurrenceWeekday(recurrence: EventRecurrence): number | null {
  switch (recurrence) {
    case "monday":
      return 1;
    case "wednesday":
      return 3;
    case "thursday":
      return 4;
    default:
      return null;
  }
}

function buildRecurringEventDates(
  startDate: string,
  recurrence: EventRecurrence,
  occurrences: number
): string[] {
  const safeOccurrences = Number.isInteger(occurrences)
    ? Math.max(1, occurrences)
    : 1;
  const parsedStartDate = parseDateInputValue(startDate);
  if (!parsedStartDate) return [];

  if (recurrence === "none") {
    return [formatDateInputValue(parsedStartDate)];
  }

  if (recurrence === "daily") {
    return Array.from({ length: safeOccurrences }, (_, index) => {
      const next = new Date(parsedStartDate);
      next.setDate(next.getDate() + index);
      return formatDateInputValue(next);
    });
  }

  const weekday = getWeeklyRecurrenceWeekday(recurrence);
  if (weekday === null) {
    return [formatDateInputValue(parsedStartDate)];
  }

  const firstDateValue = getNextDateForWeekday(weekday, parsedStartDate);
  const firstDate = parseDateInputValue(firstDateValue);
  if (!firstDate) return [];

  return Array.from({ length: safeOccurrences }, (_, index) => {
    const next = new Date(firstDate);
    next.setDate(next.getDate() + index * 7);
    return formatDateInputValue(next);
  });
}

function generateRecurrenceGroupId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function buildEventCheckInPayload(
  eventId: string,
  userId: string,
  token: string
): string {
  return `vela-checkin:${eventId}:${userId}:${token}`;
}

function parseEventCheckInPayload(value: string): {
  token: string;
  eventId?: string;
  userId?: string;
} | null {
  const normalizeToken = (token: string) =>
    token.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizeUuid = (id: string) =>
    id.trim().toLowerCase().replace(/[^a-f0-9-]/g, "");

  const raw = value.trim();
  if (!raw) return null;
  let input = raw;
  try {
    input = decodeURIComponent(raw);
  } catch {
    input = raw;
  }
  input = input.trim();

  const markerMatch = input.match(/^vela-checkin:([^:]+):([^:]+):(.+)$/i);
  if (markerMatch) {
    const eventId = normalizeUuid(markerMatch[1] ?? "");
    const userId = normalizeUuid(markerMatch[2] ?? "");
    const token = normalizeToken(markerMatch[3] ?? "");
    if (!token) return null;
    return {
      token,
      eventId: eventId || undefined,
      userId: userId || undefined,
    };
  }

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const eventId = normalizeUuid(
        url.searchParams.get("eventId") ??
          url.searchParams.get("event_id") ??
          ""
      );
      const userId = normalizeUuid(
        url.searchParams.get("userId") ??
          url.searchParams.get("user_id") ??
          ""
      );
      const token = normalizeToken(
        url.searchParams.get("token") ??
          url.searchParams.get("check_in_token") ??
          ""
      );
      if (token) {
        return {
          token,
          eventId: eventId || undefined,
          userId: userId || undefined,
        };
      }
    } catch {
      // Ignore URL parse errors and continue with generic token extraction.
    }
  }

  const tokenCandidate =
    input.match(/[a-f0-9]{16,}/i)?.[0] ?? input.replace(/^.*?:\s*/i, "");
  const token = normalizeToken(tokenCandidate);
  if (!token) return null;
  return { token };
}

function generateCheckInToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function getQrImageUrl(value: string): string {
  const encoded = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encoded}`;
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  const details =
    "details" in error && typeof error.details === "string"
      ? error.details.toLowerCase()
      : "";
  const haystack = `${message} ${details}`;
  return haystack.includes("does not exist") && haystack.includes(columnName.toLowerCase());
}

function isMissingPostMuxColumnsError(error: unknown) {
  return (
    isMissingColumnError(error, "mux_playback_id") ||
    isMissingColumnError(error, "mux_asset_id") ||
    isMissingColumnError(error, "mux_upload_id") ||
    isMissingColumnError(error, "cover_url") ||
    isMissingColumnError(error, "mux_asset_status") ||
    isMissingColumnError(error, "mux_thumbnail_url") ||
    isMissingColumnError(error, "mux_duration_seconds") ||
    isMissingColumnError(error, "mux_aspect_ratio") ||
    isMissingColumnError(error, "shorts_visibility") ||
    isMissingColumnError(error, "shorts_hidden") ||
    isMissingColumnError(error, "shorts_hidden_reason") ||
    isMissingColumnError(error, "shorts_deleted_at")
  );
}

function isMissingPinnedShortColumnError(error: unknown) {
  return isMissingColumnError(error, "pinned_short_post_id");
}

function isMissingTeacherColumnError(error: unknown) {
  return isMissingColumnError(error, "is_teacher");
}

function isMissingPremiumColumnError(error: unknown) {
  return isMissingColumnError(error, "is_premium");
}

function isMissingTeachesLanguagesColumnError(error: unknown) {
  return isMissingColumnError(error, "teaches_languages");
}

function parsePositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const next = Number(normalized);
  if (!Number.isInteger(next) || next <= 0) return null;
  return next;
}

function parsePositiveDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const next = Number(normalized);
  if (!Number.isFinite(next) || next <= 0) return null;
  return next;
}

function formatPriceEur(value: number | null | undefined, locale: Locale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} EUR`;
  }
}

function formatEventPricing(
  event: EventRecord,
  locale: Locale,
  pricingText: EventPricingText
): string {
  if (event.is_paid) {
    const price = formatPriceEur(event.price_amount, locale);
    return price ? `${pricingText.paymentTypePaid}: ${price}` : pricingText.paymentTypePaid;
  }
  return pricingText.paymentTypeFree;
}

function isEventLevelMatch(event: EventRecord, level: LanguageLevel): boolean {
  if (!level) return true;
  const range = getEventLevelRange(event);
  if (range.from || range.to) {
    const levelIndex = getLevelIndex(level);
    if (levelIndex < 0) return false;
    const minIndex =
      range.from && getLevelIndex(range.from) > -1
        ? getLevelIndex(range.from)
        : 0;
    const maxIndex =
      range.to && getLevelIndex(range.to) > -1
        ? getLevelIndex(range.to)
        : LANGUAGE_LEVELS.length - 1;
    return levelIndex >= minIndex && levelIndex <= maxIndex;
  }
  return event.language_level === level;
}

function isProfileComplete(data: ProfileRecord | null): boolean {
  if (!data) return false;
  return Boolean(
    data.full_name &&
      data.birth_date &&
      data.gender &&
      data.country &&
      data.city &&
      data.language
  );
}

function resolveRoute(slug: string): Route | null {
  if (!slug) return null;
  switch (slug) {
    case "login":
      return "login";
    case "register":
      return "register";
    case "forgot":
      return "forgot";
    case "search":
      return "search";
    case "games":
    case "practice":
      return "games";
    case "voice":
    case "assistant":
      return "voice";
    case "shorts":
      return "shorts";
    case "events":
      return "events";
    case "event":
      return "event";
    case "organizer":
      return "organizer";
    case "profile":
      return "profile";
    case "me":
      return "me";
    case "admin":
      return "admin";
    case "partners":
      return "partners";
    case "privacy":
    case "datenschutz":
      return "privacy";
    case "impressum":
      return "impressum";
    case "terms":
    case "nutzungsbedingungen":
      return "terms";
    default:
      return null;
  }
}

function getRouteFromLocation(): Route {
  if (typeof window === "undefined") return "login";
  const path = window.location.pathname.replace(/\/+$/, "");
  const slug =
    path === "" || path === "/" ? "login" : path.replace(/^\//, "");
  const resolved = resolveRoute(slug.toLowerCase());
  if (resolved) return resolved;
  const hash = window.location.hash.replace("#", "");
  const resolvedFromHash = resolveRoute(hash.toLowerCase());
  return resolvedFromHash ?? "login";
}

function getEventIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id && id.trim() ? id.trim() : null;
}

function getOrganizerIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id && id.trim() ? id.trim() : null;
}

const ROUTE_PATHS: Record<Route, string> = {
  login: "/login",
  register: "/register",
  forgot: "/forgot",
  search: "/search",
  games: "/games",
  voice: "/voice",
  shorts: "/shorts",
  events: "/events",
  event: "/event",
  organizer: "/organizer",
  profile: "/profile",
  me: "/me",
  admin: "/admin",
  partners: "/partners",
  privacy: "/privacy",
  impressum: "/impressum",
  terms: "/terms",
};

const FALLBACK_LOCALE: Locale = "en";
const LOCALE_STORAGE_KEY = "vela-locale";
const POST_AUTH_ROUTE_KEY = "vela-post-auth-route";
const POST_AUTH_EVENT_KEY = "vela-post-auth-event";
const POST_AUTH_ORGANIZER_KEY = "vela-post-auth-organizer";
const GUEST_MODE_KEY = "vela-guest-mode";
const PROFILE_PHOTO_BUCKET = "avatars";
const POSTS_BUCKET = "posts";
const EVENTS_BUCKET = "events";
const EVENT_IMAGE_UPLOAD_BUCKETS = [EVENTS_BUCKET, POSTS_BUCKET] as const;
const ORGANIZER_FOLLOWS_TABLE = "organizer_follows";
const POSTS_TABLE = "posts";
const ORGANIZER_APPLICATIONS_TABLE = "organizer_applications";
const POST_MEDIA_FOLDER = "posts";
const POST_SELECT_FIELDS =
  "id,user_id,media_url,media_type,caption,created_at,cover_url,mux_upload_id,mux_asset_id,mux_playback_id,mux_asset_status,mux_thumbnail_url,mux_duration_seconds,mux_aspect_ratio,shorts_visibility,shorts_hidden,shorts_hidden_reason,shorts_deleted_at";
const POST_SELECT_FIELDS_LEGACY =
  "id,user_id,media_url,media_type,caption,created_at";
const EVENT_SELECT_FIELDS =
  "id,organizer_id,title,description,image_url,image_urls,online_url,address,city,country,language,language_level,language_level_min,language_level_max,event_date,event_time,recurrence_group_id,recurrence_rule,recurrence_occurrence,duration_minutes,is_paid,price_amount,max_participants,format,created_at";
const LEARN_PRACTICE_EXCLUDED = new Set<Locale>([
  "ru",
  "uk",
  "fa",
  "ar",
  "sq",
  "pl",
]);

function getVisibleShortPosts(
  posts: UserPost[],
  options?: {
    includeHidden?: boolean;
    allowFollowersVisibility?: boolean;
  }
) {
  return posts.filter((post) => {
    if (post.media_type !== "video" || !post.media_url) {
      return false;
    }
    if (post.shorts_deleted_at) {
      return false;
    }
    if (!options?.includeHidden && post.shorts_hidden) {
      return false;
    }
    if (!post.shorts_visibility || post.shorts_visibility === "public") {
      return true;
    }
    if (post.shorts_visibility === "followers") {
      return Boolean(options?.allowFollowersVisibility);
    }
    return false;
  });
}
const LEARN_PRACTICE_LANGS = LANGUAGE_LIST.filter(
  (lang) => !LEARN_PRACTICE_EXCLUDED.has(lang.locale)
);
const AVATAR_CROP_SIZE = 180;
const AVATAR_OUTPUT_SIZE = 512;

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return FALLBACK_LOCALE;
  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale && isSupportedLocale(storedLocale)) {
    return storedLocale;
  }
  const navigatorLanguages = [
    window.navigator.language,
    ...(window.navigator.languages ?? []),
  ]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
  for (const candidate of navigatorLanguages) {
    if (isSupportedLocale(candidate)) {
      return candidate;
    }
    const base = candidate.split(/[-_]/)[0];
    if (isSupportedLocale(base)) {
      return base;
    }
  }
  return FALLBACK_LOCALE;
}

function isRtlLocale(locale: Locale) {
  return locale === "ar" || locale === "fa";
}

const REGISTER_CONSENT_LINES: Partial<Record<Locale, string>> = {
  de: "Mit der Registrierung stimmen Sie diesen Nutzungsbedingungen zu.",
  en: "By registering you agree to these terms of service.",
  vi: "By registering you agree to these terms of service.",
  ru: "Регистрируясь, вы соглашаетесь с этими условиями использования.",
  uk: "Реєструючись, ви погоджуєтесь з цими умовами користування.",
  fa: "با ثبت‌نام، شما با این شرایط استفاده موافقت می‌کنید.",
  ar: "بالتسجيل، توافق على شروط الاستخدام هذه.",
  sq: "Me regjistrimin, ju pranoni këto kushte përdorimi.",
  tr: "Kayıt olarak bu kullanım şartlarını kabul etmiş olursunuz.",
  fr: "En vous inscrivant, vous acceptez ces conditions d'utilisation.",
  es: "Al registrarse, usted acepta estos términos de uso.",
  it: "Registrandoti accetti questi termini di utilizzo.",
  pl: "Rejestrując się, akceptujesz niniejsze warunki korzystania.",
};

const PARTNER_LOGOS = [
  { src: "/partners/partner-1.svg", alt: "Partner 1" },
  { src: "/partners/partner-2.svg", alt: "Partner 2" },
  { src: "/partners/partner-3.svg", alt: "Partner 3" },
  { src: "/partners/partner-4.svg", alt: "Partner 4" },
] as const;

const AdminPage = lazy(() => import("./AdminPage"));
const EventDetailPage = lazy(() => import("./EventDetailPage"));
const EventsPage = lazy(() => import("./EventsPage"));
const LegalPage = lazy(() => import("./LegalPage"));
const OrganizerPage = lazy(() => import("./OrganizerPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const SearchPage = lazy(() => import("./SearchPage"));
const MiniGamesPage = lazy(() => import("./MiniGamesPage"));
const VoiceAssistantPage = lazy(() => import("./VoiceAssistantPage"));
const ShortsPage = lazy(() => import("./ShortsPage"));
const UserPage = lazy(() => import("./UserPage"));

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale());
  const [partnerOffset, setPartnerOffset] = useState(0);
  const [partnerCycle, setPartnerCycle] = useState(0);
  const [route, setRoute] = useState<Route>(() => getRouteFromLocation());
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [guestMode, setGuestMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(GUEST_MODE_KEY) === "1";
  });
  const routeRef = useRef<Route>(route);
  const [userTab, setUserTab] = useState<UserTab>("posts");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCaption, setPostCaption] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postCoverFile, setPostCoverFile] = useState<File | null>(null);
  const [postPreviewUrl, setPostPreviewUrl] = useState<string | null>(null);
  const [postCoverPreviewUrl, setPostCoverPreviewUrl] = useState<string | null>(null);
  const [postsStatus, setPostsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [postActionStatus, setPostActionStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [pinShortLoadingId, setPinShortLoadingId] = useState<string | null>(null);
  const [pinShortStatus, setPinShortStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchLanguage, setSearchLanguage] = useState<Locale | "">("");
  const [searchLevel, setSearchLevel] = useState<LanguageLevel>("");
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState<{
    events: EventRecord[];
    organizers: SearchProfile[];
    users: SearchProfile[];
  }>({ events: [], organizers: [], users: [] });
  const [searchEventProfiles, setSearchEventProfiles] = useState<
    Record<string, SearchProfile>
  >({});
  const [searchStatus, setSearchStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [adminTab, setAdminTab] = useState<
    "users" | "events" | "posts" | "applications"
  >(
    "users"
  );
  const [adminUsers, setAdminUsers] = useState<SearchProfile[]>([]);
  const [adminUsersStatus, setAdminUsersStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [adminApplications, setAdminApplications] = useState<
    OrganizerApplication[]
  >([]);
  const [adminApplicationsStatus, setAdminApplicationsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string | null>(
    null
  );
  const [adminPosts, setAdminPosts] = useState<UserPost[]>([]);
  const [adminPostsStatus, setAdminPostsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [adminEventsStatus, setAdminEventsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [adminPostEditId, setAdminPostEditId] = useState<string | null>(null);
  const [adminPostCaption, setAdminPostCaption] = useState("");
  const [adminEventOrganizerId, setAdminEventOrganizerId] = useState("");
  const [adminPinOpen, setAdminPinOpen] = useState(false);
  const [adminPinValue, setAdminPinValue] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  const [footerLanguageOpen, setFooterLanguageOpen] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [searchFormat, setSearchFormat] = useState<"" | EventFormat>("");
  const [organizerFollowMap, setOrganizerFollowMap] = useState<
    Record<string, boolean>
  >({});
  const [organizerFollowLoading, setOrganizerFollowLoading] = useState<
    Record<string, boolean>
  >({});
  const [organizerFollowerCounts, setOrganizerFollowerCounts] = useState<
    Record<string, number>
  >({});
  const [followingOrganizers, setFollowingOrganizers] = useState<SearchProfile[]>(
    []
  );
  const [followingCount, setFollowingCount] = useState(0);
  const [followingStatus, setFollowingStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [followingSearch, setFollowingSearch] = useState("");
  const [eventsList, setEventsList] = useState<EventRecord[]>([]);
  const [eventDetails, setEventDetails] = useState<EventRecord | null>(null);
  const [eventOrganizer, setEventOrganizer] = useState<SearchProfile | null>(null);
  const [eventDetailsStatus, setEventDetailsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [eventDetailSlideIndex, setEventDetailSlideIndex] = useState(0);
  const [organizerDetails, setOrganizerDetails] = useState<SearchProfile | null>(
    null
  );
  const [organizerDetailsStatus, setOrganizerDetailsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [organizerFollowers, setOrganizerFollowers] = useState<SearchProfile[]>(
    []
  );
  const [organizerFollowersStatus, setOrganizerFollowersStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [organizerShorts, setOrganizerShorts] = useState<UserPost[]>([]);
  const [organizerShortsStatus, setOrganizerShortsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [eventRsvpStatus, setEventRsvpStatus] = useState<
    "going" | "interested" | null
  >(null);
  const [eventRsvpLoading, setEventRsvpLoading] = useState(false);
  const [eventRsvps, setEventRsvps] = useState<EventRsvpRecord[]>([]);
  const [eventRsvpProfiles, setEventRsvpProfiles] = useState<
    Record<string, SearchProfile>
  >({});
  const [eventCheckInCode, setEventCheckInCode] = useState("");
  const [eventCheckInLoading, setEventCheckInLoading] = useState(false);
  const [eventCheckInStatus, setEventCheckInStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [eventCheckInUpdating, setEventCheckInUpdating] = useState<
    Record<string, boolean>
  >({});
  const [eventQrScanLoading, setEventQrScanLoading] = useState(false);
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [eventExistingImageUrls, setEventExistingImageUrls] = useState<string[]>(
    []
  );
  const [eventRemovedImageUrls, setEventRemovedImageUrls] = useState<string[]>(
    []
  );
  const [eventRemoveImage, setEventRemoveImage] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventImageFiles, setEventImageFiles] = useState<File[]>([]);
  const [eventImagePreviews, setEventImagePreviews] = useState<string[]>([]);
  const [eventCropOpen, setEventCropOpen] = useState(false);
  const [eventCropSourceUrl, setEventCropSourceUrl] = useState<string | null>(null);
  const [eventCropTargetIndex, setEventCropTargetIndex] = useState<number | null>(null);
  const [eventCropImageSize, setEventCropImageSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [eventCropScale, setEventCropScale] = useState(1);
  const [eventCropMinScale, setEventCropMinScale] = useState(1);
  const [eventCropOffset, setEventCropOffset] = useState({ x: 0, y: 0 });
  const [eventCropApplying, setEventCropApplying] = useState(false);
  const [eventCity, setEventCity] = useState("");
  const [eventCountry, setEventCountry] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventOnlineUrl, setEventOnlineUrl] = useState("");
  const [eventLanguage, setEventLanguage] = useState<Locale | "">("");
  const [eventLevelFrom, setEventLevelFrom] = useState<LanguageLevel>("");
  const [eventLevelTo, setEventLevelTo] = useState<LanguageLevel>("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventRecurrence, setEventRecurrence] = useState<EventRecurrence>("none");
  const [eventRecurrenceCount, setEventRecurrenceCount] = useState(
    String(EVENT_RECURRENCE_DEFAULT_OCCURRENCES)
  );
  const [eventDuration, setEventDuration] = useState<EventDuration>("");
  const [eventPaymentType, setEventPaymentType] = useState<EventPaymentType>("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventMaxParticipants, setEventMaxParticipants] = useState("");
  const [eventFormat, setEventFormat] = useState<"" | EventFormat>("");
  const [eventStatus, setEventStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileBirthDate, setProfileBirthDate] = useState("");
  const [profileGender, setProfileGender] = useState<
    "" | "female" | "male" | "other"
  >("");
  const [profileCountry, setProfileCountry] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileLanguage, setProfileLanguage] = useState<Locale | "">(() => locale);
  const [profileLevel, setProfileLevel] = useState<LanguageLevel>("");
  const [profileLearningLanguages, setProfileLearningLanguages] = useState<Locale[]>([]);
  const [profilePracticeLanguages, setProfilePracticeLanguages] = useState<Locale[]>([]);
  const [profileTeachesLanguages, setProfileTeachesLanguages] = useState<Locale[]>([]);
  const [profileBio, setProfileBio] = useState("");
  const [profileInterests, setProfileInterests] = useState<string[]>([]);
  const [profileInterestInput, setProfileInterestInput] = useState("");
  const [profileTelegram, setProfileTelegram] = useState("");
  const [profileInstagram, setProfileInstagram] = useState("");
  const [profileIsOrganizer, setProfileIsOrganizer] = useState(false);
  const [profileIsTeacher, setProfileIsTeacher] = useState(false);
  const [profileIsAdmin, setProfileIsAdmin] = useState(false);
  const [profileIsPremium, setProfileIsPremium] = useState(false);
  const [profilePinnedShortPostId, setProfilePinnedShortPostId] = useState<string | null>(
    null
  );
  const [organizerApplyOpen, setOrganizerApplyOpen] = useState(false);
  const [organizerApplyType, setOrganizerApplyType] = useState<
    "" | "person" | "organization"
  >("");
  const [organizerApplyName, setOrganizerApplyName] = useState("");
  const [organizerApplyOrgName, setOrganizerApplyOrgName] = useState("");
  const [organizerApplyOrgId, setOrganizerApplyOrgId] = useState("");
  const [organizerApplyContactName, setOrganizerApplyContactName] = useState("");
  const [organizerApplyPhone, setOrganizerApplyPhone] = useState("");
  const [organizerApplyEmail, setOrganizerApplyEmail] = useState("");
  const [organizerApplyWebsite, setOrganizerApplyWebsite] = useState("");
  const [organizerApplyFacebook, setOrganizerApplyFacebook] = useState("");
  const [organizerApplyInstagram, setOrganizerApplyInstagram] = useState("");
  const [organizerApplyTiktok, setOrganizerApplyTiktok] = useState("");
  const [organizerApplyLinkedIn, setOrganizerApplyLinkedIn] = useState("");
  const [organizerApplyCity, setOrganizerApplyCity] = useState("");
  const [organizerApplyCountry, setOrganizerApplyCountry] = useState("");
  const [organizerApplyLanguages, setOrganizerApplyLanguages] = useState<Locale[]>(
    []
  );
  const [organizerApplyExperience, setOrganizerApplyExperience] = useState("");
  const [organizerApplyAbout, setOrganizerApplyAbout] = useState("");
  const [organizerApplyStatus, setOrganizerApplyStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [profileCoverPhoto, setProfileCoverPhoto] = useState<File | null>(null);
  const [profileCoverPreview, setProfileCoverPreview] = useState<string | null>(
    null
  );
  const [profileCoverUrl, setProfileCoverUrl] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropImageSize, setCropImageSize] = useState<{ w: number; h: number } | null>(
    null
  );
  const [cropScale, setCropScale] = useState(1);
  const [cropMinScale, setCropMinScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const profileLoaded = useRef(false);
  const profileCoverInputRef = useRef<HTMLInputElement | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const postFileInputRef = useRef<HTMLInputElement | null>(null);
  const postCoverInputRef = useRef<HTMLInputElement | null>(null);
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const eventCropImageRef = useRef<HTMLImageElement | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const cropDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const eventCropDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const klaroAutoOpened = useRef(false);
  const [authState, setAuthState] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [profileStatus, setProfileStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const strings = {
    ...MESSAGES[FALLBACK_LOCALE],
    ...(MESSAGES[locale] ?? {}),
  } as Record<MessageKey, string>;
  const miniGamesText = getMiniGamesText(locale);
  const shortsText = getShortsText(locale);
  const voiceAssistantText = getVoiceAssistantText(locale);
  const eventPricingText = getEventPricingText(locale);
  const eventCheckInText = getEventCheckInText(locale);
  const eventScheduleText = getEventScheduleText(locale);
  const eventImageEditorText = getEventImageEditorText();
  const changeLanguageButtonLabel =
    CHANGE_LANGUAGE_BUTTON_LABELS[locale] ?? CHANGE_LANGUAGE_BUTTON_LABELS.en;
  const languageLabels =
    LANGUAGE_LABELS[locale] ?? LANGUAGE_LABELS[FALLBACK_LOCALE];
  const registerConsentLine =
    REGISTER_CONSENT_LINES[locale] ?? REGISTER_CONSENT_LINES.en ?? "";
  const legalDir = isRtlLocale(locale) ? "rtl" : "ltr";
  const sessionMetadata = sessionUser?.user_metadata;
  const sessionName =
    typeof sessionMetadata?.full_name === "string"
      ? sessionMetadata.full_name
      : typeof sessionMetadata?.name === "string"
        ? sessionMetadata.name
        : "";
  const sessionAvatar =
    typeof sessionMetadata?.avatar_url === "string"
      ? sessionMetadata.avatar_url
      : null;
  const profileHeaderName =
    profileName.trim() ||
    sessionName ||
    sessionUser?.email ||
    strings.profileHeaderNameFallback;
  const profileHeaderAvatar = profileAvatarUrl ?? sessionAvatar ?? null;
  const profileHeaderInitial =
    profileHeaderName.trim().charAt(0).toUpperCase() || "?";
  const profileCoverDisplay = profileCoverUrl ?? null;
  const profileCoverStyle = profileCoverDisplay
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(245, 194, 164, 0.35), rgba(247, 214, 193, 0.3)), url(${profileCoverDisplay})`,
      }
    : undefined;
  const emptyProfileValue = "-";
  const followerInitials = ["V", "E", "L", "A"];
  const activeEventId = getEventIdFromLocation();
  const activeOrganizerId = getOrganizerIdFromLocation();
  const eventDetailImages = eventDetails ? getEventImageUrls(eventDetails) : [];
  const eventDetailImageUrl =
    eventDetailImages[eventDetailSlideIndex] ?? null;
  const sortedEventRsvps = [...eventRsvps].sort((a, b) => {
    if (a.status !== b.status) return a.status === "going" ? -1 : 1;
    const aChecked = Boolean(a.checked_in_at);
    const bChecked = Boolean(b.checked_in_at);
    if (aChecked !== bChecked) return aChecked ? -1 : 1;
    return 0;
  });
  const eventGoingCount = eventRsvps.filter(
    (item) => item.status === "going"
  ).length;
  const eventInterestedCount = eventRsvps.filter(
    (item) => item.status === "interested"
  ).length;
  const eventCheckedInCount = eventRsvps.filter(
    (item) => item.status === "going" && Boolean(item.checked_in_at)
  ).length;
  const currentEventRsvp =
    sessionUser?.id ? eventRsvps.find((row) => row.user_id === sessionUser.id) : null;
  const currentEventCheckInPayload =
    eventDetails?.id && sessionUser?.id && currentEventRsvp?.check_in_token
      ? buildEventCheckInPayload(
          eventDetails.id,
          sessionUser.id,
          currentEventRsvp.check_in_token
        )
      : "";
  const currentEventCheckInQrUrl = currentEventCheckInPayload
    ? getQrImageUrl(currentEventCheckInPayload)
    : "";
  const canManageEventCheckIn = Boolean(
    eventDetails?.id &&
      sessionUser?.id &&
      (profileIsAdmin || sessionUser.id === eventDetails.organizer_id)
  );
  const normalizedFollowingSearch = followingSearch.trim().toLowerCase();
  const filteredFollowingOrganizers = normalizedFollowingSearch
    ? followingOrganizers.filter((profile) => {
        const name = profile.full_name?.toLowerCase() ?? "";
        const city = profile.city?.toLowerCase() ?? "";
        const country = profile.country?.toLowerCase() ?? "";
        const bio = profile.bio?.toLowerCase() ?? "";
        const languageLabel =
          profile.language && isSupportedLocale(profile.language)
            ? languageLabels[profile.language] ?? profile.language
            : profile.language ?? "";
        const haystack = `${name} ${city} ${country} ${bio} ${languageLabel}`.trim();
        return haystack.includes(normalizedFollowingSearch);
      })
    : followingOrganizers;
  const followingEmptyMessage =
    followingOrganizers.length === 0
      ? strings.userFollowingEmpty
      : strings.searchEmpty;
  const followingOrganizerIds = useMemo(
    () => followingOrganizers.map((profile) => profile.id),
    [followingOrganizers]
  );
  const sessionOrganizerFollowers = sessionUser?.id
    ? organizerFollowerCounts[sessionUser.id] ?? 0
    : 0;
  const userStats = [
    { label: strings.userStatsPosts, value: String(userPosts.length) },
    { label: strings.userStatsFollowers, value: String(sessionOrganizerFollowers) },
    { label: strings.userStatsFollowing, value: String(followingCount) },
  ];
  const userTabs = useMemo(
    () => [
      { id: "about" as const, label: strings.userTabAbout },
      { id: "following" as const, label: strings.userTabFollowing },
      { id: "posts" as const, label: strings.userTabPosts },
      { id: "photos" as const, label: strings.userTabPhotos },
      { id: "videos" as const, label: strings.userTabVideos },
        ...(profileIsOrganizer || profileIsTeacher || userPosts.some((post) => post.media_type === "video")
          ? [{ id: "shorts" as const, label: strings.userTabShorts }]
          : []),
      { id: "tagged" as const, label: strings.userTabTagged },
    ],
    [
        profileIsOrganizer,
        profileIsTeacher,
        strings.userTabAbout,
      strings.userTabFollowing,
      strings.userTabPhotos,
      strings.userTabPosts,
      strings.userTabShorts,
      strings.userTabTagged,
      strings.userTabVideos,
      userPosts,
    ]
  );
  const photoPosts = userPosts.filter(
    (post) => post.media_type === "image" && post.media_url
  );
  const videoPosts = userPosts.filter(
    (post) => post.media_type === "video" && post.media_url
  );
  const shortVideoPosts = videoPosts.filter(
    (post) =>
      Boolean(post.mux_playback_id ?? extractMuxPlaybackId(post.media_url)) &&
      !post.shorts_deleted_at
  );
  useEffect(() => {
    if (userTabs.some((tab) => tab.id === userTab)) return;
    setUserTab("posts");
  }, [userTab, userTabs]);
  const profileGenderLabel =
    profileGender === "female"
      ? strings.profileGenderFemale
      : profileGender === "male"
        ? strings.profileGenderMale
        : profileGender === "other"
          ? strings.profileGenderOther
          : "";
  const profileLanguageLabel =
    profileLanguage &&
    (languageLabels[profileLanguage] ??
      LANGUAGE_LIST.find((lang) => lang.locale === profileLanguage)?.label ??
      profileLanguage);
  const profileLearningLabels = profileLearningLanguages
    .map(
      (lang) =>
        languageLabels[lang] ??
        LANGUAGE_LIST.find((item) => item.locale === lang)?.label ??
        lang
    )
    .join(", ");
  const profilePracticeLabels = profilePracticeLanguages
    .map(
      (lang) =>
        languageLabels[lang] ??
        LANGUAGE_LIST.find((item) => item.locale === lang)?.label ??
        lang
    )
    .join(", ");
  const profileInterestsLabel = profileInterests
    .map((interest) => resolveInterestLabel(interest, locale))
    .join(", ");
  const postPreviewIsVideo = Boolean(
      postFile && postFile.type.startsWith("video/")
    );
  const postHasContent = Boolean(postCaption.trim() || postFile);
  const canUploadPostMedia = profileIsOrganizer || profileIsTeacher || profileIsAdmin;
  const profileCanManageShorts = profileIsOrganizer || profileIsTeacher;
  const mediaPostAccessMessage =
    locale === "ru"
      ? "Только organizer, teacher или admin могут добавлять фото и видео."
      : locale === "uk"
        ? "Лише organizer, teacher або admin можуть додавати фото й відео."
        : "Only organizer, teacher, or admin accounts can upload photos and videos.";
  const getSupabaseErrorMessage = useCallback((error: unknown) => {
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        const normalizedMessage = message.trim().toLowerCase();
        if (
          normalizedMessage.includes("invalid jwt") ||
          normalizedMessage.includes("jwt") ||
          normalizedMessage.includes("jwd")
        ) {
          return "Your session is invalid or expired. Log out and sign in again.";
        }
        return message;
      }
    }
    return "Authentication failed. Please try again.";
  }, []);
  const getVerifiedSupabaseSession = useCallback(
    async (supabase: SupabaseClient) => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData.session;
      const accessToken = session?.access_token;
      if (!session?.user || !accessToken) {
        await supabase.auth.signOut();
        throw new Error("Your session expired. Please sign in again.");
      }
      const { data: userData, error: userError } = await supabase.auth.getUser(
        accessToken
      );
      if (userError || !userData.user) {
        await supabase.auth.signOut();
        throw new Error("Your session expired. Please sign in again.");
      }
      return {
        accessToken,
        user: userData.user as User,
      };
    },
    []
  );
  const partnerCount = PARTNER_LOGOS.length;
  const partnerPair =
    partnerCount >= 2
      ? [
          PARTNER_LOGOS[partnerOffset % partnerCount],
          PARTNER_LOGOS[(partnerOffset + 1) % partnerCount],
        ]
      : PARTNER_LOGOS;

  const applyRouteChange = useCallback(
    (next: Route) => {
      if (next === route) return;
      setRoute(next);
      setAuthState({ type: "idle", message: "" });
      if (next !== "profile") {
        setProfileStatus({ type: "idle", message: "" });
      }
      if (next !== "register") {
        setConfirmPassword("");
      }
    },
    [route]
  );

  const navigate = useCallback(
    (next: Route) => {
      if (typeof window !== "undefined") {
        const path = ROUTE_PATHS[next] ?? "/";
        if (window.location.pathname !== path) {
          window.history.pushState({}, "", path);
        }
      }
      applyRouteChange(next);
    },
    [applyRouteChange]
  );

  const redirectToLoginWithIntent = useCallback(
    (intent: { route: Route; eventId?: string; organizerId?: string }) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(POST_AUTH_ROUTE_KEY, intent.route);
        if (intent.eventId) {
          window.localStorage.setItem(POST_AUTH_EVENT_KEY, intent.eventId);
        }
        if (intent.organizerId) {
          window.localStorage.setItem(
            POST_AUTH_ORGANIZER_KEY,
            intent.organizerId
          );
        }
      }
      navigate("login");
    },
    [navigate]
  );

  const isAuthSessionError = useCallback((error: unknown) => {
    if (!error || typeof error !== "object" || !("message" in error)) return false;
    const message = (error as { message?: unknown }).message;
    if (typeof message !== "string") return false;
    const normalized = message.trim().toLowerCase();
    return (
      normalized.includes("invalid jwt") ||
      normalized.includes("jwt") ||
      normalized.includes("jwd") ||
      normalized.includes("session expired") ||
      normalized.includes("missing authorization header") ||
      normalized.includes("missing or invalid bearer token")
    );
  }, []);

  const forceSessionReset = useCallback(
    async (supabase: SupabaseClient | null) => {
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore sign-out errors during forced session reset.
        }
        }
        setSessionUser(null);
        setProfileIsOrganizer(false);
        setProfileIsTeacher(false);
        setProfileIsAdmin(false);
        setProfileIsPremium(false);
        setProfilePinnedShortPostId(null);
      profileLoaded.current = false;
      setAuthState({
        type: "error",
        message: "Your session expired. Please sign in again.",
      });
      navigate("login");
    },
    [navigate]
  );

  const goToEvent = useCallback(
    (eventId: string) => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.pathname = ROUTE_PATHS.event;
        url.searchParams.set("id", eventId);
        window.history.pushState({}, "", url.toString());
      }
      applyRouteChange("event");
    },
    [applyRouteChange]
  );

  const goToOrganizer = useCallback(
    (organizerId: string) => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.pathname = ROUTE_PATHS.organizer;
        url.searchParams.set("id", organizerId);
        window.history.pushState({}, "", url.toString());
      }
      applyRouteChange("organizer");
    },
    [applyRouteChange]
  );

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate("login");
  }, [navigate]);

  const clampCropOffset = useCallback(
    (nextX: number, nextY: number, scale: number) => {
      if (!cropImageSize) {
        return { x: 0, y: 0 };
      }
      const scaledWidth = cropImageSize.w * scale;
      const scaledHeight = cropImageSize.h * scale;
      const maxX = Math.max(0, (scaledWidth - AVATAR_CROP_SIZE) / 2);
      const maxY = Math.max(0, (scaledHeight - AVATAR_CROP_SIZE) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, nextX)),
        y: Math.min(maxY, Math.max(-maxY, nextY)),
      };
    },
    [cropImageSize]
  );

  const clampEventImageCropOffset = useCallback(
    (nextX: number, nextY: number, scale: number) => {
      if (!eventCropImageSize) {
        return { x: 0, y: 0 };
      }
      const scaledWidth = eventCropImageSize.w * scale;
      const scaledHeight = eventCropImageSize.h * scale;
      const maxX = Math.max(0, (scaledWidth - EVENT_IMAGE_CROP_SIZE) / 2);
      const maxY = Math.max(0, (scaledHeight - EVENT_IMAGE_CROP_SIZE) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, nextX)),
        y: Math.min(maxY, Math.max(-maxY, nextY)),
      };
    },
    [eventCropImageSize]
  );

  const generateCropCanvasBlob = useCallback(
    (size: number, quality = 0.9) => {
      if (!profilePhoto || !cropImageSize || !cropImageRef.current) {
        return null;
      }
      const scale = cropScale;
      const { w, h } = cropImageSize;
      const scaledWidth = w * scale;
      const scaledHeight = h * scale;
      const centerX = AVATAR_CROP_SIZE / 2 + cropOffset.x;
      const centerY = AVATAR_CROP_SIZE / 2 + cropOffset.y;
      const x0 = centerX - scaledWidth / 2;
      const y0 = centerY - scaledHeight / 2;
      const sourceSize = AVATAR_CROP_SIZE / scale;
      let sx = (0 - x0) / scale;
      let sy = (0 - y0) / scale;
      sx = Math.max(0, Math.min(w - sourceSize, sx));
      sy = Math.max(0, Math.min(h - sourceSize, sy));
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(
        cropImageRef.current,
        sx,
        sy,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
      );
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
    },
    [cropImageSize, cropOffset.x, cropOffset.y, cropScale, profilePhoto]
  );

  const updateCropPreview = useCallback(async () => {
    const blob = await generateCropCanvasBlob(AVATAR_CROP_SIZE, 0.85);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setProfilePhotoPreview((prev) => {
      if (prev && prev.startsWith("blob:") && prev !== cropImageUrl) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
  }, [cropImageUrl, generateCropCanvasBlob]);

  useEffect(() => {
    if (partnerCount <= 2) return undefined;
    const id = window.setInterval(() => {
      setPartnerOffset((prev) => (prev + 2) % partnerCount);
      setPartnerCycle((prev) => prev + 1);
    }, 2500);
    return () => window.clearInterval(id);
  }, [partnerCount]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const localeStrings = {
        ...MESSAGES[FALLBACK_LOCALE],
        ...(MESSAGES[locale] ?? {}),
      } as Record<MessageKey, string>;
      const localizedTitle = `VELA ${localeStrings.brandTag} — ${localeStrings.brandSub}`;
      const localizedDescription = `VELA ${localeStrings.brandTag}. ${localeStrings.brandSub}`;
      document.documentElement.lang = locale;
      document.title = localizedTitle;
      let descriptionMeta = document.querySelector(
        'meta[name="description"]'
      ) as HTMLMetaElement | null;
      if (!descriptionMeta) {
        descriptionMeta = document.createElement("meta");
        descriptionMeta.setAttribute("name", "description");
        document.head.appendChild(descriptionMeta);
      }
      descriptionMeta.setAttribute("content", localizedDescription);
    }
    void setupKlaro(locale).then(() => {
      if (klaroAutoOpened.current) return;
      if (typeof window === "undefined") return;
      const hasConsent = window.localStorage.getItem("klaro-consent") !== null;
      if (!hasConsent) {
        klaroAutoOpened.current = true;
        void openKlaroSettings(locale);
      }
    });
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const postAuthRoute = params.get("postAuth");
    if (postAuthRoute) {
      window.localStorage.setItem(POST_AUTH_ROUTE_KEY, postAuthRoute);
    }
    const onLocationChange = () => applyRouteChange(getRouteFromLocation());
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    return () => {
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
    };
  }, [applyRouteChange]);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    if (guestMode || !sessionUser?.id) {
      setOrganizerFollowMap({});
      setOrganizerFollowLoading({});
      setOrganizerFollowerCounts({});
      setFollowingOrganizers([]);
      setFollowingCount(0);
      setFollowingStatus({ type: "idle", message: "" });
      setFollowingSearch("");
    }
  }, [guestMode, sessionUser?.id]);

  useEffect(() => {
    if (!guestMode) return;
    const allowedRoutes: Route[] = [
      "login",
      "register",
      "forgot",
      "search",
      "shorts",
      "events",
      "event",
      "organizer",
      "privacy",
      "impressum",
      "terms",
    ];
    if (!allowedRoutes.includes(route)) {
      navigate("search");
    }
  }, [guestMode, navigate, route]);

  useEffect(() => {
    if (route !== "profile") return;
    if (!profileLanguage) {
      setProfileLanguage(locale);
    }
  }, [route, locale, profileLanguage]);

  useEffect(() => {
    setEventDetailSlideIndex(0);
  }, [eventDetails?.id]);

  useEffect(() => {
    if (!profilePhotoPreview?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(profilePhotoPreview);
    };
  }, [profilePhotoPreview]);

  useEffect(() => {
    if (!profileCoverPreview?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(profileCoverPreview);
    };
  }, [profileCoverPreview]);

  useEffect(() => {
    if (!eventImagePreviews.some((preview) => preview.startsWith("blob:"))) {
      return undefined;
    }
    return () => {
      revokeEventImagePreviews(eventImagePreviews);
    };
  }, [eventImagePreviews]);

  useEffect(() => {
    if (!postPreviewUrl?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(postPreviewUrl);
    };
  }, [postPreviewUrl]);

  useEffect(() => {
    if (!postCoverPreviewUrl?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(postCoverPreviewUrl);
    };
  }, [postCoverPreviewUrl]);

  useEffect(() => {
    if (!cropImageUrl) {
      setCropImageSize(null);
      cropImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      setCropImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      const minScale = Math.max(
        AVATAR_CROP_SIZE / img.naturalWidth,
        AVATAR_CROP_SIZE / img.naturalHeight
      );
      setCropMinScale(minScale);
      setCropScale(minScale);
      setCropOffset({ x: 0, y: 0 });
      cropImageRef.current = img;
    };
    img.src = cropImageUrl;
  }, [cropImageUrl]);

  useEffect(() => {
    if (!eventCropSourceUrl) {
      setEventCropImageSize(null);
      eventCropImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      setEventCropImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      const minScale = Math.max(
        EVENT_IMAGE_CROP_SIZE / img.naturalWidth,
        EVENT_IMAGE_CROP_SIZE / img.naturalHeight
      );
      setEventCropMinScale(minScale);
      setEventCropScale(minScale);
      setEventCropOffset({ x: 0, y: 0 });
      eventCropImageRef.current = img;
    };
    img.src = eventCropSourceUrl;
  }, [eventCropSourceUrl]);

  useEffect(() => {
    if (!cropImageSize) return;
    setCropOffset((prev) => clampCropOffset(prev.x, prev.y, cropScale));
  }, [clampCropOffset, cropImageSize, cropScale]);

  useEffect(() => {
    if (!eventCropImageSize) return;
    setEventCropOffset((prev) =>
      clampEventImageCropOffset(prev.x, prev.y, eventCropScale)
    );
  }, [clampEventImageCropOffset, eventCropImageSize, eventCropScale]);

  useEffect(() => {
    if (!profilePhoto || !cropImageSize) return;
    void updateCropPreview();
  }, [cropImageSize, cropOffset, cropScale, profilePhoto, updateCropPreview]);

  useEffect(() => {
    if (route !== "profile" && route !== "me" && route !== "admin") return;
    if (guestMode) {
      navigate("search");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session?.user) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(POST_AUTH_ROUTE_KEY, route);
        }
        navigate("login");
      }
    });
    return () => {
      active = false;
    };
  }, [guestMode, navigate, route]);

  useEffect(() => {
    if (route !== "profile" && route !== "me" && route !== "admin") {
      profileLoaded.current = false;
      return;
    }
    if (profileLoaded.current) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    (async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setProfileStatus({
          type: "error",
          message: getSupabaseErrorMessage(sessionError),
        });
        return;
      }
      const user = sessionData.session?.user;
      if (!user) return;
        const primaryProfileResult = await supabase
          .from("profiles")
          .select(
            "full_name,birth_date,gender,country,city,language,avatar_url,cover_url,language_level,learning_languages,practice_languages,teaches_languages,bio,interests,telegram,instagram,is_organizer,is_teacher,is_admin,is_premium,pinned_short_post_id"
          )
          .eq("id", user.id)
          .maybeSingle();
        const fallbackProfileResult =
          primaryProfileResult.error &&
          (isMissingPinnedShortColumnError(primaryProfileResult.error) ||
            isMissingTeacherColumnError(primaryProfileResult.error) ||
            isMissingPremiumColumnError(primaryProfileResult.error) ||
            isMissingTeachesLanguagesColumnError(primaryProfileResult.error))
            ? await supabase
                .from("profiles")
                .select(
                  "full_name,birth_date,gender,country,city,language,avatar_url,cover_url,language_level,learning_languages,practice_languages,bio,interests,telegram,instagram,is_organizer,is_admin"
                )
                .eq("id", user.id)
                .maybeSingle()
          : null;
      const data = (fallbackProfileResult?.data ?? primaryProfileResult.data) as
        | ProfileRecord
        | null;
      const error = fallbackProfileResult?.error ?? primaryProfileResult.error;
      if (!active) return;
      if (error) {
        setProfileStatus({
          type: "error",
          message: getSupabaseErrorMessage(error),
        });
        return;
      }
      if (data) {
        setProfileName(data.full_name ?? "");
        setProfileBirthDate(data.birth_date ?? "");
        setProfileGender(
          data.gender === "female" || data.gender === "male" || data.gender === "other"
            ? data.gender
            : ""
        );
        setProfileCountry(data.country ?? "");
        setProfileCity(data.city ?? "");
        setProfileLanguage(
          data.language && isSupportedLocale(data.language)
            ? data.language
            : locale
        );
        setProfileLevel(
          data.language_level &&
            LANGUAGE_LEVELS.includes(data.language_level as (typeof LANGUAGE_LEVELS)[number])
            ? (data.language_level as LanguageLevel)
            : ""
        );
        const learningLanguages = Array.isArray(data.learning_languages)
          ? data.learning_languages.filter(
              (lang) =>
                isSupportedLocale(lang) &&
                !LEARN_PRACTICE_EXCLUDED.has(lang)
            )
          : [];
        const practiceLanguages = Array.isArray(data.practice_languages)
          ? data.practice_languages.filter(
              (lang) =>
                isSupportedLocale(lang) &&
                !LEARN_PRACTICE_EXCLUDED.has(lang)
            )
          : [];
        const teachesLanguages = Array.isArray(data.teaches_languages)
          ? data.teaches_languages.filter(
              (lang) =>
                isSupportedLocale(lang) &&
                !LEARN_PRACTICE_EXCLUDED.has(lang)
            )
          : [];
        setProfileLearningLanguages(learningLanguages as Locale[]);
        setProfilePracticeLanguages(practiceLanguages as Locale[]);
        setProfileTeachesLanguages(teachesLanguages as Locale[]);
        setProfileBio(data.bio ?? "");
        setProfileInterests(
          Array.isArray(data.interests)
            ? data.interests.filter((item) => typeof item === "string" && item.trim())
            : []
        );
        setProfileInterestInput("");
          setProfileTelegram(data.telegram ?? "");
          setProfileInstagram(data.instagram ?? "");
          setProfileIsOrganizer(Boolean(data.is_organizer));
          setProfileIsTeacher(Boolean(data.is_teacher));
          setProfileIsAdmin(Boolean(data.is_admin));
          setProfileIsPremium(Boolean(data.is_premium));
          setProfilePinnedShortPostId(data.pinned_short_post_id ?? null);
        setProfileCoverUrl(data.cover_url ?? null);
        setProfileCoverPreview(data.cover_url ?? null);
        setProfileCoverPhoto(null);
        if (profileCoverInputRef.current) {
          profileCoverInputRef.current.value = "";
        }
        setProfileAvatarUrl(data.avatar_url ?? null);
        setProfilePhotoPreview(data.avatar_url ?? null);
        setProfilePhoto(null);
        setCropImageUrl(null);
        if (profilePhotoInputRef.current) {
          profilePhotoInputRef.current.value = "";
        }
        } else {
          setProfileIsPremium(false);
          setProfileIsTeacher(false);
          setProfileIsAdmin(false);
          setProfilePinnedShortPostId(null);
          setProfileTeachesLanguages([]);
        }
      profileLoaded.current = true;
    })();
    return () => {
      active = false;
    };
  }, [getSupabaseErrorMessage, locale, route]);

  useEffect(() => {
    if (route !== "me") {
      setUserPosts([]);
      setPostsStatus({ type: "idle", message: "" });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setPostsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    if (!sessionUser?.id) return;
    let active = true;
    (async () => {
      setPostsStatus({ type: "loading", message: "" });
      const primaryPostsResult = await supabase
        .from(POSTS_TABLE)
        .select(POST_SELECT_FIELDS)
        .eq("user_id", sessionUser.id)
        .order("created_at", { ascending: false });
      const fallbackPostsResult =
        primaryPostsResult.error && isMissingPostMuxColumnsError(primaryPostsResult.error)
          ? await supabase
          .from(POSTS_TABLE)
          .select(POST_SELECT_FIELDS_LEGACY)
          .eq("user_id", sessionUser.id)
          .order("created_at", { ascending: false })
          : null;
      const data = (fallbackPostsResult?.data ?? primaryPostsResult.data) as
        | UserPost[]
        | null;
      const error = fallbackPostsResult?.error ?? primaryPostsResult.error;
      if (!active) return;
      if (error) {
        setPostsStatus({
          type: "error",
          message: getSupabaseErrorMessage(error),
        });
        setUserPosts([]);
        return;
      }
      setUserPosts((data ?? []) as UserPost[]);
      setPostsStatus({ type: "idle", message: "" });
    })();
    return () => {
      active = false;
    };
  }, [getSupabaseErrorMessage, route, sessionUser?.id]);



  const fetchEventRsvps = useCallback(async (eventId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }
    const firstResult = await supabase
      .from("event_rsvps")
      .select("user_id,status,check_in_token,checked_in_at,checked_in_by")
      .eq("event_id", eventId);
    let rsvpRows: EventRsvpRecord[] | null = null;
    let rsvpError: unknown = null;
    if (firstResult.error && isMissingColumnError(firstResult.error, "check_in_token")) {
      const fallbackResult = await supabase
        .from("event_rsvps")
        .select("user_id,status")
        .eq("event_id", eventId);
      rsvpRows = (fallbackResult.data ?? []) as EventRsvpRecord[];
      rsvpError = fallbackResult.error;
    } else {
      rsvpRows = (firstResult.data ?? []) as EventRsvpRecord[];
      rsvpError = firstResult.error;
    }
    if (rsvpError) {
      return null;
    }
    const rsvps = (rsvpRows ?? []) as EventRsvpRecord[];
    const ids = Array.from(
      new Set(rsvps.map((row) => row.user_id).filter(Boolean))
    ) as string[];
    let profiles: Record<string, SearchProfile> = {};
    if (ids.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,city,country,language,language_level,is_organizer")
        .in("id", ids);
      if (!profileError && profileRows) {
        profiles = profileRows.reduce((acc, profile) => {
          acc[profile.id] = profile as SearchProfile;
          return acc;
        }, {} as Record<string, SearchProfile>);
      }
    }
    return { rsvps, profiles };
  }, []);

  const fetchOrganizerFollowStatus = useCallback(
    async (organizerIds: string[]) => {
      if (guestMode || !sessionUser?.id) {
        return {};
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        return {};
      }
      if (!organizerIds.length) {
        return {};
      }
      const { data, error } = await supabase
        .from(ORGANIZER_FOLLOWS_TABLE)
        .select("organizer_id")
        .eq("follower_id", sessionUser.id)
        .in("organizer_id", organizerIds);
      if (error) {
        return {};
      }
      const map: Record<string, boolean> = {};
      organizerIds.forEach((id) => {
        map[id] = false;
      });
      (data as { organizer_id: string }[] | null)?.forEach((row) => {
        if (row.organizer_id) {
          map[row.organizer_id] = true;
        }
      });
      return map;
    },
    [guestMode, sessionUser?.id]
  );

  const fetchOrganizerFollowerCounts = useCallback(async (organizerIds: string[]) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {};
    }
    if (!organizerIds.length) {
      return {};
    }
    const { data, error } = await supabase.rpc("get_organizer_follow_counts", {
      organizer_ids: organizerIds,
    });
    if (error) {
      return {};
    }
    const map: Record<string, number> = {};
    organizerIds.forEach((id) => {
      map[id] = 0;
    });
    (data as { organizer_id: string; followers_count: number }[] | null)?.forEach(
      (row) => {
        if (row.organizer_id) {
          map[row.organizer_id] = Number(row.followers_count) || 0;
        }
      }
    );
    return map;
  }, []);

  const refreshFollowingOrganizers = useCallback(async () => {
    if (guestMode || !sessionUser?.id) {
      setFollowingOrganizers([]);
      setFollowingCount(0);
      setFollowingStatus({ type: "idle", message: "" });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFollowingStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setFollowingStatus({ type: "loading", message: "" });
    const { data: followRows, error } = await supabase
      .from(ORGANIZER_FOLLOWS_TABLE)
      .select("organizer_id")
      .eq("follower_id", sessionUser.id);
    if (error) {
      setFollowingStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
      return;
    }
    const ids = (followRows ?? [])
      .map((row) => row.organizer_id)
      .filter(Boolean) as string[];
    setFollowingCount(ids.length);
    if (!ids.length) {
      setFollowingOrganizers([]);
      setFollowingStatus({ type: "idle", message: "" });
      return;
    }
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,is_organizer,bio"
      )
      .in("id", ids);
    if (profileError) {
      setFollowingStatus({
        type: "error",
        message: getSupabaseErrorMessage(profileError),
      });
      return;
    }
    const orderMap = new Map(ids.map((id, index) => [id, index]));
    const sortedProfiles = (profileRows ?? []).sort((a, b) => {
      return (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0);
    }) as SearchProfile[];
    setFollowingOrganizers(sortedProfiles);
    setFollowingStatus({ type: "idle", message: "" });
    const counts = await fetchOrganizerFollowerCounts(ids);
    if (Object.keys(counts).length) {
      setOrganizerFollowerCounts((prev) => ({ ...prev, ...counts }));
    }
  }, [
    fetchOrganizerFollowerCounts,
    getSupabaseErrorMessage,
    guestMode,
    sessionUser?.id,
  ]);
  useEffect(() => {
    if (route !== "events") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEventStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    let active = true;
    (async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setEventStatus({
          type: "error",
          message: getSupabaseErrorMessage(sessionError),
        });
        return;
      }
      const user = data.session?.user;
      if (!user) {
        setEventsList([]);
        return;
      }
      const { data: eventRows, error } = await supabase
        .from("events")
        .select(EVENT_SELECT_FIELDS)
        .eq("organizer_id", user.id)
        .order("event_date", { ascending: false });
      if (!active) return;
      if (error) {
        setEventStatus({
          type: "error",
          message: getSupabaseErrorMessage(error),
        });
        return;
      }
      setEventsList((eventRows ?? []) as EventRecord[]);
      setEventStatus({ type: "idle", message: "" });
    })();
    return () => {
      active = false;
    };
  }, [getSupabaseErrorMessage, route]);

  useEffect(() => {
    if (route !== "admin") {
      setAdminUsers([]);
      setAdminApplications([]);
      setAdminPosts([]);
      setAdminPostEditId(null);
      setAdminPostCaption("");
      setAdminUsersStatus({ type: "idle", message: "" });
      setAdminApplicationsStatus({ type: "idle", message: "" });
      setAdminPostsStatus({ type: "idle", message: "" });
      setAdminEventsStatus({ type: "idle", message: "" });
      return;
    }
    if (guestMode) {
      setAdminUsersStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      setAdminApplicationsStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      setAdminPostsStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      setAdminEventsStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      return;
    }
    if (!profileIsAdmin) {
      if (!profileLoaded.current) return;
      setAdminUsersStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      setAdminApplicationsStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      setAdminPostsStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      setAdminEventsStatus({
        type: "error",
        message: strings.adminAccessDenied,
      });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminUsersStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      setAdminApplicationsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      setAdminPostsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      setAdminEventsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    let active = true;
    (async () => {
      setAdminUsersStatus({ type: "loading", message: "" });
      setAdminApplicationsStatus({ type: "loading", message: "" });
      setAdminPostsStatus({ type: "loading", message: "" });
      setAdminEventsStatus({ type: "loading", message: "" });
      const [usersResult, eventsResult, postsResult, applicationsResult] =
        await Promise.all([
        supabase
            .from("profiles")
            .select(
              "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,bio,is_organizer,is_teacher,is_admin"
            )
          .order("full_name", { ascending: true }),
          supabase
            .from("events")
            .select(EVENT_SELECT_FIELDS)
            .order("event_date", { ascending: false }),
        supabase
          .from(POSTS_TABLE)
          .select(POST_SELECT_FIELDS)
          .order("created_at", { ascending: false }),
        supabase
          .from(ORGANIZER_APPLICATIONS_TABLE)
          .select(
            "id,user_id,application_type,full_name,org_name,org_id,contact_name,phone,email,website,facebook_url,instagram_url,tiktok_url,linkedin_url,city,country,languages,experience,about,status,created_at,updated_at"
          )
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const { data: usersRows, error: usersError } = usersResult;
      if (usersError) {
        setAdminUsersStatus({
          type: "error",
          message: getSupabaseErrorMessage(usersError),
        });
      } else {
        setAdminUsers((usersRows ?? []) as SearchProfile[]);
        setAdminUsersStatus({ type: "idle", message: "" });
      }
      const { data: eventsRows, error: eventsError } = eventsResult;
      if (eventsError) {
        setAdminEventsStatus({
          type: "error",
          message: getSupabaseErrorMessage(eventsError),
        });
      } else {
        setEventsList((eventsRows ?? []) as EventRecord[]);
        setAdminEventsStatus({ type: "idle", message: "" });
      }
      const { data: postsRows, error: postsError } = postsResult;
      if (postsError) {
        if (isMissingPostMuxColumnsError(postsError)) {
          const legacyPostsResult = await supabase
            .from(POSTS_TABLE)
            .select(POST_SELECT_FIELDS_LEGACY)
            .order("created_at", { ascending: false });
          if (legacyPostsResult.error) {
            setAdminPostsStatus({
              type: "error",
              message: getSupabaseErrorMessage(legacyPostsResult.error),
            });
          } else {
            setAdminPosts((legacyPostsResult.data ?? []) as UserPost[]);
            setAdminPostsStatus({ type: "idle", message: "" });
          }
        } else {
          setAdminPostsStatus({
            type: "error",
            message: getSupabaseErrorMessage(postsError),
          });
        }
      } else {
        setAdminPosts((postsRows ?? []) as UserPost[]);
        setAdminPostsStatus({ type: "idle", message: "" });
      }
      const { data: applicationsRows, error: applicationsError } =
        applicationsResult;
      if (applicationsError) {
        setAdminApplicationsStatus({
          type: "error",
          message: getSupabaseErrorMessage(applicationsError),
        });
      } else {
        setAdminApplications(
          (applicationsRows ?? []) as OrganizerApplication[]
        );
        setAdminApplicationsStatus({ type: "idle", message: "" });
      }
    })();
    return () => {
      active = false;
    };
  }, [
    guestMode,
    getSupabaseErrorMessage,
    profileIsAdmin,
    route,
    strings.adminAccessDenied,
  ]);

  useEffect(() => {
    if (route !== "event") {
      setEventRsvps([]);
      setEventRsvpProfiles({});
      setEventRsvpStatus(null);
      setEventCheckInCode("");
      setEventCheckInStatus({ type: "idle", message: "" });
      setEventCheckInUpdating({});
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEventDetailsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    const eventId = activeEventId;
    if (!eventId) {
      setEventDetails(null);
      setEventOrganizer(null);
      setEventDetailsStatus({
        type: "error",
        message: strings.searchEmpty,
      });
      return;
    }
    let active = true;
    (async () => {
      setEventDetailsStatus({ type: "loading", message: "" });
      const { data: eventRow, error } = await supabase
        .from("events")
        .select(EVENT_SELECT_FIELDS)
        .eq("id", eventId)
        .maybeSingle();
      if (!active) return;
      if (error || !eventRow) {
        setEventDetailsStatus({
          type: "error",
          message: getSupabaseErrorMessage(error ?? new Error("Not found")),
        });
        setEventDetails(null);
        setEventOrganizer(null);
        setEventRsvps([]);
        setEventRsvpProfiles({});
        return;
      }
      const eventData = eventRow as EventRecord;
      setEventDetails(eventData);
      const { data: organizerRow } = await supabase
        .from("profiles")
        .select(
          "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,is_organizer,bio"
        )
        .eq("id", eventData.organizer_id)
        .maybeSingle();
      if (!active) return;
      setEventOrganizer((organizerRow as SearchProfile) ?? null);

      const rsvpResult = await fetchEventRsvps(eventId);
      if (!active) return;
      if (rsvpResult) {
        setEventRsvps(rsvpResult.rsvps);
        setEventRsvpProfiles(rsvpResult.profiles);
      } else {
        setEventRsvps([]);
        setEventRsvpProfiles({});
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      const user = sessionData.session?.user;
      if (!user) {
        setEventRsvpStatus(null);
        setEventDetailsStatus({ type: "idle", message: "" });
        return;
      }
      const { data: rsvpRow } = await supabase
        .from("event_rsvps")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setEventRsvpStatus(
        rsvpRow?.status === "going"
          ? "going"
          : rsvpRow?.status === "interested"
            ? "interested"
            : null
      );
      setEventDetailsStatus({ type: "idle", message: "" });
    })();
    return () => {
      active = false;
    };
  }, [
    activeEventId,
    fetchEventRsvps,
    getSupabaseErrorMessage,
    route,
    strings.searchEmpty,
  ]);

  useEffect(() => {
    if (route !== "event") return;
    const organizerId = eventOrganizer?.id;
    if (!organizerId) return;
    let active = true;
    fetchOrganizerFollowStatus([organizerId]).then((map) => {
      if (!active) return;
      if (map[organizerId] === undefined) return;
      setOrganizerFollowMap((prev) => ({
        ...prev,
        [organizerId]: map[organizerId],
      }));
    });
    return () => {
      active = false;
    };
  }, [eventOrganizer?.id, fetchOrganizerFollowStatus, route]);

  useEffect(() => {
    if (route !== "event") return;
    const organizerId = eventOrganizer?.id;
    if (!organizerId) return;
    let active = true;
    fetchOrganizerFollowerCounts([organizerId]).then((map) => {
      if (!active) return;
      if (map[organizerId] === undefined) return;
      setOrganizerFollowerCounts((prev) => ({
        ...prev,
        [organizerId]: map[organizerId],
      }));
    });
    return () => {
      active = false;
    };
  }, [eventOrganizer?.id, fetchOrganizerFollowerCounts, route]);

  useEffect(() => {
    if (route !== "event" || !eventDetails?.id || !sessionUser?.id) return;
    const ownRsvp = eventRsvps.find((row) => row.user_id === sessionUser.id);
    if (!ownRsvp || ownRsvp.status !== "going" || ownRsvp.check_in_token) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .update({ check_in_token: generateCheckInToken() })
        .eq("event_id", eventDetails.id)
        .eq("user_id", sessionUser.id)
        .eq("status", "going")
        .select("user_id,status,check_in_token,checked_in_at,checked_in_by")
        .maybeSingle();
      if (!active || error || !data) return;
      setEventRsvps((prev) =>
        prev.map((row) =>
          row.user_id === sessionUser.id
            ? {
                ...row,
                check_in_token: data.check_in_token ?? row.check_in_token ?? null,
                checked_in_at: data.checked_in_at ?? row.checked_in_at ?? null,
                checked_in_by: data.checked_in_by ?? row.checked_in_by ?? null,
              }
            : row
        )
      );
    })();
    return () => {
      active = false;
    };
  }, [eventDetails?.id, eventRsvps, route, sessionUser?.id]);

  useEffect(() => {
    if (route !== "organizer") {
      setOrganizerDetails(null);
      setOrganizerFollowers([]);
      setOrganizerShorts([]);
      setOrganizerDetailsStatus({ type: "idle", message: "" });
      setOrganizerFollowersStatus({ type: "idle", message: "" });
      setOrganizerShortsStatus({ type: "idle", message: "" });
      return;
    }
    const organizerId = activeOrganizerId;
    if (!organizerId) {
      setOrganizerDetails(null);
      setOrganizerFollowers([]);
      setOrganizerShorts([]);
      setOrganizerDetailsStatus({
        type: "error",
        message: strings.searchEmpty,
      });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setOrganizerDetailsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    let active = true;
    (async () => {
      setOrganizerDetailsStatus({ type: "loading", message: "" });
      const primaryProfileResult = await supabase
        .from("profiles")
        .select(
          "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,is_organizer,bio,pinned_short_post_id"
        )
        .eq("id", organizerId)
        .maybeSingle();
      const fallbackProfileResult =
        primaryProfileResult.error &&
        isMissingPinnedShortColumnError(primaryProfileResult.error)
          ? await supabase
              .from("profiles")
              .select(
                "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,is_organizer,bio"
              )
              .eq("id", organizerId)
              .maybeSingle()
          : null;
      const profileRow = (fallbackProfileResult?.data ??
        primaryProfileResult.data) as SearchProfile | null;
      const error = fallbackProfileResult?.error ?? primaryProfileResult.error;
      if (!active) return;
      if (error || !profileRow) {
        setOrganizerDetailsStatus({
          type: "error",
          message: getSupabaseErrorMessage(error ?? new Error("Not found")),
        });
        setOrganizerDetails(null);
        setOrganizerFollowers([]);
        setOrganizerShorts([]);
        return;
      }
      setOrganizerDetails(profileRow as SearchProfile);
      setOrganizerDetailsStatus({ type: "idle", message: "" });
      const [countMap, followMap] = await Promise.all([
        fetchOrganizerFollowerCounts([organizerId]),
        fetchOrganizerFollowStatus([organizerId]),
      ]);
      if (!active) return;
      if (Object.keys(countMap).length) {
        setOrganizerFollowerCounts((prev) => ({ ...prev, ...countMap }));
      }
      if (Object.keys(followMap).length) {
        setOrganizerFollowMap((prev) => ({ ...prev, ...followMap }));
      }
      setOrganizerShortsStatus({ type: "loading", message: "" });
      const primaryShortsResult = await supabase
        .from(POSTS_TABLE)
        .select(POST_SELECT_FIELDS)
        .eq("user_id", organizerId)
        .eq("media_type", "video")
        .order("created_at", { ascending: false });
      const fallbackShortsResult =
        primaryShortsResult.error &&
        isMissingPostMuxColumnsError(primaryShortsResult.error)
          ? await supabase
              .from(POSTS_TABLE)
              .select(POST_SELECT_FIELDS_LEGACY)
              .eq("user_id", organizerId)
              .eq("media_type", "video")
              .order("created_at", { ascending: false })
          : null;
      if (!active) return;
      const shortsRows = (fallbackShortsResult?.data ??
        primaryShortsResult.data) as UserPost[] | null;
      const shortsError = fallbackShortsResult?.error ?? primaryShortsResult.error;
      if (shortsError) {
        setOrganizerShortsStatus({
          type: "error",
          message: getSupabaseErrorMessage(shortsError),
        });
        setOrganizerShorts([]);
      } else {
        const canViewFollowerShorts =
          profileIsAdmin ||
          sessionUser?.id === organizerId ||
          followingOrganizerIds.includes(organizerId);
        const visibleShorts = getVisibleShortPosts(shortsRows ?? [], {
          includeHidden: profileIsAdmin || sessionUser?.id === organizerId,
          allowFollowersVisibility: canViewFollowerShorts,
        });
        const pinnedShortId = profileRow.pinned_short_post_id ?? null;
        const sortedShorts = [...visibleShorts].sort((left, right) => {
          if (pinnedShortId) {
            if (left.id === pinnedShortId) return -1;
            if (right.id === pinnedShortId) return 1;
          }
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
        });
        setOrganizerShorts(sortedShorts);
        setOrganizerShortsStatus({ type: "idle", message: "" });
      }
      setOrganizerFollowersStatus({ type: "loading", message: "" });
      const { data: followerRows, error: followersError } = await supabase
        .from(ORGANIZER_FOLLOWS_TABLE)
        .select("follower_id")
        .eq("organizer_id", organizerId);
      if (!active) return;
      if (followersError) {
        setOrganizerFollowersStatus({
          type: "error",
          message: getSupabaseErrorMessage(followersError),
        });
        setOrganizerFollowers([]);
        return;
      }
      const followerIds = (followerRows ?? [])
        .map((row) => row.follower_id)
        .filter(Boolean) as string[];
      if (!followerIds.length) {
        setOrganizerFollowers([]);
        setOrganizerFollowersStatus({ type: "idle", message: "" });
        return;
      }
      const { data: followerProfiles, error: followerProfilesError } =
        await supabase
          .from("profiles")
          .select(
            "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,is_organizer,bio"
          )
          .in("id", followerIds);
      if (!active) return;
      if (followerProfilesError) {
        setOrganizerFollowersStatus({
          type: "error",
          message: getSupabaseErrorMessage(followerProfilesError),
        });
        setOrganizerFollowers([]);
        return;
      }
      const orderMap = new Map(
        followerIds.map((id, index) => [id, index])
      );
      const sortedFollowers = (followerProfiles ?? []).sort((a, b) => {
        return (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0);
      }) as SearchProfile[];
      setOrganizerFollowers(sortedFollowers);
      setOrganizerFollowersStatus({ type: "idle", message: "" });
    })();
    return () => {
      active = false;
    };
  }, [
    activeOrganizerId,
    fetchOrganizerFollowStatus,
    fetchOrganizerFollowerCounts,
    followingOrganizerIds,
    getSupabaseErrorMessage,
    profileIsAdmin,
    route,
    sessionUser?.id,
    strings.searchEmpty,
  ]);


  function handleLocaleSelect(next: Locale) {
    if (next === locale) {
      setFooterLanguageOpen(false);
      return;
    }
    setLocale(next);
    setFooterLanguageOpen(false);
    setAuthState({ type: "idle", message: "" });
  }

  function updateEmail(value: string) {
    setEmail(value);
    if (authState.type !== "idle") {
      setAuthState({ type: "idle", message: "" });
    }
  }

  function updatePassword(value: string) {
    setPassword(value);
    if (authState.type !== "idle") {
      setAuthState({ type: "idle", message: "" });
    }
  }

  function updateConfirmPassword(value: string) {
    setConfirmPassword(value);
    if (authState.type !== "idle") {
      setAuthState({ type: "idle", message: "" });
    }
  }

  function resetProfileStatus() {
    if (profileStatus.type !== "idle") {
      setProfileStatus({ type: "idle", message: "" });
    }
  }

  function updateProfileName(value: string) {
    setProfileName(value);
    resetProfileStatus();
  }

  function updateProfileBirthDate(value: string) {
    setProfileBirthDate(value);
    resetProfileStatus();
  }

  function updateProfileGender(value: "" | "female" | "male" | "other") {
    setProfileGender(value);
    resetProfileStatus();
  }

  function updateProfileCountry(value: string) {
    setProfileCountry(value);
    resetProfileStatus();
  }

  function updateProfileCity(value: string) {
    setProfileCity(value);
    resetProfileStatus();
  }

  function updateProfileLanguage(value: Locale | "") {
    setProfileLanguage(value);
    resetProfileStatus();
  }

  function updateProfileLevel(value: LanguageLevel) {
    setProfileLevel(value);
    resetProfileStatus();
  }

  function toggleProfileLearningLanguage(value: Locale) {
    setProfileLearningLanguages((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
    resetProfileStatus();
  }

  function toggleProfilePracticeLanguage(value: Locale) {
    setProfilePracticeLanguages((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
    resetProfileStatus();
  }

  function toggleProfileTeachingLanguage(value: Locale) {
    setProfileTeachesLanguages((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
    resetProfileStatus();
  }

  function updateProfileBio(value: string) {
    setProfileBio(value);
    resetProfileStatus();
  }

  function updateProfileInterestInput(value: string) {
    setProfileInterestInput(value);
  }

  function addProfileInterest(raw?: string) {
    const trimmed = (raw ?? profileInterestInput).trim();
    if (!trimmed) return;
    const presetKey = matchInterestPreset(trimmed, locale);
    const value = presetKey ?? trimmed;
    setProfileInterests((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setProfileInterestInput("");
    resetProfileStatus();
  }

  function removeProfileInterest(value: string) {
    setProfileInterests((prev) => prev.filter((item) => item !== value));
    resetProfileStatus();
  }

  function handleInterestKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addProfileInterest();
    }
  }

  function toggleProfileInterestPreset(value: string) {
    setProfileInterests((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
    resetProfileStatus();
  }

  function updateProfileTelegram(value: string) {
    setProfileTelegram(value);
    resetProfileStatus();
  }

  function updateProfileInstagram(value: string) {
    setProfileInstagram(value);
    resetProfileStatus();
  }

  function updateProfileCoverPhoto(file: File | null) {
    setProfileCoverPhoto(file);
    resetProfileStatus();
  }

  function updateProfilePhoto(file: File | null) {
    setProfilePhoto(file);
    resetProfileStatus();
  }

  function toggleOrganizerApplyLanguage(lang: Locale) {
    setOrganizerApplyLanguages((prev) =>
      prev.includes(lang) ? prev.filter((item) => item !== lang) : [...prev, lang]
    );
  }

  function getEventImageUrls(event: EventRecord) {
    if (Array.isArray(event.image_urls) && event.image_urls.length) {
      return event.image_urls.filter(Boolean);
    }
    return event.image_url ? [event.image_url] : [];
  }

  function revokeEventImagePreviews(previews: string[]) {
    previews.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });
  }

  function handleEventImageChange(event: ChangeEvent<HTMLInputElement>) {
    if (eventCropOpen) {
      closeEventImageEditor();
    }
    const files = Array.from(event.target.files ?? []);
    const imageFiles = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, EVENT_IMAGE_LIMIT);
    revokeEventImagePreviews(eventImagePreviews);
    setEventImageFiles(imageFiles);
    setEventRemoveImage(false);
    if (imageFiles.length === 0) {
      setEventImagePreviews(eventExistingImageUrls);
      return;
    }
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setEventImagePreviews(previews);
  }

  function handleRemoveEventImageAt(index: number) {
    if (eventCropOpen) {
      closeEventImageEditor();
    }
    const preview = eventImagePreviews[index];
    if (preview) {
      revokeEventImagePreviews([preview]);
    }
    if (eventImageFiles.length > 0) {
      const nextFiles = eventImageFiles.filter((_, idx) => idx !== index);
      const nextPreviews = eventImagePreviews.filter((_, idx) => idx !== index);
      setEventImageFiles(nextFiles);
      if (nextFiles.length === 0) {
        setEventImagePreviews(eventExistingImageUrls);
        setEventRemoveImage(false);
      } else {
        setEventImagePreviews(nextPreviews);
      }
      if (eventImageInputRef.current) {
        eventImageInputRef.current.value = "";
      }
      return;
    }
    const removedUrl = eventExistingImageUrls[index];
    const nextExisting = eventExistingImageUrls.filter(
      (_, idx) => idx !== index
    );
    if (removedUrl) {
      setEventRemovedImageUrls((prev) =>
        prev.includes(removedUrl) ? prev : [...prev, removedUrl]
      );
    }
    setEventExistingImageUrls(nextExisting);
    setEventImagePreviews(nextExisting);
    setEventRemoveImage(nextExisting.length === 0);
  }

  function handleRemoveEventImage() {
    if (eventCropOpen) {
      closeEventImageEditor();
    }
    revokeEventImagePreviews(eventImagePreviews);
    setEventImageFiles([]);
    if (eventExistingImageUrls.length) {
      setEventRemovedImageUrls((prev) => {
        const next = new Set(prev);
        eventExistingImageUrls.forEach((url) => next.add(url));
        return Array.from(next);
      });
    }
    setEventExistingImageUrls([]);
    setEventImagePreviews([]);
    setEventRemoveImage(true);
    if (eventImageInputRef.current) {
      eventImageInputRef.current.value = "";
    }
  }

  function resetPostActionStatus() {
    if (postActionStatus.type !== "idle") {
      setPostActionStatus({ type: "idle", message: "" });
    }
  }

  function updatePostCaption(value: string) {
    setPostCaption(value);
    resetPostActionStatus();
  }

  function clearPostCoverSelection() {
    if (postCoverPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(postCoverPreviewUrl);
    }
    setPostCoverFile(null);
    setPostCoverPreviewUrl(null);
    if (postCoverInputRef.current) {
      postCoverInputRef.current.value = "";
    }
  }

  function handlePostFileChange(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0] ?? null;
      if (file && !canUploadPostMedia) {
        if (postPreviewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(postPreviewUrl);
        }
        clearPostCoverSelection();
        setPostFile(null);
        setPostPreviewUrl(null);
        event.target.value = "";
        setPostActionStatus({ type: "error", message: mediaPostAccessMessage });
        return;
      }
      if (postPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(postPreviewUrl);
      }
    clearPostCoverSelection();
    setPostFile(file);
    resetPostActionStatus();
    if (!file) {
      setPostPreviewUrl(null);
      return;
    }
      const previewUrl = URL.createObjectURL(file);
      setPostPreviewUrl(previewUrl);
    }
  
  function handlePostCoverFileChange(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0] ?? null;
      if (file && !canUploadPostMedia) {
        clearPostCoverSelection();
        event.target.value = "";
        setPostActionStatus({ type: "error", message: mediaPostAccessMessage });
        return;
      }
      clearPostCoverSelection();
      resetPostActionStatus();
      if (!file) return;
    setPostCoverFile(file);
    setPostCoverPreviewUrl(URL.createObjectURL(file));
  }

  function setError(message: string) {
    setAuthState({ type: "error", message });
  }

  function handleContinueAsGuest() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_MODE_KEY, "1");
    }
    setGuestMode(true);
    setAuthState({ type: "idle", message: "" });
    navigate("search");
  }

  async function handleBecomeOrganizer() {
    if (guestMode) {
      redirectToLoginWithIntent({ route: "events" });
      return;
    }
    const userName =
      profileName ||
      (typeof sessionUser?.user_metadata?.full_name === "string"
        ? sessionUser.user_metadata.full_name
        : "");
    const defaultLanguage =
      profileLanguage && isSupportedLocale(profileLanguage)
        ? profileLanguage
        : "";
    setOrganizerApplyType("");
    setOrganizerApplyName(userName);
    setOrganizerApplyOrgName("");
    setOrganizerApplyOrgId("");
    setOrganizerApplyContactName("");
    setOrganizerApplyPhone("");
    setOrganizerApplyEmail(sessionUser?.email ?? "");
    setOrganizerApplyWebsite("");
    setOrganizerApplyFacebook("");
    setOrganizerApplyInstagram("");
    setOrganizerApplyTiktok("");
    setOrganizerApplyLinkedIn("");
    setOrganizerApplyCity(profileCity);
    setOrganizerApplyCountry(profileCountry);
    setOrganizerApplyLanguages(defaultLanguage ? [defaultLanguage] : []);
    setOrganizerApplyExperience("");
    setOrganizerApplyAbout("");
    setOrganizerApplyStatus({ type: "idle", message: "" });
    setOrganizerApplyOpen(true);
  }

  function handleOrganizerApplyClose() {
    setOrganizerApplyOpen(false);
    setOrganizerApplyStatus({ type: "idle", message: "" });
  }

  async function handleOrganizerApplySubmit() {
    if (organizerApplyStatus.type === "loading") return;
    if (!organizerApplyType) {
      setOrganizerApplyStatus({
        type: "error",
        message: strings.organizerApplyRequired,
      });
      return;
    }
    const needsPerson = organizerApplyType === "person";
    const missing =
      (needsPerson && !organizerApplyName.trim()) ||
      (!needsPerson && !organizerApplyOrgName.trim()) ||
      (!needsPerson && !organizerApplyContactName.trim()) ||
      (!needsPerson && !organizerApplyOrgId.trim()) ||
      !organizerApplyEmail.trim() ||
      !organizerApplyExperience.trim() ||
      !organizerApplyAbout.trim() ||
      !organizerApplyCity.trim() ||
      !organizerApplyCountry.trim() ||
      organizerApplyLanguages.length === 0;
    if (missing) {
      setOrganizerApplyStatus({
        type: "error",
        message: strings.organizerApplyRequired,
      });
      return;
    }
    const websiteValue = normalizeUrl(organizerApplyWebsite.trim());
    const facebookValue = normalizeUrl(organizerApplyFacebook.trim());
    const instagramValue = normalizeUrl(organizerApplyInstagram.trim());
    const tiktokValue = normalizeUrl(organizerApplyTiktok.trim());
    const linkedinValue = normalizeUrl(organizerApplyLinkedIn.trim());
    if (organizerApplyWebsite.trim() && !isValidUrl(websiteValue)) {
      setOrganizerApplyStatus({
        type: "error",
        message: `${strings.organizerApplyInvalidUrl}: ${strings.organizerApplyWebsiteLabel}`,
      });
      return;
    }
    const socialChecks = [
      {
        value: facebookValue,
        label: strings.organizerApplyFacebookLabel,
        domains: ["facebook.com", "fb.com"],
      },
      {
        value: instagramValue,
        label: strings.organizerApplyInstagramLabel,
        domains: ["instagram.com"],
      },
      {
        value: tiktokValue,
        label: strings.organizerApplyTiktokLabel,
        domains: ["tiktok.com"],
      },
      {
        value: linkedinValue,
        label: strings.organizerApplyLinkedInLabel,
        domains: ["linkedin.com"],
      },
    ];
    const invalidSocial = socialChecks.find(
      (item) => item.value && !isAllowedSocialUrl(item.value, item.domains)
    );
    if (invalidSocial) {
      setOrganizerApplyStatus({
        type: "error",
        message: `${strings.organizerApplyInvalidUrl}: ${invalidSocial.label}`,
      });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setOrganizerApplyStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setOrganizerApplyStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = data.session?.user;
      if (!user) {
        redirectToLoginWithIntent({ route: "events" });
        return;
      }
      const payload = {
        user_id: user.id,
        application_type: organizerApplyType,
        full_name: needsPerson ? organizerApplyName.trim() : null,
        org_name: needsPerson ? null : organizerApplyOrgName.trim(),
        org_id: needsPerson ? null : organizerApplyOrgId.trim(),
        contact_name: needsPerson
          ? organizerApplyName.trim()
          : organizerApplyContactName.trim(),
        phone: organizerApplyPhone.trim() || null,
        email: organizerApplyEmail.trim(),
        website: websiteValue || null,
        facebook_url: facebookValue || null,
        instagram_url: instagramValue || null,
        tiktok_url: tiktokValue || null,
        linkedin_url: linkedinValue || null,
        city: organizerApplyCity.trim(),
        country: organizerApplyCountry.trim(),
        languages: organizerApplyLanguages.length
          ? organizerApplyLanguages.join(",")
          : null,
        experience: organizerApplyExperience.trim() || null,
        about: organizerApplyAbout.trim(),
        status: "pending",
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from(ORGANIZER_APPLICATIONS_TABLE)
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      setOrganizerApplyStatus({
        type: "success",
        message: strings.organizerApplySuccess,
      });
      handleOrganizerApplyClose();
      if (typeof window !== "undefined") {
        window.alert(strings.organizerApplySuccess);
      }
    } catch (error) {
      setOrganizerApplyStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  function resetEventForm() {
    closeEventImageEditor();
    revokeEventImagePreviews(eventImagePreviews);
    setEventEditingId(null);
    setEventExistingImageUrls([]);
    setEventRemovedImageUrls([]);
    setEventRemoveImage(false);
    setEventStatus({ type: "idle", message: "" });
    setEventTitle("");
    setEventDescription("");
    setEventImageFiles([]);
    setEventImagePreviews([]);
    if (eventImageInputRef.current) {
      eventImageInputRef.current.value = "";
    }
    setEventCity("");
    setEventCountry("");
    setEventAddress("");
    setEventOnlineUrl("");
    setEventLanguage("");
    setEventLevelFrom("");
    setEventLevelTo("");
    setEventDate("");
    setEventTime("");
    setEventRecurrence("none");
    setEventRecurrenceCount(String(EVENT_RECURRENCE_DEFAULT_OCCURRENCES));
    setEventDuration("");
    setEventPaymentType("");
    setEventPrice("");
    setEventMaxParticipants("");
    setEventFormat("");
    setAdminEventOrganizerId("");
  }

  function handleEventLevelFromChange(value: LanguageLevel) {
    setEventLevelFrom(value);
    if (!value) return;
    if (!eventLevelTo) {
      setEventLevelTo(value);
      return;
    }
    if (getLevelIndex(value) > getLevelIndex(eventLevelTo)) {
      setEventLevelTo(value);
    }
  }

  function handleEventLevelToChange(value: LanguageLevel) {
    setEventLevelTo(value);
    if (!value) return;
    if (!eventLevelFrom) {
      setEventLevelFrom(value);
      return;
    }
    if (getLevelIndex(value) < getLevelIndex(eventLevelFrom)) {
      setEventLevelFrom(value);
    }
  }

  function handleEventPaymentTypeChange(value: EventPaymentType) {
    setEventPaymentType(value);
    if (value !== "paid") {
      setEventPrice("");
    }
  }

  function handleEventRecurrenceChange(value: EventRecurrence) {
    setEventRecurrence(value);
    if (value === "none") return;
    if (!eventRecurrenceCount) {
      setEventRecurrenceCount(String(EVENT_RECURRENCE_DEFAULT_OCCURRENCES));
    }
    const nextDate = getDateForRecurrence(value);
    if (nextDate) {
      setEventDate(nextDate);
    }
    if (!eventTime) {
      setEventTime(EVENT_DEFAULT_TIME);
    }
  }

  function handleEditEvent(event: EventRecord) {
    closeEventImageEditor();
    revokeEventImagePreviews(eventImagePreviews);
    const existingUrls = getEventImageUrls(event);
    setEventEditingId(event.id);
    setEventTitle(event.title ?? "");
    setEventDescription(event.description ?? "");
    setEventCity(event.city ?? "");
    setEventCountry(event.country ?? "");
    setEventAddress(event.address ?? "");
    setEventOnlineUrl(event.online_url ?? "");
    setEventLanguage(
      event.language && isSupportedLocale(event.language) ? event.language : ""
    );
    const parsedRange = parseLevelRange(event.language_level);
    const normalizedRange = normalizeLevelRange(
      isLanguageLevel(event.language_level_min ?? null)
        ? (event.language_level_min as LanguageLevel)
        : parsedRange.from,
      isLanguageLevel(event.language_level_max ?? null)
        ? (event.language_level_max as LanguageLevel)
        : parsedRange.to
    );
    setEventLevelFrom(normalizedRange.from);
    setEventLevelTo(normalizedRange.to);
    setEventDate(event.event_date ?? "");
    setEventTime(event.event_time ?? "");
    setEventRecurrence("none");
    setEventRecurrenceCount(String(EVENT_RECURRENCE_DEFAULT_OCCURRENCES));
    const durationValue =
      event.duration_minutes &&
      EVENT_DURATIONS.includes(event.duration_minutes as typeof EVENT_DURATIONS[number])
        ? (event.duration_minutes as EventDuration)
        : "";
    setEventDuration(durationValue);
    setEventPaymentType(event.is_paid ? "paid" : "free");
    setEventPrice(
      typeof event.price_amount === "number" && Number.isFinite(event.price_amount)
        ? String(event.price_amount)
        : ""
    );
    setEventMaxParticipants(
      typeof event.max_participants === "number" &&
        Number.isFinite(event.max_participants)
        ? String(event.max_participants)
        : ""
    );
    setEventFormat(event.format ?? "");
    setEventExistingImageUrls(existingUrls);
    setEventRemovedImageUrls([]);
    setEventRemoveImage(false);
    setEventImageFiles([]);
    setEventImagePreviews(existingUrls);
    if (eventImageInputRef.current) {
      eventImageInputRef.current.value = "";
    }
    setEventStatus({ type: "idle", message: "" });
    setAdminEventOrganizerId(event.organizer_id ?? "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleAdminUpdateUserRole(
    userId: string,
    updates: Partial<Pick<SearchProfile, "is_organizer" | "is_teacher" | "is_admin">>
  ) {
    if (!profileIsAdmin) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminUsersStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setAdminUsersStatus({ type: "loading", message: "" });
    try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", userId)
          .select(
            "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,bio,is_organizer,is_teacher,is_admin"
          )
          .maybeSingle();
      if (error) throw error;
        if (data) {
          setAdminUsers((prev) =>
            prev.map((profile) =>
              profile.id === data.id ? (data as SearchProfile) : profile
            )
          );
          if (sessionUser?.id === data.id) {
            setProfileIsOrganizer(Boolean(data.is_organizer));
            setProfileIsTeacher(Boolean(data.is_teacher));
            setProfileIsAdmin(Boolean(data.is_admin));
          }
        }
      setAdminUsersStatus({ type: "idle", message: "" });
    } catch (error) {
      setAdminUsersStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleAdminApproveApplication(
    application: OrganizerApplication
  ) {
    if (!profileIsAdmin || adminApplicationsStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminApplicationsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setAdminApplicationsStatus({ type: "loading", message: "" });
    try {
      const { data, error } = await supabase
        .from(ORGANIZER_APPLICATIONS_TABLE)
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", application.id)
        .select(
          "id,user_id,application_type,full_name,org_name,org_id,contact_name,phone,email,website,city,country,languages,experience,about,status,created_at,updated_at"
        )
        .maybeSingle();
      if (error) throw error;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_organizer: true, updated_at: new Date().toISOString() })
        .eq("id", application.user_id);
      if (profileError) throw profileError;
      if (data) {
        setAdminApplications((prev) =>
          prev.map((item) =>
            item.id === data.id ? (data as OrganizerApplication) : item
          )
        );
      } else {
        setAdminApplications((prev) =>
          prev.map((item) =>
            item.id === application.id
              ? { ...item, status: "approved" }
              : item
          )
        );
      }
      setAdminUsers((prev) =>
        prev.map((profile) =>
          profile.id === application.user_id
            ? { ...profile, is_organizer: true }
            : profile
        )
      );
      if (sessionUser?.id === application.user_id) {
        setProfileIsOrganizer(true);
      }
      setAdminApplicationsStatus({ type: "idle", message: "" });
    } catch (error) {
      setAdminApplicationsStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleAdminRejectApplication(
    application: OrganizerApplication
  ) {
    if (!profileIsAdmin || adminApplicationsStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminApplicationsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setAdminApplicationsStatus({ type: "loading", message: "" });
    try {
      const { data, error } = await supabase
        .from(ORGANIZER_APPLICATIONS_TABLE)
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", application.id)
        .select(
          "id,user_id,application_type,full_name,org_name,org_id,contact_name,phone,email,website,city,country,languages,experience,about,status,created_at,updated_at"
        )
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setAdminApplications((prev) =>
          prev.map((item) =>
            item.id === data.id ? (data as OrganizerApplication) : item
          )
        );
      } else {
        setAdminApplications((prev) =>
          prev.map((item) =>
            item.id === application.id
              ? { ...item, status: "rejected" }
              : item
          )
        );
      }
      setAdminApplicationsStatus({ type: "idle", message: "" });
    } catch (error) {
      setAdminApplicationsStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleDeleteEvent(event: EventRecord) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEventStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(strings.eventDeleteConfirm);
      if (!confirmed) return;
    }
    setEventStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
      const eventImages = getEventImageUrls(event);
      if (eventImages.length) {
        const groupedByBucket = new Map<string, string[]>();
        for (const url of eventImages) {
          const target = getStorageObjectFromPublicUrl(url);
          if (!target) continue;
          const existing = groupedByBucket.get(target.bucket) ?? [];
          existing.push(target.path);
          groupedByBucket.set(target.bucket, existing);
        }
        for (const [bucket, paths] of groupedByBucket) {
          if (!paths.length) continue;
          await supabase.storage.from(bucket).remove(paths);
        }
      }
      setEventsList((prev) => prev.filter((item) => item.id !== event.id));
      if (eventEditingId === event.id) {
        resetEventForm();
      }
      setEventStatus({ type: "idle", message: "" });
    } catch (error) {
      setEventStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleSaveEvent() {
    if (eventStatus.type === "loading") return;
    const isAdminContext = profileIsAdmin && route === "admin";
    const canManageEvents = profileIsOrganizer || isAdminContext;
    if (!canManageEvents) {
      setEventStatus({
        type: "error",
        message: strings.userActionOrganizer,
      });
      return;
    }
    const isEditing = Boolean(eventEditingId);
    const shouldCreateRecurringSeries = !isEditing && eventRecurrence !== "none";

    const effectiveDate =
      eventDate ||
      (eventRecurrence !== "none" ? getDateForRecurrence(eventRecurrence) : "");
    const effectiveTime =
      eventTime || (eventRecurrence !== "none" ? EVENT_DEFAULT_TIME : "");
    if (eventRecurrence !== "none") {
      if (!eventDate && effectiveDate) {
        setEventDate(effectiveDate);
      }
      if (!eventTime && effectiveTime) {
        setEventTime(effectiveTime);
      }
    }

    let recurrenceOccurrences = 1;
    if (shouldCreateRecurringSeries) {
      const parsedOccurrences = parsePositiveInteger(eventRecurrenceCount);
      if (
        !parsedOccurrences ||
        parsedOccurrences > EVENT_RECURRENCE_MAX_OCCURRENCES
      ) {
        setEventStatus({
          type: "error",
          message: eventScheduleText.recurrenceCountError,
        });
        return;
      }
      recurrenceOccurrences = parsedOccurrences;
    }

    if (
      !eventTitle.trim() ||
      !eventDescription.trim() ||
      !effectiveDate ||
      !effectiveTime ||
      !eventDuration ||
      !eventPaymentType ||
      !eventFormat ||
      !eventCity.trim() ||
      !eventCountry.trim() ||
      !eventLanguage ||
      !eventLevelFrom ||
      !eventLevelTo
    ) {
      setEventStatus({ type: "error", message: strings.errorRequired });
      return;
    }
    if (eventFormat === "offline" && !eventAddress.trim()) {
      setEventStatus({ type: "error", message: strings.errorRequired });
      return;
    }
    if (eventFormat === "online" && !eventOnlineUrl.trim()) {
      setEventStatus({ type: "error", message: strings.errorRequired });
      return;
    }
    const maxParticipants = parsePositiveInteger(eventMaxParticipants);
    if (!maxParticipants) {
      setEventStatus({ type: "error", message: strings.errorRequired });
      return;
    }
    const priceAmount =
      eventPaymentType === "paid" ? parsePositiveDecimal(eventPrice) : null;
    if (eventPaymentType === "paid" && !priceAmount) {
      setEventStatus({ type: "error", message: strings.errorRequired });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEventStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setEventStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = data.session?.user;
      if (!user) {
        setEventStatus({
          type: "error",
          message: strings.profileAuthRequired,
        });
        return;
      }
      const adminOrganizerId = isAdminContext
        ? adminEventOrganizerId.trim()
        : "";
      const existingImageUrls = eventExistingImageUrls;
      let nextImageUrls = existingImageUrls;
      if (eventImageFiles.length > 0) {
        const uploads: string[] = [];
        for (const file of eventImageFiles.slice(0, EVENT_IMAGE_LIMIT)) {
          const extension = file.name.split(".").pop() ?? "jpg";
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${extension}`;
          const filePath = `${user.id}/events/${fileName}`;
          let publicUrl: string | null = null;
          let lastUploadError: unknown = null;
          for (const bucket of EVENT_IMAGE_UPLOAD_BUCKETS) {
            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, {
                upsert: true,
                contentType: file.type || "image/jpeg",
              });
            if (uploadError) {
              lastUploadError = uploadError;
              if (
                bucket === EVENTS_BUCKET &&
                isStorageBucketNotFoundError(uploadError)
              ) {
                continue;
              }
              throw uploadError;
            }
            const { data: publicData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            if (publicData.publicUrl) {
              publicUrl = publicData.publicUrl;
            }
            break;
          }
          if (!publicUrl) {
            throw lastUploadError ?? new Error("Event image upload failed.");
          }
          uploads.push(publicUrl);
        }
        nextImageUrls = uploads;
      } else if (eventRemoveImage) {
        nextImageUrls = [];
      }
      const nextImageUrl = nextImageUrls[0] ?? null;
      const normalizedLevels = normalizeLevelRange(eventLevelFrom, eventLevelTo);
      const levelRangeValue = formatLevelRange(
        normalizedLevels.from,
        normalizedLevels.to
      );
      const basePayload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        image_url: nextImageUrl,
        image_urls: nextImageUrls.length ? nextImageUrls : null,
        city: eventCity.trim() || null,
        country: eventCountry.trim() || null,
        address:
          eventFormat === "offline" ? eventAddress.trim() || null : null,
        online_url:
          eventFormat === "online" ? eventOnlineUrl.trim() || null : null,
        language: eventLanguage || null,
        language_level: levelRangeValue || null,
        language_level_min: normalizedLevels.from || null,
        language_level_max: normalizedLevels.to || null,
        event_date: effectiveDate || null,
        event_time: effectiveTime || null,
        duration_minutes: eventDuration || null,
        is_paid: eventPaymentType === "paid",
        price_amount: eventPaymentType === "paid" ? priceAmount : null,
        max_participants: maxParticipants,
        format: eventFormat || null,
      };
      const updatePayload =
        isAdminContext && adminOrganizerId
          ? { ...basePayload, organizer_id: adminOrganizerId }
          : basePayload;

      if (isEditing && eventEditingId) {
        const { data: updated, error } = await supabase
          .from("events")
          .update(updatePayload)
          .eq("id", eventEditingId)
          .select(EVENT_SELECT_FIELDS)
          .single();
        if (error) throw error;
        const savedEvent = updated as EventRecord;
        if (savedEvent) {
          setEventsList((prev) =>
            prev.map((item) => (item.id === savedEvent.id ? savedEvent : item))
          );
        }
      } else {
        const recurrenceDates = shouldCreateRecurringSeries
          ? buildRecurringEventDates(
              effectiveDate,
              eventRecurrence,
              recurrenceOccurrences
            )
          : [effectiveDate];
        if (!recurrenceDates.length) {
          setEventStatus({ type: "error", message: strings.errorRequired });
          return;
        }

        const recurrenceGroupId = shouldCreateRecurringSeries
          ? generateRecurrenceGroupId()
          : null;
        const targetOrganizerId = adminOrganizerId || user.id;
        const createdAt = new Date().toISOString();

        const payloads = recurrenceDates.map((dateValue, index) => ({
          ...updatePayload,
          organizer_id: targetOrganizerId,
          created_at: createdAt,
          event_date: dateValue,
          recurrence_group_id: recurrenceGroupId,
          recurrence_rule: shouldCreateRecurringSeries ? eventRecurrence : null,
          recurrence_occurrence: shouldCreateRecurringSeries ? index + 1 : null,
        }));

        const { data: insertedRows, error } = await supabase
          .from("events")
          .insert(payloads)
          .select(EVENT_SELECT_FIELDS);
        if (error) throw error;

        const savedEvents = (insertedRows ?? []) as EventRecord[];
        if (savedEvents.length) {
          const sortedSavedEvents = [...savedEvents].sort((a, b) => {
            const dateA = a.event_date ?? "";
            const dateB = b.event_date ?? "";
            return dateB.localeCompare(dateA);
          });
          setEventsList((prev) => [...sortedSavedEvents, ...prev]);
        }
      }

      const urlsToDelete = new Set(eventRemovedImageUrls);
      if (eventRemoveImage || eventImageFiles.length > 0) {
        existingImageUrls.forEach((url) => urlsToDelete.add(url));
      }
      if (urlsToDelete.size > 0) {
        const groupedByBucket = new Map<string, string[]>();
        for (const url of urlsToDelete) {
          const target = getStorageObjectFromPublicUrl(url);
          if (!target) continue;
          const existing = groupedByBucket.get(target.bucket) ?? [];
          existing.push(target.path);
          groupedByBucket.set(target.bucket, existing);
        }
        for (const [bucket, paths] of groupedByBucket) {
          if (!paths.length) continue;
          await supabase.storage.from(bucket).remove(paths);
        }
      }
      resetEventForm();
      setEventStatus({ type: "success", message: strings.eventSaved });
    } catch (error) {
      setEventStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleEventRsvp(nextStatus: "going" | "interested") {
    if (eventRsvpLoading || !eventDetails) return;
    if (guestMode) {
      redirectToLoginWithIntent({
        route: "event",
        eventId: eventDetails.id,
      });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (typeof window !== "undefined") {
        window.alert("Supabase is not configured.");
      }
      return;
    }
    try {
      setEventRsvpLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
      if (!user) {
        redirectToLoginWithIntent({
          route: "event",
          eventId: eventDetails.id,
        });
        return;
      }
      if (eventRsvpStatus === nextStatus) {
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventDetails.id)
          .eq("user_id", user.id);
        if (error) throw error;
        setEventRsvpStatus(null);
      } else {
        const nextPayload: {
          event_id: string;
          user_id: string;
          status: "going" | "interested";
          check_in_token?: string;
          checked_in_at?: null;
          checked_in_by?: null;
        } = {
          event_id: eventDetails.id,
          user_id: user.id,
          status: nextStatus,
        };
        if (nextStatus === "going") {
          nextPayload.check_in_token = generateCheckInToken();
          nextPayload.checked_in_at = null;
          nextPayload.checked_in_by = null;
        }
        let { error } = await supabase
          .from("event_rsvps")
          .upsert(nextPayload, { onConflict: "event_id,user_id" });
        if (error && isMissingColumnError(error, "check_in_token")) {
          const fallback = await supabase.from("event_rsvps").upsert(
            {
              event_id: eventDetails.id,
              user_id: user.id,
              status: nextStatus,
            },
            { onConflict: "event_id,user_id" }
          );
          error = fallback.error;
        }
        if (error) throw error;
        setEventRsvpStatus(nextStatus);
      }
      const rsvpResult = await fetchEventRsvps(eventDetails.id);
      if (rsvpResult) {
        setEventRsvps(rsvpResult.rsvps);
        setEventRsvpProfiles(rsvpResult.profiles);
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        window.alert(getSupabaseErrorMessage(error));
      }
    } finally {
      setEventRsvpLoading(false);
    }
  }

  async function updateEventParticipantCheckIn(
    userId: string,
    shouldCheckIn: boolean
  ) {
    if (!eventDetails?.id || !canManageEventCheckIn || !sessionUser?.id) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEventCheckInStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setEventCheckInUpdating((prev) => ({ ...prev, [userId]: true }));
    setEventCheckInStatus({ type: "idle", message: "" });
    try {
      const { data, error } = await supabase
        .from("event_rsvps")
        .update({
          checked_in_at: shouldCheckIn ? new Date().toISOString() : null,
          checked_in_by: shouldCheckIn ? sessionUser.id : null,
        })
        .eq("event_id", eventDetails.id)
        .eq("user_id", userId)
        .eq("status", "going")
        .select("user_id,status,check_in_token,checked_in_at,checked_in_by")
        .maybeSingle();
      if (error && isMissingColumnError(error, "checked_in_at")) {
        setEventCheckInStatus({
          type: "error",
          message:
            "The check-in columns are missing in event_rsvps. Run supabase/event_rsvps_qr_checkin.sql first.",
        });
        return;
      }
      if (error) throw error;
      if (!data) {
        setEventCheckInStatus({
          type: "error",
          message: eventCheckInText.qrOnlyGoing,
        });
        return;
      }
      const updatedRsvp = data as EventRsvpRecord;
      setEventRsvps((prev) =>
        prev.map((row) =>
          row.user_id === updatedRsvp.user_id
            ? {
                ...row,
                checked_in_at: updatedRsvp.checked_in_at ?? null,
                checked_in_by: updatedRsvp.checked_in_by ?? null,
                check_in_token: updatedRsvp.check_in_token ?? row.check_in_token ?? null,
              }
            : row
        )
      );
      setEventCheckInStatus({
        type: "success",
        message: shouldCheckIn
          ? eventCheckInText.qrCheckInMarked
          : eventCheckInText.qrCheckInUnmarked,
      });
    } catch (error) {
      setEventCheckInStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    } finally {
      setEventCheckInUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function handleEventCheckInByCode(rawValue: string) {
    if (eventCheckInLoading || !eventDetails?.id || !canManageEventCheckIn) return;
    const parsed = parseEventCheckInPayload(rawValue);
    if (!parsed?.token) {
      setEventCheckInStatus({ type: "error", message: eventCheckInText.qrNotFound });
      return;
    }
    if (parsed.eventId && parsed.eventId !== eventDetails.id) {
      setEventCheckInStatus({ type: "error", message: eventCheckInText.qrWrongEvent });
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEventCheckInStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setEventCheckInLoading(true);
    setEventCheckInStatus({ type: "idle", message: "" });
    try {
      let rsvpQuery = supabase
        .from("event_rsvps")
        .select("user_id,status,check_in_token,checked_in_at")
        .eq("event_id", eventDetails.id)
        .eq("check_in_token", parsed.token);
      if (parsed.userId) {
        rsvpQuery = rsvpQuery.eq("user_id", parsed.userId);
      }
      const { data: rsvpRow, error } = await rsvpQuery.maybeSingle();
      if (error && isMissingColumnError(error, "check_in_token")) {
        setEventCheckInStatus({
          type: "error",
          message:
            "The check-in token column is missing in event_rsvps. Run supabase/event_rsvps_qr_checkin.sql first.",
        });
        return;
      }
      if (error) throw error;
      if (!rsvpRow?.user_id) {
        setEventCheckInStatus({ type: "error", message: eventCheckInText.qrNotFound });
        return;
      }
      if (rsvpRow.status !== "going") {
        setEventCheckInStatus({
          type: "error",
          message: eventCheckInText.qrOnlyGoing,
        });
        return;
      }
      if (rsvpRow.checked_in_at) {
        setEventCheckInStatus({
          type: "success",
          message: eventCheckInText.qrCheckInAlready,
        });
        return;
      }
      await updateEventParticipantCheckIn(rsvpRow.user_id, true);
      setEventCheckInCode("");
    } catch (error) {
      setEventCheckInStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    } finally {
      setEventCheckInLoading(false);
    }
  }

  async function handleEventCheckInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleEventCheckInByCode(eventCheckInCode);
  }

  async function handleEventCheckInScanFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    if (!canManageEventCheckIn) return;
    const BarcodeDetectorCtor = (
      window as Window & {
        BarcodeDetector?: new (options?: {
          formats?: string[];
        }) => {
          detect: (
            source: ImageBitmapSource
          ) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;
    if (!BarcodeDetectorCtor || typeof createImageBitmap === "undefined") {
      setEventCheckInStatus({
        type: "error",
        message: eventCheckInText.qrScannerUnsupported,
      });
      return;
    }
    setEventQrScanLoading(true);
    setEventCheckInStatus({ type: "idle", message: "" });
    try {
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      const rawValue = results.find((item) => item.rawValue?.trim())?.rawValue ?? "";
      if (!rawValue.trim()) {
        setEventCheckInStatus({
          type: "error",
          message: eventCheckInText.qrScannerNoCode,
        });
        return;
      }
      setEventCheckInCode(rawValue);
      await handleEventCheckInByCode(rawValue);
    } catch (error) {
      setEventCheckInStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    } finally {
      setEventQrScanLoading(false);
    }
  }

  async function handleToggleOrganizerFollow(
    organizerId: string,
    intent?: { route: Route; eventId?: string; organizerId?: string }
  ) {
    if (!organizerId) return;
    if (guestMode || !sessionUser?.id) {
      redirectToLoginWithIntent(intent ?? { route: "search" });
      return;
    }
    if (sessionUser.id === organizerId) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (typeof window !== "undefined") {
        window.alert("Supabase is not configured.");
      }
      return;
    }
    const isFollowing = organizerFollowMap[organizerId] === true;
    setOrganizerFollowLoading((prev) => ({ ...prev, [organizerId]: true }));
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from(ORGANIZER_FOLLOWS_TABLE)
          .delete()
          .eq("follower_id", sessionUser.id)
          .eq("organizer_id", organizerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(ORGANIZER_FOLLOWS_TABLE)
          .insert({
            follower_id: sessionUser.id,
            organizer_id: organizerId,
            created_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
      setOrganizerFollowMap((prev) => ({
        ...prev,
        [organizerId]: !isFollowing,
      }));
      setOrganizerFollowerCounts((prev) => {
        const current = prev[organizerId];
        if (current === undefined) return prev;
        const next = Math.max(0, current + (isFollowing ? -1 : 1));
        return { ...prev, [organizerId]: next };
      });
      setFollowingCount((prev) => Math.max(0, prev + (isFollowing ? -1 : 1)));
      if (routeRef.current === "me") {
        void refreshFollowingOrganizers();
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        window.alert(getSupabaseErrorMessage(error));
      }
    } finally {
      setOrganizerFollowLoading((prev) => ({
        ...prev,
        [organizerId]: false,
      }));
    }
  }

  const runSearch = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSearchStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setSearchTouched(true);
    setSearchStatus({ type: "loading", message: "" });
    const queryValue = searchQuery.trim();
    const cityValue = searchCity.trim().toLowerCase();
    const levelValue = searchLevel;
    const languageValue = searchLanguage;
    const dateValue = searchDate;
    const formatValue = searchFormat;
    try {
      let profileQuery = supabase
        .from("profiles")
        .select(
          "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,bio,is_organizer"
        )
        .limit(200);
      if (queryValue) {
        const safeQuery = queryValue.replace(/[,()]/g, " ");
        profileQuery = profileQuery.or(
          `full_name.ilike.%${safeQuery}%,bio.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%,country.ilike.%${safeQuery}%`
        );
      }
      const { data: profileRows, error: profileError } = await profileQuery;
      if (profileError) throw profileError;
      const profiles = (profileRows ?? []) as SearchProfile[];
      const filteredProfiles = profiles.filter((profile) => {
        if (cityValue) {
          const profileCity = profile.city?.toLowerCase() ?? "";
          if (!profileCity.includes(cityValue)) return false;
        }
        if (levelValue && profile.language_level !== levelValue) return false;
        if (languageValue && !profileMatchesLanguage(profile, languageValue)) {
          return false;
        }
        return true;
      });
      const organizers = filteredProfiles.filter((profile) => profile.is_organizer);
      const users = filteredProfiles.filter((profile) => !profile.is_organizer);

      let eventsQuery = supabase
        .from("events")
        .select(EVENT_SELECT_FIELDS)
        .order("event_date", { ascending: true })
        .limit(200);
      if (queryValue) {
        const safeQuery = queryValue.replace(/[,()]/g, " ");
        eventsQuery = eventsQuery.or(
          `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
        );
      }
      if (dateValue) {
        eventsQuery = eventsQuery.eq("event_date", dateValue);
      }
      if (cityValue) {
        eventsQuery = eventsQuery.ilike("city", `%${cityValue}%`);
      }
      if (languageValue) {
        eventsQuery = eventsQuery.eq("language", languageValue);
      }
      if (formatValue) {
        eventsQuery = eventsQuery.eq("format", formatValue);
      }
      const { data: eventsRows, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;
      const events = (eventsRows ?? []) as EventRecord[];
      const filteredEvents = levelValue
        ? events.filter((event) => isEventLevelMatch(event, levelValue))
        : events;
      const organizerIds = Array.from(
        new Set(filteredEvents.map((event) => event.organizer_id).filter(Boolean))
      ) as string[];
      let eventProfiles: Record<string, SearchProfile> = {};
      if (organizerIds.length) {
        const { data: eventProfilesRows, error: eventProfilesError } =
          await supabase
            .from("profiles")
            .select(
              "id,full_name,avatar_url,city,country,language,language_level,learning_languages,practice_languages,is_organizer"
            )
            .in("id", organizerIds);
        if (eventProfilesError) throw eventProfilesError;
        eventProfiles = (eventProfilesRows ?? []).reduce(
          (acc, profile) => {
            acc[profile.id] = profile as SearchProfile;
            return acc;
          },
          {} as Record<string, SearchProfile>
        );
      }

      setSearchResults({
        events: filteredEvents,
        organizers,
        users,
      });
      setSearchEventProfiles(eventProfiles);
      setSearchStatus({ type: "idle", message: "" });
    } catch (error) {
      setSearchStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }, [
    searchCity,
    searchDate,
    searchLanguage,
    searchLevel,
    searchQuery,
    searchFormat,
    getSupabaseErrorMessage,
  ]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchCity("");
    setSearchLanguage("");
    setSearchLevel("");
    setSearchDate("");
    setSearchFormat("");
    setSearchResults({ events: [], organizers: [], users: [] });
    setSearchEventProfiles({});
    setSearchStatus({ type: "idle", message: "" });
    setSearchTouched(false);
  }, []);

  useEffect(() => {
    if (route !== "search") return;
    void runSearch();
  }, [route, runSearch]);

  useEffect(() => {
    if (route !== "search") return;
    const organizerIds = searchResults.organizers
      .map((profile) => profile.id)
      .filter(Boolean);
    if (!organizerIds.length) return;
    let active = true;
    fetchOrganizerFollowStatus(organizerIds).then((map) => {
      if (!active) return;
      if (Object.keys(map).length === 0) return;
      setOrganizerFollowMap((prev) => ({ ...prev, ...map }));
    });
    return () => {
      active = false;
    };
  }, [fetchOrganizerFollowStatus, route, searchResults.organizers]);

  useEffect(() => {
    if (route !== "search") return;
    const organizerIds = searchResults.organizers
      .map((profile) => profile.id)
      .filter(Boolean);
    if (!organizerIds.length) return;
    let active = true;
    fetchOrganizerFollowerCounts(organizerIds).then((map) => {
      if (!active) return;
      if (Object.keys(map).length === 0) return;
      setOrganizerFollowerCounts((prev) => ({ ...prev, ...map }));
    });
    return () => {
      active = false;
    };
  }, [fetchOrganizerFollowerCounts, route, searchResults.organizers]);

  useEffect(() => {
    if (!sessionUser?.id || !profileIsOrganizer) return;
    let active = true;
    fetchOrganizerFollowerCounts([sessionUser.id]).then((map) => {
      if (!active) return;
      if (map[sessionUser.id] === undefined) return;
      setOrganizerFollowerCounts((prev) => ({
        ...prev,
        [sessionUser.id]: map[sessionUser.id],
      }));
    });
    return () => {
      active = false;
    };
  }, [fetchOrganizerFollowerCounts, profileIsOrganizer, sessionUser?.id]);

  useEffect(() => {
    if (route !== "me") return;
    void refreshFollowingOrganizers();
  }, [refreshFollowingOrganizers, route]);

  const handlePostAuthRedirect = useCallback(
    async (user: SessionUser) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      let profileData: ProfileRecord | null = null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name,birth_date,gender,country,city,language,avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        profileData = data;
      } catch {
        navigate("profile");
        return;
      }

      const complete = isProfileComplete(profileData);
      let preferredRoute: Route | null = null;
      let storedEventId: string | null = null;
      let storedOrganizerId: string | null = null;
      if (typeof window !== "undefined") {
        const storedRoute = window.localStorage.getItem(POST_AUTH_ROUTE_KEY);
        if (storedRoute) {
          window.localStorage.removeItem(POST_AUTH_ROUTE_KEY);
          const resolved = resolveRoute(storedRoute.toLowerCase());
          if (
            resolved &&
            resolved !== "login" &&
            resolved !== "register" &&
            resolved !== "forgot"
          ) {
            preferredRoute = resolved;
          }
        }
        storedEventId = window.localStorage.getItem(POST_AUTH_EVENT_KEY);
        if (storedEventId) {
          window.localStorage.removeItem(POST_AUTH_EVENT_KEY);
        }
        storedOrganizerId = window.localStorage.getItem(
          POST_AUTH_ORGANIZER_KEY
        );
        if (storedOrganizerId) {
          window.localStorage.removeItem(POST_AUTH_ORGANIZER_KEY);
        }
      }

      if (!complete) {
        navigate("profile");
        return;
      }

      if (preferredRoute === "event" && storedEventId) {
        goToEvent(storedEventId);
        return;
      }

      if (preferredRoute === "organizer" && storedOrganizerId) {
        goToOrganizer(storedOrganizerId);
        return;
      }

      navigate(preferredRoute ?? "me");
    },
    [goToEvent, goToOrganizer, navigate]
  );

  const upsertProfile = useCallback(
    async (user: { id: string; email?: string | null }) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const profile = {
        id: user.id,
        email: user.email ?? null,
        locale,
        updated_at: new Date().toISOString(),
      };
      await supabase.from("profiles").upsert(profile, { onConflict: "id" });
    },
    [locale]
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const session = data.session;
      if (!session?.user || !session.access_token) {
        setSessionUser(null);
        return;
      }
      const { data: userData, error: userError } = await supabase.auth.getUser(
        session.access_token
      );
      if (!active) return;
      if (userError || !userData.user) {
        await supabase.auth.signOut();
        if (!active) return;
        setSessionUser(null);
        setProfileIsOrganizer(false);
        setProfileIsTeacher(false);
        setProfileIsAdmin(false);
        setProfileIsPremium(false);
        profileLoaded.current = false;
        setAuthState({
          type: "error",
          message: "Your session expired. Please sign in again.",
        });
        navigate("login");
        return;
      }
      setSessionUser(userData.user);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSessionUser(session?.user ?? null);
      if (!session?.user) return;
      if (guestMode) {
        setGuestMode(false);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(GUEST_MODE_KEY);
        }
      }
      void upsertProfile(session.user);
      setAuthState({ type: "success", message: strings.successLogin });
      const currentRoute = routeRef.current;
      if (
        currentRoute === "login" ||
        currentRoute === "register" ||
        currentRoute === "forgot"
      ) {
        void handlePostAuthRedirect(session.user);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [guestMode, handlePostAuthRedirect, navigate, strings.successLogin, upsertProfile]);

  async function handlePrimaryAction() {
    if (authState.type === "loading") return;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const needsPassword = route !== "forgot";
    const needsConfirm = route === "register";
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || (needsPassword && !trimmedPassword)) {
      setError(strings.errorRequired);
      return;
    }

    if (needsPassword && trimmedPassword.length < 6) {
      setError(strings.errorPasswordShort);
      return;
    }

    if (needsConfirm && trimmedConfirm !== trimmedPassword) {
      setError(strings.errorPasswordMismatch);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setAuthState({ type: "loading", message: strings.loadingLabel });
    try {
      if (route === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (error) throw error;
        if (data.user) {
          await upsertProfile(data.user);
        }
        setAuthState({ type: "success", message: strings.successLogin });
        return;
      }

      if (route === "register") {
        const emailRedirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined;
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: { data: { locale }, emailRedirectTo },
        });
        if (error) throw error;
        if (data.user) {
          await upsertProfile(data.user);
        }
        setAuthState({ type: "success", message: strings.successRegister });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setAuthState({ type: "success", message: strings.successReset });
    } catch (error) {
      setAuthState({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleGmailLogin() {
    if (authState.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setAuthState({ type: "loading", message: strings.loadingLabel });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setAuthState({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleLogout() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (typeof window !== "undefined") {
        window.alert("Supabase is not configured.");
      }
      return;
    }
    try {
      await supabase.auth.signOut();
      } finally {
        setSessionUser(null);
        setProfileIsOrganizer(false);
        setProfileIsTeacher(false);
        setProfileIsAdmin(false);
        setProfileIsPremium(false);
        profileLoaded.current = false;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUEST_MODE_KEY);
      }
      setGuestMode(false);
      navigate("login");
    }
  }

  async function handlePostPublish() {
    if (postActionStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setPostActionStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    const trimmedCaption = postCaption.trim();
      if (!trimmedCaption && !postFile) {
        setPostActionStatus({
          type: "error",
          message: strings.errorRequired,
        });
        return;
      }
      if (postFile && !canUploadPostMedia) {
        setPostActionStatus({
          type: "error",
          message: mediaPostAccessMessage,
        });
        return;
      }
      setPostActionStatus({ type: "loading", message: strings.loadingLabel });
    let coverStoragePath: string | null = null;
      try {
        const { accessToken, user } = await getVerifiedSupabaseSession(supabase);
        if (!user) {
          setPostActionStatus({
            type: "error",
            message: strings.profileAuthRequired,
          });
        return;
      }
      let mediaUrl: string | null = null;
      let mediaType: PostMediaType = "text";
      let muxUploadId: string | null = null;
      let muxAssetId: string | null = null;
      let muxPlaybackId: string | null = null;
      let muxAssetStatus: string | null = null;
      let muxThumbnailUrl: string | null = null;
      let muxDurationSeconds: number | null = null;
      let muxAspectRatio: number | null = null;
      let coverUrl: string | null = null;
      if (postFile) {
        mediaType = postFile.type.startsWith("video/") ? "video" : "image";
        if (mediaType === "video") {
          setPostActionStatus({
            type: "loading",
            message: "Uploading video to Mux...",
          });
            const directUpload = await createMuxDirectUpload({
              origin:
                typeof window !== "undefined" ? window.location.origin : "http://localhost",
              filename: postFile.name,
              contentType: postFile.type || "video/mp4",
              userId: user.id,
            }, accessToken);
            muxUploadId = directUpload.uploadId;
            await uploadFileToMux(directUpload.uploadUrl, postFile);
            const muxStatus = await waitForMuxPlayback(directUpload.uploadId, {
              accessToken,
              onProgress: (status) => {
                const assetStatus = status.assetStatus ?? status.uploadStatus ?? "processing";
                setPostActionStatus({
                  type: "loading",
                  message: `Processing video in Mux... (${assetStatus})`,
              });
            },
          });
          muxAssetId = muxStatus.assetId;
          muxPlaybackId = muxStatus.playbackId;
          muxAssetStatus = muxStatus.assetStatus ?? "ready";
          muxThumbnailUrl = muxStatus.thumbnailUrl ?? null;
          muxDurationSeconds =
            typeof muxStatus.durationSeconds === "number"
              ? muxStatus.durationSeconds
              : null;
          muxAspectRatio =
            typeof muxStatus.aspectRatio === "number"
              ? muxStatus.aspectRatio
              : null;
          if (!muxPlaybackId) {
            throw new Error(
              "Mux did not return a playback ID. Check the Mux upload configuration."
            );
          }
          mediaUrl = buildMuxPlaybackUrl(muxPlaybackId);
          if (postCoverFile) {
            const extension = postCoverFile.name.split(".").pop() ?? "jpg";
            const fileName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}.${extension}`;
            coverStoragePath = `${user.id}/${POST_MEDIA_FOLDER}/${fileName}`;
            const { error: coverUploadError } = await supabase.storage
              .from(POSTS_BUCKET)
              .upload(coverStoragePath, postCoverFile, {
                upsert: false,
                contentType: postCoverFile.type || "image/jpeg",
              });
            if (coverUploadError) throw coverUploadError;
            const { data: coverPublicData } = supabase.storage
              .from(POSTS_BUCKET)
              .getPublicUrl(coverStoragePath);
            coverUrl = coverPublicData.publicUrl ?? null;
          } else {
            coverUrl = buildMuxThumbnailUrl(muxPlaybackId);
          }
        } else {
          const extension = postFile.name.split(".").pop() ?? "jpg";
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${extension}`;
          const filePath = `${user.id}/${POST_MEDIA_FOLDER}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from(POSTS_BUCKET)
            .upload(filePath, postFile, {
              upsert: false,
              contentType: postFile.type || "application/octet-stream",
            });
          if (uploadError) throw uploadError;
          const { data: publicData } = supabase.storage
            .from(POSTS_BUCKET)
            .getPublicUrl(filePath);
          mediaUrl = publicData.publicUrl ?? null;
        }
      }
      const insertPayload: Record<string, string | number | boolean | null> = {
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: trimmedCaption || null,
      };
      if (mediaType === "video") {
        insertPayload.cover_url = coverUrl;
        insertPayload.mux_upload_id = muxUploadId;
        insertPayload.mux_asset_id = muxAssetId;
        insertPayload.mux_playback_id = muxPlaybackId;
        insertPayload.mux_asset_status = muxAssetStatus;
        insertPayload.mux_thumbnail_url = muxThumbnailUrl;
        insertPayload.mux_duration_seconds = muxDurationSeconds;
        insertPayload.mux_aspect_ratio = muxAspectRatio;
        insertPayload.shorts_visibility = "public";
      }
      const { data: inserted, error } = await supabase
        .from(POSTS_TABLE)
        .insert(insertPayload)
        .select(mediaType === "video" ? POST_SELECT_FIELDS : POST_SELECT_FIELDS_LEGACY)
        .single();
      if (error) throw error;
      if (inserted) {
        setUserPosts((prev) => [((inserted as unknown) as UserPost), ...prev]);
      }
      setPostCaption("");
      setPostFile(null);
      clearPostCoverSelection();
      if (postPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(postPreviewUrl);
      }
      setPostPreviewUrl(null);
      if (postFileInputRef.current) {
        postFileInputRef.current.value = "";
      }
      setPostActionStatus({ type: "idle", message: "" });
    } catch (error) {
      if (coverStoragePath) {
        await supabase.storage.from(POSTS_BUCKET).remove([coverStoragePath]);
      }
      if (isAuthSessionError(error)) {
        await forceSessionReset(supabase);
        return;
      }
      setPostActionStatus({
        type: "error",
        message: isMissingPostMuxColumnsError(error)
          ? "Run supabase/posts_add_mux_video_fields.sql and supabase/posts_shorts_feed_features.sql before publishing enhanced video posts."
          : getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleDeletePost(post: UserPost) {
    if (postActionStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setPostActionStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(strings.userPostDeleteConfirm);
      if (!confirmed) return;
    }
    setPostActionStatus({ type: "loading", message: strings.loadingLabel });
      try {
        const { accessToken, user } = await getVerifiedSupabaseSession(supabase);
        if (!user) {
          setPostActionStatus({
            type: "error",
            message: strings.profileAuthRequired,
          });
        return;
      }
      if (post.media_url) {
        const path = getStoragePathFromUrl(post.media_url, POSTS_BUCKET);
        if (path) {
          const { error: removeError } = await supabase.storage
            .from(POSTS_BUCKET)
            .remove([path]);
          if (removeError) throw removeError;
        }
      }
      if (post.cover_url) {
        const coverPath = getStoragePathFromUrl(post.cover_url, POSTS_BUCKET);
        if (coverPath) {
          const { error: removeCoverError } = await supabase.storage
            .from(POSTS_BUCKET)
            .remove([coverPath]);
          if (removeCoverError) throw removeCoverError;
        }
      }
        if (post.mux_asset_id) {
          await deleteMuxAsset(post.mux_asset_id, accessToken);
        }
      const { error } = await supabase
        .from(POSTS_TABLE)
        .delete()
        .eq("id", post.id)
        .eq("user_id", user.id);
      if (error) throw error;
      if (profilePinnedShortPostId === post.id) {
        await supabase
          .from("profiles")
          .update({ pinned_short_post_id: null })
          .eq("id", user.id);
        setProfilePinnedShortPostId(null);
      }
      setUserPosts((prev) => prev.filter((item) => item.id !== post.id));
      setPostActionStatus({ type: "idle", message: "" });
    } catch (error) {
      if (isAuthSessionError(error)) {
        await forceSessionReset(supabase);
        return;
      }
      setPostActionStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  function startAdminPostEdit(post: UserPost) {
    setAdminPostEditId(post.id);
    setAdminPostCaption(post.caption ?? "");
  }

  function cancelAdminPostEdit() {
    setAdminPostEditId(null);
    setAdminPostCaption("");
  }

  async function handleAdminSavePost(post: UserPost) {
    if (!profileIsAdmin || adminPostsStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminPostsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setAdminPostsStatus({ type: "loading", message: "" });
    try {
      const { data, error } = await supabase
        .from(POSTS_TABLE)
        .update({ caption: adminPostCaption.trim() || null })
        .eq("id", post.id)
        .select(POST_SELECT_FIELDS)
        .single();
      if (error) throw error;
      setAdminPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? ((data as unknown) as UserPost) : item
        )
      );
      cancelAdminPostEdit();
      setAdminPostsStatus({ type: "idle", message: "" });
    } catch (error) {
      setAdminPostsStatus({
        type: "error",
        message: isMissingPostMuxColumnsError(error)
          ? "Run supabase/posts_add_mux_video_fields.sql and supabase/posts_shorts_feed_features.sql before editing enhanced video posts."
          : getSupabaseErrorMessage(error),
      });
    }
  }

  async function handlePinShortPost(postId: string | null) {
    if (!sessionUser?.id || !profileCanManageShorts || pinShortLoadingId) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setPinShortStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    setPinShortLoadingId(postId ?? "__clear__");
    setPinShortStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pinned_short_post_id: postId })
        .eq("id", sessionUser.id);
      if (error) {
        throw error;
      }
      setProfilePinnedShortPostId(postId);
      setOrganizerDetails((prev) =>
        prev && prev.id === sessionUser.id
          ? { ...prev, pinned_short_post_id: postId }
          : prev
      );
      setPinShortStatus({ type: "idle", message: "" });
    } catch (error) {
      setPinShortStatus({
        type: "error",
        message: isMissingPinnedShortColumnError(error)
          ? "Run supabase/posts_shorts_feed_features.sql before pinning organizer shorts."
          : getSupabaseErrorMessage(error),
      });
    } finally {
      setPinShortLoadingId(null);
    }
  }

  async function handleAdminDeletePost(post: UserPost) {
    if (!profileIsAdmin || adminPostsStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminPostsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(strings.userPostDeleteConfirm);
      if (!confirmed) return;
    }
      setAdminPostsStatus({ type: "loading", message: "" });
      try {
        const { accessToken } = await getVerifiedSupabaseSession(supabase);
        if (post.media_url) {
          const path = getStoragePathFromUrl(post.media_url, POSTS_BUCKET);
          if (path) {
            const { error: removeError } = await supabase.storage
              .from(POSTS_BUCKET)
            .remove([path]);
          if (removeError) throw removeError;
        }
        }
        if (post.cover_url) {
          const coverPath = getStoragePathFromUrl(post.cover_url, POSTS_BUCKET);
          if (coverPath) {
            const { error: removeCoverError } = await supabase.storage
              .from(POSTS_BUCKET)
              .remove([coverPath]);
            if (removeCoverError) throw removeCoverError;
          }
        }
        if (post.mux_asset_id) {
          await deleteMuxAsset(post.mux_asset_id, accessToken);
        }
      const { error } = await supabase
        .from(POSTS_TABLE)
        .delete()
        .eq("id", post.id);
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ pinned_short_post_id: null })
        .eq("pinned_short_post_id", post.id);
      setAdminPosts((prev) => prev.filter((item) => item.id !== post.id));
      if (adminPostEditId === post.id) {
        cancelAdminPostEdit();
      }
      setAdminPostsStatus({ type: "idle", message: "" });
    } catch (error) {
      if (isAuthSessionError(error)) {
        await forceSessionReset(supabase);
        return;
      }
      setAdminPostsStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleAdminToggleShortHidden(post: UserPost) {
    if (!profileIsAdmin || adminPostsStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminPostsStatus({
        type: "error",
        message: "Supabase is not configured.",
      });
      return;
    }
    const nextHidden = !(post.shorts_hidden === true);
    setAdminPostsStatus({ type: "loading", message: "" });
    try {
      const payload = nextHidden
        ? {
            shorts_hidden: true,
            shorts_hidden_reason: "Hidden from admin moderation",
          }
        : {
            shorts_hidden: false,
            shorts_hidden_reason: null,
          };
      const { data, error } = await supabase
        .from(POSTS_TABLE)
        .update(payload)
        .eq("id", post.id)
        .select(POST_SELECT_FIELDS)
        .single();
      if (error) throw error;
      setAdminPosts((prev) =>
        prev.map((item) => (item.id === post.id ? ((data as unknown) as UserPost) : item))
      );
      setAdminPostsStatus({ type: "idle", message: "" });
    } catch (error) {
      setAdminPostsStatus({
        type: "error",
        message: isMissingPostMuxColumnsError(error)
          ? "Run supabase/posts_add_mux_video_fields.sql and supabase/posts_shorts_feed_features.sql before moderating shorts."
          : getSupabaseErrorMessage(error),
      });
    }
  }

  function getStoragePathFromUrl(
    url: string,
    bucketName: string = PROFILE_PHOTO_BUCKET
  ) {
    const cleanUrl = url.split("?")[0];
    const patterns = [
      `/storage/v1/object/public/${bucketName}/`,
      `/object/public/${bucketName}/`,
    ];
    for (const pattern of patterns) {
      const index = cleanUrl.indexOf(pattern);
      if (index !== -1) {
        return decodeURIComponent(cleanUrl.slice(index + pattern.length));
      }
    }
    return null;
  }

  function handleCoverPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (profileCoverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileCoverPreview);
    }
    updateProfileCoverPhoto(file);
    if (!file) {
      setProfileCoverPreview(profileCoverUrl);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProfileCoverPreview(previewUrl);
  }

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
    }
    updateProfilePhoto(file);
    if (!file) {
      setProfilePhotoPreview(null);
      setCropImageUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProfilePhotoPreview(previewUrl);
    setCropImageUrl(previewUrl);
    setProfileAvatarUrl(null);
  }

  function handleCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!cropImageSize) return;
    cropDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: cropOffset.x,
      originY: cropOffset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCropPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!cropDragRef.current.active) return;
    const dx = event.clientX - cropDragRef.current.startX;
    const dy = event.clientY - cropDragRef.current.startY;
    const next = clampCropOffset(
      cropDragRef.current.originX + dx,
      cropDragRef.current.originY + dy,
      cropScale
    );
    setCropOffset(next);
  }

  function handleCropPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!cropDragRef.current.active) return;
    cropDragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleCropScaleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextScale = Number(event.target.value);
    setCropScale(nextScale);
    setCropOffset((prev) => clampCropOffset(prev.x, prev.y, nextScale));
  }

  function handleStartEventImageCrop(index: number) {
    if (eventImageFiles.length === 0) return;
    if (index < 0 || index >= eventImageFiles.length) return;
    const preview = eventImagePreviews[index] ?? null;
    if (!preview) return;
    setEventCropTargetIndex(index);
    setEventCropSourceUrl(preview);
    setEventCropOpen(true);
    setEventCropApplying(false);
  }

  function closeEventImageEditor() {
    eventCropDragRef.current.active = false;
    setEventCropOpen(false);
    setEventCropApplying(false);
    setEventCropTargetIndex(null);
    setEventCropSourceUrl(null);
    setEventCropImageSize(null);
    setEventCropMinScale(1);
    setEventCropScale(1);
    setEventCropOffset({ x: 0, y: 0 });
    eventCropImageRef.current = null;
  }

  function handleEventImageCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!eventCropImageSize) return;
    eventCropDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: eventCropOffset.x,
      originY: eventCropOffset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleEventImageCropPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!eventCropDragRef.current.active) return;
    const dx = event.clientX - eventCropDragRef.current.startX;
    const dy = event.clientY - eventCropDragRef.current.startY;
    const next = clampEventImageCropOffset(
      eventCropDragRef.current.originX + dx,
      eventCropDragRef.current.originY + dy,
      eventCropScale
    );
    setEventCropOffset(next);
  }

  function handleEventImageCropPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!eventCropDragRef.current.active) return;
    eventCropDragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleEventImageCropScaleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextScale = Number(event.target.value);
    setEventCropScale(nextScale);
    setEventCropOffset((prev) =>
      clampEventImageCropOffset(prev.x, prev.y, nextScale)
    );
  }

  async function createCroppedEventImageBlob() {
    if (!eventCropImageSize || !eventCropImageRef.current) {
      return null;
    }
    const scale = eventCropScale;
    const { w, h } = eventCropImageSize;
    const scaledWidth = w * scale;
    const scaledHeight = h * scale;
    const centerX = EVENT_IMAGE_CROP_SIZE / 2 + eventCropOffset.x;
    const centerY = EVENT_IMAGE_CROP_SIZE / 2 + eventCropOffset.y;
    const x0 = centerX - scaledWidth / 2;
    const y0 = centerY - scaledHeight / 2;
    const sourceSize = EVENT_IMAGE_CROP_SIZE / scale;
    let sx = (0 - x0) / scale;
    let sy = (0 - y0) / scale;
    sx = Math.max(0, Math.min(w - sourceSize, sx));
    sy = Math.max(0, Math.min(h - sourceSize, sy));

    const canvas = document.createElement("canvas");
    canvas.width = EVENT_IMAGE_OUTPUT_SIZE;
    canvas.height = EVENT_IMAGE_OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      eventCropImageRef.current,
      sx,
      sy,
      sourceSize,
      sourceSize,
      0,
      0,
      EVENT_IMAGE_OUTPUT_SIZE,
      EVENT_IMAGE_OUTPUT_SIZE
    );

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
  }

  async function handleApplyEventImageCrop() {
    if (eventCropApplying) return;
    if (eventCropTargetIndex === null) return;
    if (eventCropTargetIndex < 0 || eventCropTargetIndex >= eventImageFiles.length) {
      closeEventImageEditor();
      return;
    }

    const sourceFile = eventImageFiles[eventCropTargetIndex];
    if (!sourceFile) {
      closeEventImageEditor();
      return;
    }

    setEventCropApplying(true);
    try {
      const blob = await createCroppedEventImageBlob();
      if (!blob) {
        closeEventImageEditor();
        return;
      }

      const baseName = sourceFile.name.replace(/\.[^.]+$/, "");
      const croppedFile = new File(
        [blob],
        (baseName || "event-image") + "-cropped.jpg",
        { type: "image/jpeg" }
      );
      const previewUrl = URL.createObjectURL(croppedFile);

      setEventImageFiles((prev) => {
        const next = [...prev];
        if (eventCropTargetIndex !== null && eventCropTargetIndex < next.length) {
          next[eventCropTargetIndex] = croppedFile;
        }
        return next;
      });

      setEventImagePreviews((prev) => {
        const next = [...prev];
        if (eventCropTargetIndex !== null && eventCropTargetIndex < next.length) {
          const old = next[eventCropTargetIndex];
          if (old?.startsWith("blob:")) {
            URL.revokeObjectURL(old);
          }
          next[eventCropTargetIndex] = previewUrl;
        }
        return next;
      });
    } finally {
      closeEventImageEditor();
    }
  }

  async function createCroppedAvatarBlob() {
    if (!profilePhoto || !cropImageSize || !cropImageRef.current) {
      return profilePhoto;
    }
    const blob = await generateCropCanvasBlob(AVATAR_OUTPUT_SIZE, 0.9);
    return blob ?? profilePhoto;
  }

  async function handleRemoveProfilePhoto() {
    if (profileStatus.type === "loading") return;
    if (profilePhoto) {
      setProfilePhoto(null);
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = "";
      }
      if (cropImageUrl) {
        URL.revokeObjectURL(cropImageUrl);
      }
      setProfilePhotoPreview(profileAvatarUrl);
      setCropImageUrl(null);
      return;
    }
    if (!profileAvatarUrl) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(strings.profilePhotoRemoveConfirm);
      if (!confirmed) return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setProfileStatus({ type: "error", message: "Supabase is not configured." });
      return;
    }
    setProfileStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = data.session?.user;
      if (!user) {
        setProfileStatus({
          type: "error",
          message: strings.profileAuthRequired,
        });
        return;
      }
      const path = getStoragePathFromUrl(profileAvatarUrl);
      if (path) {
        const { error: removeError } = await supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .remove([path]);
        if (removeError) throw removeError;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      setProfileAvatarUrl(null);
      setProfilePhotoPreview(null);
      setProfileStatus({ type: "success", message: strings.profileSuccess });
      navigate("me");
    } catch (error) {
      setProfileStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleRemoveCoverPhoto() {
    if (profileStatus.type === "loading") return;
    if (profileCoverPhoto) {
      setProfileCoverPhoto(null);
      if (profileCoverInputRef.current) {
        profileCoverInputRef.current.value = "";
      }
      if (profileCoverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profileCoverPreview);
      }
      setProfileCoverPreview(profileCoverUrl);
      return;
    }
    if (!profileCoverUrl) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(strings.profileCoverRemove);
      if (!confirmed) return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setProfileStatus({ type: "error", message: "Supabase is not configured." });
      return;
    }
    setProfileStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = data.session?.user;
      if (!user) {
        setProfileStatus({
          type: "error",
          message: strings.profileAuthRequired,
        });
        return;
      }
      const path = getStoragePathFromUrl(profileCoverUrl);
      if (path) {
        const { error: removeError } = await supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .remove([path]);
        if (removeError) throw removeError;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ cover_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      setProfileCoverUrl(null);
      setProfileCoverPreview(null);
      setProfileStatus({ type: "success", message: strings.profileSuccess });
      navigate("me");
    } catch (error) {
      setProfileStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  async function handleProfileSave() {
    if (profileStatus.type === "loading") return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setProfileStatus({ type: "error", message: "Supabase is not configured." });
      return;
    }
    setProfileStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = data.session?.user;
      if (!user) {
        setProfileStatus({
          type: "error",
          message: strings.profileAuthRequired,
        });
        return;
      }
      let avatarUrl: string | null = null;
      let coverUrl: string | null = null;
      if (profilePhoto) {
        const croppedBlob = await createCroppedAvatarBlob();
        const filePath = `${user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(filePath, croppedBlob ?? profilePhoto, {
            upsert: true,
            contentType: "image/jpeg",
          });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .getPublicUrl(filePath);
        avatarUrl = publicData.publicUrl ?? null;
      }
      if (profileCoverPhoto) {
        const filePath = `${user.id}/cover.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(filePath, profileCoverPhoto, {
            upsert: true,
            contentType: profileCoverPhoto.type || "image/jpeg",
          });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from(PROFILE_PHOTO_BUCKET)
          .getPublicUrl(filePath);
        coverUrl = publicData.publicUrl ?? null;
      }
      const payload = {
        id: user.id,
        full_name: profileName.trim() || null,
        birth_date: profileBirthDate || null,
        gender: profileGender || null,
        country: profileCountry.trim() || null,
        city: profileCity.trim() || null,
        language: profileLanguage || null,
        language_level: profileLevel || null,
        learning_languages: profileLearningLanguages.length
          ? profileLearningLanguages
          : null,
        practice_languages: profilePracticeLanguages.length
          ? profilePracticeLanguages
          : null,
        teaches_languages:
          (profileIsOrganizer || profileIsTeacher) && profileTeachesLanguages.length
            ? profileTeachesLanguages
            : null,
        bio: profileBio.trim() || null,
        interests: profileInterests.length ? profileInterests : null,
        telegram: profileTelegram.trim() || null,
        instagram: profileInstagram.trim() || null,
        locale,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>;
      if (avatarUrl) {
        payload.avatar_url = avatarUrl;
      }
      if (coverUrl) {
        payload.cover_url = coverUrl;
      }
      let { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      if (error && isMissingTeachesLanguagesColumnError(error)) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.teaches_languages;
        const fallbackResult = await supabase
          .from("profiles")
          .upsert(fallbackPayload, { onConflict: "id" });
        error = fallbackResult.error;
      }
      if (error) throw error;
      if (avatarUrl) {
        setProfileAvatarUrl(avatarUrl);
        setProfilePhotoPreview(avatarUrl);
        setProfilePhoto(null);
        setCropImageUrl(null);
        if (profilePhotoInputRef.current) {
          profilePhotoInputRef.current.value = "";
        }
      }
      if (coverUrl) {
        setProfileCoverUrl(coverUrl);
        setProfileCoverPreview(coverUrl);
        setProfileCoverPhoto(null);
        if (profileCoverInputRef.current) {
          profileCoverInputRef.current.value = "";
        }
      }
      setProfileStatus({ type: "success", message: strings.profileSuccess });
    } catch (error) {
      setProfileStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
      });
    }
  }

  const isPartnersRoute = route === "partners";
  const isPrivacyRoute = route === "privacy";
  const isImpressumRoute = route === "impressum";
  const isTermsRoute = route === "terms";
  const isSearchRoute = route === "search";
  const isGamesRoute = route === "games";
  const isVoiceRoute = route === "voice";
  const isShortsRoute = route === "shorts";
  const isEventsRoute = route === "events";
  const isEventRoute = route === "event";
  const isOrganizerRoute = route === "organizer";
  const isProfileRoute = route === "profile";
  const isUserRoute = route === "me";
  const isAdminRoute = route === "admin";
  const isAuthRoute = route === "login" || route === "register" || route === "forgot";
  const showPassword = isAuthRoute && route !== "forgot";
  const showConfirm = isAuthRoute && route === "register";
  const showBackButton = !isAuthRoute;
  const showSearchButton = !isAuthRoute;
  const showGamesButton = !isAuthRoute;
  const showVoiceButton = !isAuthRoute;
  const showShortsButton = !isAuthRoute;
  const showEventsButton = !isAuthRoute;
  const showLogoutButton = !isAuthRoute && !guestMode && Boolean(sessionUser?.id);
  const showUserQuickActions = isUserRoute && !guestMode;
  const canManageEvents = profileIsOrganizer || (profileIsAdmin && isAdminRoute);
  const adminUsersBusy = adminUsersStatus.type === "loading";
  const adminApplicationsBusy = adminApplicationsStatus.type === "loading";
  const adminUserMap = useMemo(() => {
    return new Map(adminUsers.map((profile) => [profile.id, profile]));
  }, [adminUsers]);
  const adminSelectedUser = useMemo(() => {
    return adminSelectedUserId
      ? adminUsers.find((profile) => profile.id === adminSelectedUserId) ?? null
      : null;
  }, [adminSelectedUserId, adminUsers]);
  useEffect(() => {
    if (adminTab !== "users") {
      setAdminSelectedUserId(null);
    }
  }, [adminTab]);
  useEffect(() => {
    if (!adminSelectedUserId) return;
    const exists = adminUsers.some(
      (profile) => profile.id === adminSelectedUserId
    );
    if (!exists) {
      setAdminSelectedUserId(null);
    }
  }, [adminSelectedUserId, adminUsers]);
  const logoTapCountRef = useRef(0);
  const logoTapTimeRef = useRef<number | null>(null);
  const adminPinTitle =
    locale === "ru"
      ? "Введите PIN администратора"
      : locale === "uk"
        ? "Введіть PIN адміністратора"
        : locale === "fa"
          ? "رمز PIN ادمین را وارد کنید"
        : "Enter admin PIN";
  const primaryLabel =
    route === "login"
      ? strings.loginButton
      : route === "register"
        ? strings.registerButton
        : strings.resetButton;

  function handleLogoClick() {
    if (typeof window === "undefined") return;
    const now = Date.now();
    if (logoTapTimeRef.current && now - logoTapTimeRef.current > 4000) {
      logoTapCountRef.current = 0;
    }
    logoTapTimeRef.current = now;
    logoTapCountRef.current += 1;
    if (logoTapCountRef.current < 10) return;
    logoTapCountRef.current = 0;
    setAdminPinValue("");
    setAdminPinError("");
    setAdminPinOpen(true);
  }

  function handleAdminPinClose() {
    setAdminPinOpen(false);
    setAdminPinValue("");
    setAdminPinError("");
  }

  async function handleAdminPinSubmit() {
    const pinValue = adminPinValue.trim();
    if (!pinValue) {
      setAdminPinError(
        locale === "ru" ? "Введите PIN" : locale === "fa" ? "PIN را وارد کنید" : "Enter PIN"
      );
      return;
    }
    if (pinValue !== "2266") {
      setAdminPinError(
        locale === "ru"
          ? "Неверный PIN"
          : locale === "fa"
            ? "PIN نامعتبر است"
            : "Invalid PIN"
      );
      return;
    }
    if (!sessionUser?.id || guestMode) {
      handleAdminPinClose();
      if (typeof window !== "undefined") {
        window.alert(strings.profileAuthRequired);
      }
      navigate("login");
      return;
    }
    let isAdmin = profileIsAdmin;
    if (!isAdmin) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", sessionUser.id)
          .maybeSingle();
        if (!error && data?.is_admin) {
          isAdmin = true;
          setProfileIsAdmin(true);
        }
      }
    }
    if (!isAdmin) {
      setAdminPinError(
        locale === "ru"
          ? "Доступ только для администратора."
          : locale === "uk"
            ? "Доступ лише для адміністратора."
            : locale === "fa"
              ? "دسترسی فقط برای ادمین."
            : "Admin access required."
      );
      return;
    }
    handleAdminPinClose();
    navigate("admin");
  }

  const eventsManagerProps = {
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
    eventImageLimit: EVENT_IMAGE_LIMIT,
    handleStartEventImageCrop,
    eventImageEditorText,
    handleRemoveEventImageAt,
    handleRemoveEventImage,
    eventScheduleText,
    eventRecurrence,
    handleEventRecurrenceChange,
    eventRecurrenceCount,
    setEventRecurrenceCount,
    eventRecurrenceMaxOccurrences: EVENT_RECURRENCE_MAX_OCCURRENCES,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    eventFormat,
    setEventFormat,
    eventDuration,
    setEventDuration,
    eventDurations: EVENT_DURATIONS,
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
    languageList: LANGUAGE_LIST,
    languageLabels,
    eventLevelFrom,
    handleEventLevelFromChange,
    eventLevelTo,
    handleEventLevelToChange,
    languageLevels: LANGUAGE_LEVELS,
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
  };
  const adminPageProps = {
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
    sessionUserId: sessionUser?.id ?? null,
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
  };
  const searchPageProps = {
    strings,
    searchQuery,
    setSearchQuery,
    runSearch,
    searchStatus,
    searchCity,
    setSearchCity,
    searchLanguage,
    setSearchLanguage,
    languageList: LANGUAGE_LIST,
    languageLabels,
    searchLevel,
    setSearchLevel,
    languageLevels: LANGUAGE_LEVELS,
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
    sessionUserId: sessionUser?.id ?? null,
  };
  const eventDetailPageProps = {
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
    sessionUserId: sessionUser?.id ?? null,
  };
  const eventsPageProps = {
    strings,
    guestMode,
    eventsManagerProps,
  };
  const organizerPageProps = {
    strings,
    organizerDetailsStatus,
    organizerDetails,
    organizerShortsStatus,
    organizerShorts,
    isSupportedLocale,
    languageLabels,
    organizerFollowerCounts,
    sessionUserId: sessionUser?.id ?? null,
    organizerFollowMap,
    organizerFollowLoading,
    handleToggleOrganizerFollow,
    organizerFollowersStatus,
    organizerFollowers,
  };
  const shortsPageProps = {
    locale,
    languageLabels,
    guestMode,
    sessionUserId: sessionUser?.id ?? null,
    viewerLanguage: profileLanguage || null,
    viewerCity: profileCity.trim() || null,
    viewerCountry: profileCountry.trim() || null,
    viewerLearningLanguages: profileLearningLanguages,
    viewerPracticeLanguages: profilePracticeLanguages,
    viewerInterests: profileInterests,
    followingOrganizerIds,
    requireAuth: () => redirectToLoginWithIntent({ route: "shorts" }),
    goToOrganizer,
    sharePath: ROUTE_PATHS.shorts,
  };
  const voiceAssistantPageProps = {
    locale,
    languageOptions: LANGUAGE_LIST.map((lang) => ({
      locale: lang.locale,
      label: languageLabels[lang.locale] ?? lang.label,
    })),
    preferredInputLocales: [
      ...profileLearningLanguages,
      ...profilePracticeLanguages,
      ...(profileLanguage ? [profileLanguage] : []),
      locale,
    ].filter((value, index, array) => array.indexOf(value) === index),
    guestMode,
    requireAuth: () => redirectToLoginWithIntent({ route: "voice" }),
  };
  const userPageProps = {
    strings,
    profileCoverDisplay,
    profileCoverStyle,
    navigateToSelf: () => navigate("me"),
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
    postCoverInputRef,
    handlePostFileChange,
    handlePostCoverFileChange,
      clearPostCoverSelection,
      handlePostPublish,
      postActionStatus,
      postHasContent,
      canUploadPostMedia,
      mediaPostAccessMessage,
      postPreviewUrl,
      postCoverPreviewUrl,
      postPreviewIsVideo,
    postsStatus,
    userPosts,
    handleDeletePost,
    photoPosts,
    videoPosts,
    shortVideoPosts,
      profileCanManageShorts,
      profilePinnedShortPostId,
      pinShortLoadingId,
      pinShortStatus,
    handlePinShortPost,
  };
  const profilePageProps = {
    strings,
    profileName,
    updateProfileName,
    profileBirthDate,
    updateProfileBirthDate,
    profileGender,
    updateProfileGender,
    profileCountry,
    updateProfileCountry,
    profileCity,
    updateProfileCity,
    profileLanguage,
    updateProfileLanguage,
    languageList: LANGUAGE_LIST,
    languageLabels,
    learnPracticeLanguages: LEARN_PRACTICE_LANGS,
    profileLearningLanguages,
    toggleProfileLearningLanguage,
    profilePracticeLanguages,
    toggleProfilePracticeLanguage,
    showTeachingLanguages: profileIsOrganizer || profileIsTeacher,
    profileTeachingLanguages: profileTeachesLanguages,
    toggleProfileTeachingLanguage,
    profileLevel,
    updateProfileLevel,
    languageLevels: LANGUAGE_LEVELS,
    profileBio,
    updateProfileBio,
    profileInterestInput,
    updateProfileInterestInput,
    handleInterestKeyDown,
    addProfileInterest,
    profileInterests,
    resolveInterestLabel,
    removeProfileInterest,
    interestPresets: INTEREST_PRESETS,
    locale,
    toggleProfileInterestPreset,
    profileTelegram,
    updateProfileTelegram,
    profileInstagram,
    updateProfileInstagram,
    profileCoverInputRef,
    handleCoverPhotoChange,
    profileCoverPhoto,
    profileCoverUrl,
    handleRemoveCoverPhoto,
    profileCoverPreview,
    profilePhotoInputRef,
    handleProfilePhotoChange,
    profilePhoto,
    profileAvatarUrl,
    handleRemoveProfilePhoto,
    handleCropPointerDown,
    handleCropPointerMove,
    handleCropPointerEnd,
    cropImageUrl,
    cropImageSize,
    cropOffset,
    cropScale,
    cropMinScale,
    handleCropScaleChange,
    profilePhotoPreview,
    profileStatus,
    handleProfileSave,
    navigateToLogin: () => navigate("login"),
  };
  return (
    <div
      className="app"
      lang={locale}
      dir={isRtlLocale(locale) ? "rtl" : "ltr"}
    >
      <div className="shell">
        <div className="panel">
          <div className="brandRow">
            <div className="brand">
              <img
                className="brandLogo"
                src="/logo.svg"
                alt="Vela Sprachcafe"
                onClick={handleLogoClick}
                onError={(event) => {
                  const target = event.currentTarget;
                  if (target.dataset.fallback === "1") return;
                  target.dataset.fallback = "1";
                  target.src = "/logo.png";
                }}
              />
            </div>
            <div className="brandTextStack">
              <div className="brandTag">{strings.brandTag}</div>
              <div className="brandSub">{strings.brandSub}</div>
            </div>
          </div>
          <div className="divider" />
          <div className="screen">
            <div className="topbar">
              <div className="topbarLeft">
                {showBackButton ? (
                  <button
                    className="btn topbarBack"
                    type="button"
                    onClick={handleBack}
                  >
                    <span className="topbarBackIcon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                        <path
                          d="M15.5 5.5L9 12l6.5 6.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    {strings.backButton}
                  </button>
                ) : null}
              </div>
              <div className="topbarActions">
                {showSearchButton ? (
                  <button
                    className={`btn${isSearchRoute ? " btnActive" : ""}`}
                    type="button"
                    onClick={() => navigate("search")}
                  >
                    {strings.searchButton}
                  </button>
                ) : null}
                {showGamesButton ? (
                  <button
                    className={`btn${isGamesRoute ? " btnActive" : ""}`}
                    type="button"
                    onClick={() => navigate("games")}
                  >
                    {miniGamesText.navLabel}
                  </button>
                ) : null}
                {showVoiceButton ? (
                  <button
                    className={`btn${isVoiceRoute ? " btnActive" : ""}`}
                    type="button"
                    onClick={() => navigate("voice")}
                  >
                    {voiceAssistantText.navLabel}
                  </button>
                ) : null}
                {showShortsButton ? (
                  <button
                    className={`btn${isShortsRoute ? " btnActive" : ""}`}
                    type="button"
                    onClick={() => navigate("shorts")}
                  >
                    {shortsText.navLabel}
                  </button>
                ) : null}
                {showEventsButton ? (
                  <button
                    className={`btn${isEventsRoute ? " btnActive" : ""}`}
                    type="button"
                    onClick={() => navigate("events")}
                  >
                    {strings.eventsButton}
                  </button>
                ) : null}
                {showLogoutButton ? (
                  <button
                    className="btn"
                    type="button"
                    onClick={handleLogout}
                  >
                    {strings.logoutButton}
                  </button>
                ) : null}
                {showUserQuickActions ? (
                  <>
                    <button
                      className="userAction userAction--ghost"
                      type="button"
                      onClick={() => navigate("profile")}
                    >
                      {strings.profileEditButton}
                    </button>
                    {profileIsOrganizer ? (
                      <button
                        className="userAction"
                        type="button"
                        onClick={() => navigate("events")}
                      >
                        {strings.eventsButton}
                      </button>
                    ) : (
                      <button
                        className="userAction"
                        type="button"
                        onClick={handleBecomeOrganizer}
                      >
                        {strings.userActionOrganizer}
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
            {adminPinOpen ? (
              <div className="adminPinOverlay" role="dialog" aria-modal="true">
                <div
                  className="adminPinModal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="adminPinTitle">{adminPinTitle}</div>
                  <input
                    className="input adminPinInput"
                    type="password"
                    inputMode="numeric"
                    placeholder="PIN"
                    value={adminPinValue}
                    onChange={(event) => {
                      setAdminPinValue(event.target.value);
                      if (adminPinError) setAdminPinError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAdminPinSubmit();
                      }
                    }}
                  />
                  {adminPinError ? (
                    <div
                      className="authStatus authStatus--error"
                      role="status"
                      aria-live="polite"
                    >
                      {adminPinError}
                    </div>
                  ) : null}
                  <div className="adminPinActions">
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={handleAdminPinClose}
                    >
                      {strings.backButton}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={handleAdminPinSubmit}
                    >
                      {strings.loginButton}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {eventCropOpen ? (
              <div
                className="eventImageEditorOverlay"
                role="dialog"
                aria-modal="true"
                onClick={closeEventImageEditor}
              >
                <div
                  className="eventImageEditorModal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="eventImageEditorTitle">
                    {eventImageEditorText.cropTitle}
                  </div>
                  <div className="eventImageEditorHint">
                    {eventImageEditorText.cropHint}
                  </div>
                  <div className="eventImageCropper">
                    <div
                      className="eventImageCropBox"
                      onPointerDown={handleEventImageCropPointerDown}
                      onPointerMove={handleEventImageCropPointerMove}
                      onPointerUp={handleEventImageCropPointerEnd}
                      onPointerLeave={handleEventImageCropPointerEnd}
                    >
                      {eventCropSourceUrl ? (
                        <img
                          className="eventImageCropImage"
                          src={eventCropSourceUrl}
                          alt={eventImageEditorText.cropTitle}
                          draggable={false}
                          style={{
                            width: eventCropImageSize
                              ? eventCropImageSize.w + "px"
                              : "auto",
                            height: eventCropImageSize
                              ? eventCropImageSize.h + "px"
                              : "auto",
                            transform:
                              "translate(-50%, -50%) translate(" +
                              eventCropOffset.x +
                              "px, " +
                              eventCropOffset.y +
                              "px) scale(" +
                              eventCropScale +
                              ")",
                          }}
                        />
                      ) : null}
                    </div>
                    <input
                      className="eventImageCropSlider"
                      type="range"
                      min={eventCropMinScale}
                      max={eventCropMinScale * 3}
                      step={0.01}
                      value={eventCropScale}
                      onChange={handleEventImageCropScaleChange}
                    />
                  </div>
                  <div className="eventImageEditorActions">
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={closeEventImageEditor}
                    >
                      {eventImageEditorText.cropCancel}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={handleApplyEventImageCrop}
                      disabled={eventCropApplying || !eventCropSourceUrl}
                    >
                      {eventCropApplying
                        ? strings.loadingLabel
                        : eventImageEditorText.cropApply}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {organizerApplyOpen ? (
              <div
                className="organizerApplyOverlay"
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="organizerApplyModal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="organizerApplyTitle">
                    {strings.organizerApplyTitle}
                  </div>
                  <div className="organizerApplySubtitle">
                    {strings.organizerApplySubtitle}
                  </div>
                  <div className="organizerApplyHint">
                    {strings.organizerApplyRequiredHint}
                  </div>
                  <div className="organizerApplyType">
                    <div className="organizerApplyTypeLabel">
                      {strings.organizerApplyTypeLabel}
                    </div>
                    <div className="organizerApplyTypeButtons">
                      <button
                        className={`btn${
                          organizerApplyType === "person" ? " btnActive" : ""
                        }`}
                        type="button"
                        onClick={() => setOrganizerApplyType("person")}
                      >
                        {strings.organizerApplyTypePerson}
                      </button>
                      <button
                        className={`btn${
                          organizerApplyType === "organization"
                            ? " btnActive"
                            : ""
                        }`}
                        type="button"
                        onClick={() => setOrganizerApplyType("organization")}
                      >
                        {strings.organizerApplyTypeOrganization}
                      </button>
                    </div>
                  </div>
                  {organizerApplyType ? (
                    <div className="organizerApplyGrid">
                      {organizerApplyType === "person" ? (
                        <>
                          <div className="field">
                            <label className="label" htmlFor="organizerApplyName">
                              {strings.organizerApplyNameLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyName"
                              type="text"
                              value={organizerApplyName}
                              onChange={(event) =>
                                setOrganizerApplyName(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="organizerApplyPhone">
                              {strings.organizerApplyPhoneLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyPhone"
                              type="tel"
                              value={organizerApplyPhone}
                              onChange={(event) =>
                                setOrganizerApplyPhone(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="organizerApplyEmail">
                              {strings.organizerApplyEmailLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyEmail"
                              type="email"
                              value={organizerApplyEmail}
                              onChange={(event) =>
                                setOrganizerApplyEmail(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyWebsitePerson"
                            >
                              {strings.organizerApplyWebsiteLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyWebsitePerson"
                              type="url"
                              value={organizerApplyWebsite}
                              onChange={(event) =>
                                setOrganizerApplyWebsite(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyFacebook"
                            >
                              {strings.organizerApplyFacebookLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyFacebook"
                              type="url"
                              value={organizerApplyFacebook}
                              onChange={(event) =>
                                setOrganizerApplyFacebook(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyInstagram"
                            >
                              {strings.organizerApplyInstagramLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyInstagram"
                              type="url"
                              value={organizerApplyInstagram}
                              onChange={(event) =>
                                setOrganizerApplyInstagram(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyTiktok"
                            >
                              {strings.organizerApplyTiktokLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyTiktok"
                              type="url"
                              value={organizerApplyTiktok}
                              onChange={(event) =>
                                setOrganizerApplyTiktok(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyLinkedIn"
                            >
                              {strings.organizerApplyLinkedInLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyLinkedIn"
                              type="url"
                              value={organizerApplyLinkedIn}
                              onChange={(event) =>
                                setOrganizerApplyLinkedIn(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="organizerApplyCity">
                              {strings.profileCityLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyCity"
                              type="text"
                              value={organizerApplyCity}
                              onChange={(event) =>
                                setOrganizerApplyCity(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="organizerApplyCountry">
                              {strings.profileCountryLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyCountry"
                              type="text"
                              value={organizerApplyCountry}
                              onChange={(event) =>
                                setOrganizerApplyCountry(event.target.value)
                              }
                            />
                          </div>
                          <div className="field organizerApplyFull">
                            <span className="label">
                              {strings.organizerApplyLanguagesLabel} *
                            </span>
                            <div className="tagGrid">
                              {LANGUAGE_LIST.map((lang) => {
                                const translatedLabel =
                                  languageLabels[lang.locale] ?? lang.label;
                                const isActive = organizerApplyLanguages.includes(
                                  lang.locale
                                );
                                return (
                                  <button
                                    key={`apply-lang-${lang.locale}`}
                                    className={`tagButton${
                                      isActive ? " tagButton--active" : ""
                                    }`}
                                    type="button"
                                    onClick={() =>
                                      toggleOrganizerApplyLanguage(lang.locale)
                                    }
                                  >
                                    <span className="tagFlags">
                                      {lang.codes.map((code) => (
                                        <span
                                          key={`${lang.locale}-${code}`}
                                          className="langFlag"
                                          aria-hidden="true"
                                        >
                                          {getFlagEmoji(code)}
                                        </span>
                                      ))}
                                    </span>
                                    <span>{translatedLabel}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="field organizerApplyFull">
                            <label
                              className="label"
                              htmlFor="organizerApplyExperience"
                            >
                              {strings.organizerApplyExperienceLabel} *
                            </label>
                            <textarea
                              className="input organizerApplyTextarea"
                              id="organizerApplyExperience"
                              value={organizerApplyExperience}
                              onChange={(event) =>
                                setOrganizerApplyExperience(event.target.value)
                              }
                            />
                          </div>
                          <div className="field organizerApplyFull">
                            <label className="label" htmlFor="organizerApplyAbout">
                              {strings.organizerApplyAboutLabel} *
                            </label>
                            <textarea
                              className="input organizerApplyTextarea"
                              id="organizerApplyAbout"
                              value={organizerApplyAbout}
                              onChange={(event) =>
                                setOrganizerApplyAbout(event.target.value)
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyOrgName"
                            >
                              {strings.organizerApplyOrgNameLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyOrgName"
                              type="text"
                              value={organizerApplyOrgName}
                              onChange={(event) =>
                                setOrganizerApplyOrgName(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label className="label" htmlFor="organizerApplyOrgId">
                              {strings.organizerApplyOrgIdLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyOrgId"
                              type="text"
                              value={organizerApplyOrgId}
                              onChange={(event) =>
                                setOrganizerApplyOrgId(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyContactName"
                            >
                              {strings.organizerApplyContactLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyContactName"
                              type="text"
                              value={organizerApplyContactName}
                              onChange={(event) =>
                                setOrganizerApplyContactName(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyPhoneOrg"
                            >
                              {strings.organizerApplyPhoneLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyPhoneOrg"
                              type="tel"
                              value={organizerApplyPhone}
                              onChange={(event) =>
                                setOrganizerApplyPhone(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyEmailOrg"
                            >
                              {strings.organizerApplyEmailLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyEmailOrg"
                              type="email"
                              value={organizerApplyEmail}
                              onChange={(event) =>
                                setOrganizerApplyEmail(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyWebsite"
                            >
                              {strings.organizerApplyWebsiteLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyWebsite"
                              type="url"
                              value={organizerApplyWebsite}
                              onChange={(event) =>
                                setOrganizerApplyWebsite(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyFacebookOrg"
                            >
                              {strings.organizerApplyFacebookLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyFacebookOrg"
                              type="url"
                              value={organizerApplyFacebook}
                              onChange={(event) =>
                                setOrganizerApplyFacebook(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyInstagramOrg"
                            >
                              {strings.organizerApplyInstagramLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyInstagramOrg"
                              type="url"
                              value={organizerApplyInstagram}
                              onChange={(event) =>
                                setOrganizerApplyInstagram(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyTiktokOrg"
                            >
                              {strings.organizerApplyTiktokLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyTiktokOrg"
                              type="url"
                              value={organizerApplyTiktok}
                              onChange={(event) =>
                                setOrganizerApplyTiktok(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyLinkedInOrg"
                            >
                              {strings.organizerApplyLinkedInLabel}
                            </label>
                            <input
                              className="input"
                              id="organizerApplyLinkedInOrg"
                              type="url"
                              value={organizerApplyLinkedIn}
                              onChange={(event) =>
                                setOrganizerApplyLinkedIn(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyCityOrg"
                            >
                              {strings.profileCityLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyCityOrg"
                              type="text"
                              value={organizerApplyCity}
                              onChange={(event) =>
                                setOrganizerApplyCity(event.target.value)
                              }
                            />
                          </div>
                          <div className="field">
                            <label
                              className="label"
                              htmlFor="organizerApplyCountryOrg"
                            >
                              {strings.profileCountryLabel} *
                            </label>
                            <input
                              className="input"
                              id="organizerApplyCountryOrg"
                              type="text"
                              value={organizerApplyCountry}
                              onChange={(event) =>
                                setOrganizerApplyCountry(event.target.value)
                              }
                            />
                          </div>
                          <div className="field organizerApplyFull">
                            <span className="label">
                              {strings.organizerApplyLanguagesLabel} *
                            </span>
                            <div className="tagGrid">
                              {LANGUAGE_LIST.map((lang) => {
                                const translatedLabel =
                                  languageLabels[lang.locale] ?? lang.label;
                                const isActive = organizerApplyLanguages.includes(
                                  lang.locale
                                );
                                return (
                                  <button
                                    key={`apply-lang-org-${lang.locale}`}
                                    className={`tagButton${
                                      isActive ? " tagButton--active" : ""
                                    }`}
                                    type="button"
                                    onClick={() =>
                                      toggleOrganizerApplyLanguage(lang.locale)
                                    }
                                  >
                                    <span className="tagFlags">
                                      {lang.codes.map((code) => (
                                        <span
                                          key={`${lang.locale}-${code}`}
                                          className="langFlag"
                                          aria-hidden="true"
                                        >
                                          {getFlagEmoji(code)}
                                        </span>
                                      ))}
                                    </span>
                                    <span>{translatedLabel}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="field organizerApplyFull">
                            <label
                              className="label"
                              htmlFor="organizerApplyExperienceOrg"
                            >
                              {strings.organizerApplyExperienceLabel} *
                            </label>
                            <textarea
                              className="input organizerApplyTextarea"
                              id="organizerApplyExperienceOrg"
                              value={organizerApplyExperience}
                              onChange={(event) =>
                                setOrganizerApplyExperience(event.target.value)
                              }
                            />
                          </div>
                          <div className="field organizerApplyFull">
                            <label
                              className="label"
                              htmlFor="organizerApplyAboutOrg"
                            >
                              {strings.organizerApplyAboutLabel} *
                            </label>
                            <textarea
                              className="input organizerApplyTextarea"
                              id="organizerApplyAboutOrg"
                              value={organizerApplyAbout}
                              onChange={(event) =>
                                setOrganizerApplyAbout(event.target.value)
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                  {organizerApplyStatus.type !== "idle" ? (
                    <div
                      className={`authStatus authStatus--${organizerApplyStatus.type}`}
                      role="status"
                      aria-live="polite"
                    >
                      {organizerApplyStatus.message}
                    </div>
                  ) : null}
                  <div className="organizerApplyActions">
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={handleOrganizerApplyClose}
                    >
                      {strings.organizerApplyCancel}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={handleOrganizerApplySubmit}
                      disabled={organizerApplyStatus.type === "loading"}
                    >
                      {organizerApplyStatus.type === "loading"
                        ? strings.loadingLabel
                        : strings.organizerApplySubmit}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {isPartnersRoute ? (
              <div className="partnersPage">
                <div className="partnersPageTitle">{strings.partnersTitle}</div>
                <div className="partnersGrid partnersGrid--page">
                  {PARTNER_LOGOS.map((logo) => (
                    <div key={logo.src} className="partnerCard">
                      <img className="partnerLogo" src={logo.src} alt={logo.alt} />
                    </div>
                  ))}
                </div>
              </div>
            ) : isPrivacyRoute ? (
              <Suspense fallback={<div className="privacyPage" dir={legalDir} />}>
                <LegalPage kind="privacy" locale={locale} dir={legalDir} />
              </Suspense>
            ) : isImpressumRoute ? (
              <Suspense fallback={<div className="privacyPage" dir={legalDir} />}>
                <LegalPage kind="impressum" locale={locale} dir={legalDir} />
              </Suspense>
            ) : isTermsRoute ? (
              <Suspense fallback={<div className="privacyPage" dir={legalDir} />}>
                <LegalPage kind="terms" locale={locale} dir={legalDir} />
              </Suspense>
            ) : isAdminRoute ? (
              <Suspense fallback={<div className="adminPage" />}>
                <AdminPage {...adminPageProps} />
              </Suspense>
            ) : isSearchRoute ? (
              <Suspense fallback={<div className="searchPage" />}>
                <SearchPage {...searchPageProps} />
              </Suspense>
            ) : isGamesRoute ? (
              <Suspense fallback={<div className="miniGamesPage" />}>
                <MiniGamesPage
                  locale={locale}
                  sessionUserId={sessionUser?.id ?? null}
                  isPremium={profileIsPremium}
                />
              </Suspense>
            ) : isVoiceRoute ? (
              <Suspense fallback={<div className="voiceAssistantPage" />}>
                <VoiceAssistantPage {...voiceAssistantPageProps} />
              </Suspense>
            ) : isShortsRoute ? (
              <Suspense fallback={<div className="shortsPage" />}>
                <ShortsPage {...shortsPageProps} />
              </Suspense>
            ) : isEventsRoute ? (
              <Suspense fallback={<div className="eventsPage" />}>
                <EventsPage {...eventsPageProps} />
              </Suspense>
            ) : isEventRoute ? (
              <Suspense fallback={<div className="eventDetailPage" />}>
                <EventDetailPage {...eventDetailPageProps} />
              </Suspense>
            ) : isOrganizerRoute ? (
              <Suspense fallback={<div className="organizerPage" />}>
                <OrganizerPage {...organizerPageProps} />
              </Suspense>
            ) : isUserRoute ? (
              <Suspense fallback={<div className="userPage" />}>
                <UserPage {...userPageProps} />
              </Suspense>
            ) : isProfileRoute ? (
              <Suspense fallback={<div className="profilePage" />}>
                <ProfilePage {...profilePageProps} />
              </Suspense>
            ) : (
              <>
                <div
                  className={`authBox${
                    route === "register" ? " authBox--register" : ""
                  }`}
                >
                  <div className="authFields">
                    <div className="field">
                      <input
                        className="input"
                        type="email"
                        name="email"
                        placeholder={strings.emailPlaceholder}
                        autoComplete="email"
                        aria-label={strings.emailPlaceholder}
                        value={email}
                        onChange={(event) => updateEmail(event.target.value)}
                      />
                    </div>
                    {showPassword ? (
                      <div className="field">
                        <input
                          className="input"
                          type="password"
                          name="password"
                          placeholder={strings.passwordPlaceholder}
                          autoComplete="current-password"
                          aria-label={strings.passwordPlaceholder}
                          value={password}
                          onChange={(event) => updatePassword(event.target.value)}
                        />
                      </div>
                    ) : null}
                    {showConfirm ? (
                      <div className="field">
                        <input
                          className="input"
                          type="password"
                          name="confirmPassword"
                          placeholder={strings.confirmPasswordPlaceholder}
                          autoComplete="new-password"
                          aria-label={strings.confirmPasswordPlaceholder}
                          value={confirmPassword}
                          onChange={(event) =>
                            updateConfirmPassword(event.target.value)
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                  {authState.type !== "idle" ? (
                    <div
                      className={`authStatus authStatus--${authState.type}`}
                      role="status"
                      aria-live="polite"
                    >
                      {authState.message}
                    </div>
                  ) : null}
                  <button
                    className="authPrimary cardButton"
                    type="button"
                    onClick={handlePrimaryAction}
                    disabled={authState.type === "loading"}
                  >
                    {authState.type === "loading"
                      ? strings.loadingLabel
                      : primaryLabel}
                  </button>
                  {route === "register" ? (
                    <div className="registerLegal">
                      <span
                        className="registerLegalIcon"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24">
                          <rect
                            x="5"
                            y="4"
                            width="14"
                            height="16"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                          <rect
                            x="8"
                            y="2"
                            width="8"
                            height="4"
                            rx="1.5"
                            fill="currentColor"
                          />
                          <path
                            d="M9 12.2l2 2.1 4.3-4.4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {registerConsentLine ? (
                        <p className="registerLegalText">
                          {registerConsentLine}
                        </p>
                      ) : null}
                      <p className="registerLegalText registerLegalLinks">
                        <button
                          className="registerLegalLink"
                          type="button"
                          onClick={() => navigate("terms")}
                        >
                          {strings.termsButton}
                        </button>
                        <span className="registerLegalDot" aria-hidden="true">
                          /
                        </span>
                        <button
                          className="registerLegalLink"
                          type="button"
                          onClick={() => navigate("privacy")}
                        >
                          {strings.privacyButton}
                        </button>
                      </p>
                    </div>
                  ) : null}
                    {route === "login" ? (
                    <>
                      <div className="authSocial">
                        <button
                          className="authGmail"
                          type="button"
                          onClick={handleGmailLogin}
                          disabled={authState.type === "loading"}
                        >
                          <span className="authGmailIcon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              role="img"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <rect
                                x="2"
                                y="4"
                                width="20"
                                height="16"
                                rx="3"
                                fill="#fff"
                                stroke="#d7dce5"
                              />
                              <path
                                d="M3.5 7.2L12 12.6L20.5 7.2"
                                fill="none"
                                stroke="#EA4335"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M3.5 7.2V18.2"
                                fill="none"
                                stroke="#4285F4"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M20.5 7.2V18.2"
                                fill="none"
                                stroke="#34A853"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M3.5 18.2H20.5"
                                fill="none"
                                stroke="#FBBC05"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                          <span>{strings.gmailButton}</span>
                        </button>
                        <button
                          className="authGuest"
                          type="button"
                          onClick={handleContinueAsGuest}
                        >
                          {strings.guestButton}
                        </button>
                      </div>
                      <button
                        className="authLink"
                        type="button"
                        onClick={() => navigate("forgot")}
                      >
                        {strings.forgotPassword}
                      </button>
                      <div className="authDivider" role="presentation" />
                      <button
                        className="authSecondary"
                        type="button"
                        onClick={() => navigate("register")}
                      >
                        {strings.createAccount}
                      </button>
                    </>
                  ) : (
                    <>
                      {route === "register" ? (
                        <div className="authSocial">
                          <button
                            className="authGmail"
                            type="button"
                            onClick={handleGmailLogin}
                            disabled={authState.type === "loading"}
                          >
                            <span className="authGmailIcon" aria-hidden="true">
                              <svg
                                viewBox="0 0 24 24"
                                role="img"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <rect
                                  x="2"
                                  y="4"
                                  width="20"
                                  height="16"
                                  rx="3"
                                  fill="#fff"
                                  stroke="#d7dce5"
                                />
                                <path
                                  d="M3.5 7.2L12 12.6L20.5 7.2"
                                  fill="none"
                                  stroke="#EA4335"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M3.5 7.2V18.2"
                                  fill="none"
                                  stroke="#4285F4"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M20.5 7.2V18.2"
                                  fill="none"
                                  stroke="#34A853"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M3.5 18.2H20.5"
                                  fill="none"
                                  stroke="#FBBC05"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                            <span>{strings.gmailButton}</span>
                          </button>
                        </div>
                      ) : null}
                      <button
                        className="authLink"
                        type="button"
                        onClick={() => navigate("login")}
                      >
                        {strings.backToLogin}
                      </button>
                    </>
                  )}
                </div>

                <div className="list languageGrid">
                  <div className="languagesSubtitle">
                    {strings.languageSubtitle}
                  </div>
                      {LANGUAGE_LIST.map((lang) => {
                        const nativeLabel = lang.label;
                        const labelDir =
                          "dir" in lang && lang.dir ? lang.dir : "ltr";

                        return (
                          <button
                            key={lang.locale}
                            className="cardButton"
                            type="button"
                            onClick={() => handleLocaleSelect(lang.locale)}
                          >
                            <div className="cardTitle" dir={labelDir}>
                              {nativeLabel}
                            </div>
                            <div className="cardMeta">
                              <span className="langPills">
                                {lang.codes.map((code) => (
                                  <span
                                    key={code}
                                    className="pill langPill"
                                    title={code}
                                  >
                                    <span className="langFlag" aria-hidden="true">
                                      {getFlagEmoji(code)}
                                    </span>
                                  </span>
                                ))}
                              </span>
                            </div>
                          </button>
                        );
                  })}
                </div>
                <div className="partnersSection">
                  <button
                    className="partnersButton btn"
                    type="button"
                    onClick={() => navigate("partners")}
                  >
                    {strings.partnersTitle}
                  </button>
                  <div className="partnersGrid">
                    {partnerPair.map((logo) => (
                      <div
                        key={`${logo.src}-${partnerCycle}`}
                        className="partnerCard"
                      >
                        <img
                          className="partnerLogo"
                          src={logo.src}
                          alt={logo.alt}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="footerActions">
              <button
                className="btn cookieSettingsBtn"
                type="button"
                onClick={() => void openKlaroSettings(locale)}
              >
                {strings.cookieSettings}
              </button>
              <button
                className="btn privacyBtn"
                type="button"
                onClick={() => navigate("privacy")}
              >
                {strings.privacyButton}
              </button>
              <button
                className="btn privacyBtn"
                type="button"
                onClick={() => navigate("impressum")}
              >
                {strings.impressumButton}
              </button>
              <button
                className="btn privacyBtn"
                type="button"
                onClick={() => navigate("terms")}
              >
                {strings.termsButton}
              </button>
              <button
                className={`btn privacyBtn${
                  footerLanguageOpen ? " btnActive" : ""
                }`}
                type="button"
                onClick={() => setFooterLanguageOpen((prev) => !prev)}
                aria-expanded={footerLanguageOpen}
                aria-controls="footerLanguagePicker"
              >
                {changeLanguageButtonLabel}
              </button>
            </div>
            {footerLanguageOpen ? (
              <div className="footerLanguagePicker" id="footerLanguagePicker">
                {LANGUAGE_LIST.map((lang) => {
                  const nativeLabel = lang.label;
                  const labelDir = "dir" in lang && lang.dir ? lang.dir : "ltr";
                  return (
                    <button
                      key={`footer-locale-${lang.locale}`}
                      className={`footerLanguageOption${
                        locale === lang.locale ? " footerLanguageOption--active" : ""
                      }`}
                      type="button"
                      onClick={() => handleLocaleSelect(lang.locale)}
                      dir={labelDir}
                    >
                      {nativeLabel}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="footerNote">© 2026 Language cafe from VELA</div>
          </div>
        </div>
      </div>
    </div>
  );
}

