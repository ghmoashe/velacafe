// src/klaro.config.ts
import type { KlaroConfig } from "klaro";

type KlaroTranslation = {
  consentModal: {
    title: string;
    description: string;
  };
  consentNotice: {
    description: string;
    learnMore: string;
  };
  acceptAll: string;
  decline: string;
  save: string;
  poweredBy: string;
  service: {
    purpose: string;
    purposes: string;
    required: {
      title: string;
      description: string;
    };
    disableAll: {
      title: string;
      description: string;
    };
  };
  purposeItem: {
    service: string;
    services: string;
  };
  purposes: {
    necessary: string;
    analytics: string;
    marketing: string;
    external: string;
  };
};

const TRANSLATIONS: Record<string, KlaroTranslation> = {
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
    poweredBy: "Bereitgestellt von Klaro!",
    service: {
      purpose: "Zweck",
      purposes: "Zwecke",
      required: {
        title: "Notwendig",
        description: "Dieser Dienst ist für den Betrieb der Website erforderlich.",
      },
      disableAll: {
        title: "Alle ein-/ausschalten",
        description: "Mit diesem Schalter können Sie alle Dienste gleichzeitig aktivieren oder deaktivieren.",
      },
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
  en: {
    consentModal: {
      title: "Privacy settings",
      description:
        "Here you can choose which services are allowed. Necessary cookies are always active.",
    },
    consentNotice: {
      description:
        "We use cookies and similar technologies. You can choose which services are enabled.",
      learnMore: "Settings",
    },
    acceptAll: "Accept all",
    decline: "Decline",
    save: "Save",
    poweredBy: "Powered by Klaro!",
    service: {
      purpose: "Purpose",
      purposes: "Purposes",
      required: {
        title: "Required",
        description: "This service is required for the website to function.",
      },
      disableAll: {
        title: "Enable/disable all",
        description: "Use this switch to enable or disable all services at once.",
      },
    },
    purposeItem: {
      service: "service",
      services: "services",
    },
    purposes: {
      necessary: "Necessary",
      analytics: "Analytics",
      marketing: "Marketing",
      external: "External media",
    },
  },
  ru: {
    consentModal: {
      title: "Настройки конфиденциальности",
      description:
        "Здесь вы можете выбрать, какие сервисы разрешены. Необходимые cookies всегда активны.",
    },
    consentNotice: {
      description:
        "Мы используем cookies и похожие технологии. Вы можете выбрать, какие сервисы включить.",
      learnMore: "Настройки",
    },
    acceptAll: "Принять все",
    decline: "Отклонить",
    save: "Сохранить",
    poweredBy: "Работает на Klaro!",
    service: {
      purpose: "Цель",
      purposes: "Цели",
      required: {
        title: "Обязательно",
        description: "Этот сервис необходим для работы сайта.",
      },
      disableAll: {
        title: "Включить/выключить все",
        description: "Используйте переключатель для включения или отключения всех сервисов сразу.",
      },
    },
    purposeItem: {
      service: "сервис",
      services: "сервиса",
    },
    purposes: {
      necessary: "Необходимые",
      analytics: "Аналитика",
      marketing: "Маркетинг",
      external: "Внешние медиа",
    },
  },
  uk: {
    consentModal: {
      title: "Налаштування конфіденційності",
      description:
        "Тут ви можете обрати, які сервіси дозволені. Необхідні cookies завжди активні.",
    },
    consentNotice: {
      description:
        "Ми використовуємо cookies та подібні технології. Ви можете обрати, які сервіси ввімкнути.",
      learnMore: "Налаштування",
    },
    acceptAll: "Прийняти все",
    decline: "Відхилити",
    save: "Зберегти",
    poweredBy: "Працює на Klaro!",
    service: {
      purpose: "Мета",
      purposes: "Цілі",
      required: {
        title: "Обов'язково",
        description: "Цей сервіс потрібен для роботи сайту.",
      },
      disableAll: {
        title: "Увімкнути/вимкнути все",
        description: "Використайте перемикач, щоб одночасно увімкнути або вимкнути всі сервіси.",
      },
    },
    purposeItem: {
      service: "сервіс",
      services: "сервіси",
    },
    purposes: {
      necessary: "Необхідні",
      analytics: "Аналітика",
      marketing: "Маркетинг",
      external: "Зовнішні медіа",
    },
  },
  fa: {
    consentModal: {
      title: "تنظیمات حریم خصوصی",
      description:
        "در اینجا می‌توانید انتخاب کنید کدام سرویس‌ها مجاز باشند. کوکی‌های ضروری همیشه فعال هستند.",
    },
    consentNotice: {
      description:
        "ما از کوکی‌ها و فناوری‌های مشابه استفاده می‌کنیم. شما می‌توانید مشخص کنید کدام سرویس‌ها فعال باشند.",
      learnMore: "تنظیمات",
    },
    acceptAll: "پذیرش همه",
    decline: "رد کردن",
    save: "ذخیره",
    poweredBy: "قدرت‌گرفته از Klaro!",
    service: {
      purpose: "هدف",
      purposes: "اهداف",
      required: {
        title: "ضروری",
        description: "این سرویس برای عملکرد صحیح سایت لازم است.",
      },
      disableAll: {
        title: "فعال/غیرفعال کردن همه",
        description: "با این گزینه می‌توانید همه سرویس‌ها را یکجا فعال یا غیرفعال کنید.",
      },
    },
    purposeItem: {
      service: "سرویس",
      services: "سرویس‌ها",
    },
    purposes: {
      necessary: "ضروری",
      analytics: "تحلیل",
      marketing: "بازاریابی",
      external: "رسانه‌های خارجی",
    },
  },
  ar: {
    consentModal: {
      title: "إعدادات الخصوصية",
      description:
        "هنا يمكنك اختيار الخدمات المسموح بها. ملفات تعريف الارتباط الضرورية مفعّلة دائمًا.",
    },
    consentNotice: {
      description:
        "نستخدم ملفات تعريف الارتباط وتقنيات مشابهة. يمكنك تحديد الخدمات التي تريد تفعيلها.",
      learnMore: "الإعدادات",
    },
    acceptAll: "قبول الكل",
    decline: "رفض",
    save: "حفظ",
    poweredBy: "مشغل بواسطة Klaro!",
    service: {
      purpose: "الغرض",
      purposes: "الأغراض",
      required: {
        title: "ضروري",
        description: "هذه الخدمة ضرورية لعمل الموقع.",
      },
      disableAll: {
        title: "تفعيل/تعطيل الكل",
        description: "استخدم هذا المفتاح لتفعيل أو تعطيل جميع الخدمات مرة واحدة.",
      },
    },
    purposeItem: {
      service: "خدمة",
      services: "الخدمات",
    },
    purposes: {
      necessary: "ضروري",
      analytics: "التحليلات",
      marketing: "التسويق",
      external: "وسائط خارجية",
    },
  },
  sq: {
    consentModal: {
      title: "Cilësimet e privatësisë",
      description:
        "Këtu mund të zgjedhni cilat shërbime lejohen. Cookies e nevojshme janë gjithmonë aktive.",
    },
    consentNotice: {
      description:
        "Ne përdorim cookies dhe teknologji të ngjashme. Mund të zgjidhni cilat shërbime të aktivizohen.",
      learnMore: "Cilësimet",
    },
    acceptAll: "Prano të gjitha",
    decline: "Refuzo",
    save: "Ruaj",
    poweredBy: "Mundësuar nga Klaro!",
    service: {
      purpose: "Qëllimi",
      purposes: "Qëllimet",
      required: {
        title: "I nevojshëm",
        description: "Ky shërbim është i nevojshëm për funksionimin e faqes.",
      },
      disableAll: {
        title: "Aktivizo/çaktivizo të gjitha",
        description: "Përdor këtë çelës për të aktivizuar ose çaktivizuar të gjitha shërbimet njëherësh.",
      },
    },
    purposeItem: {
      service: "shërbim",
      services: "shërbime",
    },
    purposes: {
      necessary: "Të nevojshme",
      analytics: "Analitika",
      marketing: "Marketing",
      external: "Media të jashtme",
    },
  },
  tr: {
    consentModal: {
      title: "Gizlilik ayarları",
      description:
        "Buradan hangi hizmetlere izin vereceğinizi seçebilirsiniz. Zorunlu çerezler her zaman aktiftir.",
    },
    consentNotice: {
      description:
        "Çerezler ve benzer teknolojiler kullanıyoruz. Hangi hizmetlerin etkin olacağını seçebilirsiniz.",
      learnMore: "Ayarlar",
    },
    acceptAll: "Tümünü kabul et",
    decline: "Reddet",
    save: "Kaydet",
    poweredBy: "Klaro tarafından sağlanır!",
    service: {
      purpose: "Amaç",
      purposes: "Amaçlar",
      required: {
        title: "Zorunlu",
        description: "Bu hizmet, sitenin çalışması için gereklidir.",
      },
      disableAll: {
        title: "Tümünü aç/kapat",
        description: "Bu anahtarla tüm hizmetleri aynı anda açabilir veya kapatabilirsiniz.",
      },
    },
    purposeItem: {
      service: "hizmet",
      services: "hizmetler",
    },
    purposes: {
      necessary: "Zorunlu",
      analytics: "Analitik",
      marketing: "Pazarlama",
      external: "Harici medya",
    },
  },
  fr: {
    consentModal: {
      title: "Paramètres de confidentialité",
      description:
        "Ici, vous pouvez choisir quels services sont autorisés. Les cookies nécessaires sont toujours actifs.",
    },
    consentNotice: {
      description:
        "Nous utilisons des cookies et des technologies similaires. Vous pouvez choisir les services activés.",
      learnMore: "Paramètres",
    },
    acceptAll: "Tout accepter",
    decline: "Refuser",
    save: "Enregistrer",
    poweredBy: "Propulsé par Klaro !",
    service: {
      purpose: "Finalité",
      purposes: "Finalités",
      required: {
        title: "Nécessaire",
        description: "Ce service est nécessaire au fonctionnement du site.",
      },
      disableAll: {
        title: "Tout activer/désactiver",
        description: "Utilisez ce bouton pour activer ou désactiver tous les services à la fois.",
      },
    },
    purposeItem: {
      service: "service",
      services: "services",
    },
    purposes: {
      necessary: "Nécessaire",
      analytics: "Statistiques",
      marketing: "Marketing",
      external: "Médias externes",
    },
  },
  es: {
    consentModal: {
      title: "Configuración de privacidad",
      description:
        "Aquí puedes elegir qué servicios están permitidos. Las cookies necesarias siempre están activas.",
    },
    consentNotice: {
      description:
        "Usamos cookies y tecnologías similares. Puedes elegir qué servicios activar.",
      learnMore: "Configuración",
    },
    acceptAll: "Aceptar todo",
    decline: "Rechazar",
    save: "Guardar",
    poweredBy: "Desarrollado con Klaro!",
    service: {
      purpose: "Propósito",
      purposes: "Propósitos",
      required: {
        title: "Necesario",
        description: "Este servicio es necesario para el funcionamiento del sitio.",
      },
      disableAll: {
        title: "Activar/desactivar todo",
        description: "Usa este interruptor para activar o desactivar todos los servicios a la vez.",
      },
    },
    purposeItem: {
      service: "servicio",
      services: "servicios",
    },
    purposes: {
      necessary: "Necesario",
      analytics: "Analítica",
      marketing: "Marketing",
      external: "Medios externos",
    },
  },
  it: {
    consentModal: {
      title: "Impostazioni privacy",
      description:
        "Qui puoi scegliere quali servizi consentire. I cookie necessari sono sempre attivi.",
    },
    consentNotice: {
      description:
        "Usiamo cookie e tecnologie simili. Puoi scegliere quali servizi attivare.",
      learnMore: "Impostazioni",
    },
    acceptAll: "Accetta tutto",
    decline: "Rifiuta",
    save: "Salva",
    poweredBy: "Powered by Klaro!",
    service: {
      purpose: "Finalità",
      purposes: "Finalità",
      required: {
        title: "Necessario",
        description: "Questo servizio è necessario per il funzionamento del sito.",
      },
      disableAll: {
        title: "Attiva/disattiva tutto",
        description: "Usa questo interruttore per attivare o disattivare tutti i servizi insieme.",
      },
    },
    purposeItem: {
      service: "servizio",
      services: "servizi",
    },
    purposes: {
      necessary: "Necessario",
      analytics: "Analitica",
      marketing: "Marketing",
      external: "Media esterni",
    },
  },
  pl: {
    consentModal: {
      title: "Ustawienia prywatności",
      description:
        "Tutaj możesz wybrać, które usługi są dozwolone. Niezbędne pliki cookie są zawsze aktywne.",
    },
    consentNotice: {
      description:
        "Używamy plików cookie i podobnych technologii. Możesz wybrać, które usługi włączyć.",
      learnMore: "Ustawienia",
    },
    acceptAll: "Akceptuj wszystko",
    decline: "Odrzuć",
    save: "Zapisz",
    poweredBy: "Obsługiwane przez Klaro!",
    service: {
      purpose: "Cel",
      purposes: "Cele",
      required: {
        title: "Niezbędne",
        description: "Ta usługa jest wymagana do działania strony.",
      },
      disableAll: {
        title: "Włącz/wyłącz wszystko",
        description: "Użyj tego przełącznika, aby włączyć lub wyłączyć wszystkie usługi jednocześnie.",
      },
    },
    purposeItem: {
      service: "usługa",
      services: "usługi",
    },
    purposes: {
      necessary: "Niezbędne",
      analytics: "Analityka",
      marketing: "Marketing",
      external: "Media zewnętrzne",
    },
  },
  vi: {
    consentModal: {
      title: "Cài đặt quyền riêng tư",
      description:
        "Tại đây bạn có thể chọn những dịch vụ được phép. Cookie cần thiết luôn được bật.",
    },
    consentNotice: {
      description:
        "Chúng tôi sử dụng cookie và các công nghệ tương tự. Bạn có thể chọn dịch vụ nào được bật.",
      learnMore: "Cài đặt",
    },
    acceptAll: "Chấp nhận tất cả",
    decline: "Từ chối",
    save: "Lưu",
    poweredBy: "Được cung cấp bởi Klaro!",
    service: {
      purpose: "Mục đích",
      purposes: "Các mục đích",
      required: {
        title: "Bắt buộc",
        description: "Dịch vụ này cần thiết để website hoạt động.",
      },
      disableAll: {
        title: "Bật/tắt tất cả",
        description: "Dùng công tắc này để bật hoặc tắt tất cả dịch vụ cùng lúc.",
      },
    },
    purposeItem: {
      service: "dịch vụ",
      services: "dịch vụ",
    },
    purposes: {
      necessary: "Cần thiết",
      analytics: "Phân tích",
      marketing: "Tiếp thị",
      external: "Nội dung bên ngoài",
    },
  },
};

const klaroConfig: KlaroConfig = {
  version: 1,
  elementID: "klaro",
  storageMethod: "localStorage",
  storageName: "klaro-consent",
  cookieName: "klaro-consent",
  mustConsent: true,
  acceptAll: true,
  hideDeclineAll: false,
  lang: "de",
  translations: TRANSLATIONS,
  purposes: ["necessary", "analytics", "marketing", "external"],
  services: [
    {
      name: "necessary",
      title: "Necessary",
      purposes: ["necessary"],
      required: true,
    },
    {
      name: "ga",
      title: "Google Analytics",
      purposes: ["analytics"],
      required: false,
      optOut: false,
    },
    {
      name: "metaPixel",
      title: "Meta Pixel",
      purposes: ["marketing"],
      required: false,
    },
    {
      name: "youtube",
      title: "YouTube",
      purposes: ["external"],
      required: false,
    },
  ],
};

export default klaroConfig;
