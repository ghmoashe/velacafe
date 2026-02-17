import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { openKlaroSettings, setupKlaro } from "./klaro";
import { getSupabaseClient } from "./supabaseClient";

const LANGUAGE_LIST = [
  { label: "Deutsch", locale: "de", codes: ["DE"] },
  { label: "English", locale: "en", codes: ["GB"] },
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

type LanguagePref = (typeof LANGUAGE_LIST)[number];
type Locale = LanguagePref["locale"];
type LanguageLevel = (typeof LANGUAGE_LEVELS)[number] | "";

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
  | "events"
  | "event"
  | "profile"
  | "me"
  | "partners"
  | "privacy"
  | "impressum"
  | "terms";

type SessionUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type UserTab = "about" | "photos" | "videos" | "posts" | "tagged";

type PostMediaType = "image" | "video" | "text";

type UserPost = {
  id: string;
  user_id?: string | null;
  media_url: string | null;
  media_type: PostMediaType;
  caption: string | null;
  created_at: string;
};

type EventFormat = "online" | "offline";

type EventRecord = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  image_url?: string | null;
  online_url?: string | null;
  address?: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
  language_level: string | null;
  event_date: string | null;
  format: EventFormat | null;
  created_at: string;
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
  bio?: string | null;
  interests?: string[] | null;
  telegram?: string | null;
  instagram?: string | null;
  cover_url?: string | null;
  is_organizer?: boolean | null;
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
  | "eventsTitle"
  | "eventsSubtitle"
  | "eventCreateTitle"
  | "eventNameLabel"
  | "eventDescriptionLabel"
  | "eventFormatLabel"
  | "eventFormatOnline"
  | "eventFormatOffline"
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
  | "userTabPosts"
  | "userTabTagged"
  | "userBioPlaceholder"
  | "userActionOrganizer"
  | "userPostCaptionPlaceholder"
  | "userPostPublish"
  | "userPostFileHint"
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

function resolveInterestLabel(value: string, locale: Locale): string {
  const preset = INTEREST_PRESETS.find((item) => item.key === value);
  if (!preset) return value;
  return preset.labels[locale] ?? preset.labels.en;
}

function matchInterestPreset(value: string, locale: Locale): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  for (const preset of INTEREST_PRESETS) {
    const localized = (preset.labels[locale] ?? preset.labels.en).toLowerCase();
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

function getStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path ? path.split("?")[0] : null;
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
    case "events":
      return "events";
    case "event":
      return "event";
    case "profile":
      return "profile";
    case "me":
      return "me";
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

const ROUTE_PATHS: Record<Route, string> = {
  login: "/login",
  register: "/register",
  forgot: "/forgot",
  search: "/search",
  events: "/events",
  event: "/event",
  profile: "/profile",
  me: "/me",
  partners: "/partners",
  privacy: "/privacy",
  impressum: "/impressum",
  terms: "/terms",
};

const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  de: {
    brandTag: "Sprachcafé",
    brandSub: "Treffen. Lernen. Reden. Üben.",
    emailPlaceholder: "E-Mail-Adresse oder Telefonnummer",
    passwordPlaceholder: "Passwort",
    confirmPasswordPlaceholder: "Passwort bestätigen",
    loginButton: "Anmelden",
    registerButton: "Jetzt kostenlos anmelden",
    gmailButton: "Mit Gmail fortfahren",
    resetButton: "Link senden",
    forgotPassword: "Passwort vergessen?",
    createAccount: "Neues Konto erstellen",
    backToLogin: "Zurück zum Login",
    backButton: "Zurück",
    guestButton: "Als Gast fortfahren",
    loadingLabel: "Wird geprüft...",
    successLogin: "Erfolgreich angemeldet.",
    successRegister: "Konto erstellt.",
    successReset: "Link wurde gesendet.",
    errorRequired: "Bitte alle Felder ausfüllen.",
    errorPasswordShort: "Passwort ist zu kurz.",
    errorPasswordMismatch: "Passwörter stimmen nicht überein.",
    languageSubtitle: "Wählen Sie die Sprache der Benutzeroberfläche.",
    cookieSettings: "Cookie-Einstellungen",
    privacyButton: "Datenschutz",
    impressumButton: "Impressum",
    termsButton: "Nutzungsbedingungen",
    searchButton: "Suche",
    searchTitle: "Suche",
    searchSubtitle: "Finde Veranstaltungen, Organisatoren und Nutzer.",
    searchPlaceholder: "Suche nach Namen, Beschreibung oder Stichwort...",
    searchCityLabel: "Stadt",
    searchLanguageLabel: "Sprache",
    searchDateLabel: "Datum",
    searchLevelLabel: "Niveau",
    searchApply: "Suchen",
    searchClear: "Zurücksetzen",
    searchSectionEvents: "Veranstaltungen",
    searchSectionOrganizers: "Organisatoren",
    searchSectionUsers: "Nutzer",
    searchEmpty: "Keine Ergebnisse gefunden.",
    eventsButton: "Events",
    eventsTitle: "Events",
    eventsSubtitle: "Erstelle und verwalte deine Veranstaltungen.",
    eventCreateTitle: "Neues Event",
    eventNameLabel: "Titel",
    eventDescriptionLabel: "Beschreibung",
    eventFormatLabel: "Format",
    eventFormatOnline: "Online",
    eventFormatOffline: "Vor Ort",
    eventImageLabel: "Eventbild",
    eventImageHint: "Optional. PNG/JPG bis 5 MB.",
    eventOnlineLabel: "Online-Link",
    eventAddressLabel: "Adresse",
    eventJoin: "Teilnehmen",
    eventInterested: "Interessiert",
    eventOrganizerLabel: "Organisator",
    eventDetailsTitle: "Event",
    eventEdit: "Bearbeiten",
    eventUpdate: "Event aktualisieren",
    eventDelete: "Löschen",
    eventDeleteConfirm: "Event wirklich löschen?",
    eventImageRemove: "Bild entfernen",
    eventCancelEdit: "Bearbeitung abbrechen",
    eventView: "Ansehen",
    eventParticipantsTitle: "Teilnehmer",
    eventGoingLabel: "Zusagen",
    eventInterestedLabel: "Interessiert",
    eventSave: "Event speichern",
    eventSaved: "Event gespeichert.",
    eventListTitle: "Deine Events",
    eventEmpty: "Noch keine Events.",
    partnersTitle: "Unsere Partner",
    profileTitle: "Profil vervollständigen",
    profileSubtitle: "Erzählen Sie kurz etwas über sich.",
    userPageTitle: "Mein Profil",
    userPageSubtitle: "Ihre Angaben im Überblick.",
    profileEditButton: "Profil bearbeiten",
    userStatsPosts: "Beiträge",
    userStatsFollowers: "Follower",
    userStatsFollowing: "Folge ich",
    userActionFollow: "Folgen",
    userActionUnfollow: "Entfolgen",
    userActionMessage: "Nachricht",
    userActionOrganizer: "Organisator werden",
    userTabAbout: "Über",
    userTabPhotos: "Fotos",
    userTabVideos: "Videos",
    userTabPosts: "Beiträge",
    userTabTagged: "Markiert",
    userBioPlaceholder: "Erzählen Sie kurz etwas über sich und Ihre Sprachen.",
    userPostCaptionPlaceholder: "Schreib etwas...",
    userPostPublish: "Veröffentlichen",
    userPostFileHint: "Foto oder Video (PNG/JPG/MP4)",
    userPostEmpty: "Noch keine Beiträge.",
    userPostDelete: "Löschen",
    userPostDeleteConfirm: "Beitrag wirklich löschen?",
    profileHeaderLabel: "Profil",
    profileHeaderNameFallback: "Konto",
    profileNameLabel: "Name",
    profileBirthLabel: "Geburtsdatum",
    profileGenderLabel: "Geschlecht",
    profileGenderFemale: "Weiblich",
    profileGenderMale: "Männlich",
    profileGenderOther: "Divers",
    profileCountryLabel: "Land",
    profileCityLabel: "Stadt",
    profileLanguageLabel: "Ihre Sprache",
    profileLanguagePlaceholder: "Sprache auswählen",
    profileLevelLabel: "Sprachniveau",
    profileLearningLabel: "Ich lerne",
    profilePracticeLabel: "Ich übe",
    profileBioLabel: "Über mich",
    profileBioPlaceholder: "Kurz über dich, deine Ziele und Sprachen.",
    profileInterestsLabel: "Interessen",
    profileInterestsPlaceholder: "Interesse hinzufügen",
    profileInterestsAdd: "Hinzufügen",
    profileInterestsSuggestions: "Beliebt",
    profileSocialLabel: "Soziale Netzwerke",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Titelbild",
    profileCoverHint: "Optional. PNG/JPG bis 5 MB.",
    profileCoverRemove: "Titelbild entfernen",
    profileCoverClear: "Auswahl zurücksetzen",
    profilePhotoLabel: "Profilfoto",
    profilePhotoHint: "Optional. PNG/JPG bis 5 MB.",
    profilePhotoRemove: "Foto löschen",
    profilePhotoClear: "Auswahl zurücksetzen",
    profilePhotoRemoveConfirm: "Profilfoto wirklich löschen?",
    profileSave: "Profil speichern",
    profileSuccess: "Profil gespeichert.",
    profileAuthRequired: "Bitte anmelden, um das Profil zu speichern.",
  },
  en: {
    brandTag: "Language cafe",
    brandSub: "Meet. Learn. Talk. Practice.",
    emailPlaceholder: "Email address or phone number",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm password",
    loginButton: "Sign in",
    registerButton: "Create account",
    gmailButton: "Continue with Gmail",
    resetButton: "Send reset link",
    forgotPassword: "Forgot password?",
    createAccount: "Create new account",
    backToLogin: "Back to sign in",
    backButton: "Back",
    guestButton: "Continue as guest",
    loadingLabel: "Checking...",
    successLogin: "Signed in successfully.",
    successRegister: "Account created.",
    successReset: "Reset link sent.",
    errorRequired: "Please fill in all fields.",
    errorPasswordShort: "Password is too short.",
    errorPasswordMismatch: "Passwords do not match.",
    languageSubtitle: "Choose the interface language.",
    cookieSettings: "Cookie settings",
    privacyButton: "Privacy",
    impressumButton: "Imprint",
    termsButton: "Terms of Service",
    searchButton: "Search",
    searchTitle: "Search",
    searchSubtitle: "Find events, organizers, and users.",
    searchPlaceholder: "Search by name, description, or keyword...",
    searchCityLabel: "City",
    searchLanguageLabel: "Language",
    searchDateLabel: "Date",
    searchLevelLabel: "Level",
    searchApply: "Search",
    searchClear: "Clear",
    searchSectionEvents: "Events",
    searchSectionOrganizers: "Organizers",
    searchSectionUsers: "Users",
    searchEmpty: "No results found.",
    eventsButton: "Events",
    eventsTitle: "Events",
    eventsSubtitle: "Create and manage your events.",
    eventCreateTitle: "New event",
    eventNameLabel: "Title",
    eventDescriptionLabel: "Description",
    eventFormatLabel: "Format",
    eventFormatOnline: "Online",
    eventFormatOffline: "In person",
    eventImageLabel: "Event image",
    eventImageHint: "Optional. PNG/JPG up to 5 MB.",
    eventOnlineLabel: "Online link",
    eventAddressLabel: "Address",
    eventJoin: "Join",
    eventInterested: "Interested",
    eventOrganizerLabel: "Organizer",
    eventDetailsTitle: "Event",
    eventEdit: "Edit",
    eventUpdate: "Update event",
    eventDelete: "Delete",
    eventDeleteConfirm: "Delete this event?",
    eventImageRemove: "Remove image",
    eventCancelEdit: "Cancel edit",
    eventView: "View",
    eventParticipantsTitle: "Participants",
    eventGoingLabel: "Going",
    eventInterestedLabel: "Interested",
    eventSave: "Save event",
    eventSaved: "Event saved.",
    eventListTitle: "Your events",
    eventEmpty: "No events yet.",
    partnersTitle: "Our partners",
    profileTitle: "Complete your profile",
    profileSubtitle: "Tell us a bit about yourself.",
    userPageTitle: "My profile",
    userPageSubtitle: "Your details at a glance.",
    profileEditButton: "Edit profile",
    userStatsPosts: "Posts",
    userStatsFollowers: "Followers",
    userStatsFollowing: "Following",
    userActionFollow: "Follow",
    userActionUnfollow: "Unfollow",
    userActionMessage: "Message",
    userActionOrganizer: "Become organizer",
    userTabAbout: "About",
    userTabPhotos: "Photos",
    userTabVideos: "Videos",
    userTabPosts: "Posts",
    userTabTagged: "Tagged",
    userBioPlaceholder: "Share a short bio about you and your languages.",
    userPostCaptionPlaceholder: "Write something...",
    userPostPublish: "Publish",
    userPostFileHint: "Photo or video (PNG/JPG/MP4)",
    userPostEmpty: "No posts yet.",
    userPostDelete: "Delete",
    userPostDeleteConfirm: "Delete this post?",
    profileHeaderLabel: "Profile",
    profileHeaderNameFallback: "Account",
    profileNameLabel: "Name",
    profileBirthLabel: "Date of birth",
    profileGenderLabel: "Gender",
    profileGenderFemale: "Female",
    profileGenderMale: "Male",
    profileGenderOther: "Other",
    profileCountryLabel: "Country",
    profileCityLabel: "City",
    profileLanguageLabel: "Your language",
    profileLanguagePlaceholder: "Select a language",
    profileLevelLabel: "Language level",
    profileLearningLabel: "Learning",
    profilePracticeLabel: "Practicing",
    profileBioLabel: "About me",
    profileBioPlaceholder: "Short bio about you and your goals.",
    profileInterestsLabel: "Interests",
    profileInterestsPlaceholder: "Add interest",
    profileInterestsAdd: "Add",
    profileInterestsSuggestions: "Popular",
    profileSocialLabel: "Social links",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Cover photo",
    profileCoverHint: "Optional. PNG/JPG up to 5 MB.",
    profileCoverRemove: "Remove cover",
    profileCoverClear: "Clear selection",
    profilePhotoLabel: "Profile photo",
    profilePhotoHint: "Optional. PNG/JPG up to 5 MB.",
    profilePhotoRemove: "Remove photo",
    profilePhotoClear: "Clear selection",
    profilePhotoRemoveConfirm: "Remove profile photo?",
    profileSave: "Save profile",
    profileSuccess: "Profile saved.",
    profileAuthRequired: "Please sign in to save your profile.",
  },
  ru: {
    brandTag: "Языковое кафе",
    brandSub: "Встречайся. Учись. Говори. Практикуйся.",
    emailPlaceholder: "Электронный адрес или номер телефона",
    passwordPlaceholder: "Пароль",
    confirmPasswordPlaceholder: "Повторите пароль",
    loginButton: "Вход",
    registerButton: "Создать аккаунт",
    gmailButton: "Войти через Gmail",
    resetButton: "Отправить ссылку",
    forgotPassword: "Забыли пароль?",
    createAccount: "Создать новый аккаунт",
    backToLogin: "Вернуться ко входу",
    backButton: "Назад",
    guestButton: "Продолжить как гость",
    loadingLabel: "Проверяем...",
    successLogin: "Успешный вход.",
    successRegister: "Аккаунт создан.",
    successReset: "Ссылка отправлена.",
    errorRequired: "Заполните все поля.",
    errorPasswordShort: "Пароль слишком короткий.",
    errorPasswordMismatch: "Пароли не совпадают.",
    languageSubtitle: "Выберите язык интерфейса.",
    cookieSettings: "Настройки cookies",
    privacyButton: "Политика конфиденциальности",
    impressumButton: "Выходные данные",
    termsButton: "Условия использования",
    searchButton: "Поиск",
    searchTitle: "Поиск",
    searchSubtitle: "Найдите события, организаторов и пользователей.",
    searchPlaceholder: "Поиск по имени, описанию или ключевому слову...",
    searchCityLabel: "Город",
    searchLanguageLabel: "Язык",
    searchDateLabel: "Дата",
    searchLevelLabel: "Уровень",
    searchApply: "Найти",
    searchClear: "Сбросить",
    searchSectionEvents: "События",
    searchSectionOrganizers: "Организаторы",
    searchSectionUsers: "Пользователи",
    searchEmpty: "Ничего не найдено.",
    eventsButton: "События",
    eventsTitle: "События",
    eventsSubtitle: "Создавайте и управляйте своими событиями.",
    eventCreateTitle: "Новое событие",
    eventNameLabel: "Название",
    eventDescriptionLabel: "Описание",
    eventFormatLabel: "Формат",
    eventFormatOnline: "Онлайн",
    eventFormatOffline: "Офлайн",
    eventImageLabel: "Фото события",
    eventImageHint: "Необязательно. PNG/JPG до 5 МБ.",
    eventOnlineLabel: "Ссылка онлайн",
    eventAddressLabel: "Адрес",
    eventJoin: "Записаться",
    eventInterested: "Интересуюсь",
    eventOrganizerLabel: "Организатор",
    eventDetailsTitle: "Событие",
    eventEdit: "Редактировать",
    eventUpdate: "Обновить событие",
    eventDelete: "Удалить",
    eventDeleteConfirm: "Удалить это событие?",
    eventImageRemove: "Удалить фото",
    eventCancelEdit: "????????",
    eventView: "Открыть",
    eventParticipantsTitle: "Участники",
    eventGoingLabel: "Идут",
    eventInterestedLabel: "Интересуются",
    eventSave: "Сохранить событие",
    eventSaved: "Событие сохранено.",
    eventListTitle: "Ваши события",
    eventEmpty: "Событий пока нет.",
    partnersTitle: "Наши партнеры",
    profileTitle: "Заполните профиль",
    profileSubtitle: "Расскажите немного о себе.",
    userPageTitle: "Мой профиль",
    userPageSubtitle: "Ваши данные и настройки.",
    profileEditButton: "Редактировать профиль",
    userStatsPosts: "Посты",
    userStatsFollowers: "Подписчики",
    userStatsFollowing: "Подписки",
    userActionFollow: "Подписаться",
    userActionUnfollow: "??????????",
    userActionMessage: "Сообщение",
    userActionOrganizer: "Стать организатором",
    userTabAbout: "Обо мне",
    userTabPhotos: "Фото",
    userTabVideos: "Видео",
    userTabPosts: "Посты",
    userTabTagged: "Отмечено",
    userBioPlaceholder: "Расскажите о себе и ваших языках.",
    userPostCaptionPlaceholder: "Напишите что-нибудь...",
    userPostPublish: "Опубликовать",
    userPostFileHint: "Фото или видео (PNG/JPG/MP4)",
    userPostEmpty: "Пока нет постов.",
    userPostDelete: "Удалить",
    userPostDeleteConfirm: "Удалить этот пост?",
    profileHeaderLabel: "Профиль",
    profileHeaderNameFallback: "Аккаунт",
    profileNameLabel: "Имя",
    profileBirthLabel: "Дата рождения",
    profileGenderLabel: "Пол",
    profileGenderFemale: "Женщина",
    profileGenderMale: "Мужчина",
    profileGenderOther: "Другое",
    profileCountryLabel: "Страна",
    profileCityLabel: "Город",
    profileLanguageLabel: "Ваш язык",
    profileLanguagePlaceholder: "Выберите язык",
    profileLevelLabel: "Уровень языка",
    profileLearningLabel: "Изучаю",
    profilePracticeLabel: "Практикую",
    profileBioLabel: "О себе",
    profileBioPlaceholder: "Коротко о себе и целях.",
    profileInterestsLabel: "Интересы",
    profileInterestsPlaceholder: "Добавить интерес",
    profileInterestsAdd: "Добавить",
    profileInterestsSuggestions: "Популярные",
    profileSocialLabel: "Соцсети",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Фото обложки",
    profileCoverHint: "Необязательно. PNG/JPG до 5 МБ.",
    profileCoverRemove: "Удалить обложку",
    profileCoverClear: "Сбросить выбор",
    profilePhotoLabel: "Фото профиля",
    profilePhotoHint: "Необязательно. PNG/JPG до 5 МБ.",
    profilePhotoRemove: "Удалить фото",
    profilePhotoClear: "Сбросить выбор",
    profilePhotoRemoveConfirm: "Удалить фото профиля?",
    profileSave: "Сохранить профиль",
    profileSuccess: "Профиль сохранен.",
    profileAuthRequired: "Войдите, чтобы сохранить профиль.",
  },
  uk: {
    brandTag: "Мовне кафе",
    brandSub: "Зустрічайся. Вчися. Говори. Практикуйся.",
    emailPlaceholder: "Електронна адреса або номер телефону",
    passwordPlaceholder: "Пароль",
    confirmPasswordPlaceholder: "Повторіть пароль",
    loginButton: "Вхід",
    registerButton: "Створити акаунт",
    gmailButton: "Увійти через Gmail",
    resetButton: "Надіслати посилання",
    forgotPassword: "Забули пароль?",
    createAccount: "Створити новий акаунт",
    backToLogin: "Повернутися до входу",
    backButton: "Назад",
    guestButton: "Продовжити як гість",
    loadingLabel: "Перевіряємо...",
    successLogin: "Успішний вхід.",
    successRegister: "Акаунт створено.",
    successReset: "Посилання надіслано.",
    errorRequired: "Заповніть усі поля.",
    errorPasswordShort: "Пароль надто короткий.",
    errorPasswordMismatch: "Паролі не збігаються.",
    languageSubtitle: "Оберіть мову інтерфейсу.",
    cookieSettings: "Налаштування cookies",
    privacyButton: "Політика конфіденційності",
    impressumButton: "Вихідні дані",
    termsButton: "Умови користування",
    searchButton: "Пошук",
    searchTitle: "Пошук",
    searchSubtitle: "Знайдіть події, організаторів і користувачів.",
    searchPlaceholder: "Пошук за ім'ям, описом чи ключовим словом...",
    searchCityLabel: "Місто",
    searchLanguageLabel: "Мова",
    searchDateLabel: "Дата",
    searchLevelLabel: "Рівень",
    searchApply: "Знайти",
    searchClear: "Скинути",
    searchSectionEvents: "Події",
    searchSectionOrganizers: "Організатори",
    searchSectionUsers: "Користувачі",
    searchEmpty: "Нічого не знайдено.",
    eventsButton: "Події",
    eventsTitle: "Події",
    eventsSubtitle: "Створюйте та керуйте своїми подіями.",
    eventCreateTitle: "Нова подія",
    eventNameLabel: "Назва",
    eventDescriptionLabel: "Опис",
    eventFormatLabel: "Формат",
    eventFormatOnline: "Онлайн",
    eventFormatOffline: "Офлайн",
    eventImageLabel: "Фото події",
    eventImageHint: "Необов’язково. PNG/JPG до 5 МБ.",
    eventOnlineLabel: "Онлайн-посилання",
    eventAddressLabel: "Адреса",
    eventJoin: "Записатися",
    eventInterested: "Цікавлюсь",
    eventOrganizerLabel: "Організатор",
    eventDetailsTitle: "Подія",
    eventEdit: "Редагувати",
    eventUpdate: "Оновити подію",
    eventDelete: "Видалити",
    eventDeleteConfirm: "Видалити цю подію?",
    eventImageRemove: "Видалити фото",
    eventCancelEdit: "?????????",
    eventView: "Відкрити",
    eventParticipantsTitle: "Учасники",
    eventGoingLabel: "Йдуть",
    eventInterestedLabel: "Цікавляться",
    eventSave: "Зберегти подію",
    eventSaved: "Подію збережено.",
    eventListTitle: "Ваші події",
    eventEmpty: "Подій поки немає.",
    partnersTitle: "Наші партнери",
    profileTitle: "Заповніть профіль",
    profileSubtitle: "Розкажіть трохи про себе.",
    userPageTitle: "Мій профіль",
    userPageSubtitle: "Ваші дані й налаштування.",
    profileEditButton: "Редагувати профіль",
    userStatsPosts: "Пости",
    userStatsFollowers: "Підписники",
    userStatsFollowing: "Підписки",
    userActionFollow: "Підписатися",
    userActionUnfollow: "???????????",
    userActionMessage: "Повідомлення",
    userActionOrganizer: "Стати організатором",
    userTabAbout: "Про мене",
    userTabPhotos: "Фото",
    userTabVideos: "Відео",
    userTabPosts: "Пости",
    userTabTagged: "Позначено",
    userBioPlaceholder: "Розкажіть про себе та ваші мови.",
    userPostCaptionPlaceholder: "Напишіть щось...",
    userPostPublish: "Опублікувати",
    userPostFileHint: "Фото або відео (PNG/JPG/MP4)",
    userPostEmpty: "Поки що немає постів.",
    userPostDelete: "Видалити",
    userPostDeleteConfirm: "Видалити цей пост?",
    profileHeaderLabel: "Профіль",
    profileHeaderNameFallback: "Акаунт",
    profileNameLabel: "Ім’я",
    profileBirthLabel: "Дата народження",
    profileGenderLabel: "Стать",
    profileGenderFemale: "Жінка",
    profileGenderMale: "Чоловік",
    profileGenderOther: "Інше",
    profileCountryLabel: "Країна",
    profileCityLabel: "Місто",
    profileLanguageLabel: "Ваша мова",
    profileLanguagePlaceholder: "Оберіть мову",
    profileLevelLabel: "Рівень мови",
    profileLearningLabel: "Вивчаю",
    profilePracticeLabel: "Практикую",
    profileBioLabel: "Про себе",
    profileBioPlaceholder: "Коротко про себе та цілі.",
    profileInterestsLabel: "Інтереси",
    profileInterestsPlaceholder: "Додати інтерес",
    profileInterestsAdd: "Додати",
    profileInterestsSuggestions: "Популярні",
    profileSocialLabel: "Соцмережі",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Фото обкладинки",
    profileCoverHint: "Необов’язково. PNG/JPG до 5 МБ.",
    profileCoverRemove: "Видалити обкладинку",
    profileCoverClear: "Скинути вибір",
    profilePhotoLabel: "Фото профілю",
    profilePhotoHint: "Необов’язково. PNG/JPG до 5 МБ.",
    profilePhotoRemove: "Видалити фото",
    profilePhotoClear: "Скинути вибір",
    profilePhotoRemoveConfirm: "Видалити фото профілю?",
    profileSave: "Зберегти профіль",
    profileSuccess: "Профіль збережено.",
    profileAuthRequired: "Увійдіть, щоб зберегти профіль.",
  },
  fa: {
    brandTag: "کافه زبان",
    brandSub: "دیدار. یادگیری. گفت‌وگو. تمرین.",
    emailPlaceholder: "ایمیل یا شماره تلفن",
    passwordPlaceholder: "رمز عبور",
    confirmPasswordPlaceholder: "تأیید رمز عبور",
    loginButton: "ورود",
    registerButton: "ایجاد حساب",
    gmailButton: "ورود با Gmail",
    resetButton: "ارسال لینک",
    forgotPassword: "رمز عبور را فراموش کردید؟",
    createAccount: "ایجاد حساب جدید",
    backToLogin: "بازگشت به ورود",
    backButton: "بازگشت",
    guestButton: "ادامه به‌عنوان مهمان",
    loadingLabel: "در حال بررسی...",
    successLogin: "ورود با موفقیت انجام شد.",
    successRegister: "حساب ایجاد شد.",
    successReset: "لینک ارسال شد.",
    errorRequired: "همه فیلدها را پر کنید.",
    errorPasswordShort: "رمز عبور کوتاه است.",
    errorPasswordMismatch: "رمزهای عبور یکسان نیستند.",
    languageSubtitle: "زبان رابط کاربری را انتخاب کنید.",
    cookieSettings: "تنظیمات کوکی",
    privacyButton: "حریم خصوصی",
    impressumButton: "اطلاعات حقوقی",
    termsButton: "شرایط استفاده",
    searchButton: "جستجو",
    searchTitle: "جستجو",
    searchSubtitle: "رویدادها، برگزارکنندگان و کاربران را پیدا کنید.",
    searchPlaceholder: "جستجو بر اساس نام، توضیح یا کلیدواژه...",
    searchCityLabel: "شهر",
    searchLanguageLabel: "زبان",
    searchDateLabel: "تاریخ",
    searchLevelLabel: "سطح",
    searchApply: "جستجو",
    searchClear: "پاک کردن",
    searchSectionEvents: "رویدادها",
    searchSectionOrganizers: "برگزارکنندگان",
    searchSectionUsers: "کاربران",
    searchEmpty: "نتیجه‌ای یافت نشد.",
    eventsButton: "رویدادها",
    eventsTitle: "رویدادها",
    eventsSubtitle: "رویدادهای خود را بسازید و مدیریت کنید.",
    eventCreateTitle: "رویداد جدید",
    eventNameLabel: "عنوان",
    eventDescriptionLabel: "توضیحات",
    eventFormatLabel: "فرمت",
    eventFormatOnline: "آنلاین",
    eventFormatOffline: "حضوری",
    eventImageLabel: "تصویر رویداد",
    eventImageHint: "اختیاری. PNG/JPG تا ۵ مگابایت.",
    eventOnlineLabel: "لینک آنلاین",
    eventAddressLabel: "آدرس",
    eventJoin: "ثبت‌نام",
    eventInterested: "علاقه‌مندم",
    eventOrganizerLabel: "برگزارکننده",
    eventDetailsTitle: "رویداد",
    eventEdit: "ویرایش",
    eventUpdate: "به‌روزرسانی رویداد",
    eventDelete: "حذف",
    eventDeleteConfirm: "این رویداد حذف شود؟",
    eventImageRemove: "حذف تصویر",
    eventCancelEdit: "??? ??????",
    eventView: "مشاهده",
    eventParticipantsTitle: "شرکت‌کنندگان",
    eventGoingLabel: "می‌آیند",
    eventInterestedLabel: "علاقه‌مند",
    eventSave: "ذخیره رویداد",
    eventSaved: "رویداد ذخیره شد.",
    eventListTitle: "رویدادهای شما",
    eventEmpty: "هنوز رویدادی نیست.",
    partnersTitle: "شرکای ما",
    profileTitle: "تکمیل پروفایل",
    profileSubtitle: "کمی درباره خودتان بگویید.",
    userPageTitle: "پروفایل من",
    userPageSubtitle: "جزئیات شما در یک نگاه.",
    profileEditButton: "ویرایش پروفایل",
    userStatsPosts: "پست‌ها",
    userStatsFollowers: "دنبال‌کننده‌ها",
    userStatsFollowing: "دنبال‌می‌کنم",
    userActionFollow: "دنبال کردن",
    userActionUnfollow: "??? ????? ????",
    userActionMessage: "پیام",
    userActionOrganizer: "تبدیل به برگزارکننده",
    userTabAbout: "درباره",
    userTabPhotos: "عکس‌ها",
    userTabVideos: "ویدیوها",
    userTabPosts: "پست‌ها",
    userTabTagged: "برچسب‌شده",
    userBioPlaceholder: "کمی درباره خود و زبان‌هایتان بنویسید.",
    userPostCaptionPlaceholder: "چیزی بنویسید...",
    userPostPublish: "انتشار",
    userPostFileHint: "عکس یا ویدیو (PNG/JPG/MP4)",
    userPostEmpty: "هنوز پستی نیست.",
    userPostDelete: "حذف",
    userPostDeleteConfirm: "این پست حذف شود؟",
    profileHeaderLabel: "پروفایل",
    profileHeaderNameFallback: "حساب",
    profileNameLabel: "نام",
    profileBirthLabel: "تاریخ تولد",
    profileGenderLabel: "جنسیت",
    profileGenderFemale: "زن",
    profileGenderMale: "مرد",
    profileGenderOther: "سایر",
    profileCountryLabel: "کشور",
    profileCityLabel: "شهر",
    profileLanguageLabel: "زبان شما",
    profileLanguagePlaceholder: "انتخاب زبان",
    profileLevelLabel: "سطح زبان",
    profileLearningLabel: "در حال یادگیری",
    profilePracticeLabel: "تمرین می‌کنم",
    profileBioLabel: "درباره من",
    profileBioPlaceholder: "کمی درباره خود و هدفتان بنویسید.",
    profileInterestsLabel: "علایق",
    profileInterestsPlaceholder: "افزودن علاقه",
    profileInterestsAdd: "افزودن",
    profileInterestsSuggestions: "محبوب",
    profileSocialLabel: "شبکه‌های اجتماعی",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "تصویر کاور",
    profileCoverHint: "اختیاری. PNG/JPG تا ۵ مگابایت.",
    profileCoverRemove: "حذف کاور",
    profileCoverClear: "لغو انتخاب",
    profilePhotoLabel: "عکس پروفایل",
    profilePhotoHint: "اختیاری. PNG/JPG تا ۵ مگابایت.",
    profilePhotoRemove: "حذف عکس",
    profilePhotoClear: "لغو انتخاب",
    profilePhotoRemoveConfirm: "عکس پروفایل حذف شود؟",
    profileSave: "ذخیره پروفایل",
    profileSuccess: "پروفایل ذخیره شد.",
    profileAuthRequired: "برای ذخیره پروفایل وارد شوید.",
  },
  ar: {
    brandTag: "مقهى اللغات",
    brandSub: "التقِ. تعلّم. تحدّث. تمرّن.",
    emailPlaceholder: "البريد الإلكتروني أو رقم الهاتف",
    passwordPlaceholder: "كلمة المرور",
    confirmPasswordPlaceholder: "تأكيد كلمة المرور",
    loginButton: "تسجيل الدخول",
    registerButton: "إنشاء حساب",
    gmailButton: "المتابعة عبر Gmail",
    resetButton: "إرسال الرابط",
    forgotPassword: "هل نسيت كلمة المرور؟",
    createAccount: "إنشاء حساب جديد",
    backToLogin: "العودة لتسجيل الدخول",
    backButton: "رجوع",
    guestButton: "المتابعة كضيف",
    loadingLabel: "جارٍ التحقق...",
    successLogin: "تم تسجيل الدخول بنجاح.",
    successRegister: "تم إنشاء الحساب.",
    successReset: "تم إرسال الرابط.",
    errorRequired: "يرجى تعبئة جميع الحقول.",
    errorPasswordShort: "كلمة المرور قصيرة.",
    errorPasswordMismatch: "كلمتا المرور غير متطابقتين.",
    languageSubtitle: "اختر لغة الواجهة.",
    cookieSettings: "إعدادات ملفات تعريف الارتباط",
    privacyButton: "الخصوصية",
    impressumButton: "الإفصاح القانوني",
    termsButton: "شروط الاستخدام",
    searchButton: "بحث",
    searchTitle: "بحث",
    searchSubtitle: "ابحث عن الفعاليات والمنظمين والمستخدمين.",
    searchPlaceholder: "ابحث بالاسم أو الوصف أو كلمة مفتاحية...",
    searchCityLabel: "المدينة",
    searchLanguageLabel: "اللغة",
    searchDateLabel: "التاريخ",
    searchLevelLabel: "المستوى",
    searchApply: "بحث",
    searchClear: "مسح",
    searchSectionEvents: "الفعاليات",
    searchSectionOrganizers: "المنظمون",
    searchSectionUsers: "المستخدمون",
    searchEmpty: "لا توجد نتائج.",
    eventsButton: "الفعاليات",
    eventsTitle: "الفعاليات",
    eventsSubtitle: "أنشئ فعالياتك وأدرها.",
    eventCreateTitle: "فعالية جديدة",
    eventNameLabel: "العنوان",
    eventDescriptionLabel: "الوصف",
    eventFormatLabel: "الصيغة",
    eventFormatOnline: "عبر الإنترنت",
    eventFormatOffline: "حضوري",
    eventImageLabel: "صورة الفعالية",
    eventImageHint: "اختياري. PNG/JPG حتى 5 ميغابايت.",
    eventOnlineLabel: "رابط عبر الإنترنت",
    eventAddressLabel: "العنوان",
    eventJoin: "سأشارك",
    eventInterested: "مهتم",
    eventOrganizerLabel: "المنظم",
    eventDetailsTitle: "الفعالية",
    eventEdit: "تعديل",
    eventUpdate: "تحديث الفعالية",
    eventDelete: "حذف",
    eventDeleteConfirm: "هل تريد حذف هذه الفعالية؟",
    eventImageRemove: "إزالة الصورة",
    eventCancelEdit: "????? ???????",
    eventView: "عرض",
    eventParticipantsTitle: "المشاركون",
    eventGoingLabel: "سيحضرون",
    eventInterestedLabel: "مهتمون",
    eventSave: "حفظ الفعالية",
    eventSaved: "تم حفظ الفعالية.",
    eventListTitle: "فعالياتك",
    eventEmpty: "لا توجد فعاليات بعد.",
    partnersTitle: "شركاؤنا",
    profileTitle: "أكمل ملفك الشخصي",
    profileSubtitle: "أخبرنا قليلاً عنك.",
    userPageTitle: "ملفي الشخصي",
    userPageSubtitle: "تفاصيلك في لمحة.",
    profileEditButton: "تعديل الملف الشخصي",
    userStatsPosts: "المنشورات",
    userStatsFollowers: "المتابعون",
    userStatsFollowing: "المتابَعون",
    userActionFollow: "متابعة",
    userActionUnfollow: "????? ????????",
    userActionMessage: "رسالة",
    userActionOrganizer: "كن منظماً",
    userTabAbout: "نبذة",
    userTabPhotos: "الصور",
    userTabVideos: "الفيديو",
    userTabPosts: "المنشورات",
    userTabTagged: "المُشار إليه",
    userBioPlaceholder: "عرّف بنفسك وباللغات التي تتحدثها.",
    userPostCaptionPlaceholder: "اكتب شيئًا...",
    userPostPublish: "نشر",
    userPostFileHint: "صورة أو فيديو (PNG/JPG/MP4)",
    userPostEmpty: "لا توجد منشورات بعد.",
    userPostDelete: "حذف",
    userPostDeleteConfirm: "هل تريد حذف هذا المنشور؟",
    profileHeaderLabel: "الملف الشخصي",
    profileHeaderNameFallback: "الحساب",
    profileNameLabel: "الاسم",
    profileBirthLabel: "تاريخ الميلاد",
    profileGenderLabel: "النوع",
    profileGenderFemale: "أنثى",
    profileGenderMale: "ذكر",
    profileGenderOther: "آخر",
    profileCountryLabel: "البلد",
    profileCityLabel: "المدينة",
    profileLanguageLabel: "لغتك",
    profileLanguagePlaceholder: "اختر اللغة",
    profileLevelLabel: "مستوى اللغة",
    profileLearningLabel: "أتعلم",
    profilePracticeLabel: "أتمرن",
    profileBioLabel: "نبذة عني",
    profileBioPlaceholder: "اكتب نبذة قصيرة عنك وأهدافك.",
    profileInterestsLabel: "الاهتمامات",
    profileInterestsPlaceholder: "إضافة اهتمام",
    profileInterestsAdd: "إضافة",
    profileInterestsSuggestions: "الأكثر شيوعاً",
    profileSocialLabel: "روابط اجتماعية",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "صورة الغلاف",
    profileCoverHint: "اختياري. PNG/JPG حتى 5 ميغابايت.",
    profileCoverRemove: "حذف الغلاف",
    profileCoverClear: "إلغاء الاختيار",
    profilePhotoLabel: "صورة الملف الشخصي",
    profilePhotoHint: "اختياري. PNG/JPG حتى 5 ميغابايت.",
    profilePhotoRemove: "حذف الصورة",
    profilePhotoClear: "إلغاء الاختيار",
    profilePhotoRemoveConfirm: "حذف صورة الملف الشخصي؟",
    profileSave: "حفظ الملف الشخصي",
    profileSuccess: "تم حفظ الملف الشخصي.",
    profileAuthRequired: "يرجى تسجيل الدخول لحفظ الملف الشخصي.",
  },
  sq: {
    brandTag: "Kafene gjuhe",
    brandSub: "Takohu. Mëso. Fol. Praktiko.",
    emailPlaceholder: "Email ose numër telefoni",
    passwordPlaceholder: "Fjalëkalimi",
    confirmPasswordPlaceholder: "Konfirmo fjalëkalimin",
    loginButton: "Hyr",
    registerButton: "Krijo llogari",
    gmailButton: "Vazhdo me Gmail",
    resetButton: "Dërgo linkun",
    forgotPassword: "Keni harruar fjalëkalimin?",
    createAccount: "Krijo llogari të re",
    backToLogin: "Kthehu te hyrja",
    backButton: "Kthehu",
    guestButton: "Vazhdo si mysafir",
    loadingLabel: "Duke kontrolluar...",
    successLogin: "Hyrja u krye me sukses.",
    successRegister: "Llogaria u krijua.",
    successReset: "Lidhja u dërgua.",
    errorRequired: "Plotësoni të gjitha fushat.",
    errorPasswordShort: "Fjalëkalimi është i shkurtër.",
    errorPasswordMismatch: "Fjalëkalimet nuk përputhen.",
    languageSubtitle: "Zgjidhni gjuhën e ndërfaqes.",
    cookieSettings: "Cilësimet e cookies",
    privacyButton: "Privatësia",
    impressumButton: "Njoftim ligjor",
    termsButton: "Kushtet e përdorimit",
    searchButton: "Kërko",
    searchTitle: "Kërkim",
    searchSubtitle: "Gjeni evente, organizatorë dhe përdorues.",
    searchPlaceholder: "Kërko sipas emrit, përshkrimit ose fjalëkyçit...",
    searchCityLabel: "Qyteti",
    searchLanguageLabel: "Gjuha",
    searchDateLabel: "Data",
    searchLevelLabel: "Niveli",
    searchApply: "Kërko",
    searchClear: "Pastro",
    searchSectionEvents: "Evente",
    searchSectionOrganizers: "Organizatorë",
    searchSectionUsers: "Përdorues",
    searchEmpty: "Nuk u gjetën rezultate.",
    eventsButton: "Evente",
    eventsTitle: "Evente",
    eventsSubtitle: "Krijoni dhe menaxhoni eventet tuaja.",
    eventCreateTitle: "Event i ri",
    eventNameLabel: "Titulli",
    eventDescriptionLabel: "Përshkrimi",
    eventFormatLabel: "Formati",
    eventFormatOnline: "Online",
    eventFormatOffline: "Me prani",
    eventImageLabel: "Foto e eventit",
    eventImageHint: "Opsionale. PNG/JPG deri në 5 MB.",
    eventOnlineLabel: "Link online",
    eventAddressLabel: "Adresa",
    eventJoin: "Do të marr pjesë",
    eventInterested: "I interesuar",
    eventOrganizerLabel: "Organizator",
    eventDetailsTitle: "Event",
    eventEdit: "Redakto",
    eventUpdate: "Përditëso eventin",
    eventDelete: "Fshi",
    eventDeleteConfirm: "Të fshihet ky event?",
    eventImageRemove: "Hiq foton",
    eventCancelEdit: "Anulo",
    eventView: "Shiko",
    eventParticipantsTitle: "Pjesëmarrësit",
    eventGoingLabel: "Do të vijë",
    eventInterestedLabel: "Të interesuar",
    eventSave: "Ruaj eventin",
    eventSaved: "Eventi u ruajt.",
    eventListTitle: "Eventet tuaja",
    eventEmpty: "Ende nuk ka evente.",
    partnersTitle: "Partnerët tanë",
    profileTitle: "Plotëso profilin",
    profileSubtitle: "Na trego pak për veten.",
    userPageTitle: "Profili im",
    userPageSubtitle: "Të dhënat tuaja në një vështrim.",
    profileEditButton: "Redakto profilin",
    userStatsPosts: "Postime",
    userStatsFollowers: "Ndjekës",
    userStatsFollowing: "Ndjekje",
    userActionFollow: "Ndiq",
    userActionUnfollow: "Mos ndiq",
    userActionMessage: "Mesazh",
    userActionOrganizer: "Bëhu organizator",
    userTabAbout: "Rreth",
    userTabPhotos: "Foto",
    userTabVideos: "Video",
    userTabPosts: "Postime",
    userTabTagged: "Etiketuar",
    userBioPlaceholder: "Trego pak për veten dhe gjuhët e tua.",
    userPostCaptionPlaceholder: "Shkruani diçka...",
    userPostPublish: "Publiko",
    userPostFileHint: "Foto ose video (PNG/JPG/MP4)",
    userPostEmpty: "Ende nuk ka postime.",
    userPostDelete: "Fshi",
    userPostDeleteConfirm: "Të fshihet ky postim?",
    profileHeaderLabel: "Profili",
    profileHeaderNameFallback: "Llogaria",
    profileNameLabel: "Emri",
    profileBirthLabel: "Data e lindjes",
    profileGenderLabel: "Gjinia",
    profileGenderFemale: "Femër",
    profileGenderMale: "Mashkull",
    profileGenderOther: "Tjetër",
    profileCountryLabel: "Shteti",
    profileCityLabel: "Qyteti",
    profileLanguageLabel: "Gjuha juaj",
    profileLanguagePlaceholder: "Zgjidh gjuhën",
    profileLevelLabel: "Niveli i gjuhës",
    profileLearningLabel: "Po mësoj",
    profilePracticeLabel: "Po praktikoj",
    profileBioLabel: "Rreth meje",
    profileBioPlaceholder: "Shkruaj shkurt për veten dhe qëllimet.",
    profileInterestsLabel: "Interesa",
    profileInterestsPlaceholder: "Shto interes",
    profileInterestsAdd: "Shto",
    profileInterestsSuggestions: "Popullore",
    profileSocialLabel: "Rrjetet sociale",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Foto kopertine",
    profileCoverHint: "Opsionale. PNG/JPG deri në 5 MB.",
    profileCoverRemove: "Hiq kopertinën",
    profileCoverClear: "Pastro përzgjedhjen",
    profilePhotoLabel: "Foto profili",
    profilePhotoHint: "Opsionale. PNG/JPG deri në 5 MB.",
    profilePhotoRemove: "Hiq foton",
    profilePhotoClear: "Pastro përzgjedhjen",
    profilePhotoRemoveConfirm: "Të fshihet fotoja e profilit?",
    profileSave: "Ruaj profilin",
    profileSuccess: "Profili u ruajt.",
    profileAuthRequired: "Ju lutemi hyni për të ruajtur profilin.",
  },
  tr: {
    brandTag: "Dil kafe",
    brandSub: "Buluş. Öğren. Konuş. Pratik yap.",
    emailPlaceholder: "E-posta veya telefon numarası",
    passwordPlaceholder: "Şifre",
    confirmPasswordPlaceholder: "Şifreyi doğrulayın",
    loginButton: "Giriş",
    registerButton: "Hesap oluştur",
    gmailButton: "Gmail ile devam et",
    resetButton: "Bağlantı gönder",
    forgotPassword: "Şifrenizi mi unuttunuz?",
    createAccount: "Yeni hesap oluştur",
    backToLogin: "Girişe dön",
    backButton: "Geri",
    guestButton: "Misafir olarak devam et",
    loadingLabel: "Kontrol ediliyor...",
    successLogin: "Başarıyla giriş yapıldı.",
    successRegister: "Hesap oluşturuldu.",
    successReset: "Bağlantı gönderildi.",
    errorRequired: "Lütfen tüm alanları doldurun.",
    errorPasswordShort: "Şifre çok kısa.",
    errorPasswordMismatch: "Şifreler eşleşmiyor.",
    languageSubtitle: "Arayüz dilini seçin.",
    cookieSettings: "Çerez ayarları",
    privacyButton: "Gizlilik",
    impressumButton: "Künye",
    termsButton: "Kullanım şartları",
    searchButton: "Ara",
    searchTitle: "Ara",
    searchSubtitle: "Etkinlikler, organizatörler ve kullanıcıları bulun.",
    searchPlaceholder: "İsim, açıklama veya anahtar kelime ile ara...",
    searchCityLabel: "Şehir",
    searchLanguageLabel: "Dil",
    searchDateLabel: "Tarih",
    searchLevelLabel: "Seviye",
    searchApply: "Ara",
    searchClear: "Temizle",
    searchSectionEvents: "Etkinlikler",
    searchSectionOrganizers: "Organizatörler",
    searchSectionUsers: "Kullanıcılar",
    searchEmpty: "Sonuç bulunamadı.",
    eventsButton: "Etkinlikler",
    eventsTitle: "Etkinlikler",
    eventsSubtitle: "Etkinliklerinizi oluşturun ve yönetin.",
    eventCreateTitle: "Yeni etkinlik",
    eventNameLabel: "Başlık",
    eventDescriptionLabel: "Açıklama",
    eventFormatLabel: "Format",
    eventFormatOnline: "Online",
    eventFormatOffline: "Yüz yüze",
    eventImageLabel: "Etkinlik görseli",
    eventImageHint: "İsteğe bağlı. PNG/JPG 5 MB'a kadar.",
    eventOnlineLabel: "Online bağlantı",
    eventAddressLabel: "Adres",
    eventJoin: "Katılacağım",
    eventInterested: "İlgileniyorum",
    eventOrganizerLabel: "Organizatör",
    eventDetailsTitle: "Etkinlik",
    eventEdit: "Düzenle",
    eventUpdate: "Etkinliği güncelle",
    eventDelete: "Sil",
    eventDeleteConfirm: "Bu etkinlik silinsin mi?",
    eventImageRemove: "Görseli kaldır",
    eventCancelEdit: "D?zenlemeyi iptal et",
    eventView: "Görüntüle",
    eventParticipantsTitle: "Katılımcılar",
    eventGoingLabel: "Katılıyor",
    eventInterestedLabel: "İlgilenenler",
    eventSave: "Etkinliği kaydet",
    eventSaved: "Etkinlik kaydedildi.",
    eventListTitle: "Etkinlikleriniz",
    eventEmpty: "Henüz etkinlik yok.",
    partnersTitle: "Ortaklarımız",
    profileTitle: "Profili tamamlayın",
    profileSubtitle: "Kendiniz hakkında biraz bilgi verin.",
    userPageTitle: "Profilim",
    userPageSubtitle: "Bilgileriniz burada.",
    profileEditButton: "Profili düzenle",
    userStatsPosts: "Gönderiler",
    userStatsFollowers: "Takipçiler",
    userStatsFollowing: "Takip",
    userActionFollow: "Takip et",
    userActionUnfollow: "Takibi b?rak",
    userActionMessage: "Mesaj",
    userActionOrganizer: "Organizatör ol",
    userTabAbout: "Hakkında",
    userTabPhotos: "Fotoğraflar",
    userTabVideos: "Videolar",
    userTabPosts: "Gönderiler",
    userTabTagged: "Etiketlenen",
    userBioPlaceholder: "Kendiniz ve dilleriniz hakkında kısa bir bilgi yazın.",
    userPostCaptionPlaceholder: "Bir şeyler yaz...",
    userPostPublish: "Yayınla",
    userPostFileHint: "Fotoğraf veya video (PNG/JPG/MP4)",
    userPostEmpty: "Henüz gönderi yok.",
    userPostDelete: "Sil",
    userPostDeleteConfirm: "Bu gönderi silinsin mi?",
    profileHeaderLabel: "Profil",
    profileHeaderNameFallback: "Hesap",
    profileNameLabel: "Ad",
    profileBirthLabel: "Doğum tarihi",
    profileGenderLabel: "Cinsiyet",
    profileGenderFemale: "Kadın",
    profileGenderMale: "Erkek",
    profileGenderOther: "Diğer",
    profileCountryLabel: "Ülke",
    profileCityLabel: "Şehir",
    profileLanguageLabel: "Diliniz",
    profileLanguagePlaceholder: "Dil seçin",
    profileLevelLabel: "Dil seviyesi",
    profileLearningLabel: "Öğreniyorum",
    profilePracticeLabel: "Pratik yapıyorum",
    profileBioLabel: "Hakkımda",
    profileBioPlaceholder: "Kendiniz ve hedefleriniz hakkında kısaca yazın.",
    profileInterestsLabel: "İlgi alanları",
    profileInterestsPlaceholder: "İlgi ekle",
    profileInterestsAdd: "Ekle",
    profileInterestsSuggestions: "Popüler",
    profileSocialLabel: "Sosyal bağlantılar",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Kapak fotoğrafı",
    profileCoverHint: "İsteğe bağlı. PNG/JPG 5 MB'a kadar.",
    profileCoverRemove: "Kapak fotoğrafını sil",
    profileCoverClear: "Seçimi temizle",
    profilePhotoLabel: "Profil fotoğrafı",
    profilePhotoHint: "İsteğe bağlı. PNG/JPG 5 MB'a kadar.",
    profilePhotoRemove: "Fotoğrafı sil",
    profilePhotoClear: "Seçimi temizle",
    profilePhotoRemoveConfirm: "Profil fotoğrafı silinsin mi?",
    profileSave: "Profili kaydet",
    profileSuccess: "Profil kaydedildi.",
    profileAuthRequired: "Profili kaydetmek için giriş yapın.",
  },
  fr: {
    brandTag: "Café des langues",
    brandSub: "Rencontre. Apprends. Parle. Pratique.",
    emailPlaceholder: "Adresse e-mail ou numéro de téléphone",
    passwordPlaceholder: "Mot de passe",
    confirmPasswordPlaceholder: "Confirmez le mot de passe",
    loginButton: "Connexion",
    registerButton: "Créer un compte",
    gmailButton: "Continuer avec Gmail",
    resetButton: "Envoyer le lien",
    forgotPassword: "Mot de passe oublié ?",
    createAccount: "Créer un nouveau compte",
    backToLogin: "Retour à la connexion",
    backButton: "Retour",
    guestButton: "Continuer en tant qu’invité",
    loadingLabel: "Vérification...",
    successLogin: "Connexion réussie.",
    successRegister: "Compte créé.",
    successReset: "Lien envoyé.",
    errorRequired: "Veuillez remplir tous les champs.",
    errorPasswordShort: "Mot de passe trop court.",
    errorPasswordMismatch: "Les mots de passe ne correspondent pas.",
    languageSubtitle: "Choisissez la langue de l'interface.",
    cookieSettings: "Paramètres des cookies",
    privacyButton: "Confidentialité",
    impressumButton: "Mentions légales",
    termsButton: "Conditions d'utilisation",
    searchButton: "Recherche",
    searchTitle: "Recherche",
    searchSubtitle: "Trouvez des événements, des organisateurs et des utilisateurs.",
    searchPlaceholder: "Rechercher par nom, description ou mot-clé...",
    searchCityLabel: "Ville",
    searchLanguageLabel: "Langue",
    searchDateLabel: "Date",
    searchLevelLabel: "Niveau",
    searchApply: "Rechercher",
    searchClear: "Réinitialiser",
    searchSectionEvents: "Événements",
    searchSectionOrganizers: "Organisateurs",
    searchSectionUsers: "Utilisateurs",
    searchEmpty: "Aucun résultat.",
    eventsButton: "Événements",
    eventsTitle: "Événements",
    eventsSubtitle: "Créez et gérez vos événements.",
    eventCreateTitle: "Nouvel événement",
    eventNameLabel: "Titre",
    eventDescriptionLabel: "Description",
    eventFormatLabel: "Format",
    eventFormatOnline: "En ligne",
    eventFormatOffline: "En présentiel",
    eventImageLabel: "Image de l'événement",
    eventImageHint: "Optionnel. PNG/JPG jusqu’à 5 Mo.",
    eventOnlineLabel: "Lien en ligne",
    eventAddressLabel: "Adresse",
    eventJoin: "Je participe",
    eventInterested: "Intéressé",
    eventOrganizerLabel: "Organisateur",
    eventDetailsTitle: "Événement",
    eventEdit: "Modifier",
    eventUpdate: "Mettre à jour l'événement",
    eventDelete: "Supprimer",
    eventDeleteConfirm: "Supprimer cet événement ?",
    eventImageRemove: "Supprimer l'image",
    eventCancelEdit: "Annuler",
    eventView: "Voir",
    eventParticipantsTitle: "Participants",
    eventGoingLabel: "Participants",
    eventInterestedLabel: "Intéressés",
    eventSave: "Enregistrer l'événement",
    eventSaved: "Événement enregistré.",
    eventListTitle: "Vos événements",
    eventEmpty: "Aucun événement pour l'instant.",
    partnersTitle: "Nos partenaires",
    profileTitle: "Complétez votre profil",
    profileSubtitle: "Parlez-nous un peu de vous.",
    userPageTitle: "Mon profil",
    userPageSubtitle: "Vos informations en un coup d'œil.",
    profileEditButton: "Modifier le profil",
    userStatsPosts: "Publications",
    userStatsFollowers: "Abonnés",
    userStatsFollowing: "Abonnements",
    userActionFollow: "Suivre",
    userActionUnfollow: "Ne plus suivre",
    userActionMessage: "Message",
    userActionOrganizer: "Devenir organisateur",
    userTabAbout: "À propos",
    userTabPhotos: "Photos",
    userTabVideos: "Vidéos",
    userTabPosts: "Publications",
    userTabTagged: "Identifié",
    userBioPlaceholder: "Partagez une courte bio sur vous et vos langues.",
    userPostCaptionPlaceholder: "Écrivez quelque chose...",
    userPostPublish: "Publier",
    userPostFileHint: "Photo ou vidéo (PNG/JPG/MP4)",
    userPostEmpty: "Aucune publication pour l'instant.",
    userPostDelete: "Supprimer",
    userPostDeleteConfirm: "Supprimer cette publication ?",
    profileHeaderLabel: "Profil",
    profileHeaderNameFallback: "Compte",
    profileNameLabel: "Nom",
    profileBirthLabel: "Date de naissance",
    profileGenderLabel: "Genre",
    profileGenderFemale: "Femme",
    profileGenderMale: "Homme",
    profileGenderOther: "Autre",
    profileCountryLabel: "Pays",
    profileCityLabel: "Ville",
    profileLanguageLabel: "Votre langue",
    profileLanguagePlaceholder: "Choisir une langue",
    profileLevelLabel: "Niveau de langue",
    profileLearningLabel: "J'apprends",
    profilePracticeLabel: "Je pratique",
    profileBioLabel: "À propos",
    profileBioPlaceholder: "Bref portrait de vous et de vos objectifs.",
    profileInterestsLabel: "Centres d’intérêt",
    profileInterestsPlaceholder: "Ajouter un intérêt",
    profileInterestsAdd: "Ajouter",
    profileInterestsSuggestions: "Populaires",
    profileSocialLabel: "Réseaux sociaux",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Photo de couverture",
    profileCoverHint: "Optionnel. PNG/JPG jusqu’à 5 Mo.",
    profileCoverRemove: "Supprimer la couverture",
    profileCoverClear: "Annuler la sélection",
    profilePhotoLabel: "Photo de profil",
    profilePhotoHint: "Optionnel. PNG/JPG jusqu’à 5 Mo.",
    profilePhotoRemove: "Supprimer la photo",
    profilePhotoClear: "Annuler la sélection",
    profilePhotoRemoveConfirm: "Supprimer la photo de profil ?",
    profileSave: "Enregistrer le profil",
    profileSuccess: "Profil enregistré.",
    profileAuthRequired: "Connectez-vous pour enregistrer le profil.",
  },
  es: {
    brandTag: "Café de idiomas",
    brandSub: "Reúnete. Aprende. Habla. Practica.",
    emailPlaceholder: "Correo electrónico o número de teléfono",
    passwordPlaceholder: "Contraseña",
    confirmPasswordPlaceholder: "Confirmar contraseña",
    loginButton: "Iniciar sesión",
    registerButton: "Crear cuenta",
    gmailButton: "Continuar con Gmail",
    resetButton: "Enviar enlace",
    forgotPassword: "¿Olvidaste tu contraseña?",
    createAccount: "Crear nueva cuenta",
    backToLogin: "Volver al inicio",
    backButton: "Atrás",
    guestButton: "Continuar como invitado",
    loadingLabel: "Verificando...",
    successLogin: "Sesión iniciada.",
    successRegister: "Cuenta creada.",
    successReset: "Enlace enviado.",
    errorRequired: "Completa todos los campos.",
    errorPasswordShort: "La contraseña es muy corta.",
    errorPasswordMismatch: "Las contraseñas no coinciden.",
    languageSubtitle: "Elige el idioma de la interfaz.",
    cookieSettings: "Configuración de cookies",
    privacyButton: "Privacidad",
    impressumButton: "Aviso legal",
    termsButton: "Términos de uso",
    searchButton: "Buscar",
    searchTitle: "Buscar",
    searchSubtitle: "Encuentra eventos, organizadores y usuarios.",
    searchPlaceholder: "Buscar por nombre, descripción o palabra clave...",
    searchCityLabel: "Ciudad",
    searchLanguageLabel: "Idioma",
    searchDateLabel: "Fecha",
    searchLevelLabel: "Nivel",
    searchApply: "Buscar",
    searchClear: "Restablecer",
    searchSectionEvents: "Eventos",
    searchSectionOrganizers: "Organizadores",
    searchSectionUsers: "Usuarios",
    searchEmpty: "No se encontraron resultados.",
    eventsButton: "Eventos",
    eventsTitle: "Eventos",
    eventsSubtitle: "Crea y gestiona tus eventos.",
    eventCreateTitle: "Nuevo evento",
    eventNameLabel: "Título",
    eventDescriptionLabel: "Descripción",
    eventFormatLabel: "Formato",
    eventFormatOnline: "En línea",
    eventFormatOffline: "Presencial",
    eventImageLabel: "Imagen del evento",
    eventImageHint: "Opcional. PNG/JPG hasta 5 MB.",
    eventOnlineLabel: "Enlace en línea",
    eventAddressLabel: "Dirección",
    eventJoin: "Me apunto",
    eventInterested: "Me interesa",
    eventOrganizerLabel: "Organizador",
    eventDetailsTitle: "Evento",
    eventEdit: "Editar",
    eventUpdate: "Actualizar evento",
    eventDelete: "Eliminar",
    eventDeleteConfirm: "¿Eliminar este evento?",
    eventImageRemove: "Quitar imagen",
    eventCancelEdit: "Cancelar",
    eventView: "Ver",
    eventParticipantsTitle: "Participantes",
    eventGoingLabel: "Asistentes",
    eventInterestedLabel: "Interesados",
    eventSave: "Guardar evento",
    eventSaved: "Evento guardado.",
    eventListTitle: "Tus eventos",
    eventEmpty: "Aún no hay eventos.",
    partnersTitle: "Nuestros socios",
    profileTitle: "Completa tu perfil",
    profileSubtitle: "Cuéntanos un poco sobre ti.",
    userPageTitle: "Mi perfil",
    userPageSubtitle: "Tus datos de un vistazo.",
    profileEditButton: "Editar perfil",
    userStatsPosts: "Publicaciones",
    userStatsFollowers: "Seguidores",
    userStatsFollowing: "Siguiendo",
    userActionFollow: "Seguir",
    userActionUnfollow: "Dejar de seguir",
    userActionMessage: "Mensaje",
    userActionOrganizer: "Ser organizador",
    userTabAbout: "Acerca de",
    userTabPhotos: "Fotos",
    userTabVideos: "Videos",
    userTabPosts: "Publicaciones",
    userTabTagged: "Etiquetado",
    userBioPlaceholder: "Comparte una breve bio sobre ti y tus idiomas.",
    userPostCaptionPlaceholder: "Escribe algo...",
    userPostPublish: "Publicar",
    userPostFileHint: "Foto o video (PNG/JPG/MP4)",
    userPostEmpty: "Aún no hay publicaciones.",
    userPostDelete: "Eliminar",
    userPostDeleteConfirm: "¿Eliminar esta publicación?",
    profileHeaderLabel: "Perfil",
    profileHeaderNameFallback: "Cuenta",
    profileNameLabel: "Nombre",
    profileBirthLabel: "Fecha de nacimiento",
    profileGenderLabel: "Género",
    profileGenderFemale: "Mujer",
    profileGenderMale: "Hombre",
    profileGenderOther: "Otro",
    profileCountryLabel: "País",
    profileCityLabel: "Ciudad",
    profileLanguageLabel: "Tu idioma",
    profileLanguagePlaceholder: "Selecciona un idioma",
    profileLevelLabel: "Nivel de idioma",
    profileLearningLabel: "Estoy aprendiendo",
    profilePracticeLabel: "Practico",
    profileBioLabel: "Sobre mí",
    profileBioPlaceholder: "Breve descripción sobre ti y tus objetivos.",
    profileInterestsLabel: "Intereses",
    profileInterestsPlaceholder: "Agregar interés",
    profileInterestsAdd: "Agregar",
    profileInterestsSuggestions: "Populares",
    profileSocialLabel: "Redes sociales",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Foto de portada",
    profileCoverHint: "Opcional. PNG/JPG hasta 5 MB.",
    profileCoverRemove: "Eliminar portada",
    profileCoverClear: "Quitar selección",
    profilePhotoLabel: "Foto de perfil",
    profilePhotoHint: "Opcional. PNG/JPG hasta 5 MB.",
    profilePhotoRemove: "Eliminar foto",
    profilePhotoClear: "Quitar selección",
    profilePhotoRemoveConfirm: "¿Eliminar la foto de perfil?",
    profileSave: "Guardar perfil",
    profileSuccess: "Perfil guardado.",
    profileAuthRequired: "Inicia sesión para guardar el perfil.",
  },
  it: {
    brandTag: "Caffè delle lingue",
    brandSub: "Incontra. Impara. Parla. Esercitati.",
    emailPlaceholder: "Email o numero di telefono",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Conferma password",
    loginButton: "Accedi",
    registerButton: "Crea account",
    gmailButton: "Continua con Gmail",
    resetButton: "Invia link",
    forgotPassword: "Password dimenticata?",
    createAccount: "Crea un nuovo account",
    backToLogin: "Torna al login",
    backButton: "Indietro",
    guestButton: "Continua come ospite",
    loadingLabel: "Verifica in corso...",
    successLogin: "Accesso riuscito.",
    successRegister: "Account creato.",
    successReset: "Link inviato.",
    errorRequired: "Compila tutti i campi.",
    errorPasswordShort: "Password troppo corta.",
    errorPasswordMismatch: "Le password non corrispondono.",
    languageSubtitle: "Scegli la lingua dell'interfaccia.",
    cookieSettings: "Impostazioni dei cookie",
    privacyButton: "Privacy",
    impressumButton: "Note legali",
    termsButton: "Termini di utilizzo",
    searchButton: "Cerca",
    searchTitle: "Cerca",
    searchSubtitle: "Trova eventi, organizzatori e utenti.",
    searchPlaceholder: "Cerca per nome, descrizione o parola chiave...",
    searchCityLabel: "Città",
    searchLanguageLabel: "Lingua",
    searchDateLabel: "Data",
    searchLevelLabel: "Livello",
    searchApply: "Cerca",
    searchClear: "Ripristina",
    searchSectionEvents: "Eventi",
    searchSectionOrganizers: "Organizzatori",
    searchSectionUsers: "Utenti",
    searchEmpty: "Nessun risultato.",
    eventsButton: "Eventi",
    eventsTitle: "Eventi",
    eventsSubtitle: "Crea e gestisci i tuoi eventi.",
    eventCreateTitle: "Nuovo evento",
    eventNameLabel: "Titolo",
    eventDescriptionLabel: "Descrizione",
    eventFormatLabel: "Formato",
    eventFormatOnline: "Online",
    eventFormatOffline: "In presenza",
    eventImageLabel: "Immagine evento",
    eventImageHint: "Opzionale. PNG/JPG fino a 5 MB.",
    eventOnlineLabel: "Link online",
    eventAddressLabel: "Indirizzo",
    eventJoin: "Partecipo",
    eventInterested: "Interessato",
    eventOrganizerLabel: "Organizzatore",
    eventDetailsTitle: "Evento",
    eventEdit: "Modifica",
    eventUpdate: "Aggiorna evento",
    eventDelete: "Elimina",
    eventDeleteConfirm: "Eliminare questo evento?",
    eventImageRemove: "Rimuovi immagine",
    eventCancelEdit: "Annulla",
    eventView: "Apri",
    eventParticipantsTitle: "Partecipanti",
    eventGoingLabel: "Partecipano",
    eventInterestedLabel: "Interessati",
    eventSave: "Salva evento",
    eventSaved: "Evento salvato.",
    eventListTitle: "I tuoi eventi",
    eventEmpty: "Nessun evento ancora.",
    partnersTitle: "I nostri partner",
    profileTitle: "Completa il profilo",
    profileSubtitle: "Raccontaci qualcosa su di te.",
    userPageTitle: "Il mio profilo",
    userPageSubtitle: "I tuoi dati in breve.",
    profileEditButton: "Modifica profilo",
    userStatsPosts: "Post",
    userStatsFollowers: "Follower",
    userStatsFollowing: "Seguiti",
    userActionFollow: "Segui",
    userActionUnfollow: "Smetti di seguire",
    userActionMessage: "Messaggio",
    userActionOrganizer: "Diventa organizzatore",
    userTabAbout: "Info",
    userTabPhotos: "Foto",
    userTabVideos: "Video",
    userTabPosts: "Post",
    userTabTagged: "Tag",
    userBioPlaceholder: "Condividi una breve bio su di te e le tue lingue.",
    userPostCaptionPlaceholder: "Scrivi qualcosa...",
    userPostPublish: "Pubblica",
    userPostFileHint: "Foto o video (PNG/JPG/MP4)",
    userPostEmpty: "Ancora nessun post.",
    userPostDelete: "Elimina",
    userPostDeleteConfirm: "Eliminare questo post?",
    profileHeaderLabel: "Profilo",
    profileHeaderNameFallback: "Account",
    profileNameLabel: "Nome",
    profileBirthLabel: "Data di nascita",
    profileGenderLabel: "Genere",
    profileGenderFemale: "Donna",
    profileGenderMale: "Uomo",
    profileGenderOther: "Altro",
    profileCountryLabel: "Paese",
    profileCityLabel: "Città",
    profileLanguageLabel: "La tua lingua",
    profileLanguagePlaceholder: "Seleziona una lingua",
    profileLevelLabel: "Livello di lingua",
    profileLearningLabel: "Sto imparando",
    profilePracticeLabel: "Pratico",
    profileBioLabel: "Su di me",
    profileBioPlaceholder: "Breve descrizione su di te e i tuoi obiettivi.",
    profileInterestsLabel: "Interessi",
    profileInterestsPlaceholder: "Aggiungi interesse",
    profileInterestsAdd: "Aggiungi",
    profileInterestsSuggestions: "Popolari",
    profileSocialLabel: "Social",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Foto di copertina",
    profileCoverHint: "Opzionale. PNG/JPG fino a 5 MB.",
    profileCoverRemove: "Rimuovi copertina",
    profileCoverClear: "Annulla selezione",
    profilePhotoLabel: "Foto profilo",
    profilePhotoHint: "Opzionale. PNG/JPG fino a 5 MB.",
    profilePhotoRemove: "Rimuovi foto",
    profilePhotoClear: "Annulla selezione",
    profilePhotoRemoveConfirm: "Rimuovere la foto profilo?",
    profileSave: "Salva profilo",
    profileSuccess: "Profilo salvato.",
    profileAuthRequired: "Accedi per salvare il profilo.",
  },
  pl: {
    brandTag: "Kawiarnia językowa",
    brandSub: "Spotkaj się. Ucz się. Rozmawiaj. Ćwicz.",
    emailPlaceholder: "Adres e-mail lub numer telefonu",
    passwordPlaceholder: "Hasło",
    confirmPasswordPlaceholder: "Powtórz hasło",
    loginButton: "Zaloguj się",
    registerButton: "Utwórz konto",
    gmailButton: "Kontynuuj z Gmail",
    resetButton: "Wyślij link",
    forgotPassword: "Nie pamiętasz hasła?",
    createAccount: "Utwórz nowe konto",
    backToLogin: "Wróć do logowania",
    backButton: "Wstecz",
    guestButton: "Kontynuuj jako gość",
    loadingLabel: "Sprawdzanie...",
    successLogin: "Zalogowano pomyślnie.",
    successRegister: "Konto utworzono.",
    successReset: "Link wysłany.",
    errorRequired: "Wypełnij wszystkie pola.",
    errorPasswordShort: "Hasło jest za krótkie.",
    errorPasswordMismatch: "Hasła nie są takie same.",
    languageSubtitle: "Wybierz język interfejsu.",
    cookieSettings: "Ustawienia cookies",
    privacyButton: "Prywatność",
    impressumButton: "Nota prawna",
    termsButton: "Warunki korzystania",
    searchButton: "Szukaj",
    searchTitle: "Szukaj",
    searchSubtitle: "Znajdź wydarzenia, organizatorów i użytkowników.",
    searchPlaceholder: "Szukaj po nazwie, opisie lub słowie kluczowym...",
    searchCityLabel: "Miasto",
    searchLanguageLabel: "Język",
    searchDateLabel: "Data",
    searchLevelLabel: "Poziom",
    searchApply: "Szukaj",
    searchClear: "Wyczyść",
    searchSectionEvents: "Wydarzenia",
    searchSectionOrganizers: "Organizatorzy",
    searchSectionUsers: "Użytkownicy",
    searchEmpty: "Brak wyników.",
    eventsButton: "Wydarzenia",
    eventsTitle: "Wydarzenia",
    eventsSubtitle: "Twórz i zarządzaj swoimi wydarzeniami.",
    eventCreateTitle: "Nowe wydarzenie",
    eventNameLabel: "Tytuł",
    eventDescriptionLabel: "Opis",
    eventFormatLabel: "Format",
    eventFormatOnline: "Online",
    eventFormatOffline: "Stacjonarnie",
    eventImageLabel: "Zdjęcie wydarzenia",
    eventImageHint: "Opcjonalnie. PNG/JPG do 5 MB.",
    eventOnlineLabel: "Link online",
    eventAddressLabel: "Adres",
    eventJoin: "Zapisz się",
    eventInterested: "Interesuje mnie",
    eventOrganizerLabel: "Organizator",
    eventDetailsTitle: "Wydarzenie",
    eventEdit: "Edytuj",
    eventUpdate: "Aktualizuj wydarzenie",
    eventDelete: "Usuń",
    eventDeleteConfirm: "Usunąć to wydarzenie?",
    eventImageRemove: "Usuń zdjęcie",
    eventCancelEdit: "Anuluj",
    eventView: "Otwórz",
    eventParticipantsTitle: "Uczestnicy",
    eventGoingLabel: "Idą",
    eventInterestedLabel: "Zainteresowani",
    eventSave: "Zapisz wydarzenie",
    eventSaved: "Wydarzenie zapisane.",
    eventListTitle: "Twoje wydarzenia",
    eventEmpty: "Brak wydarzeń.",
    partnersTitle: "Nasi partnerzy",
    profileTitle: "Uzupełnij profil",
    profileSubtitle: "Opowiedz nam krótko o sobie.",
    userPageTitle: "Mój profil",
    userPageSubtitle: "Twoje dane w skrócie.",
    profileEditButton: "Edytuj profil",
    userStatsPosts: "Posty",
    userStatsFollowers: "Obserwujący",
    userStatsFollowing: "Obserwowani",
    userActionFollow: "Obserwuj",
    userActionUnfollow: "Przesta? obserwowa?",
    userActionMessage: "Wiadomość",
    userActionOrganizer: "Zostań organizatorem",
    userTabAbout: "O mnie",
    userTabPhotos: "Zdjęcia",
    userTabVideos: "Wideo",
    userTabPosts: "Posty",
    userTabTagged: "Oznaczone",
    userBioPlaceholder: "Napisz krótko o sobie i swoich językach.",
    userPostCaptionPlaceholder: "Napisz coś...",
    userPostPublish: "Opublikuj",
    userPostFileHint: "Zdjęcie lub wideo (PNG/JPG/MP4)",
    userPostEmpty: "Brak postów.",
    userPostDelete: "Usuń",
    userPostDeleteConfirm: "Usunąć ten post?",
    profileHeaderLabel: "Profil",
    profileHeaderNameFallback: "Konto",
    profileNameLabel: "Imię",
    profileBirthLabel: "Data urodzenia",
    profileGenderLabel: "Płeć",
    profileGenderFemale: "Kobieta",
    profileGenderMale: "Mężczyzna",
    profileGenderOther: "Inna",
    profileCountryLabel: "Kraj",
    profileCityLabel: "Miasto",
    profileLanguageLabel: "Twój język",
    profileLanguagePlaceholder: "Wybierz język",
    profileLevelLabel: "Poziom języka",
    profileLearningLabel: "Uczę się",
    profilePracticeLabel: "Ćwiczę",
    profileBioLabel: "O mnie",
    profileBioPlaceholder: "Krótko o sobie i swoich celach.",
    profileInterestsLabel: "Zainteresowania",
    profileInterestsPlaceholder: "Dodaj zainteresowanie",
    profileInterestsAdd: "Dodaj",
    profileInterestsSuggestions: "Popularne",
    profileSocialLabel: "Social media",
    profileTelegramLabel: "Telegram",
    profileInstagramLabel: "Instagram",
    profileCoverLabel: "Zdjęcie w tle",
    profileCoverHint: "Opcjonalnie. PNG/JPG do 5 MB.",
    profileCoverRemove: "Usuń tło",
    profileCoverClear: "Wyczyść wybór",
    profilePhotoLabel: "Zdjęcie profilowe",
    profilePhotoHint: "Opcjonalnie. PNG/JPG do 5 MB.",
    profilePhotoRemove: "Usuń zdjęcie",
    profilePhotoClear: "Wyczyść wybór",
    profilePhotoRemoveConfirm: "Usunąć zdjęcie profilowe?",
    profileSave: "Zapisz profil",
    profileSuccess: "Profil zapisany.",
    profileAuthRequired: "Zaloguj się, aby zapisać profil.",
  },
};

const FALLBACK_LOCALE: Locale = "en";
const POST_AUTH_ROUTE_KEY = "vela-post-auth-route";
const POST_AUTH_EVENT_KEY = "vela-post-auth-event";
const GUEST_MODE_KEY = "vela-guest-mode";
const PROFILE_PHOTO_BUCKET = "avatars";
const POSTS_BUCKET = "posts";
const EVENTS_BUCKET = "events";
const ORGANIZER_FOLLOWS_TABLE = "organizer_follows";
const POSTS_TABLE = "posts";
const POST_MEDIA_FOLDER = "posts";
const LEARN_PRACTICE_EXCLUDED = new Set<Locale>([
  "ru",
  "uk",
  "fa",
  "ar",
  "sq",
  "pl",
]);
const LEARN_PRACTICE_LANGS = LANGUAGE_LIST.filter(
  (lang) => !LEARN_PRACTICE_EXCLUDED.has(lang.locale)
);
const AVATAR_CROP_SIZE = 180;
const AVATAR_OUTPUT_SIZE = 512;

const LANGUAGE_LABELS: Record<Locale, Record<Locale, string>> = {
  de: {
    de: "Deutsch",
    en: "Englisch",
    ru: "Russisch",
    uk: "Ukrainisch",
    fa: "Persisch",
    ar: "Arabisch",
    sq: "Albanisch",
    tr: "Türkisch",
    fr: "Französisch",
    es: "Spanisch",
    it: "Italienisch",
    pl: "Polnisch",
  },
  en: {
    de: "German",
    en: "English",
    ru: "Russian",
    uk: "Ukrainian",
    fa: "Persian",
    ar: "Arabic",
    sq: "Albanian",
    tr: "Turkish",
    fr: "French",
    es: "Spanish",
    it: "Italian",
    pl: "Polish",
  },
  ru: {
    de: "Немецкий",
    en: "Английский",
    ru: "Русский",
    uk: "Украинский",
    fa: "Персидский",
    ar: "Арабский",
    sq: "Албанский",
    tr: "Турецкий",
    fr: "Французский",
    es: "Испанский",
    it: "Итальянский",
    pl: "Польский",
  },
  uk: {
    de: "Німецька",
    en: "Англійська",
    ru: "Російська",
    uk: "Українська",
    fa: "Перська",
    ar: "Арабська",
    sq: "Албанська",
    tr: "Турецька",
    fr: "Французька",
    es: "Іспанська",
    it: "Італійська",
    pl: "Польська",
  },
  fa: {
    de: "آلمانی",
    en: "انگلیسی",
    ru: "روسی",
    uk: "اوکراینی",
    fa: "فارسی",
    ar: "عربی",
    sq: "آلبانیایی",
    tr: "ترکی",
    fr: "فرانسوی",
    es: "اسپانیایی",
    it: "ایتالیایی",
    pl: "لهستانی",
  },
  ar: {
    de: "الألمانية",
    en: "الإنجليزية",
    ru: "الروسية",
    uk: "الأوكرانية",
    fa: "الفارسية",
    ar: "العربية",
    sq: "الألبانية",
    tr: "التركية",
    fr: "الفرنسية",
    es: "الإسبانية",
    it: "الإيطالية",
    pl: "البولندية",
  },
  sq: {
    de: "Gjermanisht",
    en: "Anglisht",
    ru: "Rusisht",
    uk: "Ukrainisht",
    fa: "Persisht",
    ar: "Arabisht",
    sq: "Shqip",
    tr: "Turqisht",
    fr: "Frëngjisht",
    es: "Spanjisht",
    it: "Italisht",
    pl: "Polonisht",
  },
  tr: {
    de: "Almanca",
    en: "İngilizce",
    ru: "Rusça",
    uk: "Ukraynaca",
    fa: "Farsça",
    ar: "Arapça",
    sq: "Arnavutça",
    tr: "Türkçe",
    fr: "Fransızca",
    es: "İspanyolca",
    it: "İtalyanca",
    pl: "Lehçe",
  },
  fr: {
    de: "Allemand",
    en: "Anglais",
    ru: "Russe",
    uk: "Ukrainien",
    fa: "Persan",
    ar: "Arabe",
    sq: "Albanais",
    tr: "Turc",
    fr: "Français",
    es: "Espagnol",
    it: "Italien",
    pl: "Polonais",
  },
  es: {
    de: "Alemán",
    en: "Inglés",
    ru: "Ruso",
    uk: "Ucraniano",
    fa: "Persa",
    ar: "Árabe",
    sq: "Albanés",
    tr: "Turco",
    fr: "Francés",
    es: "Español",
    it: "Italiano",
    pl: "Polaco",
  },
  it: {
    de: "Tedesco",
    en: "Inglese",
    ru: "Russo",
    uk: "Ucraino",
    fa: "Persiano",
    ar: "Arabo",
    sq: "Albanese",
    tr: "Turco",
    fr: "Francese",
    es: "Spagnolo",
    it: "Italiano",
    pl: "Polacco",
  },
  pl: {
    de: "Niemiecki",
    en: "Angielski",
    ru: "Rosyjski",
    uk: "Ukraiński",
    fa: "Perski",
    ar: "Arabski",
    sq: "Albański",
    tr: "Turecki",
    fr: "Francuski",
    es: "Hiszpański",
    it: "Włoski",
    pl: "Polski",
  },
};

function isRtlLocale(locale: Locale) {
  return locale === "ar" || locale === "fa";
}

type PrivacySubsection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  afterList?: string[];
};

