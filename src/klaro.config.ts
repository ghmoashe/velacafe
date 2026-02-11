// src/klaro.config.ts
import type { KlaroConfig } from "klaro";

const klaroConfig: KlaroConfig = {
  version: 1,
  elementID: "klaro",
  storageMethod: "localStorage",
  storageName: "klaro-consent",
  cookieName: "klaro-consent",

  // Показывать баннер автоматически
  mustConsent: true,
  acceptAll: true,
  hideDeclineAll: false,

  // Лучше включить "Отклонить" так же заметно, как "Принять"
  // Klaro по умолчанию делает обе кнопки, главное не прятать decline.

  lang: "de",
  translations: {
    de: {
      consentModal: {
        title: "Datenschutzeinstellungen",
        description:
          "Hier können Sie auswählen, welche Dienste wir verwenden dürfen. Notwendige Cookies sind immer aktiv.",
      },
      consentNotice: {
        description:
          "Wir verwenden Cookies und ähnliche Technologien. Sie können auswählen, welche Dienste erlaubt sind.",
        learnMore: "Einstellungen",
      },
      acceptAll: "Alle akzeptieren",
      decline: "Ablehnen",
      save: "Speichern",
      service: {
        purpose: "Zweck",
        purposes: "Zwecke",
      },
      purposeItem: {
        service: "Dienst",
        services: "Dienste",
      },
      purposes: {
        necessary: "Notwendig",
        analytics: "Statistik",
        marketing: "Marketing",
        external: "Externe Medien",
      },
    },

    ru: {
      consentModal: {
        title: "Настройки конфиденциальности",
        description:
          "Выберите, какие сервисы разрешены. Необходимые cookies всегда активны.",
      },
      consentNotice: {
        description:
          "Мы используем cookies и похожие технологии. Вы можете выбрать, какие сервисы разрешить.",
        learnMore: "Настройки",
      },
      acceptAll: "Принять все",
      decline: "Отклонить",
      save: "Сохранить",
      purposeItem: {
        service: "сервис",
        services: "сервисов",
      },
      purposes: {
        necessary: "Необходимые",
        analytics: "Статистика",
        marketing: "Маркетинг",
        external: "Внешние медиа",
      },
    },
  },

  // Группы (purposes)
  purposes: ["necessary", "analytics", "marketing", "external"],

  services: [
    // Пример "технически необходимого" (без скрипта, просто для структуры)
    {
      name: "necessary",
      title: "Notwendige Cookies",
      purposes: ["necessary"],
      required: true,
      // Это сервис-заглушка: скрипт не нужен
    },

    // Пример: Google Analytics (GA4) — будет заблокирован до согласия
    {
      name: "ga",
      title: "Google Analytics",
      purposes: ["analytics"],
      required: false,
      optOut: false,
      // Klaro будет искать <script type="text/plain" data-type="application/javascript" data-name="ga">...</script>
      // и активировать его только после согласия
    },

    // Пример: Meta Pixel
    {
      name: "metaPixel",
      title: "Meta Pixel",
      purposes: ["marketing"],
      required: false,
    },

    // Пример: YouTube embeds (если вставляешь iframe/скрипты)
    {
      name: "youtube",
      title: "YouTube",
      purposes: ["external"],
      required: false,
    },
  ],
};

export default klaroConfig;
