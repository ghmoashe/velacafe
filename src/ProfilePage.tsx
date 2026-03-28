import type {
  ChangeEventHandler,
  KeyboardEventHandler,
  PointerEventHandler,
  RefObject,
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

type Status = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

type LanguageOption = {
  label: string;
  locale: Locale;
  codes: readonly string[];
  dir?: string;
};

type InterestPreset = {
  key: string;
  labels: Record<string, string> & { en: string };
};

type ProfilePageProps = {
  strings: Record<string, string>;
  profileName: string;
  updateProfileName: (value: string) => void;
  profileBirthDate: string;
  updateProfileBirthDate: (value: string) => void;
  profileGender: "" | "female" | "male" | "other";
  updateProfileGender: (value: "" | "female" | "male" | "other") => void;
  profileCountry: string;
  updateProfileCountry: (value: string) => void;
  profileCity: string;
  updateProfileCity: (value: string) => void;
  profileLanguage: Locale | "";
  updateProfileLanguage: (value: Locale | "") => void;
  languageList: readonly LanguageOption[];
  languageLabels: Partial<Record<string, string>>;
  learnPracticeLanguages: readonly LanguageOption[];
  profileLearningLanguages: Locale[];
  toggleProfileLearningLanguage: (value: Locale) => void;
  profilePracticeLanguages: Locale[];
  toggleProfilePracticeLanguage: (value: Locale) => void;
  profileLevel: LanguageLevel;
  updateProfileLevel: (value: Exclude<LanguageLevel, "">) => void;
  languageLevels: readonly Exclude<LanguageLevel, "">[];
  profileBio: string;
  updateProfileBio: (value: string) => void;
  profileInterestInput: string;
  updateProfileInterestInput: (value: string) => void;
  handleInterestKeyDown: KeyboardEventHandler<HTMLInputElement>;
  addProfileInterest: () => void;
  profileInterests: string[];
  resolveInterestLabel: (value: string, locale: Locale) => string;
  removeProfileInterest: (value: string) => void;
  interestPresets: readonly InterestPreset[];
  locale: Locale;
  toggleProfileInterestPreset: (value: string) => void;
  profileTelegram: string;
  updateProfileTelegram: (value: string) => void;
  profileInstagram: string;
  updateProfileInstagram: (value: string) => void;
  profileCoverInputRef: RefObject<HTMLInputElement | null>;
  handleCoverPhotoChange: ChangeEventHandler<HTMLInputElement>;
  profileCoverPhoto: File | null;
  profileCoverUrl: string | null;
  handleRemoveCoverPhoto: () => void;
  profileCoverPreview: string | null;
  profilePhotoInputRef: RefObject<HTMLInputElement | null>;
  handleProfilePhotoChange: ChangeEventHandler<HTMLInputElement>;
  profilePhoto: File | null;
  profileAvatarUrl: string | null;
  handleRemoveProfilePhoto: () => void;
  handleCropPointerDown: PointerEventHandler<HTMLDivElement>;
  handleCropPointerMove: PointerEventHandler<HTMLDivElement>;
  handleCropPointerEnd: PointerEventHandler<HTMLDivElement>;
  cropImageUrl: string | null;
  cropImageSize: { w: number; h: number } | null;
  cropOffset: { x: number; y: number };
  cropScale: number;
  cropMinScale: number;
  handleCropScaleChange: ChangeEventHandler<HTMLInputElement>;
  profilePhotoPreview: string | null;
  profileStatus: Status;
  handleProfileSave: () => Promise<void> | void;
  navigateToLogin: () => void;
};

export default function ProfilePage(props: ProfilePageProps) {
  const {
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
    languageList,
    languageLabels,
    learnPracticeLanguages,
    profileLearningLanguages,
    toggleProfileLearningLanguage,
    profilePracticeLanguages,
    toggleProfilePracticeLanguage,
    profileLevel,
    updateProfileLevel,
    languageLevels,
    profileBio,
    updateProfileBio,
    profileInterestInput,
    updateProfileInterestInput,
    handleInterestKeyDown,
    addProfileInterest,
    profileInterests,
    resolveInterestLabel,
    removeProfileInterest,
    interestPresets,
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
    navigateToLogin,
  } = props;

  return (
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
              onChange={(event) => updateProfileBirthDate(event.target.value)}
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
              onChange={(event) => updateProfileCountry(event.target.value)}
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
              onChange={(event) => updateProfileCity(event.target.value)}
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
            <option value="">{strings.profileLanguagePlaceholder}</option>
            {languageList.map((lang) => {
              const translatedLabel = languageLabels[lang.locale] ?? lang.label;
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
            {learnPracticeLanguages.map((lang) => {
              const translatedLabel = languageLabels[lang.locale] ?? lang.label;
              const isActive = profileLearningLanguages.includes(lang.locale);
              return (
                <button
                  key={`learn-${lang.locale}`}
                  className={`tagButton${isActive ? " tagButton--active" : ""}`}
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
            {learnPracticeLanguages.map((lang) => {
              const translatedLabel = languageLabels[lang.locale] ?? lang.label;
              const isActive = profilePracticeLanguages.includes(lang.locale);
              return (
                <button
                  key={`practice-${lang.locale}`}
                  className={`tagButton${isActive ? " tagButton--active" : ""}`}
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
            {languageLevels.map((level) => (
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
              onChange={(event) => updateProfileInterestInput(event.target.value)}
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
                    x
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
              {interestPresets.map((preset) => {
                const label = preset.labels[locale] ?? preset.labels.en;
                const isActive = profileInterests.includes(preset.key);
                return (
                  <button
                    key={preset.key}
                    className={`tagButton${isActive ? " tagButton--active" : ""}`}
                    type="button"
                    onClick={() => toggleProfileInterestPreset(preset.key)}
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
                onChange={(event) => updateProfileTelegram(event.target.value)}
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
                onChange={(event) => updateProfileInstagram(event.target.value)}
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
              {profileCoverPhoto ? profileCoverPhoto.name : strings.profileCoverHint}
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
                      width: cropImageSize ? `${cropImageSize.w}px` : "auto",
                      height: cropImageSize ? `${cropImageSize.h}px` : "auto",
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
            onClick={navigateToLogin}
          >
            {strings.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
}