type PrivacySection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  afterList?: string[];
  subsections?: PrivacySubsection[];
};

type LegalContent = {
  title: string;
  sections: PrivacySection[];
};

const PRIVACY_CONTENT: Record<Locale, LegalContent> = {
  de: {
    title: "Datenschutzerklärung",
    sections: [
      {
        title: "1. Verantwortlicher",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Deutschland\nE-Mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Welche Daten wir erfassen",
        subsections: [
          {
            title: "Bei Login über Telegram",
            paragraphs: ["Bei der Anmeldung werden folgende Daten übermittelt:"],
            list: [
              "Telegram-ID",
              "Benutzername",
              "Vorname, Nachname",
              "Profilbild (falls vorhanden)",
            ],
            afterList: [
              "Diese Daten werden zur Erstellung Ihres Benutzerkontos verwendet.",
            ],
          },
          {
            title: "Bei Nutzung von E-Mail",
            paragraphs: [
              "Wenn Sie Ihre E-Mail angeben oder uns per E-Mail kontaktieren:",
            ],
            list: ["E-Mail-Adresse", "Nachrichteninhalt"],
          },
          {
            title: "Profildaten innerhalb der Plattform",
            list: [
              "Stadt",
              "Sprachpräferenzen",
              "Teilnahme an Veranstaltungen (online/offline)",
              "Angaben, die Sie freiwillig machen",
            ],
          },
          {
            title: "Technische Daten",
            list: ["IP-Adresse", "Gerätetyp", "Cookies"],
          },
        ],
      },
      {
        title: "3. Zweck der Verarbeitung",
        paragraphs: ["Ihre Daten werden verwendet, um:"],
        list: [
          "Ihr Benutzerkonto zu erstellen und zu verwalten",
          "Sprach-Treffen in Ihrer Stadt anzuzeigen",
          "Online- und Offline-Veranstaltungen zu organisieren",
          "Kommunikation zwischen Teilnehmern zu ermöglichen",
          "Ihnen Informationen per E-Mail zu senden",
          "Die Plattform technisch und funktional zu verbessern",
        ],
        afterList: ["Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO"],
      },
      {
        title: "4. Cookies und Consent",
        paragraphs: [
          "Wir verwenden das Consent-Tool Klaro!.",
          "Technisch notwendige Cookies sind immer aktiv.",
          "Analyse-Cookies werden nur nach Ihrer Einwilligung aktiviert.",
          "Rechtsgrundlage: §25 TTDSG, Art. 6 Abs. 1 lit. a DSGVO",
        ],
      },
      {
        title: "5. Einsatz von Google Analytics",
        paragraphs: [
          "Google Analytics wird nur nach Zustimmung geladen und speichert anonymisierte Nutzungsdaten zur Verbesserung der Plattform.",
          "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO",
        ],
      },
      {
        title: "6. Hosting und Datenbank",
        paragraphs: [
          "Wir nutzen Supabase (Server innerhalb der EU) zur Speicherung der Daten.",
          "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO",
        ],
      },
      {
        title: "7. Weitergabe von Daten",
        paragraphs: ["Daten werden ausschließlich weitergegeben an:"],
        list: [
          "Telegram (Login)",
          "Supabase (Hosting)",
          "Google (Analytics, nur nach Einwilligung)",
        ],
        afterList: ["Eine Weitergabe zu Werbezwecken erfolgt nicht."],
      },
      {
        title: "8. Offline-Veranstaltungen",
        paragraphs: [
          "Vela ermöglicht reale Treffen zwischen Menschen.",
          "Für Teilnehmer sichtbar sind nur notwendige Profildaten (Name, Sprache, Stadt).",
          "Vela übernimmt keine Verantwortung für das Verhalten von Teilnehmern bei Offline-Treffen.",
        ],
      },
      {
        title: "9. E-Mail Kommunikation",
        paragraphs: ["Wir verwenden Ihre E-Mail-Adresse für:"],
        list: [
          "Plattform-Informationen",
          "Veranstaltungsinformationen",
          "Wichtige Updates",
        ],
        afterList: [
          "Sie können sich jederzeit von E-Mails abmelden.",
          "Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO",
        ],
      },
      {
        title: "10. Speicherdauer",
        paragraphs: [
          "Daten werden gespeichert, solange Ihr Konto aktiv ist.",
          "Nach Löschung werden alle Daten entfernt.",
        ],
      },
      {
        title: "11. Ihre Rechte",
        paragraphs: ["Sie haben das Recht auf:"],
        list: [
          "Auskunft",
          "Berichtigung",
          "Löschung",
          "Einschränkung",
          "Datenübertragbarkeit",
          "Widerruf Ihrer Einwilligung",
        ],
        afterList: ["Kontakt: info@vela.cafe"],
      },
      {
        title: "12. Sicherheit",
        paragraphs: [
          "Wir verwenden Verschlüsselung, Zugriffskontrollen und moderne Sicherheitsmaßnahmen.",
        ],
      },
      {
        title: "13. Änderungen",
        paragraphs: [
          "Diese Datenschutzerklärung kann bei Änderungen der Plattform angepasst werden.",
          "Stand: Februar 2026",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      {
        title: "1. Controller",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Germany\nEmail: info@vela.cafe",
        ],
      },
      {
        title: "2. What Data We Collect",
        subsections: [
          {
            title: "When logging in via Telegram",
            paragraphs: ["When you sign in, the following data is transmitted:"],
            list: [
              "Telegram ID",
              "Username",
              "First name, last name",
              "Profile photo (if available)",
            ],
            afterList: ["This data is used to create your user account."],
          },
          {
            title: "When using email",
            paragraphs: [
              "If you provide your email address or contact us by email:",
            ],
            list: ["Email address", "Message content"],
          },
          {
            title: "Profile data within the platform",
            list: [
              "City",
              "Language preferences",
              "Participation in events (online/offline)",
              "Information you provide voluntarily",
            ],
          },
          {
            title: "Technical data",
            list: ["IP address", "Device type", "Cookies"],
          },
        ],
      },
      {
        title: "3. Purpose of Processing",
        paragraphs: ["Your data is used to:"],
        list: [
          "Create and manage your user account",
          "Show language meetups in your city",
          "Organize online and offline events",
          "Enable communication between participants",
          "Send you information by email",
          "Improve the platform technically and functionally",
        ],
        afterList: ["Legal basis: Art. 6(1)(b) and (f) GDPR"],
      },
      {
        title: "4. Cookies and Consent",
        paragraphs: [
          "We use the consent tool Klaro!.",
          "Technically necessary cookies are always active.",
          "Analytics cookies are activated only with your consent.",
          "Legal basis: §25 TTDSG, Art. 6(1)(a) GDPR",
        ],
      },
      {
        title: "5. Use of Google Analytics",
        paragraphs: [
          "Google Analytics is loaded only after consent and stores anonymized usage data to improve the platform.",
          "Legal basis: Art. 6(1)(a) GDPR",
        ],
      },
      {
        title: "6. Hosting and Database",
        paragraphs: [
          "We use Supabase (servers within the EU) to store data.",
          "Legal basis: Art. 6(1)(b) GDPR",
        ],
      },
      {
        title: "7. Data Sharing",
        paragraphs: ["Data is shared only with:"],
        list: [
          "Telegram (login)",
          "Supabase (hosting)",
          "Google (analytics, only with consent)",
        ],
        afterList: ["Data is not shared for advertising purposes."],
      },
      {
        title: "8. Offline Events",
        paragraphs: [
          "Vela enables real-life meetings between people.",
          "Only necessary profile data (name, language, city) is visible to participants.",
          "Vela assumes no responsibility for participants' behavior at offline meetings.",
        ],
      },
      {
        title: "9. Email Communication",
        paragraphs: ["We use your email address for:"],
        list: ["Platform information", "Event information", "Important updates"],
        afterList: [
          "You can unsubscribe from emails at any time.",
          "Legal basis: Art. 6(1)(b) GDPR",
        ],
      },
      {
        title: "10. Retention Period",
        paragraphs: [
          "Data is stored as long as your account is active.",
          "After deletion, all data is removed.",
        ],
      },
      {
        title: "11. Your Rights",
        paragraphs: ["You have the right to:"],
        list: [
          "Access",
          "Rectification",
          "Deletion",
          "Restriction",
          "Data portability",
          "Withdrawal of your consent",
        ],
        afterList: ["Contact: info@vela.cafe"],
      },
      {
        title: "12. Security",
        paragraphs: [
          "We use encryption, access controls and modern security measures.",
        ],
      },
      {
        title: "13. Changes",
        paragraphs: [
          "This privacy policy may be updated when the platform changes.",
          "Status: February 2026",
        ],
      },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    sections: [
      {
        title: "1. Ответственное лицо",
        paragraphs: [
          "Ghazanfar Maosher\nБерлин, Германия\nE-mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Какие данные мы собираем",
        subsections: [
          {
            title: "При входе через Telegram",
            paragraphs: ["При входе передаются следующие данные:"],
            list: [
              "Telegram-ID",
              "Имя пользователя",
              "Имя, фамилия",
              "Фото профиля (если есть)",
            ],
            afterList: ["Эти данные используются для создания вашего аккаунта."],
          },
          {
            title: "При использовании E-mail",
            paragraphs: [
              "Если вы указываете E-mail или связываетесь с нами по E-mail:",
            ],
            list: ["E-mail адрес", "Содержание сообщения"],
          },
          {
            title: "Профильные данные в платформе",
            list: [
              "Город",
              "Языковые предпочтения",
              "Участие в мероприятиях (онлайн/офлайн)",
              "Данные, которые вы указываете добровольно",
            ],
          },
          {
            title: "Технические данные",
            list: ["IP-адрес", "Тип устройства", "Cookies"],
          },
        ],
      },
      {
        title: "3. Цель обработки",
        paragraphs: ["Ваши данные используются для:"],
        list: [
          "Создания и управления вашим аккаунтом",
          "Показа языковых встреч в вашем городе",
          "Организации онлайн и офлайн мероприятий",
          "Обеспечения коммуникации между участниками",
          "Отправки вам информации по E-mail",
          "Технического и функционального улучшения платформы",
        ],
        afterList: ["Правовое основание: ст. 6 абз. 1 лит. b и f DSGVO"],
      },
      {
        title: "4. Cookies и согласие",
        paragraphs: [
          "Мы используем инструмент согласия Klaro!.",
          "Технически необходимые cookies всегда активны.",
          "Аналитические cookies активируются только после вашего согласия.",
          "Правовое основание: §25 TTDSG, ст. 6 абз. 1 лит. a DSGVO",
        ],
      },
      {
        title: "5. Использование Google Analytics",
        paragraphs: [
          "Google Analytics загружается только после согласия и хранит обезличенные данные об использовании для улучшения платформы.",
          "Правовое основание: ст. 6 абз. 1 лит. a DSGVO",
        ],
      },
      {
        title: "6. Хостинг и база данных",
        paragraphs: [
          "Мы используем Supabase (серверы в пределах ЕС) для хранения данных.",
          "Правовое основание: ст. 6 абз. 1 лит. b DSGVO",
        ],
      },
      {
        title: "7. Передача данных",
        paragraphs: ["Данные передаются исключительно следующим сторонам:"],
        list: [
          "Telegram (вход)",
          "Supabase (хостинг)",
          "Google (аналитика, только с согласия)",
        ],
        afterList: ["Передача данных в рекламных целях не осуществляется."],
      },
      {
        title: "8. Офлайн-мероприятия",
        paragraphs: [
          "Vela организует реальные встречи между людьми.",
          "Для участников видны только необходимые профильные данные (имя, язык, город).",
          "Vela не несёт ответственности за поведение участников на офлайн-встречах.",
        ],
      },
      {
        title: "9. E-mail коммуникация",
        paragraphs: ["Мы используем ваш E-mail для:"],
        list: [
          "Информации о платформе",
          "Информации о мероприятиях",
          "Важных обновлений",
        ],
        afterList: [
          "Вы можете в любой момент отказаться от рассылки.",
          "Правовое основание: ст. 6 абз. 1 лит. b DSGVO",
        ],
      },
      {
        title: "10. Срок хранения",
        paragraphs: [
          "Данные хранятся, пока ваш аккаунт активен.",
          "После удаления аккаунта все данные удаляются.",
        ],
      },
      {
        title: "11. Ваши права",
        paragraphs: ["Вы имеете право на:"],
        list: [
          "Доступ к данным",
          "Исправление",
          "Удаление",
          "Ограничение обработки",
          "Переносимость данных",
          "Отзыв согласия",
        ],
        afterList: ["Контакт: info@vela.cafe"],
      },
      {
        title: "12. Безопасность",
        paragraphs: [
          "Мы используем шифрование, контроль доступа и современные меры безопасности.",
        ],
      },
      {
        title: "13. Изменения",
        paragraphs: [
          "Эта политика конфиденциальности может обновляться при изменениях платформы.",
          "Статус: февраль 2026",
        ],
      },
    ],
  },
  uk: {
    title: "Політика конфіденційності",
    sections: [
      {
        title: "1. Відповідальна особа",
        paragraphs: [
          "Ghazanfar Maosher\nБерлін, Німеччина\nE-mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Які дані ми збираємо",
        subsections: [
          {
            title: "Під час входу через Telegram",
            paragraphs: ["Під час входу передаються такі дані:"],
            list: [
              "Telegram-ID",
              "Ім'я користувача",
              "Ім'я, прізвище",
              "Фото профілю (за наявності)",
            ],
            afterList: ["Ці дані використовуються для створення вашого акаунта."],
          },
          {
            title: "Під час використання E-mail",
            paragraphs: [
              "Якщо ви вказуєте E-mail або зв’язуєтесь з нами електронною поштою:",
            ],
            list: ["E-mail адреса", "Вміст повідомлення"],
          },
          {
            title: "Профільні дані в межах платформи",
            list: [
              "Місто",
              "Мовні вподобання",
              "Участь у заходах (онлайн/офлайн)",
              "Дані, які ви вказуєте добровільно",
            ],
          },
          {
            title: "Технічні дані",
            list: ["IP-адреса", "Тип пристрою", "Cookies"],
          },
        ],
      },
      {
        title: "3. Мета обробки",
        paragraphs: ["Ваші дані використовуються для:"],
        list: [
          "Створення та керування вашим акаунтом",
          "Показу мовних зустрічей у вашому місті",
          "Організації онлайн та офлайн заходів",
          "Забезпечення комунікації між учасниками",
          "Надсилання вам інформації електронною поштою",
          "Технічного та функціонального покращення платформи",
        ],
        afterList: ["Правова підстава: ст. 6 абз. 1 літ. b та f DSGVO"],
      },
      {
        title: "4. Cookies та згода",
        paragraphs: [
          "Ми використовуємо інструмент згоди Klaro!.",
          "Технічно необхідні cookies завжди активні.",
          "Аналітичні cookies активуються лише після вашої згоди.",
          "Правова підстава: §25 TTDSG, ст. 6 абз. 1 літ. a DSGVO",
        ],
      },
      {
        title: "5. Використання Google Analytics",
        paragraphs: [
          "Google Analytics завантажується лише після згоди та зберігає знеособлені дані використання для покращення платформи.",
          "Правова підстава: ст. 6 абз. 1 літ. a DSGVO",
        ],
      },
      {
        title: "6. Хостинг і база даних",
        paragraphs: [
          "Ми використовуємо Supabase (сервери в межах ЄС) для зберігання даних.",
          "Правова підстава: ст. 6 абз. 1 літ. b DSGVO",
        ],
      },
      {
        title: "7. Передача даних",
        paragraphs: ["Дані передаються виключно таким сторонам:"],
        list: [
          "Telegram (вхід)",
          "Supabase (хостинг)",
          "Google (аналітика, лише за згоди)",
        ],
        afterList: ["Передача даних для рекламних цілей не здійснюється."],
      },
      {
        title: "8. Офлайн-заходи",
        paragraphs: [
          "Vela організовує реальні зустрічі між людьми.",
          "Для учасників видимі лише необхідні профільні дані (ім’я, мова, місто).",
          "Vela не несе відповідальності за поведінку учасників на офлайн-зустрічах.",
        ],
      },
      {
        title: "9. E-mail комунікація",
        paragraphs: ["Ми використовуємо вашу E-mail адресу для:"],
        list: [
          "Інформації про платформу",
          "Інформації про заходи",
          "Важливих оновлень",
        ],
        afterList: [
          "Ви можете будь-коли відмовитися від листів.",
          "Правова підстава: ст. 6 абз. 1 літ. b DSGVO",
        ],
      },
      {
        title: "10. Строк зберігання",
        paragraphs: [
          "Дані зберігаються, доки ваш акаунт активний.",
          "Після видалення всі дані видаляються.",
        ],
      },
      {
        title: "11. Ваші права",
        paragraphs: ["Ви маєте право на:"],
        list: [
          "Доступ",
          "Виправлення",
          "Видалення",
          "Обмеження обробки",
          "Перенесення даних",
          "Відкликання згоди",
        ],
        afterList: ["Контакт: info@vela.cafe"],
      },
      {
        title: "12. Безпека",
        paragraphs: [
          "Ми використовуємо шифрування, контроль доступу та сучасні заходи безпеки.",
        ],
      },
      {
        title: "13. Зміни",
        paragraphs: [
          "Ця політика конфіденційності може оновлюватися у разі змін платформи.",
          "Стан: лютий 2026",
        ],
      },
    ],
  },
  fa: {
    title: "سیاست حفظ حریم خصوصی",
    sections: [
      {
        title: "1. مسئول پردازش",
        paragraphs: [
          "Ghazanfar Maosher\nبرلین، آلمان\nایمیل: info@vela.cafe",
        ],
      },
      {
        title: "2. چه داده‌هایی جمع‌آوری می‌کنیم",
        subsections: [
          {
            title: "هنگام ورود با تلگرام",
            paragraphs: ["در هنگام ورود، داده‌های زیر منتقل می‌شود:"],
            list: [
              "شناسه تلگرام",
              "نام کاربری",
              "نام و نام خانوادگی",
              "تصویر پروفایل (در صورت وجود)",
            ],
            afterList: ["این داده‌ها برای ایجاد حساب کاربری شما استفاده می‌شوند."],
          },
          {
            title: "هنگام استفاده از ایمیل",
            paragraphs: [
              "اگر ایمیل خود را وارد کنید یا از طریق ایمیل با ما تماس بگیرید:",
            ],
            list: ["آدرس ایمیل", "محتوای پیام"],
          },
          {
            title: "داده‌های پروفایل در داخل پلتفرم",
            list: [
              "شهر",
              "ترجیحات زبانی",
              "شرکت در رویدادها (آنلاین/آفلاین)",
              "اطلاعاتی که داوطلبانه ارائه می‌کنید",
            ],
          },
          {
            title: "داده‌های فنی",
            list: ["آدرس IP", "نوع دستگاه", "کوکی‌ها"],
          },
        ],
      },
      {
        title: "3. هدف پردازش",
        paragraphs: ["داده‌های شما برای موارد زیر استفاده می‌شود:"],
        list: [
          "ایجاد و مدیریت حساب کاربری شما",
          "نمایش ملاقات‌های زبانی در شهر شما",
          "برگزاری رویدادهای آنلاین و آفلاین",
          "امکان ارتباط بین شرکت‌کنندگان",
          "ارسال اطلاعات از طریق ایمیل",
          "بهبود فنی و عملکردی پلتفرم",
        ],
        afterList: ["مبنای قانونی: ماده ۶ بند ۱ حروف b و f DSGVO"],
      },
      {
        title: "4. کوکی‌ها و رضایت",
        paragraphs: [
          "ما از ابزار رضایت Klaro! استفاده می‌کنیم.",
          "کوکی‌های ضروری همیشه فعال هستند.",
          "کوکی‌های تحلیلی فقط با رضایت شما فعال می‌شوند.",
          "مبنای قانونی: §25 TTDSG، ماده ۶ بند ۱ حرف a DSGVO",
        ],
      },
      {
        title: "5. استفاده از Google Analytics",
        paragraphs: [
          "Google Analytics فقط پس از رضایت بارگذاری می‌شود و داده‌های ناشناس استفاده را برای بهبود پلتفرم ذخیره می‌کند.",
          "مبنای قانونی: ماده ۶ بند ۱ حرف a DSGVO",
        ],
      },
      {
        title: "6. میزبانی و پایگاه داده",
        paragraphs: [
          "ما از Supabase (سرورهای داخل اتحادیه اروپا) برای ذخیره داده‌ها استفاده می‌کنیم.",
          "مبنای قانونی: ماده ۶ بند ۱ حرف b DSGVO",
        ],
      },
      {
        title: "7. اشتراک‌گذاری داده‌ها",
        paragraphs: ["داده‌ها فقط با موارد زیر به اشتراک گذاشته می‌شوند:"],
        list: [
          "Telegram (ورود)",
          "Supabase (میزبانی)",
          "Google (تحلیل، فقط با رضایت)",
        ],
        afterList: ["هیچ انتقالی برای اهداف تبلیغاتی انجام نمی‌شود."],
      },
      {
        title: "8. رویدادهای آفلاین",
        paragraphs: [
          "Vela امکان دیدارهای حضوری بین افراد را فراهم می‌کند.",
          "برای شرکت‌کنندگان فقط داده‌های ضروری پروفایل (نام، زبان، شهر) قابل مشاهده است.",
          "Vela مسئولیتی در قبال رفتار شرکت‌کنندگان در دیدارهای آفلاین ندارد.",
        ],
      },
      {
        title: "9. ارتباط از طریق ایمیل",
        paragraphs: ["ما از آدرس ایمیل شما برای موارد زیر استفاده می‌کنیم:"],
        list: ["اطلاعات پلتفرم", "اطلاعات رویدادها", "به‌روزرسانی‌های مهم"],
        afterList: [
          "شما هر زمان می‌توانید از دریافت ایمیل‌ها انصراف دهید.",
          "مبنای قانونی: ماده ۶ بند ۱ حرف b DSGVO",
        ],
      },
      {
        title: "10. مدت نگهداری",
        paragraphs: [
          "داده‌ها تا زمانی که حساب شما فعال است نگهداری می‌شوند.",
          "پس از حذف حساب، همه داده‌ها حذف می‌شوند.",
        ],
      },
      {
        title: "11. حقوق شما",
        paragraphs: ["شما حق دارید:"],
        list: [
          "دسترسی",
          "اصلاح",
          "حذف",
          "محدودیت پردازش",
          "قابلیت انتقال داده",
          "پس‌گرفتن رضایت",
        ],
        afterList: ["تماس: info@vela.cafe"],
      },
      {
        title: "12. امنیت",
        paragraphs: [
          "ما از رمزنگاری، کنترل دسترسی و اقدامات امنیتی مدرن استفاده می‌کنیم.",
        ],
      },
      {
        title: "13. تغییرات",
        paragraphs: [
          "این سیاست حریم خصوصی ممکن است با تغییرات پلتفرم به‌روز شود.",
          "وضعیت: فوریه 2026",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    sections: [
      {
        title: "1. المسؤول",
        paragraphs: [
          "Ghazanfar Maosher\nبرلين، ألمانيا\nالبريد الإلكتروني: info@vela.cafe",
        ],
      },
      {
        title: "2. البيانات التي نجمعها",
        subsections: [
          {
            title: "عند تسجيل الدخول عبر Telegram",
            paragraphs: ["عند التسجيل يتم نقل البيانات التالية:"],
            list: [
              "معرّف Telegram",
              "اسم المستخدم",
              "الاسم الأول واسم العائلة",
              "صورة الملف الشخصي (إن وجدت)",
            ],
            afterList: ["تُستخدم هذه البيانات لإنشاء حسابك."],
          },
          {
            title: "عند استخدام البريد الإلكتروني",
            paragraphs: [
              "إذا قدمت بريدك الإلكتروني أو تواصلت معنا عبر البريد الإلكتروني:",
            ],
            list: ["عنوان البريد الإلكتروني", "محتوى الرسالة"],
          },
          {
            title: "بيانات الملف الشخصي داخل المنصة",
            list: [
              "المدينة",
              "تفضيلات اللغة",
              "المشاركة في الفعاليات (عبر الإنترنت/دون اتصال)",
              "المعلومات التي تقدمها طوعاً",
            ],
          },
          {
            title: "البيانات التقنية",
            list: ["عنوان IP", "نوع الجهاز", "ملفات تعريف الارتباط"],
          },
        ],
      },
      {
        title: "3. غرض المعالجة",
        paragraphs: ["تُستخدم بياناتك من أجل:"],
        list: [
          "إنشاء حسابك وإدارته",
          "عرض لقاءات اللغات في مدينتك",
          "تنظيم الفعاليات عبر الإنترنت ودون اتصال",
          "تمكين التواصل بين المشاركين",
          "إرسال المعلومات إليك عبر البريد الإلكتروني",
          "تحسين المنصة تقنياً ووظيفياً",
        ],
        afterList: ["الأساس القانوني: المادة 6 الفقرة 1 البنود b و f من DSGVO"],
      },
      {
        title: "4. ملفات تعريف الارتباط والموافقة",
        paragraphs: [
          "نستخدم أداة الموافقة Klaro!.",
          "ملفات تعريف الارتباط الضرورية تقنياً تكون فعّالة دائماً.",
          "تُفعّل ملفات تعريف الارتباط التحليلية فقط بعد موافقتك.",
          "الأساس القانوني: §25 TTDSG، المادة 6 الفقرة 1 البند a من DSGVO",
        ],
      },
      {
        title: "5. استخدام Google Analytics",
        paragraphs: [
          "يتم تحميل Google Analytics فقط بعد الموافقة ويخزن بيانات استخدام مجهولة لتحسين المنصة.",
          "الأساس القانوني: المادة 6 الفقرة 1 البند a من DSGVO",
        ],
      },
      {
        title: "6. الاستضافة وقاعدة البيانات",
        paragraphs: [
          "نستخدم Supabase (خوادم داخل الاتحاد الأوروبي) لتخزين البيانات.",
          "الأساس القانوني: المادة 6 الفقرة 1 البند b من DSGVO",
        ],
      },
      {
        title: "7. مشاركة البيانات",
        paragraphs: ["تتم مشاركة البيانات فقط مع:"],
        list: [
          "Telegram (تسجيل الدخول)",
          "Supabase (الاستضافة)",
          "Google (التحليلات، فقط بعد الموافقة)",
        ],
        afterList: ["لا تتم مشاركة البيانات لأغراض إعلانية."],
      },
      {
        title: "8. الفعاليات دون اتصال",
        paragraphs: [
          "تتيح Vela لقاءات واقعية بين الأشخاص.",
          "لا تكون مرئية للمشاركين إلا بيانات الملف الشخصي الضرورية (الاسم، اللغة، المدينة).",
          "لا تتحمل Vela أي مسؤولية عن سلوك المشاركين في اللقاءات دون اتصال.",
        ],
      },
      {
        title: "9. التواصل عبر البريد الإلكتروني",
        paragraphs: ["نستخدم بريدك الإلكتروني من أجل:"],
        list: [
          "معلومات المنصة",
          "معلومات الفعاليات",
          "تحديثات مهمة",
        ],
        afterList: [
          "يمكنك إلغاء الاشتراك من الرسائل في أي وقت.",
          "الأساس القانوني: المادة 6 الفقرة 1 البند b من DSGVO",
        ],
      },
      {
        title: "10. مدة الاحتفاظ",
        paragraphs: [
          "يتم الاحتفاظ بالبيانات طالما أن حسابك نشط.",
          "بعد الحذف تتم إزالة جميع البيانات.",
        ],
      },
      {
        title: "11. حقوقك",
        paragraphs: ["لديك الحق في:"],
        list: [
          "الحصول على المعلومات",
          "التصحيح",
          "الحذف",
          "تقييد المعالجة",
          "قابلية نقل البيانات",
          "سحب موافقتك",
        ],
        afterList: ["التواصل: info@vela.cafe"],
      },
      {
        title: "12. الأمان",
        paragraphs: [
          "نستخدم التشفير وضوابط الوصول وإجراءات أمنية حديثة.",
        ],
      },
      {
        title: "13. التغييرات",
        paragraphs: [
          "قد يتم تحديث سياسة الخصوصية هذه عند تغيير المنصة.",
          "الحالة: فبراير 2026",
        ],
      },
    ],
  },
  sq: {
    title: "Politika e privatësisë",
    sections: [
      {
        title: "1. Personi përgjegjës",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Gjermani\nE-mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Çfarë të dhënash mbledhim",
        subsections: [
          {
            title: "Gjatë hyrjes me Telegram",
            paragraphs: ["Gjatë hyrjes transmetohen këto të dhëna:"],
            list: [
              "ID e Telegram",
              "Emri i përdoruesit",
              "Emri, mbiemri",
              "Fotografia e profilit (nëse ekziston)",
            ],
            afterList: [
              "Këto të dhëna përdoren për krijimin e llogarisë suaj.",
            ],
          },
          {
            title: "Kur përdoret e-maili",
            paragraphs: ["Nëse jepni e-mailin ose na kontaktoni me e-mail:"],
            list: ["Adresa e e-mailit", "Përmbajtja e mesazhit"],
          },
          {
            title: "Të dhëna profili brenda platformës",
            list: [
              "Qyteti",
              "Preferencat e gjuhës",
              "Pjesëmarrja në ngjarje (online/offline)",
              "Të dhëna që i jepni vullnetarisht",
            ],
          },
          {
            title: "Të dhëna teknike",
            list: ["Adresa IP", "Lloji i pajisjes", "Cookies"],
          },
        ],
      },
      {
        title: "3. Qëllimi i përpunimit",
        paragraphs: ["Të dhënat tuaja përdoren për:"],
        list: [
          "Krijimin dhe menaxhimin e llogarisë suaj",
          "Shfaqjen e takimeve gjuhësore në qytetin tuaj",
          "Organizimin e ngjarjeve online dhe offline",
          "Mundësimin e komunikimit mes pjesëmarrësve",
          "Dërgimin e informacionit me e-mail",
          "Përmirësimin teknik dhe funksional të platformës",
        ],
        afterList: ["Baza ligjore: Neni 6(1) shkronjat b dhe f DSGVO"],
      },
      {
        title: "4. Cookies dhe pëlqimi",
        paragraphs: [
          "Përdorim mjetin e pëlqimit Klaro!.",
          "Cookies teknike të domosdoshme janë gjithmonë aktive.",
          "Cookies analitike aktivizohen vetëm me pëlqimin tuaj.",
          "Baza ligjore: §25 TTDSG, Neni 6(1) shkronja a DSGVO",
        ],
      },
      {
        title: "5. Përdorimi i Google Analytics",
        paragraphs: [
          "Google Analytics ngarkohet vetëm pas pëlqimit dhe ruan të dhëna të anonimizuara për të përmirësuar platformën.",
          "Baza ligjore: Neni 6(1) shkronja a DSGVO",
        ],
      },
      {
        title: "6. Hostimi dhe baza e të dhënave",
        paragraphs: [
          "Përdorim Supabase (serverë brenda BE-së) për ruajtjen e të dhënave.",
          "Baza ligjore: Neni 6(1) shkronja b DSGVO",
        ],
      },
      {
        title: "7. Ndarja e të dhënave",
        paragraphs: ["Të dhënat ndahen vetëm me:"],
        list: [
          "Telegram (hyrja)",
          "Supabase (hostimi)",
          "Google (analitika, vetëm me pëlqim)",
        ],
        afterList: ["Nuk ka ndarje për qëllime reklamimi."],
      },
      {
        title: "8. Ngjarje offline",
        paragraphs: [
          "Vela mundëson takime reale midis njerëzve.",
          "Për pjesëmarrësit shfaqen vetëm të dhënat e nevojshme të profilit (emër, gjuhë, qytet).",
          "Vela nuk mban përgjegjësi për sjelljen e pjesëmarrësve në takimet offline.",
        ],
      },
      {
        title: "9. Komunikimi me e-mail",
        paragraphs: ["Përdorim adresën tuaj të e-mailit për:"],
        list: [
          "Informacion mbi platformën",
          "Informacion mbi ngjarjet",
          "Përditësime të rëndësishme",
        ],
        afterList: [
          "Mund të çregjistroheni nga e-mail-et në çdo kohë.",
          "Baza ligjore: Neni 6(1) shkronja b DSGVO",
        ],
      },
      {
        title: "10. Kohëzgjatja e ruajtjes",
        paragraphs: [
          "Të dhënat ruhen për aq kohë sa llogaria juaj është aktive.",
          "Pas fshirjes, të gjitha të dhënat hiqen.",
        ],
      },
      {
        title: "11. Të drejtat tuaja",
        paragraphs: ["Ju keni të drejtë për:"],
        list: [
          "Qasje",
          "Korrigjim",
          "Fshirje",
          "Kufizim të përpunimit",
          "Transferueshmëri të të dhënave",
          "Tërheqje të pëlqimit",
        ],
        afterList: ["Kontakt: info@vela.cafe"],
      },
      {
        title: "12. Siguria",
        paragraphs: [
          "Përdorim enkriptim, kontrolle të aksesit dhe masa moderne sigurie.",
        ],
      },
      {
        title: "13. Ndryshime",
        paragraphs: [
          "Kjo politikë e privatësisë mund të përditësohet nëse platforma ndryshon.",
          "Statusi: Shkurt 2026",
        ],
      },
    ],
  },
  tr: {
    title: "Gizlilik Politikası",
    sections: [
      {
        title: "1. Sorumlu",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Almanya\nE-posta: info@vela.cafe",
        ],
      },
      {
        title: "2. Hangi verileri topluyoruz",
        subsections: [
          {
            title: "Telegram ile girişte",
            paragraphs: ["Giriş sırasında aşağıdaki veriler iletilir:"],
            list: [
              "Telegram kimliği",
              "Kullanıcı adı",
              "Ad, soyad",
              "Profil fotoğrafı (varsa)",
            ],
            afterList: ["Bu veriler kullanıcı hesabınızı oluşturmak için kullanılır."],
          },
          {
            title: "E-posta kullanımı",
            paragraphs: ["E-postanızı verirseniz veya bize e-posta ile ulaşırsanız:"],
            list: ["E-posta adresi", "Mesaj içeriği"],
          },
          {
            title: "Platform içindeki profil verileri",
            list: [
              "Şehir",
              "Dil tercihleri",
              "Etkinliklere katılım (online/offline)",
              "Gönüllü olarak verdiğiniz bilgiler",
            ],
          },
          {
            title: "Teknik veriler",
            list: ["IP adresi", "Cihaz türü", "Çerezler"],
          },
        ],
      },
      {
        title: "3. İşleme amacı",
        paragraphs: ["Verileriniz şu amaçlarla kullanılır:"],
        list: [
          "Hesabınızı oluşturmak ve yönetmek",
          "Şehrinizdeki dil buluşmalarını göstermek",
          "Online ve offline etkinlikleri organize etmek",
          "Katılımcılar arasında iletişimi sağlamak",
          "Size e-posta ile bilgi göndermek",
          "Platformu teknik ve işlevsel olarak geliştirmek",
        ],
        afterList: ["Hukuki dayanak: DSGVO Madde 6(1) bent b ve f"],
      },
      {
        title: "4. Çerezler ve onay",
        paragraphs: [
          "Klaro! onay aracını kullanıyoruz.",
          "Teknik olarak gerekli çerezler her zaman aktiftir.",
          "Analitik çerezler yalnızca onayınızdan sonra etkinleştirilir.",
          "Hukuki dayanak: §25 TTDSG, DSGVO Madde 6(1) bent a",
        ],
      },
      {
        title: "5. Google Analytics kullanımı",
        paragraphs: [
          "Google Analytics yalnızca onaydan sonra yüklenir ve platformu geliştirmek için anonimleştirilmiş kullanım verilerini saklar.",
          "Hukuki dayanak: DSGVO Madde 6(1) bent a",
        ],
      },
      {
        title: "6. Barındırma ve veritabanı",
        paragraphs: [
          "Verileri saklamak için Supabase (AB içindeki sunucular) kullanıyoruz.",
          "Hukuki dayanak: DSGVO Madde 6(1) bent b",
        ],
      },
      {
        title: "7. Veri paylaşımı",
        paragraphs: ["Veriler yalnızca şu taraflarla paylaşılır:"],
        list: [
          "Telegram (giriş)",
          "Supabase (barındırma)",
          "Google (analitik, yalnızca onayla)",
        ],
        afterList: ["Reklam amaçlı paylaşım yapılmaz."],
      },
      {
        title: "8. Çevrimdışı etkinlikler",
        paragraphs: [
          "Vela insanlar arasında yüz yüze buluşmalar sağlar.",
          "Katılımcılara yalnızca gerekli profil verileri (ad, dil, şehir) görünür.",
          "Vela, çevrimdışı buluşmalarda katılımcıların davranışlarından sorumlu değildir.",
        ],
      },
      {
        title: "9. E-posta iletişimi",
        paragraphs: ["E-posta adresinizi şunlar için kullanırız:"],
        list: ["Platform bilgileri", "Etkinlik bilgileri", "Önemli güncellemeler"],
        afterList: [
          "E-postalardan istediğiniz zaman çıkabilirsiniz.",
          "Hukuki dayanak: DSGVO Madde 6(1) bent b",
        ],
      },
      {
        title: "10. Saklama süresi",
        paragraphs: [
          "Veriler hesabınız aktif olduğu sürece saklanır.",
          "Silme sonrası tüm veriler kaldırılır.",
        ],
      },
      {
        title: "11. Haklarınız",
        paragraphs: ["Şu haklara sahipsiniz:"],
        list: [
          "Erişim",
          "Düzeltme",
          "Silme",
          "İşlemenin kısıtlanması",
          "Veri taşınabilirliği",
          "Onayınızı geri çekme",
        ],
        afterList: ["İletişim: info@vela.cafe"],
      },
      {
        title: "12. Güvenlik",
        paragraphs: [
          "Şifreleme, erişim kontrolleri ve modern güvenlik önlemleri kullanıyoruz.",
        ],
      },
      {
        title: "13. Değişiklikler",
        paragraphs: [
          "Bu gizlilik politikası, platformdaki değişikliklerle güncellenebilir.",
          "Durum: Şubat 2026",
        ],
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    sections: [
      {
        title: "1. Responsable",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Allemagne\nE-mail : info@vela.cafe",
        ],
      },
      {
        title: "2. Quelles données nous collectons",
        subsections: [
          {
            title: "Lors de la connexion via Telegram",
            paragraphs: [
              "Lors de la connexion, les données suivantes sont transmises :",
            ],
            list: [
              "Identifiant Telegram",
              "Nom d'utilisateur",
              "Prénom, nom",
              "Photo de profil (si disponible)",
            ],
            afterList: [
              "Ces données sont utilisées pour créer votre compte utilisateur.",
            ],
          },
          {
            title: "Lors de l’utilisation de l’e-mail",
            paragraphs: [
              "Si vous fournissez votre e-mail ou nous contactez par e-mail :",
            ],
            list: ["Adresse e-mail", "Contenu du message"],
          },
          {
            title: "Données de profil au sein de la plateforme",
            list: [
              "Ville",
              "Préférences linguistiques",
              "Participation aux événements (en ligne/hors ligne)",
              "Informations fournies volontairement",
            ],
          },
          {
            title: "Données techniques",
            list: ["Adresse IP", "Type d’appareil", "Cookies"],
          },
        ],
      },
      {
        title: "3. Finalité du traitement",
        paragraphs: ["Vos données sont utilisées pour :"],
        list: [
          "Créer et gérer votre compte",
          "Afficher les rencontres linguistiques dans votre ville",
          "Organiser des événements en ligne et hors ligne",
          "Permettre la communication entre participants",
          "Vous envoyer des informations par e-mail",
          "Améliorer la plateforme sur le plan technique et fonctionnel",
        ],
        afterList: ["Base juridique : art. 6(1) b et f RGPD"],
      },
      {
        title: "4. Cookies et consentement",
        paragraphs: [
          "Nous utilisons l’outil de consentement Klaro!.",
          "Les cookies techniquement nécessaires sont toujours actifs.",
          "Les cookies d’analyse ne sont activés qu’avec votre consentement.",
          "Base juridique : §25 TTDSG, art. 6(1) a RGPD",
        ],
      },
      {
        title: "5. Utilisation de Google Analytics",
        paragraphs: [
          "Google Analytics n’est chargé qu’après consentement et stocke des données d’usage anonymisées pour améliorer la plateforme.",
          "Base juridique : art. 6(1) a RGPD",
        ],
      },
      {
        title: "6. Hébergement et base de données",
        paragraphs: [
          "Nous utilisons Supabase (serveurs dans l’UE) pour stocker les données.",
          "Base juridique : art. 6(1) b RGPD",
        ],
      },
      {
        title: "7. Partage des données",
        paragraphs: ["Les données sont transmises uniquement à :"],
        list: [
          "Telegram (connexion)",
          "Supabase (hébergement)",
          "Google (analytics, uniquement avec consentement)",
        ],
        afterList: ["Aucun partage à des fins publicitaires."],
      },
      {
        title: "8. Événements hors ligne",
        paragraphs: [
          "Vela permet des rencontres réelles entre personnes.",
          "Seules les données de profil nécessaires (nom, langue, ville) sont visibles pour les participants.",
          "Vela décline toute responsabilité quant au comportement des participants lors des rencontres hors ligne.",
        ],
      },
      {
        title: "9. Communication par e-mail",
        paragraphs: ["Nous utilisons votre adresse e-mail pour :"],
        list: [
          "Informations sur la plateforme",
          "Informations sur les événements",
          "Mises à jour importantes",
        ],
        afterList: [
          "Vous pouvez vous désabonner des e-mails à tout moment.",
          "Base juridique : art. 6(1) b RGPD",
        ],
      },
      {
        title: "10. Durée de conservation",
        paragraphs: [
          "Les données sont conservées tant que votre compte est actif.",
          "Après suppression, toutes les données sont supprimées.",
        ],
      },
      {
        title: "11. Vos droits",
        paragraphs: ["Vous avez le droit de :"],
        list: [
          "Accès",
          "Rectification",
          "Suppression",
          "Limitation du traitement",
          "Portabilité des données",
          "Retrait de votre consentement",
        ],
        afterList: ["Contact : info@vela.cafe"],
      },
      {
        title: "12. Sécurité",
        paragraphs: [
          "Nous utilisons le chiffrement, des contrôles d’accès et des mesures de sécurité modernes.",
        ],
      },
      {
        title: "13. Modifications",
        paragraphs: [
          "Cette politique de confidentialité peut être modifiée en cas de changements de la plateforme.",
          "Statut : février 2026",
        ],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    sections: [
      {
        title: "1. Responsable",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Alemania\nE-mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Qué datos recopilamos",
        subsections: [
          {
            title: "Al iniciar sesión con Telegram",
            paragraphs: ["Al iniciar sesión se transmiten los siguientes datos:"],
            list: [
              "ID de Telegram",
              "Nombre de usuario",
              "Nombre y apellido",
              "Foto de perfil (si existe)",
            ],
            afterList: ["Estos datos se usan para crear su cuenta."],
          },
          {
            title: "Al usar el correo electrónico",
            paragraphs: ["Si proporciona su correo electrónico o nos contacta por correo:"],
            list: ["Dirección de correo electrónico", "Contenido del mensaje"],
          },
          {
            title: "Datos de perfil dentro de la plataforma",
            list: [
              "Ciudad",
              "Preferencias de idioma",
              "Participación en eventos (online/offline)",
              "Información que proporciona voluntariamente",
            ],
          },
          {
            title: "Datos técnicos",
            list: ["Dirección IP", "Tipo de dispositivo", "Cookies"],
          },
        ],
      },
      {
        title: "3. Finalidad del tratamiento",
        paragraphs: ["Sus datos se utilizan para:"],
        list: [
          "Crear y gestionar su cuenta",
          "Mostrar encuentros de idiomas en su ciudad",
          "Organizar eventos online y offline",
          "Permitir la comunicación entre participantes",
          "Enviar información por correo electrónico",
          "Mejorar técnicamente y funcionalmente la plataforma",
        ],
        afterList: ["Base legal: art. 6(1) b y f RGPD"],
      },
      {
        title: "4. Cookies y consentimiento",
        paragraphs: [
          "Utilizamos la herramienta de consentimiento Klaro!.",
          "Las cookies técnicamente necesarias siempre están activas.",
          "Las cookies de análisis solo se activan con su consentimiento.",
          "Base legal: §25 TTDSG, art. 6(1) a RGPD",
        ],
      },
      {
        title: "5. Uso de Google Analytics",
        paragraphs: [
          "Google Analytics solo se carga tras el consentimiento y almacena datos de uso anonimizados para mejorar la plataforma.",
          "Base legal: art. 6(1) a RGPD",
        ],
      },
      {
        title: "6. Hosting y base de datos",
        paragraphs: [
          "Utilizamos Supabase (servidores dentro de la UE) para almacenar datos.",
          "Base legal: art. 6(1) b RGPD",
        ],
      },
      {
        title: "7. Cesión de datos",
        paragraphs: ["Los datos se comparten exclusivamente con:"],
        list: [
          "Telegram (inicio de sesión)",
          "Supabase (hosting)",
          "Google (analítica, solo con consentimiento)",
        ],
        afterList: ["No se comparten datos con fines publicitarios."],
      },
      {
        title: "8. Eventos presenciales",
        paragraphs: [
          "Vela permite encuentros reales entre personas.",
          "Para los participantes solo son visibles los datos de perfil necesarios (nombre, idioma, ciudad).",
          "Vela no se hace responsable del comportamiento de los participantes en los encuentros presenciales.",
        ],
      },
      {
        title: "9. Comunicación por correo electrónico",
        paragraphs: ["Utilizamos su dirección de correo electrónico para:"],
        list: [
          "Información de la plataforma",
          "Información sobre eventos",
          "Actualizaciones importantes",
        ],
        afterList: [
          "Puede darse de baja de los correos en cualquier momento.",
          "Base legal: art. 6(1) b RGPD",
        ],
      },
      {
        title: "10. Plazo de conservación",
        paragraphs: [
          "Los datos se almacenan mientras su cuenta esté activa.",
          "Tras la eliminación, todos los datos se eliminan.",
        ],
      },
      {
        title: "11. Sus derechos",
        paragraphs: ["Usted tiene derecho a:"],
        list: [
          "Acceso",
          "Rectificación",
          "Eliminación",
          "Limitación del tratamiento",
          "Portabilidad de datos",
          "Retiro de su consentimiento",
        ],
        afterList: ["Contacto: info@vela.cafe"],
      },
      {
        title: "12. Seguridad",
        paragraphs: [
          "Utilizamos cifrado, controles de acceso y medidas de seguridad modernas.",
        ],
      },
      {
        title: "13. Cambios",
        paragraphs: [
          "Esta política de privacidad puede actualizarse cuando la plataforma cambie.",
          "Estado: febrero de 2026",
        ],
      },
    ],
  },
  it: {
    title: "Informativa sulla privacy",
    sections: [
      {
        title: "1. Titolare del trattamento",
        paragraphs: [
          "Ghazanfar Maosher\nBerlino, Germania\nE-mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Quali dati raccogliamo",
        subsections: [
          {
            title: "Accesso tramite Telegram",
            paragraphs: ["Durante l’accesso vengono trasmessi i seguenti dati:"],
            list: [
              "ID Telegram",
              "Nome utente",
              "Nome, cognome",
              "Foto del profilo (se presente)",
            ],
            afterList: ["Questi dati sono utilizzati per creare il tuo account."],
          },
          {
            title: "Uso dell’e-mail",
            paragraphs: ["Se fornisci la tua e-mail o ci contatti via e-mail:"],
            list: ["Indirizzo e-mail", "Contenuto del messaggio"],
          },
          {
            title: "Dati del profilo all’interno della piattaforma",
            list: [
              "Città",
              "Preferenze linguistiche",
              "Partecipazione agli eventi (online/offline)",
              "Informazioni fornite volontariamente",
            ],
          },
          {
            title: "Dati tecnici",
            list: ["Indirizzo IP", "Tipo di dispositivo", "Cookie"],
          },
        ],
      },
      {
        title: "3. Finalità del trattamento",
        paragraphs: ["I tuoi dati vengono utilizzati per:"],
        list: [
          "Creare e gestire il tuo account",
          "Mostrare incontri linguistici nella tua città",
          "Organizzare eventi online e offline",
          "Consentire la comunicazione tra i partecipanti",
          "Inviarti informazioni via e-mail",
          "Migliorare tecnicamente e funzionalmente la piattaforma",
        ],
        afterList: ["Base giuridica: art. 6(1) lett. b e f GDPR"],
      },
      {
        title: "4. Cookie e consenso",
        paragraphs: [
          "Utilizziamo lo strumento di consenso Klaro!.",
          "I cookie tecnicamente necessari sono sempre attivi.",
          "I cookie di analisi sono attivati solo con il tuo consenso.",
          "Base giuridica: §25 TTDSG, art. 6(1) lett. a GDPR",
        ],
      },
      {
        title: "5. Utilizzo di Google Analytics",
        paragraphs: [
          "Google Analytics viene caricato solo dopo il consenso e memorizza dati di utilizzo anonimizzati per migliorare la piattaforma.",
          "Base giuridica: art. 6(1) lett. a GDPR",
        ],
      },
      {
        title: "6. Hosting e database",
        paragraphs: [
          "Utilizziamo Supabase (server all’interno dell’UE) per l’archiviazione dei dati.",
          "Base giuridica: art. 6(1) lett. b GDPR",
        ],
      },
      {
        title: "7. Condivisione dei dati",
        paragraphs: ["I dati vengono condivisi solo con:"],
        list: [
          "Telegram (accesso)",
          "Supabase (hosting)",
          "Google (analisi, solo con consenso)",
        ],
        afterList: ["Non condividiamo dati per finalità pubblicitarie."],
      },
      {
        title: "8. Eventi offline",
        paragraphs: [
          "Vela consente incontri reali tra persone.",
          "Sono visibili ai partecipanti solo i dati di profilo necessari (nome, lingua, città).",
          "Vela non si assume responsabilità per il comportamento dei partecipanti agli incontri offline.",
        ],
      },
      {
        title: "9. Comunicazione via e-mail",
        paragraphs: ["Utilizziamo il tuo indirizzo e-mail per:"],
        list: [
          "Informazioni sulla piattaforma",
          "Informazioni sugli eventi",
          "Aggiornamenti importanti",
        ],
        afterList: [
          "Puoi annullare l’iscrizione alle e-mail in qualsiasi momento.",
          "Base giuridica: art. 6(1) lett. b GDPR",
        ],
      },
      {
        title: "10. Periodo di conservazione",
        paragraphs: [
          "I dati vengono conservati finché il tuo account è attivo.",
          "Dopo la cancellazione, tutti i dati vengono eliminati.",
        ],
      },
      {
        title: "11. I tuoi diritti",
        paragraphs: ["Hai diritto a:"],
        list: [
          "Accesso",
          "Rettifica",
          "Cancellazione",
          "Limitazione del trattamento",
          "Portabilità dei dati",
          "Revoca del consenso",
        ],
        afterList: ["Contatto: info@vela.cafe"],
      },
      {
        title: "12. Sicurezza",
        paragraphs: [
          "Utilizziamo crittografia, controlli di accesso e misure di sicurezza moderne.",
        ],
      },
      {
        title: "13. Modifiche",
        paragraphs: [
          "Questa informativa sulla privacy può essere aggiornata in caso di modifiche della piattaforma.",
          "Stato: febbraio 2026",
        ],
      },
    ],
  },
  pl: {
    title: "Polityka prywatności",
    sections: [
      {
        title: "1. Administrator",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Niemcy\nE-mail: info@vela.cafe",
        ],
      },
      {
        title: "2. Jakie dane zbieramy",
        subsections: [
          {
            title: "Logowanie przez Telegram",
            paragraphs: ["Podczas logowania przekazywane są następujące dane:"],
            list: [
              "ID Telegram",
              "Nazwa użytkownika",
              "Imię, nazwisko",
              "Zdjęcie profilowe (jeśli istnieje)",
            ],
            afterList: ["Dane te służą do utworzenia konta użytkownika."],
          },
          {
            title: "Korzystanie z e-maila",
            paragraphs: [
              "Jeśli podajesz e-mail lub kontaktujesz się z nami przez e-mail:",
            ],
            list: ["Adres e-mail", "Treść wiadomości"],
          },
          {
            title: "Dane profilowe w platformie",
            list: [
              "Miasto",
              "Preferencje językowe",
              "Udział w wydarzeniach (online/offline)",
              "Informacje podane dobrowolnie",
            ],
          },
          {
            title: "Dane techniczne",
            list: ["Adres IP", "Typ urządzenia", "Pliki cookie"],
          },
        ],
      },
      {
        title: "3. Cel przetwarzania",
        paragraphs: ["Twoje dane są wykorzystywane do:"],
        list: [
          "Tworzenia i zarządzania kontem",
          "Wyświetlania spotkań językowych w Twoim mieście",
          "Organizowania wydarzeń online i offline",
          "Umożliwienia komunikacji między uczestnikami",
          "Wysyłania informacji e-mail",
          "Technicznego i funkcjonalnego ulepszania platformy",
        ],
        afterList: ["Podstawa prawna: art. 6 ust. 1 lit. b i f DSGVO"],
      },
      {
        title: "4. Pliki cookie i zgoda",
        paragraphs: [
          "Korzystamy z narzędzia zgody Klaro!.",
          "Technicznie niezbędne pliki cookie są zawsze aktywne.",
          "Analityczne pliki cookie są aktywowane tylko po Twojej zgodzie.",
          "Podstawa prawna: §25 TTDSG, art. 6 ust. 1 lit. a DSGVO",
        ],
      },
      {
        title: "5. Wykorzystanie Google Analytics",
        paragraphs: [
          "Google Analytics jest ładowane tylko po zgodzie i przechowuje zanonimizowane dane użytkowania w celu poprawy platformy.",
          "Podstawa prawna: art. 6 ust. 1 lit. a DSGVO",
        ],
      },
      {
        title: "6. Hosting i baza danych",
        paragraphs: [
          "Korzystamy z Supabase (serwery w UE) do przechowywania danych.",
          "Podstawa prawna: art. 6 ust. 1 lit. b DSGVO",
        ],
      },
      {
        title: "7. Udostępnianie danych",
        paragraphs: ["Dane są przekazywane wyłącznie do:"],
        list: [
          "Telegram (logowanie)",
          "Supabase (hosting)",
          "Google (analityka, tylko po zgodzie)",
        ],
        afterList: ["Nie przekazujemy danych w celach reklamowych."],
      },
      {
        title: "8. Wydarzenia offline",
        paragraphs: [
          "Vela umożliwia spotkania na żywo między ludźmi.",
          "Uczestnicy widzą tylko niezbędne dane profilowe (imię, język, miasto).",
          "Vela nie ponosi odpowiedzialności za zachowanie uczestników podczas spotkań offline.",
        ],
      },
      {
        title: "9. Komunikacja e-mail",
        paragraphs: ["Wykorzystujemy Twój adres e-mail do:"],
        list: [
          "Informacji o platformie",
          "Informacji o wydarzeniach",
          "Ważnych aktualizacji",
        ],
        afterList: [
          "Możesz w każdej chwili wypisać się z e-maili.",
          "Podstawa prawna: art. 6 ust. 1 lit. b DSGVO",
        ],
      },
      {
        title: "10. Okres przechowywania",
        paragraphs: [
          "Dane są przechowywane tak długo, jak konto jest aktywne.",
          "Po usunięciu wszystkie dane są usuwane.",
        ],
      },
      {
        title: "11. Twoje prawa",
        paragraphs: ["Masz prawo do:"],
        list: [
          "Dostępu",
          "Sprostowania",
          "Usunięcia",
          "Ograniczenia przetwarzania",
          "Przenoszenia danych",
          "Wycofania zgody",
        ],
        afterList: ["Kontakt: info@vela.cafe"],
      },
      {
        title: "12. Bezpieczeństwo",
        paragraphs: [
          "Stosujemy szyfrowanie, kontrolę dostępu i nowoczesne środki bezpieczeństwa.",
        ],
      },
      {
        title: "13. Zmiany",
        paragraphs: [
          "Niniejsza polityka prywatności może być aktualizowana w przypadku zmian platformy.",
          "Stan: luty 2026",
        ],
      },
    ],
  },
};

const IMPRESSUM_CONTENT: Record<Locale, LegalContent> = {
  de: {
    title: "Impressum",
    sections: [
      {
        title: "Angaben gemäß § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Deutschland\nE-Mail: info@vela.cafe\nWebsite: https://vela.cafe",
        ],
      },
      {
        title: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Deutschland"],
      },
      {
        title: "Haftung für Inhalte",
        paragraphs: [
          "Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.",
        ],
      },
      {
        title: "Haftung für Links",
        paragraphs: [
          "Unsere Plattform enthält Links zu externen Webseiten Dritter. Auf deren Inhalte haben wir keinen Einfluss.",
        ],
      },
      {
        title: "Urheberrecht",
        paragraphs: [
          "Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht.",
        ],
      },
      {
        title: "Streitbeilegung",
        paragraphs: [
          "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:",
          "https://ec.europa.eu/consumers/odr/",
          "Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
      {
        title: "Kontakt",
        paragraphs: ["E-Mail: info@vela.cafe"],
      },
    ],
  },
  en: {
    title: "Imprint",
    sections: [
      {
        title: "Information according to § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Germany\nEmail: info@vela.cafe\nWebsite: https://vela.cafe",
        ],
      },
      {
        title: "Responsible for content pursuant to § 55(2) RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Germany"],
      },
      {
        title: "Liability for content",
        paragraphs: [
          "The contents of our pages were created with the greatest care. However, we cannot guarantee the accuracy, completeness or timeliness of the content.",
        ],
      },
      {
        title: "Liability for links",
        paragraphs: [
          "Our platform contains links to external websites of third parties. We have no influence on their contents.",
        ],
      },
      {
        title: "Copyright",
        paragraphs: [
          "The content and works created by the site operator on these pages are subject to copyright.",
        ],
      },
      {
        title: "Dispute resolution",
        paragraphs: [
          "The European Commission provides a platform for online dispute resolution (ODR):",
          "https://ec.europa.eu/consumers/odr/",
          "We are not obliged and not willing to participate in dispute resolution proceedings before a consumer arbitration board.",
        ],
      },
      {
        title: "Contact",
        paragraphs: ["Email: info@vela.cafe"],
      },
    ],
  },
  ru: {
    title: "Выходные данные",
    sections: [
      {
        title: "Сведения согласно § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nБерлин, Германия\nE-mail: info@vela.cafe\nСайт: https://vela.cafe",
        ],
      },
      {
        title: "Ответственный за содержание согласно § 55 абз. 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nБерлин, Германия"],
      },
      {
        title: "Ответственность за содержание",
        paragraphs: [
          "Содержание наших страниц было подготовлено с максимальной тщательностью. Однако мы не можем гарантировать точность, полноту и актуальность содержания.",
        ],
      },
      {
        title: "Ответственность за ссылки",
        paragraphs: [
          "Наша платформа содержит ссылки на внешние сайты третьих лиц. Мы не влияем на их содержание.",
        ],
      },
      {
        title: "Авторское право",
        paragraphs: [
          "Контент и работы, созданные владельцем сайта, защищены авторским правом.",
        ],
      },
      {
        title: "Урегулирование споров",
        paragraphs: [
          "Европейская комиссия предоставляет платформу для онлайн-разрешения споров (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "Мы не обязаны и не готовы участвовать в процедурах урегулирования споров перед потребительской арбитражной комиссией.",
        ],
      },
      {
        title: "Контакт",
        paragraphs: ["E-mail: info@vela.cafe"],
      },
    ],
  },
  uk: {
    title: "Вихідні дані",
    sections: [
      {
        title: "Відомості згідно з § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nБерлін, Німеччина\nE-mail: info@vela.cafe\nВебсайт: https://vela.cafe",
        ],
      },
      {
        title: "Відповідальний за зміст згідно з § 55 абз. 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nБерлін, Німеччина"],
      },
      {
        title: "Відповідальність за зміст",
        paragraphs: [
          "Зміст наших сторінок був підготовлений з найбільшою ретельністю. Однак ми не можемо гарантувати точність, повноту та актуальність змісту.",
        ],
      },
      {
        title: "Відповідальність за посилання",
        paragraphs: [
          "Наша платформа містить посилання на зовнішні сайти третіх сторін. Ми не впливаємо на їхній зміст.",
        ],
      },
      {
        title: "Авторське право",
        paragraphs: [
          "Контент і роботи, створені власником сайту, підлягають захисту авторського права.",
        ],
      },
      {
        title: "Врегулювання спорів",
        paragraphs: [
          "Європейська комісія надає платформу для онлайн-врегулювання спорів (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "Ми не зобов’язані й не готові брати участь у процедурах врегулювання спорів перед споживчою арбітражною установою.",
        ],
      },
      {
        title: "Контакт",
        paragraphs: ["E-mail: info@vela.cafe"],
      },
    ],
  },
  fa: {
    title: "اطلاعات حقوقی",
    sections: [
      {
        title: "اطلاعات مطابق با § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nبرلین، آلمان\nایمیل: info@vela.cafe\nوب‌سایت: https://vela.cafe",
        ],
      },
      {
        title: "مسئول محتوا مطابق با § 55 بند 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nبرلین، آلمان"],
      },
      {
        title: "مسئولیت محتوا",
        paragraphs: [
          "محتوای صفحات ما با نهایت دقت تهیه شده است. با این حال، ما نمی‌توانیم صحت، کامل بودن و به‌روز بودن محتوا را تضمین کنیم.",
        ],
      },
      {
        title: "مسئولیت پیوندها",
        paragraphs: [
          "پلتفرم ما شامل پیوندهایی به وب‌سایت‌های خارجی اشخاص ثالث است. ما هیچ کنترلی بر محتوای آنها نداریم.",
        ],
      },
      {
        title: "حق نشر",
        paragraphs: [
          "محتوا و آثار ایجادشده توسط صاحب وب‌سایت مشمول حق نشر هستند.",
        ],
      },
      {
        title: "حل و فصل اختلافات",
        paragraphs: [
          "کمیسیون اروپا پلتفرمی برای حل و فصل آنلاین اختلافات (OS) ارائه می‌کند:",
          "https://ec.europa.eu/consumers/odr/",
          "ما ملزم نیستیم و تمایلی به مشارکت در فرآیندهای حل اختلاف نزد هیئت داوری مصرف‌کنندگان نداریم.",
        ],
      },
      {
        title: "تماس",
        paragraphs: ["ایمیل: info@vela.cafe"],
      },
    ],
  },
  ar: {
    title: "الإفصاح القانوني",
    sections: [
      {
        title: "بيانات وفقًا لـ § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nبرلين، ألمانيا\nالبريد الإلكتروني: info@vela.cafe\nالموقع الإلكتروني: https://vela.cafe",
        ],
      },
      {
        title: "المسؤول عن المحتوى وفقًا لـ § 55 الفقرة 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nبرلين، ألمانيا"],
      },
      {
        title: "المسؤولية عن المحتوى",
        paragraphs: [
          "تم إعداد محتوى صفحاتنا بأقصى قدر من العناية. ومع ذلك، لا يمكننا ضمان دقة المحتوى واكتماله وحداثته.",
        ],
      },
      {
        title: "المسؤولية عن الروابط",
        paragraphs: [
          "تحتوي منصتنا على روابط لمواقع خارجية لأطراف ثالثة. لا نملك أي تأثير على محتواها.",
        ],
      },
      {
        title: "حقوق النشر",
        paragraphs: [
          "المحتوى والأعمال التي ينشئها مشغل الموقع تخضع لحقوق النشر.",
        ],
      },
      {
        title: "تسوية النزاعات",
        paragraphs: [
          "توفر المفوضية الأوروبية منصة لتسوية النزاعات عبر الإنترنت (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "نحن غير ملزمين ولسنا مستعدين للمشاركة في إجراءات تسوية النزاعات أمام هيئة تحكيم المستهلكين.",
        ],
      },
      {
        title: "التواصل",
        paragraphs: ["البريد الإلكتروني: info@vela.cafe"],
      },
    ],
  },
  sq: {
    title: "Njoftim ligjor",
    sections: [
      {
        title: "Të dhënat sipas § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Gjermani\nE-mail: info@vela.cafe\nWebsite: https://vela.cafe",
        ],
      },
      {
        title: "Përgjegjës për përmbajtjen sipas § 55 paragrafi 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Gjermani"],
      },
      {
        title: "Përgjegjësia për përmbajtjen",
        paragraphs: [
          "Përmbajtja e faqeve tona u krijua me kujdesin më të madh. Megjithatë, nuk mund të garantojmë saktësinë, plotësinë dhe aktualitetin e përmbajtjes.",
        ],
      },
      {
        title: "Përgjegjësia për lidhjet",
        paragraphs: [
          "Platforma jonë përmban lidhje drejt faqeve të jashtme të palëve të treta. Ne nuk kemi ndikim në përmbajtjen e tyre.",
        ],
      },
      {
        title: "E drejta e autorit",
        paragraphs: [
          "Përmbajtja dhe veprat e krijuara nga operatori i faqes janë të mbrojtura nga e drejta e autorit.",
        ],
      },
      {
        title: "Zgjidhja e mosmarrëveshjeve",
        paragraphs: [
          "Komisioni Evropian ofron një platformë për zgjidhjen online të mosmarrëveshjeve (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "Nuk jemi të detyruar dhe nuk jemi të gatshëm të marrim pjesë në procedurat e zgjidhjes së mosmarrëveshjeve para një organi arbitrazhi të konsumatorëve.",
        ],
      },
      {
        title: "Kontakt",
        paragraphs: ["E-mail: info@vela.cafe"],
      },
    ],
  },
  tr: {
    title: "Künye",
    sections: [
      {
        title: "§ 5 TMG uyarınca bilgiler",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Almanya\nE-posta: info@vela.cafe\nWebsite: https://vela.cafe",
        ],
      },
      {
        title: "§ 55 Abs. 2 RStV uyarınca içerikten sorumlu",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Almanya"],
      },
      {
        title: "İçerik sorumluluğu",
        paragraphs: [
          "Sayfalarımızın içeriği büyük bir özenle hazırlanmıştır. Ancak içeriklerin doğruluğu, eksiksizliği ve güncelliği konusunda garanti veremeyiz.",
        ],
      },
      {
        title: "Bağlantılar için sorumluluk",
        paragraphs: [
          "Platformumuz üçüncü tarafların dış web sitelerine bağlantılar içerir. Bu içerik üzerinde herhangi bir etkimiz yoktur.",
        ],
      },
      {
        title: "Telif hakkı",
        paragraphs: [
          "Site işletmecisi tarafından oluşturulan içerik ve eserler telif hakkına tabidir.",
        ],
      },
      {
        title: "Uyuşmazlıkların çözümü",
        paragraphs: [
          "Avrupa Komisyonu çevrimiçi uyuşmazlık çözümü (OS) için bir platform sağlar:",
          "https://ec.europa.eu/consumers/odr/",
          "Bir tüketici tahkim kurulunda uyuşmazlık çözümüne katılmakla yükümlü değiliz ve buna hazır değiliz.",
        ],
      },
      {
        title: "İletişim",
        paragraphs: ["E-posta: info@vela.cafe"],
      },
    ],
  },
  fr: {
    title: "Mentions légales",
    sections: [
      {
        title: "Informations conformément au § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Allemagne\nE-mail : info@vela.cafe\nSite web : https://vela.cafe",
        ],
      },
      {
        title: "Responsable du contenu conformément au § 55 al. 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Allemagne"],
      },
      {
        title: "Responsabilité du contenu",
        paragraphs: [
          "Le contenu de nos pages a été créé avec le plus grand soin. Toutefois, nous ne pouvons garantir l’exactitude, l’exhaustivité et l’actualité du contenu.",
        ],
      },
      {
        title: "Responsabilité des liens",
        paragraphs: [
          "Notre plateforme contient des liens vers des sites web externes de tiers. Nous n’avons aucune influence sur leur contenu.",
        ],
      },
      {
        title: "Droit d’auteur",
        paragraphs: [
          "Le contenu et les œuvres créés par l’exploitant du site sont soumis au droit d’auteur.",
        ],
      },
      {
        title: "Règlement des litiges",
        paragraphs: [
          "La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (OS) :",
          "https://ec.europa.eu/consumers/odr/",
          "Nous ne sommes ni obligés ni disposés à participer à une procédure de règlement des litiges devant un organisme d’arbitrage des consommateurs.",
        ],
      },
      {
        title: "Contact",
        paragraphs: ["E-mail : info@vela.cafe"],
      },
    ],
  },
  es: {
    title: "Aviso legal",
    sections: [
      {
        title: "Información conforme al § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Alemania\nE-mail: info@vela.cafe\nSitio web: https://vela.cafe",
        ],
      },
      {
        title: "Responsable del contenido conforme al § 55 apdo. 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Alemania"],
      },
      {
        title: "Responsabilidad por contenidos",
        paragraphs: [
          "El contenido de nuestras páginas se ha creado con el máximo cuidado. Sin embargo, no podemos garantizar la precisión, la integridad ni la actualidad del contenido.",
        ],
      },
      {
        title: "Responsabilidad por enlaces",
        paragraphs: [
          "Nuestra plataforma contiene enlaces a sitios web externos de terceros. No tenemos influencia sobre sus contenidos.",
        ],
      },
      {
        title: "Derechos de autor",
        paragraphs: [
          "El contenido y las obras creadas por el operador del sitio están sujetos a derechos de autor.",
        ],
      },
      {
        title: "Resolución de litigios",
        paragraphs: [
          "La Comisión Europea proporciona una plataforma para la resolución de litigios en línea (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "No estamos obligados ni dispuestos a participar en procedimientos de resolución de litigios ante una junta de arbitraje de consumidores.",
        ],
      },
      {
        title: "Contacto",
        paragraphs: ["E-mail: info@vela.cafe"],
      },
    ],
  },
  it: {
    title: "Note legali",
    sections: [
      {
        title: "Informazioni ai sensi del § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlino, Germania\nE-mail: info@vela.cafe\nSito web: https://vela.cafe",
        ],
      },
      {
        title: "Responsabile dei contenuti ai sensi del § 55 comma 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlino, Germania"],
      },
      {
        title: "Responsabilità per i contenuti",
        paragraphs: [
          "I contenuti delle nostre pagine sono stati creati con la massima cura. Tuttavia, non possiamo garantire accuratezza, completezza e attualità dei contenuti.",
        ],
      },
      {
        title: "Responsabilità per i link",
        paragraphs: [
          "La nostra piattaforma contiene link a siti web esterni di terzi. Non abbiamo alcuna influenza sui loro contenuti.",
        ],
      },
      {
        title: "Diritto d’autore",
        paragraphs: [
          "I contenuti e le opere creati dal gestore del sito sono soggetti al diritto d’autore.",
        ],
      },
      {
        title: "Risoluzione delle controversie",
        paragraphs: [
          "La Commissione europea mette a disposizione una piattaforma per la risoluzione online delle controversie (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "Non siamo obbligati né disposti a partecipare a procedure di risoluzione delle controversie davanti a un organismo di conciliazione dei consumatori.",
        ],
      },
      {
        title: "Contatto",
        paragraphs: ["E-mail: info@vela.cafe"],
      },
    ],
  },
  pl: {
    title: "Nota prawna",
    sections: [
      {
        title: "Informacje zgodnie z § 5 TMG",
        paragraphs: [
          "Ghazanfar Maosher\nBerlin, Niemcy\nE-mail: info@vela.cafe\nStrona internetowa: https://vela.cafe",
        ],
      },
      {
        title: "Odpowiedzialny za treść zgodnie z § 55 ust. 2 RStV",
        paragraphs: ["Ghazanfar Maosher\nBerlin, Niemcy"],
      },
      {
        title: "Odpowiedzialność za treści",
        paragraphs: [
          "Treści naszych stron zostały przygotowane z największą starannością. Nie możemy jednak zagwarantować ich dokładności, kompletności i aktualności.",
        ],
      },
      {
        title: "Odpowiedzialność za linki",
        paragraphs: [
          "Nasza platforma zawiera linki do zewnętrznych stron internetowych osób trzecich. Nie mamy wpływu na ich treść.",
        ],
      },
      {
        title: "Prawa autorskie",
        paragraphs: [
          "Treści i utwory stworzone przez operatora strony podlegają prawu autorskiemu.",
        ],
      },
      {
        title: "Rozwiązywanie sporów",
        paragraphs: [
          "Komisja Europejska udostępnia platformę do internetowego rozwiązywania sporów (OS):",
          "https://ec.europa.eu/consumers/odr/",
          "Nie jesteśmy zobowiązani ani skłonni do udziału w postępowaniach rozwiązywania sporów przed organem arbitrażowym ds. konsumentów.",
        ],
      },
      {
        title: "Kontakt",
        paragraphs: ["E-mail: info@vela.cafe"],
      },
    ],
  },
};

const TERMS_SECTIONS_DE: PrivacySection[] = [
  {
    title: "1. Über Vela",
    paragraphs: [
      "Vela ist eine Plattform zur Organisation von Sprach-Treffen (Language Café) online und offline.",
      "Nutzer können Veranstaltungen erstellen, daran teilnehmen und miteinander kommunizieren.",
    ],
  },
  {
    title: "2. Registrierung und Benutzerkonto",
    paragraphs: ["Die Registrierung ist möglich über:"],
    list: ["Telegram", "E-Mail-Adresse"],
    afterList: [
      "Mit der Registrierung stimmen Sie diesen Nutzungsbedingungen zu.",
      "Sie sind verpflichtet, korrekte Angaben zu machen und Ihr Konto nicht an Dritte weiterzugeben.",
    ],
  },
  {
    title: "3. Nutzung der Plattform",
    paragraphs: ["Sie verpflichten sich:"],
    list: [
      "respektvoll mit anderen Nutzern umzugehen",
      "keine rechtswidrigen, beleidigenden oder diskriminierenden Inhalte zu veröffentlichen",
      "keine Werbung oder Spam zu verbreiten",
      "die Plattform nicht missbräuchlich zu verwenden",
    ],
    afterList: [
      "Vela behält sich das Recht vor, Konten bei Verstößen zu sperren.",
    ],
  },
  {
    title: "4. Veranstaltungen und Organisatoren",
    paragraphs: [
      "Nutzer können eigene Sprach-Treffen erstellen und organisieren.",
      "Organisatoren tragen die volle Verantwortung für:",
    ],
    list: [
      "Planung und Durchführung",
      "Sicherheit der Teilnehmer",
      "Inhalte der Veranstaltung",
    ],
    afterList: ["Vela stellt ausschließlich die technische Plattform zur Verfügung."],
  },
  {
    title: "5. Offline-Treffen (Haftungsausschluss)",
    paragraphs: [
      "Bei realen Treffen zwischen Nutzern übernimmt Vela keine Verantwortung für:",
    ],
    list: [
      "Verhalten der Teilnehmer",
      "Schäden, Vorfälle oder Streitigkeiten",
      "Sicherheit bei Veranstaltungen",
    ],
    afterList: ["Die Teilnahme erfolgt auf eigene Verantwortung."],
  },
  {
    title: "6. Nutzerinhalte",
    paragraphs: [
      "Jeder Nutzer ist für die von ihm veröffentlichten Inhalte selbst verantwortlich.",
      "Verboten sind Inhalte, die:",
    ],
    list: [
      "gegen Gesetze verstoßen",
      "urheberrechtswidrig sind",
      "beleidigend oder diskriminierend sind",
    ],
  },
  {
    title: "7. E-Mail Kommunikation",
    paragraphs: [
      "Vela darf Ihnen wichtige Informationen, Veranstaltungsdetails und Updates per E-Mail zusenden.",
      "Sie können sich jederzeit von E-Mails abmelden.",
    ],
  },
  {
    title: "8. Beendigung des Kontos",
    paragraphs: [
      "Sie können Ihr Konto jederzeit löschen.",
      "Vela kann Konten bei Regelverstößen sperren oder löschen.",
    ],
  },
  {
    title: "9. Änderungen der Nutzungsbedingungen",
    paragraphs: [
      "Vela kann diese Bedingungen jederzeit anpassen.",
      "Die weitere Nutzung gilt als Zustimmung zu den Änderungen.",
    ],
  },
  {
    title: "10. Haftungsbeschränkung",
    paragraphs: [
      "Vela haftet nur für vorsätzliches oder grob fahrlässiges Verhalten.",
    ],
  },
  {
    title: "11. Anwendbares Recht",
    paragraphs: ["Es gilt das Recht der Bundesrepublik Deutschland."],
  },
  {
    title: "12. Kontakt",
    paragraphs: ["E-Mail: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_EN: PrivacySection[] = [
  {
    title: "1. About Vela",
    paragraphs: [
      "Vela is a platform for organizing language meetups (Language Café) online and offline.",
      "Users can create events, participate in them and communicate with each other.",
    ],
  },
  {
    title: "2. Registration and User Account",
    paragraphs: ["Registration is possible via:"],
    list: ["Telegram", "Email address"],
    afterList: [
      "By registering you agree to these terms of service.",
      "You must provide accurate information and not share your account with third parties.",
    ],
  },
  {
    title: "3. Use of the Platform",
    paragraphs: ["You agree to:"],
    list: [
      "treat other users respectfully",
      "not publish illegal, offensive or discriminatory content",
      "not distribute advertising or spam",
      "not misuse the platform",
    ],
    afterList: [
      "Vela reserves the right to suspend accounts in case of violations.",
    ],
  },
  {
    title: "4. Events and Organizers",
    paragraphs: [
      "Users can create and organize their own language meetups.",
      "Organizers bear full responsibility for:",
    ],
    list: ["Planning and execution", "Participant safety", "Event content"],
    afterList: ["Vela only provides the technical platform."],
  },
  {
    title: "5. Offline Meetings (Disclaimer)",
    paragraphs: [
      "For real-life meetings between users, Vela assumes no responsibility for:",
    ],
    list: [
      "participants' behavior",
      "damages, incidents or disputes",
      "safety at events",
    ],
    afterList: ["Participation is at your own risk."],
  },
  {
    title: "6. User Content",
    paragraphs: [
      "Each user is responsible for the content they publish.",
      "Prohibited are contents that:",
    ],
    list: ["violate laws", "infringe copyright", "are offensive or discriminatory"],
  },
  {
    title: "7. Email Communication",
    paragraphs: [
      "Vela may send you important information, event details and updates by email.",
      "You can unsubscribe from emails at any time.",
    ],
  },
  {
    title: "8. Account Termination",
    paragraphs: [
      "You can delete your account at any time.",
      "Vela may suspend or delete accounts in case of rule violations.",
    ],
  },
  {
    title: "9. Changes to the Terms",
    paragraphs: [
      "Vela may modify these terms at any time.",
      "Continued use is considered acceptance of the changes.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    paragraphs: ["Vela is liable only for intentional or grossly negligent conduct."],
  },
  {
    title: "11. Applicable Law",
    paragraphs: ["The law of the Federal Republic of Germany applies."],
  },
  {
    title: "12. Contact",
    paragraphs: ["Email: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_RU: PrivacySection[] = [
  {
    title: "1. О Vela",
    paragraphs: [
      "Vela — это платформа для организации языковых встреч (Language Café) онлайн и офлайн.",
      "Пользователи могут создавать мероприятия, участвовать в них и общаться друг с другом.",
    ],
  },
  {
    title: "2. Регистрация и пользовательский аккаунт",
    paragraphs: ["Регистрация возможна через:"],
    list: ["Telegram", "E-mail адрес"],
    afterList: [
      "Регистрируясь, вы соглашаетесь с этими условиями использования.",
      "Вы обязаны указывать достоверные данные и не передавать свой аккаунт третьим лицам.",
    ],
  },
  {
    title: "3. Использование платформы",
    paragraphs: ["Вы обязуетесь:"],
    list: [
      "уважительно относиться к другим пользователям",
      "не публиковать незаконный, оскорбительный или дискриминационный контент",
      "не распространять рекламу или спам",
      "не использовать платформу злоупотребительно",
    ],
    afterList: [
      "Vela оставляет за собой право блокировать аккаунты при нарушениях.",
    ],
  },
  {
    title: "4. Мероприятия и организаторы",
    paragraphs: [
      "Пользователи могут создавать и организовывать собственные языковые встречи.",
      "Организаторы несут полную ответственность за:",
    ],
    list: [
      "Планирование и проведение",
      "Безопасность участников",
      "Содержание мероприятия",
    ],
    afterList: ["Vela предоставляет только техническую платформу."],
  },
  {
    title: "5. Офлайн-встречи (отказ от ответственности)",
    paragraphs: [
      "При реальных встречах между пользователями Vela не несет ответственности за:",
    ],
    list: [
      "поведение участников",
      "ущерб, инциденты или споры",
      "безопасность на мероприятиях",
    ],
    afterList: ["Участие осуществляется на ваш страх и риск."],
  },
  {
    title: "6. Пользовательский контент",
    paragraphs: [
      "Каждый пользователь несет ответственность за размещенный им контент.",
      "Запрещены материалы, которые:",
    ],
    list: [
      "нарушают законы",
      "нарушают авторские права",
      "являются оскорбительными или дискриминационными",
    ],
  },
  {
    title: "7. E-mail коммуникация",
    paragraphs: [
      "Vela может отправлять вам важную информацию, детали мероприятий и обновления по электронной почте.",
      "Вы можете в любой момент отказаться от рассылки.",
    ],
  },
  {
    title: "8. Прекращение аккаунта",
    paragraphs: [
      "Вы можете удалить свой аккаунт в любое время.",
      "Vela может блокировать или удалять аккаунты при нарушении правил.",
    ],
  },
  {
    title: "9. Изменения условий",
    paragraphs: [
      "Vela может в любой момент изменить эти условия.",
      "Продолжение использования означает согласие с изменениями.",
    ],
  },
  {
    title: "10. Ограничение ответственности",
    paragraphs: [
      "Vela отвечает только за умышленное или грубо неосторожное поведение.",
    ],
  },
  {
    title: "11. Применимое право",
    paragraphs: ["Применяется право Федеративной Республики Германия."],
  },
  {
    title: "12. Контакт",
    paragraphs: ["E-mail: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_UK: PrivacySection[] = [
  {
    title: "1. Про Vela",
    paragraphs: [
      "Vela — платформа для організації мовних зустрічей (Language Café) онлайн та офлайн.",
      "Користувачі можуть створювати події, брати в них участь і спілкуватися між собою.",
    ],
  },
  {
    title: "2. Реєстрація та обліковий запис",
    paragraphs: ["Реєстрація можлива через:"],
    list: ["Telegram", "E-mail адреса"],
    afterList: [
      "Реєструючись, ви погоджуєтесь з цими умовами користування.",
      "Ви зобов’язані надавати коректні дані та не передавати свій акаунт третім особам.",
    ],
  },
  {
    title: "3. Використання платформи",
    paragraphs: ["Ви зобов’язуєтесь:"],
    list: [
      "поважно ставитися до інших користувачів",
      "не публікувати незаконний, образливий або дискримінаційний контент",
      "не поширювати рекламу або спам",
      "не зловживати платформою",
    ],
    afterList: [
      "Vela залишає за собою право блокувати акаунти у разі порушень.",
    ],
  },
  {
    title: "4. Події та організатори",
    paragraphs: [
      "Користувачі можуть створювати та організовувати власні мовні зустрічі.",
      "Організатори несуть повну відповідальність за:",
    ],
    list: [
      "Планування та проведення",
      "Безпеку учасників",
      "Зміст заходу",
    ],
    afterList: ["Vela надає лише технічну платформу."],
  },
  {
    title: "5. Офлайн-зустрічі (відмова від відповідальності)",
    paragraphs: [
      "Під час реальних зустрічей між користувачами Vela не несе відповідальності за:",
    ],
    list: [
      "поведінку учасників",
      "збитки, інциденти або суперечки",
      "безпеку під час заходів",
    ],
    afterList: ["Участь здійснюється на власний ризик."],
  },
  {
    title: "6. Користувацький контент",
    paragraphs: [
      "Кожен користувач несе відповідальність за контент, який він публікує.",
      "Заборонені матеріали, що:",
    ],
    list: [
      "порушують закони",
      "порушують авторські права",
      "є образливими або дискримінаційними",
    ],
  },
  {
    title: "7. E-mail комунікація",
    paragraphs: [
      "Vela може надсилати вам важливу інформацію, деталі подій та оновлення електронною поштою.",
      "Ви можете будь-коли відмовитися від листів.",
    ],
  },
  {
    title: "8. Припинення облікового запису",
    paragraphs: [
      "Ви можете видалити свій акаунт у будь-який час.",
      "Vela може блокувати або видаляти акаунти у разі порушення правил.",
    ],
  },
  {
    title: "9. Зміни умов",
    paragraphs: [
      "Vela може змінювати ці умови у будь-який час.",
      "Подальше використання означає згоду зі змінами.",
    ],
  },
  {
    title: "10. Обмеження відповідальності",
    paragraphs: [
      "Vela несе відповідальність лише за умисні або грубо недбалі дії.",
    ],
  },
  {
    title: "11. Застосовне право",
    paragraphs: ["Застосовується право Федеративної Республіки Німеччина."],
  },
  {
    title: "12. Контакт",
    paragraphs: ["E-mail: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_FA: PrivacySection[] = [
  {
    title: "1. درباره Vela",
    paragraphs: [
      "Vela پلتفرمی برای سازمان‌دهی دورهمی‌های زبانی (Language Café) به صورت آنلاین و آفلاین است.",
      "کاربران می‌توانند رویداد ایجاد کنند، در آن‌ها شرکت کنند و با یکدیگر ارتباط داشته باشند.",
    ],
  },
  {
    title: "2. ثبت‌نام و حساب کاربری",
    paragraphs: ["ثبت‌نام از طریق موارد زیر امکان‌پذیر است:"],
    list: ["Telegram", "آدرس ایمیل"],
    afterList: [
      "با ثبت‌نام، شما با این شرایط استفاده موافقت می‌کنید.",
      "شما موظفید اطلاعات صحیح ارائه دهید و حساب خود را در اختیار اشخاص ثالث قرار ندهید.",
    ],
  },
  {
    title: "3. استفاده از پلتفرم",
    paragraphs: ["شما متعهد می‌شوید:"],
    list: [
      "با دیگر کاربران با احترام رفتار کنید",
      "محتوای غیرقانونی، توهین‌آمیز یا تبعیض‌آمیز منتشر نکنید",
      "تبلیغات یا اسپم منتشر نکنید",
      "از پلتفرم سوءاستفاده نکنید",
    ],
    afterList: ["Vela حق دارد در صورت تخلف، حساب‌ها را مسدود کند."],
  },
  {
    title: "4. رویدادها و برگزارکنندگان",
    paragraphs: [
      "کاربران می‌توانند دورهمی‌های زبانی خود را ایجاد و سازمان‌دهی کنند.",
      "برگزارکنندگان مسئولیت کامل دارند برای:",
    ],
    list: [
      "برنامه‌ریزی و اجرا",
      "ایمنی شرکت‌کنندگان",
      "محتوای رویداد",
    ],
    afterList: ["Vela فقط پلتفرم فنی را فراهم می‌کند."],
  },
  {
    title: "5. دیدارهای آفلاین (سلب مسئولیت)",
    paragraphs: [
      "در دیدارهای حضوری بین کاربران، Vela هیچ مسئولیتی در قبال موارد زیر ندارد:",
    ],
    list: [
      "رفتار شرکت‌کنندگان",
      "خسارات، حوادث یا اختلافات",
      "ایمنی در رویدادها",
    ],
    afterList: ["شرکت در رویدادها با مسئولیت خود شماست."],
  },
  {
    title: "6. محتوای کاربران",
    paragraphs: [
      "هر کاربر نسبت به محتوایی که منتشر می‌کند مسئول است.",
      "محتواهای زیر ممنوع است که:",
    ],
    list: [
      "برخلاف قانون باشد",
      "نقض‌کننده حق نشر باشد",
      "توهین‌آمیز یا تبعیض‌آمیز باشد",
    ],
  },
  {
    title: "7. ارتباط ایمیلی",
    paragraphs: [
      "Vela می‌تواند اطلاعات مهم، جزئیات رویداد و به‌روزرسانی‌ها را از طریق ایمیل برای شما ارسال کند.",
      "شما می‌توانید هر زمان از دریافت ایمیل‌ها انصراف دهید.",
    ],
  },
  {
    title: "8. پایان حساب کاربری",
    paragraphs: [
      "می‌توانید حساب خود را هر زمان حذف کنید.",
      "Vela می‌تواند در صورت نقض قوانین حساب‌ها را مسدود یا حذف کند.",
    ],
  },
  {
    title: "9. تغییرات شرایط استفاده",
    paragraphs: [
      "Vela می‌تواند این شرایط را هر زمان تغییر دهد.",
      "ادامه استفاده به منزله پذیرش تغییرات است.",
    ],
  },
  {
    title: "10. محدودیت مسئولیت",
    paragraphs: ["Vela فقط در صورت عمد یا تقصیر فاحش مسئول است."],
  },
  {
    title: "11. قانون حاکم",
    paragraphs: ["قانون جمهوری فدرال آلمان حاکم است."],
  },
  {
    title: "12. تماس",
    paragraphs: ["ایمیل: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_AR: PrivacySection[] = [
  {
    title: "1. حول Vela",
    paragraphs: [
      "Vela هي منصة لتنظيم لقاءات لغوية (Language Café) عبر الإنترنت وخارجه.",
      "يمكن للمستخدمين إنشاء الفعاليات والمشاركة فيها والتواصل مع بعضهم.",
    ],
  },
  {
    title: "2. التسجيل وحساب المستخدم",
    paragraphs: ["التسجيل متاح عبر:"],
    list: ["Telegram", "البريد الإلكتروني"],
    afterList: [
      "بالتسجيل، توافق على شروط الاستخدام هذه.",
      "يلزمك تقديم معلومات صحيحة وعدم مشاركة حسابك مع أطراف ثالثة.",
    ],
  },
  {
    title: "3. استخدام المنصة",
    paragraphs: ["تتعهد بما يلي:"],
    list: [
      "التعامل باحترام مع المستخدمين الآخرين",
      "عدم نشر محتوى غير قانوني أو مسيء أو تمييزي",
      "عدم نشر الإعلانات أو الرسائل المزعجة",
      "عدم إساءة استخدام المنصة",
    ],
    afterList: [
      "تحتفظ Vela بالحق في حظر الحسابات عند المخالفات.",
    ],
  },
  {
    title: "4. الفعاليات والمنظمون",
    paragraphs: [
      "يمكن للمستخدمين إنشاء وتنظيم لقاءاتهم اللغوية الخاصة.",
      "يتحمل المنظمون المسؤولية الكاملة عن:",
    ],
    list: ["التخطيط والتنفيذ", "سلامة المشاركين", "محتوى الفعالية"],
    afterList: ["Vela توفر المنصة التقنية فقط."],
  },
  {
    title: "5. اللقاءات دون اتصال (إخلاء مسؤولية)",
    paragraphs: [
      "في اللقاءات الواقعية بين المستخدمين، لا تتحمل Vela أي مسؤولية عن:",
    ],
    list: [
      "سلوك المشاركين",
      "الأضرار أو الحوادث أو النزاعات",
      "السلامة أثناء الفعاليات",
    ],
    afterList: ["المشاركة على مسؤوليتك الخاصة."],
  },
  {
    title: "6. محتوى المستخدم",
    paragraphs: [
      "كل مستخدم مسؤول عن المحتوى الذي ينشره.",
      "المحتوى المحظور هو الذي:",
    ],
    list: [
      "ينتهك القوانين",
      "ينتهك حقوق النشر",
      "يكون مسيئًا أو تمييزيًا",
    ],
  },
  {
    title: "7. التواصل عبر البريد الإلكتروني",
    paragraphs: [
      "قد ترسل Vela إليك معلومات مهمة وتفاصيل الفعاليات والتحديثات عبر البريد الإلكتروني.",
      "يمكنك إلغاء الاشتراك من الرسائل في أي وقت.",
    ],
  },
  {
    title: "8. إنهاء الحساب",
    paragraphs: [
      "يمكنك حذف حسابك في أي وقت.",
      "يمكن لـ Vela حظر أو حذف الحسابات عند مخالفة القواعد.",
    ],
  },
  {
    title: "9. تغييرات شروط الاستخدام",
    paragraphs: [
      "يمكن لـ Vela تعديل هذه الشروط في أي وقت.",
      "يُعدّ الاستمرار في الاستخدام موافقة على التغييرات.",
    ],
  },
  {
    title: "10. حدود المسؤولية",
    paragraphs: [
      "تتحمل Vela المسؤولية فقط عن السلوك العمدي أو الإهمال الجسيم.",
    ],
  },
  {
    title: "11. القانون الواجب التطبيق",
    paragraphs: ["يطبق قانون جمهورية ألمانيا الاتحادية."],
  },
  {
    title: "12. التواصل",
    paragraphs: ["البريد الإلكتروني: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_SQ: PrivacySection[] = [
  {
    title: "1. Rreth Vela",
    paragraphs: [
      "Vela është një platformë për organizimin e takimeve gjuhësore (Language Café) online dhe offline.",
      "Përdoruesit mund të krijojnë ngjarje, të marrin pjesë në to dhe të komunikojnë me njëri-tjetrin.",
    ],
  },
  {
    title: "2. Regjistrimi dhe llogaria e përdoruesit",
    paragraphs: ["Regjistrimi është i mundur përmes:"],
    list: ["Telegram", "Adresa e e-mailit"],
    afterList: [
      "Me regjistrimin, ju pranoni këto kushte përdorimi.",
      "Ju jeni të detyruar të jepni të dhëna të sakta dhe të mos e ndani llogarinë tuaj me palë të treta.",
    ],
  },
  {
    title: "3. Përdorimi i platformës",
    paragraphs: ["Ju angazhoheni të:"],
    list: [
      "të silleni me respekt ndaj përdoruesve të tjerë",
      "të mos publikoni përmbajtje të paligjshme, fyese ose diskriminuese",
      "të mos shpërndani reklama ose spam",
      "të mos e përdorni platformën në mënyrë abuzive",
    ],
    afterList: [
      "Vela rezervon të drejtën të bllokojë llogaritë në rast shkeljesh.",
    ],
  },
  {
    title: "4. Ngjarjet dhe organizatorët",
    paragraphs: [
      "Përdoruesit mund të krijojnë dhe organizojnë takime gjuhësore të tyre.",
      "Organizatorët mbajnë përgjegjësi të plotë për:",
    ],
    list: [
      "Planifikimin dhe zbatimin",
      "Sigurinë e pjesëmarrësve",
      "Përmbajtjen e ngjarjes",
    ],
    afterList: ["Vela ofron vetëm platformën teknike."],
  },
  {
    title: "5. Takime offline (Përjashtim përgjegjësie)",
    paragraphs: [
      "Në takimet reale midis përdoruesve, Vela nuk mban përgjegjësi për:",
    ],
    list: [
      "sjelljen e pjesëmarrësve",
      "dëme, incidente ose mosmarrëveshje",
      "sigurinë në ngjarje",
    ],
    afterList: ["Pjesëmarrja bëhet me përgjegjësinë tuaj."],
  },
  {
    title: "6. Përmbajtja e përdoruesve",
    paragraphs: [
      "Çdo përdorues është përgjegjës për përmbajtjen që publikon.",
      "Ndalohet përmbajtja që:",
    ],
    list: [
      "shkel ligjet",
      "shkel të drejtat e autorit",
      "është fyese ose diskriminuese",
    ],
  },
  {
    title: "7. Komunikimi me e-mail",
    paragraphs: [
      "Vela mund t'ju dërgojë informacione të rëndësishme, detaje të ngjarjeve dhe përditësime me e-mail.",
      "Ju mund të çregjistroheni nga e-mail-et në çdo kohë.",
    ],
  },
  {
    title: "8. Përfundimi i llogarisë",
    paragraphs: [
      "Ju mund ta fshini llogarinë tuaj në çdo kohë.",
      "Vela mund të bllokojë ose fshijë llogaritë në rast shkeljesh.",
    ],
  },
  {
    title: "9. Ndryshimet e kushteve të përdorimit",
    paragraphs: [
      "Vela mund t'i ndryshojë këto kushte në çdo kohë.",
      "Përdorimi i mëtejshëm konsiderohet si pranim i ndryshimeve.",
    ],
  },
  {
    title: "10. Kufizimi i përgjegjësisë",
    paragraphs: [
      "Vela mban përgjegjësi vetëm për veprime të qëllimshme ose pakujdesi të rëndë.",
    ],
  },
  {
    title: "11. E drejta e zbatueshme",
    paragraphs: ["Zbatohet e drejta e Republikës Federale të Gjermanisë."],
  },
  {
    title: "12. Kontakt",
    paragraphs: ["E-mail: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_TR: PrivacySection[] = [
  {
    title: "1. Vela hakkında",
    paragraphs: [
      "Vela, çevrimiçi ve çevrimdışı dil buluşmalarını (Language Café) organize etmek için bir platformdur.",
      "Kullanıcılar etkinlik oluşturabilir, etkinliklere katılabilir ve birbirleriyle iletişim kurabilir.",
    ],
  },
  {
    title: "2. Kayıt ve kullanıcı hesabı",
    paragraphs: ["Kayıt şu yollarla mümkündür:"],
    list: ["Telegram", "E-posta adresi"],
    afterList: [
      "Kayıt olarak bu kullanım şartlarını kabul etmiş olursunuz.",
      "Doğru bilgi vermek ve hesabınızı üçüncü kişilerle paylaşmamakla yükümlüsünüz.",
    ],
  },
  {
    title: "3. Platformun kullanımı",
    paragraphs: ["Şunları taahhüt edersiniz:"],
    list: [
      "diğer kullanıcılara saygılı davranmak",
      "hukuka aykırı, hakaret içeren veya ayrımcı içerikler paylaşmamak",
      "reklam veya spam yaymamak",
      "platformu kötüye kullanmamak",
    ],
    afterList: [
      "Vela, ihlallerde hesapları askıya alma hakkını saklı tutar.",
    ],
  },
  {
    title: "4. Etkinlikler ve organizatörler",
    paragraphs: [
      "Kullanıcılar kendi dil buluşmalarını oluşturabilir ve organize edebilir.",
      "Organizatörler şu konularda tam sorumluluk taşır:",
    ],
    list: [
      "Planlama ve yürütme",
      "Katılımcıların güvenliği",
      "Etkinliğin içeriği",
    ],
    afterList: ["Vela yalnızca teknik platformu sağlar."],
  },
  {
    title: "5. Çevrimdışı buluşmalar (sorumluluk reddi)",
    paragraphs: [
      "Kullanıcılar arasındaki gerçek buluşmalarda Vela şu konularda sorumluluk kabul etmez:",
    ],
    list: [
      "katılımcıların davranışı",
      "zararlar, olaylar veya uyuşmazlıklar",
      "etkinliklerde güvenlik",
    ],
    afterList: ["Katılım kendi sorumluluğunuzdadır."],
  },
  {
    title: "6. Kullanıcı içerikleri",
    paragraphs: [
      "Her kullanıcı, paylaştığı içerikten kendisi sorumludur.",
      "Şu içerikler yasaktır:",
    ],
    list: [
      "kanunlara aykırı olanlar",
      "telif hakkını ihlal edenler",
      "hakaret içeren veya ayrımcı olanlar",
    ],
  },
  {
    title: "7. E-posta iletişimi",
    paragraphs: [
      "Vela size önemli bilgiler, etkinlik ayrıntıları ve güncellemeleri e-posta ile gönderebilir.",
      "E-postalardan istediğiniz zaman çıkabilirsiniz.",
    ],
  },
  {
    title: "8. Hesabın sonlandırılması",
    paragraphs: [
      "Hesabınızı istediğiniz zaman silebilirsiniz.",
      "Vela, kural ihlallerinde hesapları askıya alabilir veya silebilir.",
    ],
  },
  {
    title: "9. Kullanım şartlarında değişiklikler",
    paragraphs: [
      "Vela bu şartları istediği zaman değiştirebilir.",
      "Kullanıma devam etmek değişiklikleri kabul ettiğiniz anlamına gelir.",
    ],
  },
  {
    title: "10. Sorumluluğun sınırlandırılması",
    paragraphs: [
      "Vela yalnızca kasıtlı veya ağır ihmal durumlarında sorumludur.",
    ],
  },
  {
    title: "11. Uygulanacak hukuk",
    paragraphs: ["Almanya Federal Cumhuriyeti hukuku uygulanır."],
  },
  {
    title: "12. İletişim",
    paragraphs: ["E-posta: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_FR: PrivacySection[] = [
  {
    title: "1. À propos de Vela",
    paragraphs: [
      "Vela est une plateforme d’organisation de rencontres linguistiques (Language Café) en ligne et hors ligne.",
      "Les utilisateurs peuvent créer des événements, y participer et communiquer entre eux.",
    ],
  },
  {
    title: "2. Inscription et compte utilisateur",
    paragraphs: ["L’inscription est possible via :"],
    list: ["Telegram", "Adresse e-mail"],
    afterList: [
      "En vous inscrivant, vous acceptez ces conditions d'utilisation.",
      "Vous êtes tenu de fournir des informations correctes et de ne pas transmettre votre compte à des tiers.",
    ],
  },
  {
    title: "3. Utilisation de la plateforme",
    paragraphs: ["Vous vous engagez à :"],
    list: [
      "traiter les autres utilisateurs avec respect",
      "ne pas publier de contenu illégal, offensant ou discriminatoire",
      "ne pas diffuser de publicité ou de spam",
      "ne pas utiliser la plateforme de manière abusive",
    ],
    afterList: [
      "Vela se réserve le droit de suspendre des comptes en cas de violations.",
    ],
  },
  {
    title: "4. Événements et organisateurs",
    paragraphs: [
      "Les utilisateurs peuvent créer et organiser leurs propres rencontres linguistiques.",
      "Les organisateurs sont pleinement responsables de :",
    ],
    list: [
      "Planification et réalisation",
      "Sécurité des participants",
      "Contenu de l'événement",
    ],
    afterList: ["Vela fournit uniquement la plateforme technique."],
  },
  {
    title: "5. Rencontres hors ligne (clause de non-responsabilité)",
    paragraphs: [
      "Lors de rencontres réelles entre utilisateurs, Vela n'assume aucune responsabilité pour :",
    ],
    list: [
      "le comportement des participants",
      "les dommages, incidents ou litiges",
      "la sécurité lors des événements",
    ],
    afterList: ["La participation se fait à vos propres risques."],
  },
  {
    title: "6. Contenus des utilisateurs",
    paragraphs: [
      "Chaque utilisateur est responsable du contenu qu'il publie.",
      "Les contenus interdits sont ceux qui :",
    ],
    list: [
      "violent la loi",
      "enfreignent le droit d’auteur",
      "sont offensants ou discriminatoires",
    ],
  },
  {
    title: "7. Communication par e-mail",
    paragraphs: [
      "Vela peut vous envoyer des informations importantes, des détails d’événements et des mises à jour par e-mail.",
      "Vous pouvez vous désabonner des e-mails à tout moment.",
    ],
  },
  {
    title: "8. Résiliation du compte",
    paragraphs: [
      "Vous pouvez supprimer votre compte à tout moment.",
      "Vela peut suspendre ou supprimer des comptes en cas de violation des règles.",
    ],
  },
  {
    title: "9. Modifications des conditions d'utilisation",
    paragraphs: [
      "Vela peut modifier ces conditions à tout moment.",
      "La poursuite de l’utilisation vaut acceptation des modifications.",
    ],
  },
  {
    title: "10. Limitation de responsabilité",
    paragraphs: [
      "Vela n’est responsable qu’en cas de faute intentionnelle ou de négligence grave.",
    ],
  },
  {
    title: "11. Droit applicable",
    paragraphs: ["Le droit de la République fédérale d’Allemagne s’applique."],
  },
  {
    title: "12. Contact",
    paragraphs: ["E-mail : info@vela.cafe"],
  },
];

const TERMS_SECTIONS_ES: PrivacySection[] = [
  {
    title: "1. Sobre Vela",
    paragraphs: [
      "Vela es una plataforma para organizar encuentros de idiomas (Language Café) online y offline.",
      "Los usuarios pueden crear eventos, participar en ellos y comunicarse entre sí.",
    ],
  },
  {
    title: "2. Registro y cuenta de usuario",
    paragraphs: ["El registro es posible a través de:"],
    list: ["Telegram", "Dirección de correo electrónico"],
    afterList: [
      "Al registrarse, usted acepta estos términos de uso.",
      "Debe proporcionar información correcta y no compartir su cuenta con terceros.",
    ],
  },
  {
    title: "3. Uso de la plataforma",
    paragraphs: ["Usted se compromete a:"],
    list: [
      "tratar con respeto a los demás usuarios",
      "no publicar contenido ilegal, ofensivo o discriminatorio",
      "no difundir publicidad ni spam",
      "no usar la plataforma de forma abusiva",
    ],
    afterList: [
      "Vela se reserva el derecho de suspender cuentas en caso de incumplimiento.",
    ],
  },
  {
    title: "4. Eventos y organizadores",
    paragraphs: [
      "Los usuarios pueden crear y organizar sus propios encuentros de idiomas.",
      "Los organizadores asumen toda la responsabilidad por:",
    ],
    list: [
      "Planificación y ejecución",
      "Seguridad de los participantes",
      "Contenido del evento",
    ],
    afterList: ["Vela proporciona únicamente la plataforma técnica."],
  },
  {
    title: "5. Encuentros presenciales (exención de responsabilidad)",
    paragraphs: [
      "En los encuentros reales entre usuarios, Vela no asume responsabilidad por:",
    ],
    list: [
      "el comportamiento de los participantes",
      "daños, incidentes o disputas",
      "la seguridad en los eventos",
    ],
    afterList: ["La participación es bajo su propia responsabilidad."],
  },
  {
    title: "6. Contenido de los usuarios",
    paragraphs: [
      "Cada usuario es responsable del contenido que publica.",
      "Está prohibido el contenido que:",
    ],
    list: [
      "viole las leyes",
      "infrinja derechos de autor",
      "sea ofensivo o discriminatorio",
    ],
  },
  {
    title: "7. Comunicación por correo electrónico",
    paragraphs: [
      "Vela puede enviarle información importante, detalles de eventos y actualizaciones por correo electrónico.",
      "Puede darse de baja de los correos en cualquier momento.",
    ],
  },
  {
    title: "8. Terminación de la cuenta",
    paragraphs: [
      "Puede eliminar su cuenta en cualquier momento.",
      "Vela puede suspender o eliminar cuentas en caso de incumplimiento de las reglas.",
    ],
  },
  {
    title: "9. Cambios en los términos de uso",
    paragraphs: [
      "Vela puede modificar estos términos en cualquier momento.",
      "El uso continuado se considera aceptación de los cambios.",
    ],
  },
  {
    title: "10. Limitación de responsabilidad",
    paragraphs: [
      "Vela solo es responsable por conducta dolosa o negligencia grave.",
    ],
  },
  {
    title: "11. Ley aplicable",
    paragraphs: ["Se aplica la ley de la República Federal de Alemania."],
  },
  {
    title: "12. Contacto",
    paragraphs: ["E-mail: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_IT: PrivacySection[] = [
  {
    title: "1. Informazioni su Vela",
    paragraphs: [
      "Vela è una piattaforma per organizzare incontri linguistici (Language Café) online e offline.",
      "Gli utenti possono creare eventi, partecipare e comunicare tra loro.",
    ],
  },
  {
    title: "2. Registrazione e account utente",
    paragraphs: ["La registrazione è possibile tramite:"],
    list: ["Telegram", "Indirizzo e-mail"],
    afterList: [
      "Registrandoti accetti questi termini di utilizzo.",
      "Sei tenuto a fornire dati corretti e a non condividere il tuo account con terzi.",
    ],
  },
  {
    title: "3. Utilizzo della piattaforma",
    paragraphs: ["Ti impegni a:"],
    list: [
      "trattare con rispetto gli altri utenti",
      "non pubblicare contenuti illegali, offensivi o discriminatori",
      "non diffondere pubblicità o spam",
      "non utilizzare la piattaforma in modo improprio",
    ],
    afterList: [
      "Vela si riserva il diritto di sospendere gli account in caso di violazioni.",
    ],
  },
  {
    title: "4. Eventi e organizzatori",
    paragraphs: [
      "Gli utenti possono creare e organizzare i propri incontri linguistici.",
      "Gli organizzatori sono pienamente responsabili di:",
    ],
    list: [
      "Pianificazione ed esecuzione",
      "Sicurezza dei partecipanti",
      "Contenuto dell'evento",
    ],
    afterList: ["Vela fornisce esclusivamente la piattaforma tecnica."],
  },
  {
    title: "5. Incontri offline (esclusione di responsabilità)",
    paragraphs: [
      "Negli incontri reali tra utenti, Vela non si assume alcuna responsabilità per:",
    ],
    list: [
      "il comportamento dei partecipanti",
      "danni, incidenti o controversie",
      "la sicurezza durante gli eventi",
    ],
    afterList: ["La partecipazione avviene a proprio rischio."],
  },
  {
    title: "6. Contenuti degli utenti",
    paragraphs: [
      "Ogni utente è responsabile dei contenuti pubblicati.",
      "Sono vietati i contenuti che:",
    ],
    list: [
      "violano le leggi",
      "violano il diritto d’autore",
      "sono offensivi o discriminatori",
    ],
  },
  {
    title: "7. Comunicazione via e-mail",
    paragraphs: [
      "Vela può inviarti informazioni importanti, dettagli degli eventi e aggiornamenti via e-mail.",
      "Puoi annullare l’iscrizione alle e-mail in qualsiasi momento.",
    ],
  },
  {
    title: "8. Chiusura dell'account",
    paragraphs: [
      "Puoi eliminare il tuo account in qualsiasi momento.",
      "Vela può sospendere o eliminare account in caso di violazioni delle regole.",
    ],
  },
  {
    title: "9. Modifiche ai termini di utilizzo",
    paragraphs: [
      "Vela può modificare questi termini in qualsiasi momento.",
      "L’uso continuato è considerato accettazione delle modifiche.",
    ],
  },
  {
    title: "10. Limitazione di responsabilità",
    paragraphs: [
      "Vela è responsabile solo in caso di dolo o colpa grave.",
    ],
  },
  {
    title: "11. Legge applicabile",
    paragraphs: ["Si applica la legge della Repubblica Federale di Germania."],
  },
  {
    title: "12. Contatto",
    paragraphs: ["E-mail: info@vela.cafe"],
  },
];

const TERMS_SECTIONS_PL: PrivacySection[] = [
  {
    title: "1. O Vela",
    paragraphs: [
      "Vela to platforma do organizowania spotkań językowych (Language Café) online i offline.",
      "Użytkownicy mogą tworzyć wydarzenia, brać w nich udział i komunikować się ze sobą.",
    ],
  },
  {
    title: "2. Rejestracja i konto użytkownika",
    paragraphs: ["Rejestracja jest możliwa poprzez:"],
    list: ["Telegram", "Adres e-mail"],
    afterList: [
      "Rejestrując się, akceptujesz niniejsze warunki korzystania.",
      "Jesteś zobowiązany do podawania prawidłowych danych i nieudostępniania konta osobom trzecim.",
    ],
  },
  {
    title: "3. Korzystanie z platformy",
    paragraphs: ["Zobowiązujesz się:"],
    list: [
      "traktować innych użytkowników z szacunkiem",
      "nie publikować treści nielegalnych, obraźliwych lub dyskryminujących",
      "nie rozpowszechniać reklam ani spamu",
      "nie używać platformy w sposób nadużywający",
    ],
    afterList: [
      "Vela zastrzega sobie prawo do blokowania kont w przypadku naruszeń.",
    ],
  },
  {
    title: "4. Wydarzenia i organizatorzy",
    paragraphs: [
      "Użytkownicy mogą tworzyć i organizować własne spotkania językowe.",
      "Organizatorzy ponoszą pełną odpowiedzialność za:",
    ],
    list: [
      "Planowanie i realizację",
      "Bezpieczeństwo uczestników",
      "Treść wydarzenia",
    ],
    afterList: ["Vela zapewnia wyłącznie platformę techniczną."],
  },
  {
    title: "5. Spotkania offline (wyłączenie odpowiedzialności)",
    paragraphs: [
      "W przypadku spotkań na żywo między użytkownikami Vela nie ponosi odpowiedzialności za:",
    ],
    list: [
      "zachowanie uczestników",
      "szkody, incydenty lub spory",
      "bezpieczeństwo podczas wydarzeń",
    ],
    afterList: ["Udział odbywa się na własne ryzyko."],
  },
  {
    title: "6. Treści użytkowników",
    paragraphs: [
      "Każdy użytkownik ponosi odpowiedzialność za publikowane przez siebie treści.",
      "Zabronione są treści, które:",
    ],
    list: [
      "naruszają prawo",
      "naruszają prawa autorskie",
      "są obraźliwe lub dyskryminujące",
    ],
  },
  {
    title: "7. Komunikacja e-mail",
    paragraphs: [
      "Vela może wysyłać Ci ważne informacje, szczegóły wydarzeń i aktualizacje drogą e-mailową.",
      "Możesz w każdej chwili zrezygnować z e-maili.",
    ],
  },
  {
    title: "8. Zakończenie konta",
    paragraphs: [
      "Możesz usunąć swoje konto w dowolnym momencie.",
      "Vela może zablokować lub usunąć konta w przypadku naruszenia zasad.",
    ],
  },
  {
    title: "9. Zmiany warunków korzystania",
    paragraphs: [
      "Vela może w każdej chwili zmienić te warunki.",
      "Dalsze korzystanie oznacza akceptację zmian.",
    ],
  },
  {
    title: "10. Ograniczenie odpowiedzialności",
    paragraphs: [
      "Vela ponosi odpowiedzialność wyłącznie za działania umyślne lub rażące niedbalstwo.",
    ],
  },
  {
    title: "11. Prawo właściwe",
    paragraphs: ["Zastosowanie ma prawo Republiki Federalnej Niemiec."],
  },
  {
    title: "12. Kontakt",
    paragraphs: ["E-mail: info@vela.cafe"],
  },
];

const TERMS_CONTENT: Record<Locale, LegalContent> = {
  de: {
    title: "Nutzungsbedingungen (Terms of Service)",
    sections: TERMS_SECTIONS_DE,
  },
  en: { title: "Terms of Service", sections: TERMS_SECTIONS_EN },
  ru: { title: "Условия использования", sections: TERMS_SECTIONS_RU },
  uk: { title: "Умови користування", sections: TERMS_SECTIONS_UK },
  fa: { title: "شرایط استفاده", sections: TERMS_SECTIONS_FA },
  ar: { title: "شروط الاستخدام", sections: TERMS_SECTIONS_AR },
  sq: { title: "Kushtet e përdorimit", sections: TERMS_SECTIONS_SQ },
  tr: { title: "Kullanım Şartları", sections: TERMS_SECTIONS_TR },
  fr: { title: "Conditions d'utilisation", sections: TERMS_SECTIONS_FR },
  es: { title: "Términos de uso", sections: TERMS_SECTIONS_ES },
  it: { title: "Termini di utilizzo", sections: TERMS_SECTIONS_IT },
  pl: { title: "Warunki korzystania", sections: TERMS_SECTIONS_PL },
};

function renderLegalContent(title: string, sections: PrivacySection[]) {
  return (
    <div className="privacyContent">
      <h1 className="privacyTitle">{title}</h1>
      {sections.map((section, sectionIndex) => (
        <section key={`${section.title}-${sectionIndex}`} className="privacySection">
          <h2 className="privacyHeading">{section.title}</h2>
          {section.paragraphs?.map((paragraph, paragraphIndex) => (
            <p
              key={`p-${sectionIndex}-${paragraphIndex}`}
              className="privacyParagraph"
            >
              {paragraph}
            </p>
          ))}
          {section.list ? (
            <ul className="privacyList">
              {section.list.map((item, itemIndex) => (
                <li
                  key={`li-${sectionIndex}-${itemIndex}`}
                  className="privacyListItem"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {section.afterList?.map((paragraph, paragraphIndex) => (
            <p
              key={`a-${sectionIndex}-${paragraphIndex}`}
              className="privacyParagraph"
            >
              {paragraph}
            </p>
          ))}
          {section.subsections?.map((subsection, subsectionIndex) => (
            <div
              key={`sub-${sectionIndex}-${subsectionIndex}`}
              className="privacySubsection"
            >
              <h3 className="privacySubheading">{subsection.title}</h3>
              {subsection.paragraphs?.map((paragraph, paragraphIndex) => (
                <p
                  key={`sp-${sectionIndex}-${subsectionIndex}-${paragraphIndex}`}
                  className="privacyParagraph"
                >
                  {paragraph}
                </p>
              ))}
              {subsection.list ? (
                <ul className="privacyList">
                  {subsection.list.map((item, itemIndex) => (
                    <li
                      key={`sl-${sectionIndex}-${subsectionIndex}-${itemIndex}`}
                      className="privacyListItem"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {subsection.afterList?.map((paragraph, paragraphIndex) => (
                <p
                  key={`sa-${sectionIndex}-${subsectionIndex}-${paragraphIndex}`}
                  className="privacyParagraph"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

const PARTNER_LOGOS = [
  { src: "/partners/partner-1.svg", alt: "Partner 1" },
  { src: "/partners/partner-2.svg", alt: "Partner 2" },
  { src: "/partners/partner-3.svg", alt: "Partner 3" },
  { src: "/partners/partner-4.svg", alt: "Partner 4" },
] as const;

export default function App() {
  const [locale, setLocale] = useState<Locale>("ru");
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
  const [postPreviewUrl, setPostPreviewUrl] = useState<string | null>(null);
  const [postsStatus, setPostsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [postActionStatus, setPostActionStatus] = useState<{
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
  const [eventsList, setEventsList] = useState<EventRecord[]>([]);
  const [eventDetails, setEventDetails] = useState<EventRecord | null>(null);
  const [eventOrganizer, setEventOrganizer] = useState<SearchProfile | null>(null);
  const [eventDetailsStatus, setEventDetailsStatus] = useState<{
    type: "idle" | "loading" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [eventRsvpStatus, setEventRsvpStatus] = useState<
    "going" | "interested" | null
  >(null);
  const [eventRsvpLoading, setEventRsvpLoading] = useState(false);
  const [eventRsvps, setEventRsvps] = useState<
    { user_id: string; status: "going" | "interested" }[]
  >([]);
  const [eventRsvpProfiles, setEventRsvpProfiles] = useState<
    Record<string, SearchProfile>
  >({});
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [eventExistingImageUrl, setEventExistingImageUrl] = useState<string | null>(
    null
  );
  const [eventRemoveImage, setEventRemoveImage] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [eventCity, setEventCity] = useState("");
  const [eventCountry, setEventCountry] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventOnlineUrl, setEventOnlineUrl] = useState("");
  const [eventLanguage, setEventLanguage] = useState<Locale | "">("");
  const [eventLevel, setEventLevel] = useState<LanguageLevel>("");
  const [eventDate, setEventDate] = useState("");
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
  const [profileBio, setProfileBio] = useState("");
  const [profileInterests, setProfileInterests] = useState<string[]>([]);
  const [profileInterestInput, setProfileInterestInput] = useState("");
  const [profileTelegram, setProfileTelegram] = useState("");
  const [profileInstagram, setProfileInstagram] = useState("");
  const [profileIsOrganizer, setProfileIsOrganizer] = useState(false);
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
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const cropDragRef = useRef<{
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
  const strings = MESSAGES[locale] ?? MESSAGES[FALLBACK_LOCALE];
  const languageLabels =
    LANGUAGE_LABELS[locale] ?? LANGUAGE_LABELS[FALLBACK_LOCALE];
  const privacyContent =
    PRIVACY_CONTENT[locale] ?? PRIVACY_CONTENT[FALLBACK_LOCALE];
  const impressumContent =
    IMPRESSUM_CONTENT[locale] ?? IMPRESSUM_CONTENT[FALLBACK_LOCALE];
  const termsContent =
    TERMS_CONTENT[locale] ?? TERMS_CONTENT[FALLBACK_LOCALE];
  const registerConsentLine =
    termsContent.sections.find((section) => section.afterList?.length)
      ?.afterList?.[0] ?? "";
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
  const sortedEventRsvps = [...eventRsvps].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "going" ? -1 : 1;
  });
  const eventGoingCount = eventRsvps.filter(
    (item) => item.status === "going"
  ).length;
  const eventInterestedCount = eventRsvps.filter(
    (item) => item.status === "interested"
  ).length;
  const sessionOrganizerFollowers =
    sessionUser?.id && profileIsOrganizer
      ? organizerFollowerCounts[sessionUser.id] ?? 0
      : 0;
  const userStats = [
    { label: strings.userStatsPosts, value: String(userPosts.length) },
    { label: strings.userStatsFollowers, value: String(sessionOrganizerFollowers) },
    { label: strings.userStatsFollowing, value: "0" },
  ];
  const userTabs = [
    { id: "about" as const, label: strings.userTabAbout },
    { id: "posts" as const, label: strings.userTabPosts },
    { id: "photos" as const, label: strings.userTabPhotos },
    { id: "videos" as const, label: strings.userTabVideos },
    { id: "tagged" as const, label: strings.userTabTagged },
  ];
  const photoPosts = userPosts.filter(
    (post) => post.media_type === "image" && post.media_url
  );
  const videoPosts = userPosts.filter(
    (post) => post.media_type === "video" && post.media_url
  );
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
  const getSupabaseErrorMessage = useCallback((error: unknown) => {
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return "Authentication failed. Please try again.";
  }, []);
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
    (intent: { route: Route; eventId?: string }) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(POST_AUTH_ROUTE_KEY, intent.route);
        if (intent.eventId) {
          window.localStorage.setItem(POST_AUTH_EVENT_KEY, intent.eventId);
        }
      }
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
      document.documentElement.lang = locale;
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
    }
  }, [guestMode, sessionUser?.id]);

  useEffect(() => {
    if (!guestMode) return;
    const allowedRoutes: Route[] = [
      "login",
      "register",
      "forgot",
      "search",
      "events",
      "event",
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
    if (!eventImagePreview?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(eventImagePreview);
    };
  }, [eventImagePreview]);

  useEffect(() => {
    if (!postPreviewUrl?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(postPreviewUrl);
    };
  }, [postPreviewUrl]);

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
    if (!cropImageSize) return;
    setCropOffset((prev) => clampCropOffset(prev.x, prev.y, cropScale));
  }, [clampCropOffset, cropImageSize, cropScale]);

  useEffect(() => {
    if (!profilePhoto || !cropImageSize) return;
    void updateCropPreview();
  }, [cropImageSize, cropOffset, cropScale, profilePhoto, updateCropPreview]);

  useEffect(() => {
    if (route !== "profile" && route !== "me") return;
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
    if (route !== "profile" && route !== "me") {
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
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name,birth_date,gender,country,city,language,avatar_url,cover_url,language_level,learning_languages,practice_languages,bio,interests,telegram,instagram,is_organizer"
        )
        .eq("id", user.id)
        .maybeSingle();
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
        setProfileLearningLanguages(learningLanguages as Locale[]);
        setProfilePracticeLanguages(practiceLanguages as Locale[]);
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
      const { data, error } = await supabase
        .from(POSTS_TABLE)
        .select("id, media_url, media_type, caption, created_at")
        .eq("user_id", sessionUser.id)
        .order("created_at", { ascending: false });
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
    const { data: rsvpRows, error } = await supabase
      .from("event_rsvps")
      .select("user_id,status")
      .eq("event_id", eventId);
    if (error) {
      return null;
    }
    const rsvps = (rsvpRows ?? []) as {
      user_id: string;
      status: "going" | "interested";
    }[];
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
        .select(
          "id,organizer_id,title,description,image_url,online_url,address,city,country,language,language_level,event_date,format,created_at"
        )
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
    if (route !== "event") {
      setEventRsvps([]);
      setEventRsvpProfiles({});
      setEventRsvpStatus(null);
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
        .select(
          "id,organizer_id,title,description,image_url,online_url,address,city,country,language,language_level,event_date,format,created_at"
        )
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


  function handleLocaleSelect(next: Locale) {
    if (next === locale) return;
    setLocale(next);
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

  function handleEventImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (eventImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(eventImagePreview);
    }
    setEventImageFile(file);
    setEventRemoveImage(false);
    if (!file) {
      setEventImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setEventImagePreview(previewUrl);
  }

  function handleRemoveEventImage() {
    if (eventImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(eventImagePreview);
    }
    setEventImageFile(null);
    setEventImagePreview(null);
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

  function handlePostFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (postPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(postPreviewUrl);
    }
    setPostFile(file);
    resetPostActionStatus();
    if (!file) {
      setPostPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPostPreviewUrl(previewUrl);
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
    if (profileIsOrganizer) return;
    if (guestMode) {
      redirectToLoginWithIntent({ route: "events" });
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
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = data.session?.user;
      if (!user) {
        redirectToLoginWithIntent({ route: "events" });
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ is_organizer: true, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      setProfileIsOrganizer(true);
    } catch (error) {
      if (typeof window !== "undefined") {
        window.alert(getSupabaseErrorMessage(error));
      }
    }
  }

  function resetEventForm() {
    if (eventImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(eventImagePreview);
    }
    setEventEditingId(null);
    setEventExistingImageUrl(null);
    setEventRemoveImage(false);
    setEventStatus({ type: "idle", message: "" });
    setEventTitle("");
    setEventDescription("");
    setEventImageFile(null);
    setEventImagePreview(null);
    if (eventImageInputRef.current) {
      eventImageInputRef.current.value = "";
    }
    setEventCity("");
    setEventCountry("");
    setEventAddress("");
    setEventOnlineUrl("");
    setEventLanguage("");
    setEventLevel("");
    setEventDate("");
    setEventFormat("");
  }

  function handleEditEvent(event: EventRecord) {
    if (eventImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(eventImagePreview);
    }
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
    setEventLevel(isLanguageLevel(event.language_level) ? event.language_level : "");
    setEventDate(event.event_date ?? "");
    setEventFormat(event.format ?? "");
    setEventExistingImageUrl(event.image_url ?? null);
    setEventRemoveImage(false);
    setEventImageFile(null);
    setEventImagePreview(event.image_url ?? null);
    if (eventImageInputRef.current) {
      eventImageInputRef.current.value = "";
    }
    setEventStatus({ type: "idle", message: "" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      if (event.image_url) {
        const path = getStoragePathFromPublicUrl(event.image_url, EVENTS_BUCKET);
        if (path) {
          await supabase.storage.from(EVENTS_BUCKET).remove([path]);
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
    if (!profileIsOrganizer) {
      setEventStatus({
        type: "error",
        message: strings.userActionOrganizer,
      });
      return;
    }
    if (!eventTitle.trim() || !eventDate) {
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
      const isEditing = Boolean(eventEditingId);
      const existingImageUrl = eventExistingImageUrl ?? null;
      let nextImageUrl = existingImageUrl;
      if (eventImageFile) {
        const extension =
          eventImageFile.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${extension}`;
        const filePath = `${user.id}/events/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from(EVENTS_BUCKET)
          .upload(filePath, eventImageFile, {
            upsert: true,
            contentType: eventImageFile.type || "image/jpeg",
          });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from(EVENTS_BUCKET)
          .getPublicUrl(filePath);
        nextImageUrl = publicData.publicUrl ?? null;
      } else if (eventRemoveImage) {
        nextImageUrl = null;
      }
      const basePayload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        image_url: nextImageUrl,
        city: eventCity.trim() || null,
        country: eventCountry.trim() || null,
        address: eventAddress.trim() || null,
        online_url: eventOnlineUrl.trim() || null,
        language: eventLanguage || null,
        language_level: eventLevel || null,
        event_date: eventDate || null,
        format: eventFormat || null,
      };
      let savedEvent: EventRecord | null = null;
      if (isEditing && eventEditingId) {
        const { data: updated, error } = await supabase
          .from("events")
          .update(basePayload)
          .eq("id", eventEditingId)
          .select(
            "id,organizer_id,title,description,image_url,online_url,address,city,country,language,language_level,event_date,format,created_at"
          )
          .single();
        if (error) throw error;
        savedEvent = updated as EventRecord;
        if (savedEvent) {
          setEventsList((prev) =>
            prev.map((item) => (item.id === savedEvent?.id ? savedEvent : item))
          );
        }
      } else {
        const payload = {
          ...basePayload,
          organizer_id: user.id,
          created_at: new Date().toISOString(),
        };
        const { data: inserted, error } = await supabase
          .from("events")
          .insert(payload)
          .select(
            "id,organizer_id,title,description,image_url,online_url,address,city,country,language,language_level,event_date,format,created_at"
          )
          .single();
        if (error) throw error;
        savedEvent = inserted as EventRecord;
        if (savedEvent) {
          setEventsList((prev) => [savedEvent as EventRecord, ...prev]);
        }
      }
      if (
        existingImageUrl &&
        (eventRemoveImage ||
          (eventImageFile && existingImageUrl !== nextImageUrl))
      ) {
        const path = getStoragePathFromPublicUrl(
          existingImageUrl,
          EVENTS_BUCKET
        );
        if (path) {
          await supabase.storage.from(EVENTS_BUCKET).remove([path]);
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
        const { error } = await supabase
          .from("event_rsvps")
          .upsert(
            {
              event_id: eventDetails.id,
              user_id: user.id,
              status: nextStatus,
            },
            { onConflict: "event_id,user_id" }
          );
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

  async function handleToggleOrganizerFollow(
    organizerId: string,
    sourceEventId?: string | null
  ) {
    if (!organizerId) return;
    if (guestMode || !sessionUser?.id) {
      redirectToLoginWithIntent({
        route: sourceEventId ? "event" : "search",
        eventId: sourceEventId ?? undefined,
      });
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
        .select(
          "id,organizer_id,title,description,image_url,online_url,address,city,country,language,language_level,event_date,format,created_at"
        )
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
      if (levelValue) {
        eventsQuery = eventsQuery.eq("language_level", levelValue);
      }
      if (formatValue) {
        eventsQuery = eventsQuery.eq("format", formatValue);
      }
      const { data: eventsRows, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;
      const events = (eventsRows ?? []) as EventRecord[];
      const organizerIds = Array.from(
        new Set(events.map((event) => event.organizer_id).filter(Boolean))
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
        events,
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
      }

      if (!complete) {
        navigate("profile");
        return;
      }

      if (preferredRoute === "event" && storedEventId) {
        goToEvent(storedEventId);
        return;
      }

      navigate(preferredRoute ?? "me");
    },
    [goToEvent, navigate]
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
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSessionUser(data.session?.user ?? null);
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
  }, [guestMode, handlePostAuthRedirect, strings.successLogin, upsertProfile]);

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
    setPostActionStatus({ type: "loading", message: strings.loadingLabel });
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
      if (!user) {
        setPostActionStatus({
          type: "error",
          message: strings.profileAuthRequired,
        });
        return;
      }
      let mediaUrl: string | null = null;
      let mediaType: PostMediaType = "text";
      if (postFile) {
        mediaType = postFile.type.startsWith("video/") ? "video" : "image";
        const extension =
          postFile.name.split(".").pop() ??
          (mediaType === "video" ? "mp4" : "jpg");
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
      const { data: inserted, error } = await supabase
        .from(POSTS_TABLE)
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: trimmedCaption || null,
        })
        .select("id, media_url, media_type, caption, created_at")
        .single();
      if (error) throw error;
      if (inserted) {
        setUserPosts((prev) => [inserted as UserPost, ...prev]);
      }
      setPostCaption("");
      setPostFile(null);
      if (postPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(postPreviewUrl);
      }
      setPostPreviewUrl(null);
      if (postFileInputRef.current) {
        postFileInputRef.current.value = "";
      }
      setPostActionStatus({ type: "idle", message: "" });
    } catch (error) {
      setPostActionStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
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
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
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
      const { error } = await supabase
        .from(POSTS_TABLE)
        .delete()
        .eq("id", post.id)
        .eq("user_id", user.id);
      if (error) throw error;
      setUserPosts((prev) => prev.filter((item) => item.id !== post.id));
      setPostActionStatus({ type: "idle", message: "" });
    } catch (error) {
      setPostActionStatus({
        type: "error",
        message: getSupabaseErrorMessage(error),
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
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
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
  const isEventsRoute = route === "events";
  const isEventRoute = route === "event";
  const isProfileRoute = route === "profile";
  const isUserRoute = route === "me";
  const isAuthRoute = route === "login" || route === "register" || route === "forgot";
  const showPassword = isAuthRoute && route !== "forgot";
  const showConfirm = isAuthRoute && route === "register";
  const showBackButton = !isAuthRoute;
  const showSearchButton = !isAuthRoute;
  const showEventsButton = !isAuthRoute;
  const showUserQuickActions = isUserRoute && !guestMode;
  const primaryLabel =
    route === "login"
      ? strings.loginButton
      : route === "register"
        ? strings.registerButton
        : strings.resetButton;

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
                {showEventsButton ? (
                  <button
                    className={`btn${isEventsRoute ? " btnActive" : ""}`}
                    type="button"
                    onClick={() => navigate("events")}
                  >
                    {strings.eventsButton}
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
                    <button
                      className="userAction"
                      type="button"
                      onClick={handleBecomeOrganizer}
                      disabled={profileIsOrganizer}
                    >
                      {strings.userActionOrganizer}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
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
              <div className="privacyPage" dir={legalDir}>
                {renderLegalContent(privacyContent.title, privacyContent.sections)}
              </div>
            ) : isImpressumRoute ? (
              <div className="privacyPage" dir={legalDir}>
                {renderLegalContent(impressumContent.title, impressumContent.sections)}
              </div>
            ) : isTermsRoute ? (
              <div className="privacyPage" dir={legalDir}>
                {renderLegalContent(termsContent.title, termsContent.sections)}
              </div>
            ) : isSearchRoute ? (
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
                        {LANGUAGE_LIST.map((lang) => {
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
                        {LANGUAGE_LEVELS.map((level) => (
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
                            const eventMeta = [
                              event.event_date
                                ? formatDate(event.event_date, locale)
                                : "",
                              organizerName,
                              event.city || organizerCity,
                              eventLanguage,
                              event.language_level ?? "",
                              event.format === "online"
                                ? strings.eventFormatOnline
                                : event.format === "offline"
                                  ? strings.eventFormatOffline
                                  : "",
                            ].filter(Boolean);
                            return (
                              <button
                                key={event.id}
                                className="searchEventCard"
                                type="button"
                                onClick={() => goToEvent(event.id)}
                              >
                                <div className="searchEventMedia">
                                  {event.image_url ? (
                                    <img
                                      src={event.image_url}
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
                              profile.id !== sessionUser?.id;
                            const isFollowing =
                              organizerFollowMap[profile.id] === true;
                            const isFollowLoading =
                              organizerFollowLoading[profile.id] === true;
                            const followersCount =
                              organizerFollowerCounts[profile.id] ?? 0;
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
                                      onClick={() =>
                                        handleToggleOrganizerFollow(profile.id)
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
            ) : isEventsRoute ? (
              <div className="eventsPage">
                <div className="eventsHeader">
                  <div className="eventsTitle">{strings.eventsTitle}</div>
                  <div className="eventsSubtitle">{strings.eventsSubtitle}</div>
                </div>
                {!profileIsOrganizer ? (
                  <div className="eventsHint">
                    <div className="eventsHintText">
                      {strings.userActionOrganizer}
                    </div>
                    <button className="btn" type="button" onClick={handleBecomeOrganizer}>
                      {strings.userActionOrganizer}
                    </button>
                  </div>
                ) : null}
                <div className="eventsCard">
                  <div className="eventsCardTitle">
                    {eventEditingId ? strings.eventEdit : strings.eventCreateTitle}
                  </div>
                  <div className="eventsForm">
                    <div className="field">
                      <label className="label" htmlFor="eventTitle">
                        {strings.eventNameLabel}
                      </label>
                      <input
                        className="input"
                        id="eventTitle"
                        type="text"
                        value={eventTitle}
                        onChange={(event) => setEventTitle(event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="eventDescription">
                        {strings.eventDescriptionLabel}
                      </label>
                      <textarea
                        className="input eventsTextarea"
                        id="eventDescription"
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
                        accept="image/*"
                        onChange={handleEventImageChange}
                      />
                      <span className="fieldHint">{strings.eventImageHint}</span>
                      {eventImagePreview ? (
                        <div className="eventImageWrap">
                          <img
                            className="eventImagePreview"
                            src={eventImagePreview}
                            alt={strings.eventImageLabel}
                          />
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
                        <label className="label" htmlFor="eventDate">
                          {strings.searchDateLabel}
                        </label>
                        <input
                          className="input"
                          id="eventDate"
                          type="date"
                          value={eventDate}
                          onChange={(event) => setEventDate(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="eventFormat">
                          {strings.eventFormatLabel}
                        </label>
                        <select
                          className="input"
                          id="eventFormat"
                          value={eventFormat}
                          onChange={(event) =>
                            setEventFormat(event.target.value as "" | EventFormat)
                          }
                        >
                          <option value="">{strings.eventFormatLabel}</option>
                          <option value="online">
                            {strings.eventFormatOnline}
                          </option>
                          <option value="offline">
                            {strings.eventFormatOffline}
                          </option>
                        </select>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="eventCity">
                          {strings.profileCityLabel}
                        </label>
                        <input
                          className="input"
                          id="eventCity"
                          type="text"
                          value={eventCity}
                          onChange={(event) => setEventCity(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="eventAddress">
                          {strings.eventAddressLabel}
                        </label>
                        <input
                          className="input"
                          id="eventAddress"
                          type="text"
                          value={eventAddress}
                          onChange={(event) => setEventAddress(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="eventCountry">
                          {strings.profileCountryLabel}
                        </label>
                        <input
                          className="input"
                          id="eventCountry"
                          type="text"
                          value={eventCountry}
                          onChange={(event) => setEventCountry(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="eventLanguage">
                          {strings.profileLanguageLabel}
                        </label>
                        <select
                          className="input"
                          id="eventLanguage"
                          value={eventLanguage}
                          onChange={(event) =>
                            setEventLanguage(event.target.value as Locale | "")
                          }
                        >
                          <option value="">
                            {strings.profileLanguagePlaceholder}
                          </option>
                          {LANGUAGE_LIST.map((lang) => {
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
                        <label className="label" htmlFor="eventLevel">
                          {strings.profileLevelLabel}
                        </label>
                        <select
                          className="input"
                          id="eventLevel"
                          value={eventLevel}
                          onChange={(event) =>
                            setEventLevel(event.target.value as LanguageLevel)
                          }
                        >
                          <option value="">
                            {strings.profileLevelLabel}
                          </option>
                          {LANGUAGE_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="eventOnlineUrl">
                          {strings.eventOnlineLabel}
                        </label>
                        <input
                          className="input"
                          id="eventOnlineUrl"
                          type="url"
                          value={eventOnlineUrl}
                          onChange={(event) => setEventOnlineUrl(event.target.value)}
                        />
                      </div>
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
                        disabled={eventStatus.type === "loading" || !profileIsOrganizer}
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
                <div className="eventsList">
                  <div className="eventsListTitle">{strings.eventListTitle}</div>
                  {eventsList.length === 0 ? (
                    <div className="searchEmpty">{strings.eventEmpty}</div>
                  ) : (
                    <div className="eventsGridList">
                      {eventsList.map((event) => {
                        const meta = [
                          event.event_date
                            ? formatDate(event.event_date, locale)
                            : "",
                          event.city,
                          event.language && isSupportedLocale(event.language)
                            ? languageLabels[event.language] ?? event.language
                            : event.language ?? "",
                          event.language_level ?? "",
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
                        return (
                          <div
                            key={event.id}
                            className={`eventCard${
                              eventEditingId === event.id
                                ? " eventCard--editing"
                                : ""
                            }`}
                          >
                            <div className="eventCardMedia">
                              {event.image_url ? (
                                <img
                                  src={event.image_url}
                                  alt={event.title}
                                />
                              ) : (
                                <div className="eventCardPlaceholder" />
                              )}
                            </div>
                            <div className="eventCardBody">
                              <div className="eventCardTitle">{event.title}</div>
                              {meta.length ? (
                                <div className="eventCardMeta">
                                  {meta.join(" • ")}
                                </div>
                              ) : null}
                              {event.description ? (
                                <div className="eventCardDesc">
                                  {event.description}
                                </div>
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
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : isEventRoute ? (
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
                      {eventDetails.image_url ? (
                        <img
                          src={eventDetails.image_url}
                          alt={eventDetails.title}
                        />
                      ) : (
                        <div className="searchEventPlaceholder" />
                      )}
                    </div>
                    <div className="eventDetailBody">
                      <div className="eventDetailHeadline">
                        {eventDetails.title}
                      </div>
                      <div className="eventDetailMeta">
                        {[
                          eventDetails.event_date
                            ? formatDate(eventDetails.event_date, locale)
                            : "",
                          eventDetails.city,
                          eventDetails.language &&
                          isSupportedLocale(eventDetails.language)
                            ? languageLabels[eventDetails.language] ??
                              eventDetails.language
                            : eventDetails.language ?? "",
                          eventDetails.language_level ?? "",
                          eventDetails.format === "online"
                            ? strings.eventFormatOnline
                            : eventDetails.format === "offline"
                              ? strings.eventFormatOffline
                              : "",
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
                          <span className="eventDetailInfoValue">
                            {eventOrganizer?.full_name ??
                              strings.profileHeaderNameFallback}
                          </span>
                        </div>
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
                        eventOrganizer.id !== sessionUser?.id ? (
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
                                eventDetails?.id
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
                          </div>
                        </div>
                        {sortedEventRsvps.length ? (
                          <div className="eventParticipantsGrid">
                            {sortedEventRsvps.map((rsvp) => {
                              const profile = eventRsvpProfiles[rsvp.user_id];
                              const name =
                                profile?.full_name ??
                                strings.profileHeaderNameFallback;
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
                                  </div>
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
            ) : isUserRoute ? (
              <div className="userPage">
                <div className="userHero">
                  <div
                    className={`userCover${
                      profileCoverDisplay ? " userCover--image" : ""
                    }`}
                    style={profileCoverStyle}
                  />
                  <button
                    className="userAvatarWrap"
                    type="button"
                    onClick={() => navigate("me")}
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
                        className={`userTab${
                          userTab === tab.id ? " userTab--active" : ""
                        }`}
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
                      {profileBio.trim()
                        ? profileBio
                        : strings.userBioPlaceholder}
                    </div>
                    <div className="userInfoGrid">
                      <div className="userInfoItem">
                        <span className="userInfoLabel">
                          {strings.profileBirthLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileBirthDate || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem">
                        <span className="userInfoLabel">
                          {strings.profileGenderLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileGenderLabel || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem">
                        <span className="userInfoLabel">
                          {strings.profileCountryLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileCountry || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem">
                        <span className="userInfoLabel">
                          {strings.profileCityLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileCity || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem userInfoItem--full">
                        <span className="userInfoLabel">
                          {strings.profileLanguageLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileLanguageLabel || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem">
                        <span className="userInfoLabel">
                          {strings.profileLevelLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileLevel || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem userInfoItem--full">
                        <span className="userInfoLabel">
                          {strings.profileLearningLabel}
                        </span>
                        <span className="userInfoValue">
                          {profileLearningLabels || emptyProfileValue}
                        </span>
                      </div>
                      <div className="userInfoItem userInfoItem--full">
                        <span className="userInfoLabel">
                          {strings.profilePracticeLabel}
                        </span>
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
                        <span className="userInfoLabel">
                          {strings.profileTelegramLabel}
                        </span>
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
                      <div className="userPostEmpty">
                        {strings.userPostEmpty}
                      </div>
                    ) : (
                      <div className="userPostList">
                        {userPosts.map((post) => (
                          <div key={post.id} className="userPostCard">
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
                              <video
                                className="userPostMedia"
                                src={post.media_url}
                                controls
                              />
                            ) : null}
                            {post.caption ? (
                              <div className="userPostCaption">
                                {post.caption}
                              </div>
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
                            <video src={post.media_url} controls />
                          </div>
                        ) : null
                      )}
                    </div>
                  )
                ) : (
                  <div className="userPostEmpty">{strings.userPostEmpty}</div>
                )}
              </div>
            ) : isProfileRoute ? (
              <div className="profilePage">
                <div className="profileHeader">
                  <div className="profileTitle">{strings.profileTitle}</div>
                  <div className="profileSubtitle">{strings.profileSubtitle}</div>
                </div>
                <div className="profileCard">
                  <div className="formRow">
                    <div className="field">
                      <label className="label" htmlFor="profileName">
                        {strings.profileNameLabel}
                      </label>
                      <input
                        className="input"
                        id="profileName"
                        type="text"
                        autoComplete="name"
                        value={profileName}
                        onChange={(event) => updateProfileName(event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="profileBirth">
                        {strings.profileBirthLabel}
                      </label>
                      <input
                        className="input"
                        id="profileBirth"
                        type="date"
                        value={profileBirthDate}
                        onChange={(event) =>
                          updateProfileBirthDate(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="field">
                    <span className="label">{strings.profileGenderLabel}</span>
                    <div className="genderRow">
                      <label
                        className={`genderOption${
                          profileGender === "female" ? " genderOption--active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={profileGender === "female"}
                          onChange={() => updateProfileGender("female")}
                        />
                        <span>{strings.profileGenderFemale}</span>
                      </label>
                      <label
                        className={`genderOption${
                          profileGender === "male" ? " genderOption--active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={profileGender === "male"}
                          onChange={() => updateProfileGender("male")}
                        />
                        <span>{strings.profileGenderMale}</span>
                      </label>
                      <label
                        className={`genderOption${
                          profileGender === "other" ? " genderOption--active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="other"
                          checked={profileGender === "other"}
                          onChange={() => updateProfileGender("other")}
                        />
                        <span>{strings.profileGenderOther}</span>
                      </label>
                    </div>
                  </div>
                  <div className="formRow">
                    <div className="field">
                      <label className="label" htmlFor="profileCountry">
                        {strings.profileCountryLabel}
                      </label>
                      <input
                        className="input"
                        id="profileCountry"
                        type="text"
                        autoComplete="country-name"
                        value={profileCountry}
                        onChange={(event) =>
                          updateProfileCountry(event.target.value)
                        }
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="profileCity">
                        {strings.profileCityLabel}
                      </label>
                      <input
                        className="input"
                        id="profileCity"
                        type="text"
                        autoComplete="address-level2"
                        value={profileCity}
                        onChange={(event) =>
                          updateProfileCity(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="profileLanguage">
                      {strings.profileLanguageLabel}
                    </label>
                    <select
                      className="input"
                      id="profileLanguage"
                      value={profileLanguage}
                      onChange={(event) =>
                        updateProfileLanguage(event.target.value as Locale | "")
                      }
                    >
                      <option value="">
                        {strings.profileLanguagePlaceholder}
                      </option>
                      {LANGUAGE_LIST.map((lang) => {
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
                    <span className="label">{strings.profileLearningLabel}</span>
                    <div className="tagGrid">
                      {LEARN_PRACTICE_LANGS.map((lang) => {
                        const translatedLabel =
                          languageLabels[lang.locale] ?? lang.label;
                        const isActive = profileLearningLanguages.includes(lang.locale);
                        return (
                          <button
                            key={`learn-${lang.locale}`}
                            className={`tagButton${
                              isActive ? " tagButton--active" : ""
                            }`}
                            type="button"
                            onClick={() => toggleProfileLearningLanguage(lang.locale)}
                          >
                            {translatedLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="field">
                    <span className="label">{strings.profilePracticeLabel}</span>
                    <div className="tagGrid">
                      {LEARN_PRACTICE_LANGS.map((lang) => {
                        const translatedLabel =
                          languageLabels[lang.locale] ?? lang.label;
                        const isActive = profilePracticeLanguages.includes(lang.locale);
                        return (
                          <button
                            key={`practice-${lang.locale}`}
                            className={`tagButton${
                              isActive ? " tagButton--active" : ""
                            }`}
                            type="button"
                            onClick={() => toggleProfilePracticeLanguage(lang.locale)}
                          >
                            {translatedLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="field">
                    <span className="label">{strings.profileLevelLabel}</span>
                    <div className="levelGrid">
                      {LANGUAGE_LEVELS.map((level) => (
                        <button
                          key={level}
                          className={`levelButton${
                            profileLevel === level ? " levelButton--active" : ""
                          }`}
                          type="button"
                          onClick={() => updateProfileLevel(level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="profileBio">
                      {strings.profileBioLabel}
                    </label>
                    <textarea
                      className="input input--textarea"
                      id="profileBio"
                      rows={3}
                      placeholder={strings.profileBioPlaceholder}
                      value={profileBio}
                      onChange={(event) => updateProfileBio(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="profileInterests">
                      {strings.profileInterestsLabel}
                    </label>
                    <div className="interestInputRow">
                      <input
                        className="input"
                        id="profileInterests"
                        type="text"
                        placeholder={strings.profileInterestsPlaceholder}
                        value={profileInterestInput}
                        onChange={(event) =>
                          updateProfileInterestInput(event.target.value)
                        }
                        onKeyDown={handleInterestKeyDown}
                      />
                      <button
                        className="interestAdd"
                        type="button"
                        onClick={() => addProfileInterest()}
                      >
                        {strings.profileInterestsAdd}
                      </button>
                    </div>
                    {profileInterests.length ? (
                      <div className="interestChips">
                        {profileInterests.map((interest) => (
                          <span key={interest} className="interestChip">
                            {resolveInterestLabel(interest, locale)}
                            <button
                              className="interestRemove"
                              type="button"
                              onClick={() => removeProfileInterest(interest)}
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="interestPresetRow">
                      <span className="interestPresetLabel">
                        {strings.profileInterestsSuggestions}
                      </span>
                      <div className="tagGrid">
                        {INTEREST_PRESETS.map((preset) => {
                          const label =
                            preset.labels[locale] ?? preset.labels.en;
                          const isActive = profileInterests.includes(preset.key);
                          return (
                            <button
                              key={preset.key}
                              className={`tagButton${
                                isActive ? " tagButton--active" : ""
                              }`}
                              type="button"
                              onClick={() =>
                                toggleProfileInterestPreset(preset.key)
                              }
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <span className="label">{strings.profileSocialLabel}</span>
                    <div className="formRow">
                      <div className="field">
                        <label className="label" htmlFor="profileTelegram">
                          {strings.profileTelegramLabel}
                        </label>
                        <input
                          className="input"
                          id="profileTelegram"
                          type="text"
                          placeholder="@username"
                          value={profileTelegram}
                          onChange={(event) =>
                            updateProfileTelegram(event.target.value)
                          }
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="profileInstagram">
                          {strings.profileInstagramLabel}
                        </label>
                        <input
                          className="input"
                          id="profileInstagram"
                          type="text"
                          placeholder="@username"
                          value={profileInstagram}
                          onChange={(event) =>
                            updateProfileInstagram(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="profileCover">
                      {strings.profileCoverLabel}
                    </label>
                    <div className="fileRow">
                      <input
                        className="fileInput"
                        id="profileCover"
                        type="file"
                        accept="image/*"
                        ref={profileCoverInputRef}
                        onChange={handleCoverPhotoChange}
                      />
                      <span className="fileName">
                        {profileCoverPhoto
                          ? profileCoverPhoto.name
                          : strings.profileCoverHint}
                      </span>
                      {profileCoverPhoto ? (
                        <button
                          className="photoAction"
                          type="button"
                          onClick={handleRemoveCoverPhoto}
                        >
                          {strings.profileCoverClear}
                        </button>
                      ) : profileCoverUrl ? (
                        <button
                          className="photoAction photoAction--danger"
                          type="button"
                          onClick={handleRemoveCoverPhoto}
                        >
                          {strings.profileCoverRemove}
                        </button>
                      ) : null}
                    </div>
                    {profileCoverPreview ? (
                      <img
                        className="coverPreview"
                        src={profileCoverPreview}
                        alt={strings.profileCoverLabel}
                      />
                    ) : null}
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="profilePhoto">
                      {strings.profilePhotoLabel}
                    </label>
                    <div className="fileRow">
                      <input
                        className="fileInput"
                        id="profilePhoto"
                        type="file"
                        accept="image/*"
                        ref={profilePhotoInputRef}
                        onChange={handleProfilePhotoChange}
                      />
                      <span className="fileName">
                        {profilePhoto ? profilePhoto.name : strings.profilePhotoHint}
                      </span>
                      {profilePhoto ? (
                        <button
                          className="photoAction"
                          type="button"
                          onClick={handleRemoveProfilePhoto}
                        >
                          {strings.profilePhotoClear}
                        </button>
                      ) : profileAvatarUrl ? (
                        <button
                          className="photoAction photoAction--danger"
                          type="button"
                          onClick={handleRemoveProfilePhoto}
                        >
                          {strings.profilePhotoRemove}
                        </button>
                      ) : null}
                    </div>
                    {profilePhoto ? (
                      <div className="avatarCropper">
                        <div
                          className="avatarCropBox"
                          onPointerDown={handleCropPointerDown}
                          onPointerMove={handleCropPointerMove}
                          onPointerUp={handleCropPointerEnd}
                          onPointerLeave={handleCropPointerEnd}
                        >
                          {cropImageUrl ? (
                            <img
                              className="avatarCropImage"
                              src={cropImageUrl}
                              alt={strings.profilePhotoLabel}
                              draggable={false}
                              style={{
                                width: cropImageSize
                                  ? `${cropImageSize.w}px`
                                  : "auto",
                                height: cropImageSize
                                  ? `${cropImageSize.h}px`
                                  : "auto",
                                transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="avatarCropControls">
                          <input
                            className="avatarCropSlider"
                            type="range"
                            min={cropMinScale}
                            max={cropMinScale * 3}
                            step={0.01}
                            value={cropScale}
                            onChange={handleCropScaleChange}
                          />
                        </div>
                        {profilePhotoPreview ? (
                          <img
                            className="avatarPreview"
                            src={profilePhotoPreview}
                            alt={strings.profilePhotoLabel}
                          />
                        ) : null}
                      </div>
                    ) : profilePhotoPreview ? (
                      <img
                        className="imagePreview"
                        src={profilePhotoPreview}
                        alt={strings.profilePhotoLabel}
                      />
                    ) : null}
                  </div>
                  {profileStatus.type !== "idle" ? (
                    <div
                      className={`authStatus authStatus--${profileStatus.type}`}
                      role="status"
                      aria-live="polite"
                    >
                      {profileStatus.message}
                    </div>
                  ) : null}
                  <div className="profileActions">
                    <button
                      className="profileSave"
                      type="button"
                      onClick={handleProfileSave}
                      disabled={profileStatus.type === "loading"}
                    >
                      {profileStatus.type === "loading"
                        ? strings.loadingLabel
                        : strings.profileSave}
                    </button>
                    <button
                      className="authLink"
                      type="button"
                      onClick={() => navigate("login")}
                    >
                      {strings.backToLogin}
                    </button>
                  </div>
                </div>
              </div>
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
                        const translatedLabel =
                          languageLabels[lang.locale] ?? lang.label;
                        const hasTranslation =
                          languageLabels[lang.locale] !== undefined;
                    const labelDir = hasTranslation
                      ? isRtlLocale(locale)
                        ? "rtl"
                        : "ltr"
                      : "dir" in lang && lang.dir
                        ? lang.dir
                        : "ltr";

                        return (
                          <button
                            key={lang.locale}
                            className="cardButton"
                            type="button"
                            onClick={() => handleLocaleSelect(lang.locale)}
                          >
                            <div className="cardTitle" dir={labelDir}>
                              {translatedLabel}
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
            </div>
            <div className="footerNote">© 2026 Language cafe from VELA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
