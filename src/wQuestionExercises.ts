import { W_QUESTION_MEANING_TRANSLATIONS } from "./wQuestionMeaningTranslations";

export type WQuestionExercise = {
  id: string;
  answer: string;
  translation: string;
  questionTemplate: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  emoji: string;
  level: "A1" | "A2" | "B1" | "B2";
};

type WQuestionLocale =
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

type WQuestionSeed = readonly [
  answer: string,
  translationEn: string,
  translationRu: string,
  questionTemplate: string,
  emoji?: string,
];

type WQuestionSection = {
  id: string;
  level: "A1" | "A2" | "B1" | "B2";
  correctAnswer: string;
  options: readonly [string, string, string, string];
  explanationEn: string;
  explanationRu: string;
  explanationDe: string;
  emoji: string;
  items: readonly WQuestionSeed[];
};

const W_QUESTION_EXPLANATION_OVERRIDES: Partial<
  Record<WQuestionLocale, Record<string, string>>
> = {
  vi: {
    wer: "`Wer` hỏi về người hoặc chủ ngữ.",
    was: "`Was` hỏi về đồ vật, hành động hoặc nội dung.",
    wo: "`Wo` hỏi về địa điểm.",
    woher: "`Woher` hỏi về nguồn gốc hoặc nơi xuất phát.",
    wohin: "`Wohin` hỏi về hướng đi hoặc đích đến.",
    wann: "`Wann` hỏi về thời gian hoặc ngày tháng.",
    wie: "`Wie` hỏi về cách thức, trạng thái hoặc quá trình.",
    warum: "`Warum` hỏi về lý do.",
    "wie-oft": "`Wie oft` hỏi về tần suất.",
    "wie-lange": "`Wie lange` hỏi về khoảng thời gian kéo dài.",
    "wie-viel": "`Wie viel` hỏi về số lượng hoặc mức độ.",
    welche: "`Welche` yêu cầu chọn từ một nhóm đã biết.",
    wen: "`Wen` hỏi về người ở cách Akkusativ.",
    wem: "`Wem` hỏi về người ở cách Dativ hoặc người nhận.",
    wessen: "`Wessen` hỏi về sự sở hữu hoặc thuộc về ai.",
    womit: "`Womit` hỏi về phương tiện, công cụ hoặc dụng cụ.",
    worueber:
      "`Worüber` hỏi về chủ đề mà ai đó đang nói, nghĩ hoặc viết tới.",
    woran:
      "`Woran` hỏi ai đó đang làm về việc gì, nghĩ tới điều gì hoặc dựa vào đâu để nhận ra điều gì.",
    wofuer: "`Wofür` hỏi về mục đích, công dụng hoặc việc gì đó dùng để làm gì.",
  },
  uk: {
    wer: "`Wer` запитує про людину або підмет.",
    was: "`Was` запитує про предмет, дію або зміст.",
    wo: "`Wo` запитує про місце.",
    woher: "`Woher` запитує про походження або джерело.",
    wohin: "`Wohin` запитує про напрямок або пункт призначення.",
    wann: "`Wann` запитує про час або дату.",
    wie: "`Wie` запитує про спосіб, стан або перебіг дії.",
    warum: "`Warum` запитує про причину.",
    "wie-oft": "`Wie oft` запитує про частоту.",
    "wie-lange": "`Wie lange` запитує про тривалість.",
    "wie-viel": "`Wie viel` запитує про кількість або обсяг.",
    welche: "`Welche` просить вибрати з відомого набору.",
    wen: "`Wen` запитує про людину в Akkusativ.",
    wem: "`Wem` запитує про людину в Dativ або про отримувача.",
    wessen: "`Wessen` запитує про належність або володіння.",
    womit: "`Womit` запитує про засіб, інструмент або знаряддя.",
    worueber:
      "`Worüber` запитує про тему, про яку хтось говорить, думає або пише.",
    woran:
      "`Woran` запитує, над чим хтось працює, про що думає або за чим щось можна впізнати.",
    wofuer: "`Wofür` запитує про мету, призначення або те, для чого щось потрібно.",
  },
  fa: {
    wer: "`Wer` دربارهٔ شخص یا نهاد جمله می‌پرسد.",
    was: "`Was` دربارهٔ چیز، عمل یا محتوا می‌پرسد.",
    wo: "`Wo` دربارهٔ مکان می‌پرسد.",
    woher: "`Woher` دربارهٔ مبدأ یا منشأ می‌پرسد.",
    wohin: "`Wohin` دربارهٔ جهت یا مقصد می‌پرسد.",
    wann: "`Wann` دربارهٔ زمان یا تاریخ می‌پرسد.",
    wie: "`Wie` دربارهٔ شیوه، وضعیت یا روند می‌پرسد.",
    warum: "`Warum` دربارهٔ دلیل می‌پرسد.",
    "wie-oft": "`Wie oft` دربارهٔ تعداد دفعات می‌پرسد.",
    "wie-lange": "`Wie lange` دربارهٔ مدت زمان می‌پرسد.",
    "wie-viel": "`Wie viel` دربارهٔ مقدار یا کمیت می‌پرسد.",
    welche: "`Welche` درخواست انتخاب از یک مجموعهٔ مشخص را دارد.",
    wen: "`Wen` دربارهٔ شخص در حالت Akkusativ می‌پرسد.",
    wem: "`Wem` دربارهٔ شخص در حالت Dativ یا گیرنده می‌پرسد.",
    wessen: "`Wessen` دربارهٔ مالکیت یا تعلق می‌پرسد.",
    womit: "`Womit` دربارهٔ وسیله، ابزار یا ابزار کار می‌پرسد.",
    worueber:
      "`Worüber` دربارهٔ موضوعی می‌پرسد که کسی درباره‌اش صحبت می‌کند، فکر می‌کند یا می‌نویسد.",
    woran:
      "`Woran` می‌پرسد کسی روی چه چیزی کار می‌کند، به چه چیزی فکر می‌کند یا از چه چیزی می‌شود چیزی را شناخت.",
    wofuer: "`Wofür` دربارهٔ هدف، کاربرد یا اینکه چیزی برای چه منظوری است می‌پرسد.",
  },
  ar: {
    wer: "`Wer` يسأل عن الشخص أو الفاعل.",
    was: "`Was` يسأل عن الشيء أو الفعل أو المحتوى.",
    wo: "`Wo` يسأل عن المكان.",
    woher: "`Woher` يسأل عن الأصل أو المصدر.",
    wohin: "`Wohin` يسأل عن الاتجاه أو الوجهة.",
    wann: "`Wann` يسأل عن الوقت أو التاريخ.",
    wie: "`Wie` يسأل عن الطريقة أو الحالة أو سير الأمر.",
    warum: "`Warum` يسأل عن السبب.",
    "wie-oft": "`Wie oft` يسأل عن عدد المرات أو التكرار.",
    "wie-lange": "`Wie lange` يسأل عن المدة.",
    "wie-viel": "`Wie viel` يسأل عن الكمية أو المقدار.",
    welche: "`Welche` يطلب الاختيار من مجموعة معروفة.",
    wen: "`Wen` يسأل عن شخص في حالة Akkusativ.",
    wem: "`Wem` يسأل عن شخص في حالة Dativ أو عن المتلقي.",
    wessen: "`Wessen` يسأل عن الملكية أو الانتماء.",
    womit: "`Womit` يسأل عن الوسيلة أو الأداة أو الآلة.",
    worueber:
      "`Worüber` يسأل عن الموضوع الذي يتحدث عنه شخص ما أو يفكر فيه أو يكتب عنه.",
    woran:
      "`Woran` يسأل عمّا يعمل عليه شخص ما أو يفكر فيه أو عمّا يمكن التعرّف على شيء بواسطته.",
    wofuer: "`Wofür` يسأل عن الغرض أو الاستخدام أو ما الذي خُصص له الشيء.",
  },
  sq: {
    wer: "`Wer` pyet për personin ose kryefjalën.",
    was: "`Was` pyet për një send, veprim ose përmbajtje.",
    wo: "`Wo` pyet për vendin.",
    woher: "`Woher` pyet për origjinën ose burimin.",
    wohin: "`Wohin` pyet për drejtimin ose destinacionin.",
    wann: "`Wann` pyet për kohën ose datën.",
    wie: "`Wie` pyet për mënyrën, gjendjen ose procesin.",
    warum: "`Warum` pyet për arsyen.",
    "wie-oft": "`Wie oft` pyet për shpeshtësinë.",
    "wie-lange": "`Wie lange` pyet për kohëzgjatjen.",
    "wie-viel": "`Wie viel` pyet për sasinë ose numrin.",
    welche: "`Welche` kërkon të zgjedhësh nga një grup i njohur.",
    wen: "`Wen` pyet për një person në rasën Akkusativ.",
    wem: "`Wem` pyet për një person në rasën Dativ ose marrësin.",
    wessen: "`Wessen` pyet për zotërimin ose përkatësinë.",
    womit: "`Womit` pyet për mjetin, veglën ose instrumentin.",
    worueber:
      "`Worüber` pyet për temën për të cilën dikush flet, mendon ose shkruan.",
    woran:
      "`Woran` pyet se për çfarë po punon dikush, për çfarë po mendon ose nga çfarë mund të njihet diçka.",
    wofuer: "`Wofür` pyet për qëllimin, përdorimin ose për çfarë shërben diçka.",
  },
  tr: {
    wer: "`Wer` kişi ya da özne hakkında soru sorar.",
    was: "`Was` nesne, eylem ya da içerik hakkında soru sorar.",
    wo: "`Wo` yer hakkında soru sorar.",
    woher: "`Woher` köken ya da çıkış noktası hakkında soru sorar.",
    wohin: "`Wohin` yön veya varış noktası hakkında soru sorar.",
    wann: "`Wann` zaman veya tarih hakkında soru sorar.",
    wie: "`Wie` biçim, durum ya da süreç hakkında soru sorar.",
    warum: "`Warum` neden hakkında soru sorar.",
    "wie-oft": "`Wie oft` sıklık hakkında soru sorar.",
    "wie-lange": "`Wie lange` süre hakkında soru sorar.",
    "wie-viel": "`Wie viel` miktar veya sayı hakkında soru sorar.",
    welche: "`Welche` bilinen bir gruptan seçim yapmayı ister.",
    wen: "`Wen` Akkusativ durumundaki kişi hakkında soru sorar.",
    wem: "`Wem` Dativ durumundaki kişi ya da alıcı hakkında soru sorar.",
    wessen: "`Wessen` sahiplik ya da ait olma hakkında soru sorar.",
    womit: "`Womit` araç, yöntem ya da alet hakkında soru sorar.",
    worueber:
      "`Worüber` birinin hakkında konuştuğu, düşündüğü ya da yazdığı konu hakkında soru sorar.",
    woran:
      "`Woran` birinin ne üzerinde çalıştığını, neyi düşündüğünü ya da bir şeyin neye bakılarak tanınabileceğini sorar.",
    wofuer: "`Wofür` amaç, kullanım ya da bir şeyin ne için olduğunu sorar.",
  },
  fr: {
    wer: "`Wer` demande quelle est la personne ou le sujet.",
    was: "`Was` demande une chose, une action ou un contenu.",
    wo: "`Wo` demande le lieu.",
    woher: "`Woher` demande l'origine ou la provenance.",
    wohin: "`Wohin` demande la direction ou la destination.",
    wann: "`Wann` demande le moment ou la date.",
    wie: "`Wie` demande la manière, l'état ou le déroulement.",
    warum: "`Warum` demande la raison.",
    "wie-oft": "`Wie oft` demande la fréquence.",
    "wie-lange": "`Wie lange` demande la durée.",
    "wie-viel": "`Wie viel` demande la quantité ou le montant.",
    welche: "`Welche` demande de choisir dans un ensemble connu.",
    wen: "`Wen` demande une personne à l'accusatif.",
    wem: "`Wem` demande une personne au datif ou le destinataire.",
    wessen: "`Wessen` demande la possession ou l'appartenance.",
    womit: "`Womit` demande le moyen, l'outil ou l'instrument.",
    worueber:
      "`Worüber` demande le sujet dont quelqu'un parle, qu'il pense ou sur lequel il écrit.",
    woran:
      "`Woran` demande à quoi quelqu'un travaille, pense, ou à quoi l'on peut reconnaître quelque chose.",
    wofuer: "`Wofür` demande le but, l'usage ou à quoi quelque chose sert.",
  },
  es: {
    wer: "`Wer` pregunta por la persona o el sujeto.",
    was: "`Was` pregunta por una cosa, una acción o un contenido.",
    wo: "`Wo` pregunta por el lugar.",
    woher: "`Woher` pregunta por el origen o la procedencia.",
    wohin: "`Wohin` pregunta por la dirección o el destino.",
    wann: "`Wann` pregunta por el momento o la fecha.",
    wie: "`Wie` pregunta por la manera, el estado o el proceso.",
    warum: "`Warum` pregunta por la razón.",
    "wie-oft": "`Wie oft` pregunta por la frecuencia.",
    "wie-lange": "`Wie lange` pregunta por la duración.",
    "wie-viel": "`Wie viel` pregunta por la cantidad o el volumen.",
    welche: "`Welche` pide elegir dentro de un conjunto conocido.",
    wen: "`Wen` pregunta por una persona en acusativo.",
    wem: "`Wem` pregunta por una persona en dativo o por el destinatario.",
    wessen: "`Wessen` pregunta por la posesión o la pertenencia.",
    womit: "`Womit` pregunta por el medio, la herramienta o el instrumento.",
    worueber:
      "`Worüber` pregunta por el tema del que alguien habla, piensa o escribe.",
    woran:
      "`Woran` pregunta en qué trabaja alguien, en qué piensa o por qué se puede reconocer algo.",
    wofuer: "`Wofür` pregunta por el propósito, el uso o para qué sirve algo.",
  },
  it: {
    wer: "`Wer` chiede della persona o del soggetto.",
    was: "`Was` chiede di una cosa, di un'azione o di un contenuto.",
    wo: "`Wo` chiede il luogo.",
    woher: "`Woher` chiede l'origine o la provenienza.",
    wohin: "`Wohin` chiede la direzione o la destinazione.",
    wann: "`Wann` chiede il momento o la data.",
    wie: "`Wie` chiede il modo, lo stato o il processo.",
    warum: "`Warum` chiede il motivo.",
    "wie-oft": "`Wie oft` chiede la frequenza.",
    "wie-lange": "`Wie lange` chiede la durata.",
    "wie-viel": "`Wie viel` chiede la quantità o l'ammontare.",
    welche: "`Welche` chiede di scegliere da un insieme noto.",
    wen: "`Wen` chiede di una persona all'accusativo.",
    wem: "`Wem` chiede di una persona al dativo o del destinatario.",
    wessen: "`Wessen` chiede il possesso o l'appartenenza.",
    womit: "`Womit` chiede il mezzo, lo strumento o l'utensile.",
    worueber:
      "`Worüber` chiede l'argomento di cui qualcuno parla, pensa o scrive.",
    woran:
      "`Woran` chiede a cosa qualcuno sta lavorando, a cosa pensa o da cosa si può riconoscere qualcosa.",
    wofuer: "`Wofür` chiede lo scopo, l'uso o a che cosa serve qualcosa.",
  },
  pl: {
    wer: "`Wer` pyta o osobę lub podmiot.",
    was: "`Was` pyta o rzecz, czynność lub treść.",
    wo: "`Wo` pyta o miejsce.",
    woher: "`Woher` pyta o pochodzenie lub źródło.",
    wohin: "`Wohin` pyta o kierunek lub cel.",
    wann: "`Wann` pyta o czas lub datę.",
    wie: "`Wie` pyta o sposób, stan lub przebieg.",
    warum: "`Warum` pyta o powód.",
    "wie-oft": "`Wie oft` pyta o częstotliwość.",
    "wie-lange": "`Wie lange` pyta o czas trwania.",
    "wie-viel": "`Wie viel` pyta o ilość lub wielkość.",
    welche: "`Welche` prosi o wybór ze znanego zestawu.",
    wen: "`Wen` pyta o osobę w bierniku.",
    wem: "`Wem` pyta o osobę w celowniku lub odbiorcę.",
    wessen: "`Wessen` pyta o posiadanie lub przynależność.",
    womit: "`Womit` pyta o środek, narzędzie lub instrument.",
    worueber:
      "`Worüber` pyta o temat, o którym ktoś mówi, myśli lub pisze.",
    woran:
      "`Woran` pyta, nad czym ktoś pracuje, o czym myśli lub po czym można coś rozpoznać.",
    wofuer: "`Wofür` pyta o cel, zastosowanie lub o to, do czego coś służy.",
  },
};

function normalizeWQuestionLocale(locale: string): WQuestionLocale {
  const normalizedLocale = locale.toLowerCase();
  if (normalizedLocale.startsWith("vi")) return "vi";
  if (normalizedLocale.startsWith("uk")) return "uk";
  if (normalizedLocale.startsWith("fa")) return "fa";
  if (normalizedLocale.startsWith("ar")) return "ar";
  if (normalizedLocale.startsWith("sq")) return "sq";
  if (normalizedLocale.startsWith("tr")) return "tr";
  if (normalizedLocale.startsWith("fr")) return "fr";
  if (normalizedLocale.startsWith("es")) return "es";
  if (normalizedLocale.startsWith("it")) return "it";
  if (normalizedLocale.startsWith("pl")) return "pl";
  if (normalizedLocale.startsWith("ru")) return "ru";
  if (normalizedLocale.startsWith("de")) return "de";
  return "en";
}

function getWQuestionExplanation(
  section: WQuestionSection,
  locale: WQuestionLocale,
): string {
  if (locale === "ru") return section.explanationRu;
  if (locale === "de") return section.explanationDe;
  if (locale === "en") return section.explanationEn;
  return (
    W_QUESTION_EXPLANATION_OVERRIDES[locale]?.[section.id] ?? section.explanationEn
  );
}

function getWQuestionMeaning(
  section: WQuestionSection,
  locale: WQuestionLocale,
  index: number,
  answer: string,
  translationEn: string,
  translationRu: string,
): string {
  if (locale === "ru") return translationRu;
  if (locale === "de") return answer;
  if (locale === "en") return translationEn;

  const localeMeaningMap = W_QUESTION_MEANING_TRANSLATIONS[locale] as
    | Record<string, readonly string[]>
    | undefined;

  return (
    localeMeaningMap?.[section.id]?.[index] ?? translationEn
  );
}

function composeWQuestionSection(
  section: WQuestionSection,
  locale: WQuestionLocale,
): WQuestionExercise[] {
  const explanation = getWQuestionExplanation(section, locale);

  return section.items.map(
    ([answer, translationEn, translationRu, questionTemplate, emoji], index) => ({
      id: `wfrage-${section.id}-${index + 1}`,
      answer,
      translation: getWQuestionMeaning(
        section,
        locale,
        index,
        answer,
        translationEn,
        translationRu,
      ),
      questionTemplate,
      correctAnswer: section.correctAnswer,
      options: [...section.options],
      explanation,
      emoji: emoji ?? section.emoji,
      level: section.level,
    }),
  );
}

const W_QUESTION_SECTIONS: WQuestionSection[] = [
  {
    id: "wer",
    level: "A1",
    correctAnswer: "Wer",
    options: ["Wer", "Was", "Wo", "Wann"],
    explanationEn: "`Wer` asks about the person or subject.",
    explanationRu: "`Wer` спрашивает о человеке или подлежащем.",
    explanationDe: "`Wer` fragt nach einer Person oder dem Subjekt.",
    emoji: "👤",
    items: [
      ["Das ist meine Lehrerin.", "That is my teacher.", "Это моя учительница.", "___ ist das?"],
      ["Amir arbeitet heute im Café.", "Amir is working at the cafe today.", "Амир сегодня работает в кафе.", "___ arbeitet heute im Café?"],
      ["Meine Schwester lernt mit mir Deutsch.", "My sister is learning German with me.", "Моя сестра учит со мной немецкий.", "___ lernt mit dir Deutsch?"],
      ["Unser neuer Kollege ruft später an.", "Our new colleague is calling later.", "Наш новый коллега позвонит позже.", "___ ruft später an?"],
      ["Frau Becker organisiert das Treffen.", "Mrs. Becker is organizing the meeting.", "Госпожа Беккер организует встречу.", "___ organisiert das Treffen?"],
      ["Der Arzt kommt um zehn Uhr.", "The doctor is coming at ten o'clock.", "Врач приходит в десять часов.", "___ kommt um zehn Uhr?"],
      ["Meine Freundin bringt Kuchen mit.", "My friend is bringing cake.", "Моя подруга приносит торт.", "___ bringt Kuchen mit?"],
    ],
  },
  {
    id: "was",
    level: "A1",
    correctAnswer: "Was",
    options: ["Was", "Wer", "Warum", "Wie"],
    explanationEn: "`Was` asks about a thing, an action, or content.",
    explanationRu: "`Was` спрашивает о предмете, действии или содержании.",
    explanationDe: "`Was` fragt nach einer Sache, Handlung oder einem Inhalt.",
    emoji: "📦",
    items: [
      ["Ich lerne heute neue Verben.", "I am learning new verbs today.", "Я сегодня учу новые глаголы.", "___ lernst du heute?"],
      ["Wir trinken Kaffee.", "We are drinking coffee.", "Мы пьём кофе.", "___ trinkt ihr?"],
      ["Er sucht seinen Schlüssel.", "He is looking for his key.", "Он ищет свой ключ.", "___ sucht er?"],
      ["Ich koche eine Suppe.", "I am cooking a soup.", "Я варю суп.", "___ kochst du?"],
      ["Sie liest ein interessantes Buch.", "She is reading an interesting book.", "Она читает интересную книгу.", "___ liest sie?"],
      ["Wir planen eine Reise nach Wien.", "We are planning a trip to Vienna.", "Мы планируем поездку в Вену.", "___ plant ihr?"],
      ["Das Kind malt ein Bild.", "The child is painting a picture.", "Ребёнок рисует картину.", "___ malt das Kind?"],
    ],
  },
  {
    id: "wo",
    level: "A1",
    correctAnswer: "Wo",
    options: ["Wo", "Woher", "Wohin", "Wann"],
    explanationEn: "`Wo` asks about a location.",
    explanationRu: "`Wo` спрашивает о месте.",
    explanationDe: "`Wo` fragt nach einem Ort.",
    emoji: "📍",
    items: [
      ["Ich wohne in Köln.", "I live in Cologne.", "Я живу в Кёльне.", "___ wohnst du?"],
      ["Der Kurs ist im zweiten Stock.", "The course is on the second floor.", "Курс проходит на втором этаже.", "___ ist der Kurs?"],
      ["Wir warten am Bahnhof.", "We are waiting at the station.", "Мы ждём на вокзале.", "___ wartet ihr?"],
      ["Mein Handy liegt auf dem Tisch.", "My phone is on the table.", "Мой телефон лежит на столе.", "___ liegt mein Handy?"],
      ["Sie arbeitet im Supermarkt.", "She works in the supermarket.", "Она работает в супермаркете.", "___ arbeitet sie?"],
      ["Die Kinder spielen im Garten.", "The children are playing in the garden.", "Дети играют в саду.", "___ spielen die Kinder?"],
      ["Eure Jacken hängen an der Tür.", "Your jackets are hanging on the door.", "Ваши куртки висят на двери.", "___ hängen eure Jacken?"],
    ],
  },
  {
    id: "woher",
    level: "A1",
    correctAnswer: "Woher",
    options: ["Woher", "Wo", "Wohin", "Wie"],
    explanationEn: "`Woher` asks about origin or where something comes from.",
    explanationRu: "`Woher` спрашивает о происхождении и о том, откуда кто-то или что-то.",
    explanationDe: "`Woher` fragt nach der Herkunft.",
    emoji: "🧭",
    items: [
      ["Ich komme aus Italien.", "I come from Italy.", "Я из Италии.", "___ kommst du?"],
      ["Der Zug kommt aus München.", "The train comes from Munich.", "Поезд приходит из Мюнхена.", "___ kommt der Zug?"],
      ["Meine Nachbarin kommt aus Polen.", "My neighbor comes from Poland.", "Моя соседка из Польши.", "___ kommt deine Nachbarin?"],
      ["Dieses Paket kommt aus Berlin.", "This package comes from Berlin.", "Эта посылка из Берлина.", "___ kommt dieses Paket?"],
      ["Der Wein kommt aus Spanien.", "The wine comes from Spain.", "Это вино из Испании.", "___ kommt der Wein?"],
      ["Ich kenne das Wort aus dem Kurs.", "I know the word from the course.", "Я знаю это слово с курса.", "___ kennst du das Wort?"],
      ["Unser Lehrer kommt aus Wien.", "Our teacher comes from Vienna.", "Наш учитель из Вены.", "___ kommt euer Lehrer?"],
    ],
  },
  {
    id: "wohin",
    level: "A1",
    correctAnswer: "Wohin",
    options: ["Wohin", "Wo", "Woher", "Wann"],
    explanationEn: "`Wohin` asks about direction or destination.",
    explanationRu: "`Wohin` спрашивает о направлении или цели движения.",
    explanationDe: "`Wohin` fragt nach einer Richtung oder einem Ziel.",
    emoji: "➡️",
    items: [
      ["Ich fahre morgen nach Hamburg.", "I am going to Hamburg tomorrow.", "Я завтра еду в Гамбург.", "___ fährst du morgen?"],
      ["Wir gehen ins Kino.", "We are going to the cinema.", "Мы идём в кино.", "___ geht ihr?"],
      ["Sie bringt die Bücher in die Bibliothek.", "She is taking the books to the library.", "Она несёт книги в библиотеку.", "___ bringt sie die Bücher?"],
      ["Das Kind läuft in den Garten.", "The child is running into the garden.", "Ребёнок бежит в сад.", "___ läuft das Kind?"],
      ["Er legt das Handy auf den Tisch.", "He puts the phone on the table.", "Он кладёт телефон на стол.", "___ legt er das Handy?"],
      ["Ihr fliegt im Sommer in die Türkei.", "You are flying to Turkey in summer.", "Летом вы летите в Турцию.", "___ fliegt ihr im Sommer?"],
      ["Die Gäste setzen sich an den Tisch.", "The guests sit down at the table.", "Гости садятся за стол.", "___ setzen sich die Gäste?"],
    ],
  },
  {
    id: "wann",
    level: "A1",
    correctAnswer: "Wann",
    options: ["Wann", "Wo", "Wie", "Warum"],
    explanationEn: "`Wann` asks about time or date.",
    explanationRu: "`Wann` спрашивает о времени или дате.",
    explanationDe: "`Wann` fragt nach Zeit oder Datum.",
    emoji: "⏰",
    items: [
      ["Der Unterricht beginnt um neun Uhr.", "The lesson starts at nine o'clock.", "Урок начинается в девять часов.", "___ beginnt der Unterricht?"],
      ["Wir treffen uns am Freitag.", "We are meeting on Friday.", "Мы встречаемся в пятницу.", "___ trefft ihr euch?"],
      ["Sie kommt morgen zurück.", "She is coming back tomorrow.", "Она вернётся завтра.", "___ kommt sie zurück?"],
      ["Mein Zug fährt in zehn Minuten ab.", "My train leaves in ten minutes.", "Мой поезд отправляется через десять минут.", "___ fährt dein Zug ab?"],
      ["Ich habe im Juli Urlaub.", "I have vacation in July.", "У меня отпуск в июле.", "___ hast du Urlaub?"],
      ["Der Film endet um 22 Uhr.", "The film ends at 10 p.m.", "Фильм заканчивается в 22:00.", "___ endet der Film?"],
      ["Ihr habt nächste Woche Prüfung.", "You have an exam next week.", "На следующей неделе у вас экзамен.", "___ habt ihr Prüfung?"],
    ],
  },
  {
    id: "wie",
    level: "A1",
    correctAnswer: "Wie",
    options: ["Wie", "Wo", "Wann", "Warum"],
    explanationEn: "`Wie` asks about manner, condition, or process.",
    explanationRu: "`Wie` спрашивает о способе, состоянии или ходе действия.",
    explanationDe: "`Wie` fragt nach Art und Weise, Zustand oder Ablauf.",
    emoji: "✨",
    items: [
      ["Mir geht es gut.", "I am doing well.", "У меня всё хорошо.", "___ geht es dir?"],
      ["Sie spricht sehr langsam.", "She speaks very slowly.", "Она говорит очень медленно.", "___ spricht sie?"],
      ["Wir bezahlen bar.", "We are paying in cash.", "Мы платим наличными.", "___ bezahlt ihr?"],
      ["Das Wort spricht man so aus.", "That word is pronounced like this.", "Это слово произносится так.", "___ spricht man das Wort aus?"],
      ["Er kommt pünktlich.", "He arrives on time.", "Он приходит вовремя.", "___ kommt er?"],
      ["Die Suppe schmeckt lecker.", "The soup tastes delicious.", "Суп вкусный.", "___ schmeckt die Suppe?"],
      ["Ihr arbeitet sehr konzentriert.", "You are working very focused.", "Вы работаете очень сосредоточенно.", "___ arbeitet ihr?"],
    ],
  },
  {
    id: "warum",
    level: "A2",
    correctAnswer: "Warum",
    options: ["Warum", "Wie", "Wann", "Was"],
    explanationEn: "`Warum` asks about the reason.",
    explanationRu: "`Warum` спрашивает о причине.",
    explanationDe: "`Warum` fragt nach dem Grund.",
    emoji: "❓",
    items: [
      ["Ich lerne Deutsch, weil ich in Berlin arbeite.", "I am learning German because I work in Berlin.", "Я учу немецкий, потому что работаю в Берлине.", "___ lernst du Deutsch?"],
      ["Er bleibt zu Hause, weil er krank ist.", "He stays at home because he is ill.", "Он остаётся дома, потому что болен.", "___ bleibt er zu Hause?"],
      ["Wir gehen früh, weil der Zug bald fährt.", "We are leaving early because the train departs soon.", "Мы уходим рано, потому что поезд скоро отправляется.", "___ geht ihr früh?"],
      ["Sie spart Geld, weil sie reisen will.", "She is saving money because she wants to travel.", "Она копит деньги, потому что хочет путешествовать.", "___ spart sie Geld?"],
      ["Ich nehme den Bus, weil es regnet.", "I am taking the bus because it is raining.", "Я еду на автобусе, потому что идёт дождь.", "___ nimmst du den Bus?"],
      ["Der Termin ist online, weil der Lehrer unterwegs ist.", "The appointment is online because the teacher is on the road.", "Встреча проходит онлайн, потому что учитель в дороге.", "___ ist der Termin online?"],
      ["Wir feiern heute, weil Lara Geburtstag hat.", "We are celebrating today because Lara has a birthday.", "Мы сегодня празднуем, потому что у Лары день рождения.", "___ feiert ihr heute?"],
    ],
  },
  {
    id: "wie-oft",
    level: "A2",
    correctAnswer: "Wie oft",
    options: ["Wie oft", "Wie lange", "Wie viel", "Wann"],
    explanationEn: "`Wie oft` asks about frequency.",
    explanationRu: "`Wie oft` спрашивает о частоте.",
    explanationDe: "`Wie oft` fragt nach Häufigkeit.",
    emoji: "🔁",
    items: [
      ["Ich gehe dreimal pro Woche ins Fitnessstudio.", "I go to the gym three times a week.", "Я хожу в спортзал три раза в неделю.", "___ gehst du ins Fitnessstudio?"],
      ["Wir üben jeden Abend Wortschatz.", "We practice vocabulary every evening.", "Мы каждый вечер повторяем слова.", "___ übt ihr Wortschatz?"],
      ["Sie telefoniert selten mit ihrem Chef.", "She rarely calls her boss.", "Она редко звонит своему начальнику.", "___ telefoniert sie mit ihrem Chef?"],
      ["Er besucht seine Eltern einmal im Monat.", "He visits his parents once a month.", "Он навещает родителей раз в месяц.", "___ besucht er seine Eltern?"],
      ["Ich bestelle oft online.", "I order online often.", "Я часто заказываю онлайн.", "___ bestellst du online?"],
      ["Die Kinder haben jeden Tag Hausaufgaben.", "The children have homework every day.", "У детей каждый день домашнее задание.", "___ haben die Kinder Hausaufgaben?"],
      ["Ihr seid am Wochenende immer im Park.", "You are always in the park at the weekend.", "По выходным вы всегда в парке.", "___ seid ihr im Park?"],
    ],
  },
  {
    id: "wie-lange",
    level: "A2",
    correctAnswer: "Wie lange",
    options: ["Wie lange", "Wie oft", "Wann", "Wie viel"],
    explanationEn: "`Wie lange` asks about duration.",
    explanationRu: "`Wie lange` спрашивает о продолжительности.",
    explanationDe: "`Wie lange` fragt nach Dauer.",
    emoji: "⌛",
    items: [
      ["Der Kurs dauert zwei Stunden.", "The course lasts two hours.", "Курс длится два часа.", "___ dauert der Kurs?"],
      ["Ich warte seit zehn Minuten.", "I have been waiting for ten minutes.", "Я жду уже десять минут.", "___ wartest du schon?"],
      ["Wir bleiben bis Sonntag in Wien.", "We are staying in Vienna until Sunday.", "Мы остаёмся в Вене до воскресенья.", "___ bleibt ihr in Wien?"],
      ["Sie lernt seit drei Jahren Deutsch.", "She has been learning German for three years.", "Она учит немецкий уже три года.", "___ lernt sie schon Deutsch?"],
      ["Der Film dauert fast drei Stunden.", "The film lasts almost three hours.", "Фильм длится почти три часа.", "___ dauert der Film?"],
      ["Ihr arbeitet heute bis 18 Uhr.", "You are working until 6 p.m. today.", "Сегодня вы работаете до 18:00.", "___ arbeitet ihr heute?"],
      ["Er wohnt seit einem Monat hier.", "He has been living here for a month.", "Он живёт здесь уже месяц.", "___ wohnt er schon hier?"],
    ],
  },
  {
    id: "wie-viel",
    level: "A2",
    correctAnswer: "Wie viel",
    options: ["Wie viel", "Wie oft", "Wie lange", "Was"],
    explanationEn: "`Wie viel` asks about quantity or amount.",
    explanationRu: "`Wie viel` спрашивает о количестве или объёме.",
    explanationDe: "`Wie viel` fragt nach Menge oder Anzahl.",
    emoji: "💶",
    items: [
      ["Ein Kaffee kostet drei Euro.", "A coffee costs three euros.", "Кофе стоит три евро.", "___ kostet ein Kaffee?"],
      ["Ich brauche zwei Liter Wasser.", "I need two liters of water.", "Мне нужно два литра воды.", "___ Wasser brauchst du?"],
      ["Wir haben nur zehn Minuten Zeit.", "We only have ten minutes of time.", "У нас есть только десять минут.", "___ Zeit habt ihr?"],
      ["Sie verdient 1500 Euro im Monat.", "She earns 1500 euros a month.", "Она зарабатывает 1500 евро в месяц.", "___ verdient sie im Monat?"],
      ["Er trinkt viel Kaffee.", "He drinks a lot of coffee.", "Он пьёт много кофе.", "___ Kaffee trinkt er?"],
      ["Ihr braucht drei Tickets.", "You need three tickets.", "Вам нужно три билета.", "___ Tickets braucht ihr?"],
      ["Im Kühlschrank ist wenig Milch.", "There is little milk in the fridge.", "В холодильнике мало молока.", "___ Milch ist im Kühlschrank?"],
    ],
  },
  {
    id: "welche",
    level: "A2",
    correctAnswer: "Welche",
    options: ["Welche", "Was", "Wie viel", "Warum"],
    explanationEn: "`Welche` asks you to choose from a known set.",
    explanationRu: "`Welche` просит выбрать из известного набора.",
    explanationDe: "`Welche` fragt nach einer Auswahl aus einer bekannten Gruppe.",
    emoji: "🗂️",
    items: [
      ["Ich nehme die blaue Jacke.", "I am taking the blue jacket.", "Я беру синюю куртку.", "___ Jacke nimmst du?"],
      ["Wir schauen die neuen Filme.", "We are watching the new films.", "Мы смотрим новые фильмы.", "___ Filme schaut ihr heute?"],
      ["Sie liest die deutsche Zeitung.", "She is reading the German newspaper.", "Она читает немецкую газету.", "___ Zeitung liest sie?"],
      ["Ich höre am liebsten klassische Musik.", "I prefer listening to classical music.", "Больше всего я слушаю классическую музыку.", "___ Musik hörst du am liebsten?"],
      ["Wir besuchen diese Ausstellung.", "We are visiting this exhibition.", "Мы посещаем эту выставку.", "___ Ausstellung besucht ihr?"],
      ["Er benutzt die Lern-App von Vela.", "He uses the Vela learning app.", "Он пользуется учебным приложением Vela.", "___ App benutzt er?"],
      ["Das Team wählt die zweite Option.", "The team chooses the second option.", "Команда выбирает второй вариант.", "___ Option wählt das Team?"],
    ],
  },
  {
    id: "wen",
    level: "B1",
    correctAnswer: "Wen",
    options: ["Wen", "Wer", "Wem", "Was"],
    explanationEn: "`Wen` asks about a person in Akkusativ.",
    explanationRu: "`Wen` спрашивает о человеке в Akkusativ.",
    explanationDe: "`Wen` fragt nach einer Person im Akkusativ.",
    emoji: "👥",
    items: [
      ["Ich sehe meinen Lehrer im Flur.", "I see my teacher in the hallway.", "Я вижу своего учителя в коридоре.", "___ siehst du im Flur?"],
      ["Wir besuchen unsere Oma am Sonntag.", "We visit our grandma on Sunday.", "Мы навещаем бабушку в воскресенье.", "___ besucht ihr am Sonntag?"],
      ["Sie ruft ihren Bruder später an.", "She calls her brother later.", "Она позже звонит своему брату.", "___ ruft sie später an?"],
      ["Er sucht den neuen Kollegen.", "He is looking for the new colleague.", "Он ищет нового коллегу.", "___ sucht er?"],
      ["Ich frage meine Nachbarin.", "I am asking my neighbor.", "Я спрашиваю свою соседку.", "___ fragst du?"],
      ["Die Polizei kontrolliert den Fahrer.", "The police are checking the driver.", "Полиция проверяет водителя.", "___ kontrolliert die Polizei?"],
      ["Ihr trefft eure Freunde am Abend.", "You meet your friends in the evening.", "Вечером вы встречаете своих друзей.", "___ trefft ihr am Abend?"],
    ],
  },
  {
    id: "wem",
    level: "B1",
    correctAnswer: "Wem",
    options: ["Wem", "Wen", "Wer", "Was"],
    explanationEn: "`Wem` asks about a person in Dativ or the receiver.",
    explanationRu: "`Wem` спрашивает о человеке в Dativ или о получателе.",
    explanationDe: "`Wem` fragt nach einer Person im Dativ oder dem Empfänger.",
    emoji: "🤝",
    items: [
      ["Ich helfe meinem Bruder bei den Hausaufgaben.", "I help my brother with the homework.", "Я помогаю своему брату с домашним заданием.", "___ hilfst du bei den Hausaufgaben?"],
      ["Wir danken unserer Lehrerin für den Tipp.", "We thank our teacher for the tip.", "Мы благодарим нашу учительницу за совет.", "___ dankt ihr für den Tipp?"],
      ["Sie schreibt ihrem Chef eine Nachricht.", "She writes a message to her boss.", "Она пишет сообщение своему начальнику.", "___ schreibt sie eine Nachricht?"],
      ["Er gibt dem Kind einen Apfel.", "He gives the child an apple.", "Он даёт ребёнку яблоко.", "___ gibt er einen Apfel?"],
      ["Ich antworte meiner Freundin sofort.", "I answer my friend immediately.", "Я сразу отвечаю своей подруге.", "___ antwortest du sofort?"],
      ["Die Mutter erklärt dem Gast den Weg.", "The mother explains the way to the guest.", "Мама объясняет гостю дорогу.", "___ erklärt die Mutter den Weg?"],
      ["Ihr zeigt dem Arzt die Karte.", "You show the card to the doctor.", "Вы показываете врачу карту.", "___ zeigt ihr die Karte?"],
    ],
  },
  {
    id: "wessen",
    level: "B2",
    correctAnswer: "Wessen",
    options: ["Wessen", "Wer", "Wem", "Welche"],
    explanationEn: "`Wessen` asks about possession or belonging.",
    explanationRu: "`Wessen` спрашивает о принадлежности или владении.",
    explanationDe: "`Wessen` fragt nach Besitz oder Zugehörigkeit.",
    emoji: "🧾",
    items: [
      ["Das ist Claras Tasche.", "That is Clara's bag.", "Это сумка Клары.", "___ Tasche ist das?"],
      ["Hier steht Jonas' Fahrrad.", "Jonas's bicycle is standing here.", "Здесь стоит велосипед Йонаса.", "___ Fahrrad steht hier?"],
      ["Ich höre den Podcast meiner Lehrerin.", "I am listening to my teacher's podcast.", "Я слушаю подкаст моей учительницы.", "___ Podcast hörst du?"],
      ["Auf dem Tisch liegt Annas Handy.", "Anna's phone is lying on the table.", "На столе лежит телефон Анны.", "___ Handy liegt auf dem Tisch?"],
      ["Wir suchen die Unterlagen unseres Chefs.", "We are looking for our boss's documents.", "Мы ищем документы нашего начальника.", "___ Unterlagen sucht ihr?"],
      ["Das ist der Schlüssel meiner Nachbarin.", "That is my neighbor's key.", "Это ключ моей соседки.", "___ Schlüssel ist das?"],
      ["Er liest den Artikel seines Professors.", "He is reading his professor's article.", "Он читает статью своего профессора.", "___ Artikel liest er?"],
    ],
  },
  {
    id: "womit",
    level: "B1",
    correctAnswer: "Womit",
    options: ["Womit", "Wie", "Woran", "Wofür"],
    explanationEn: "`Womit` asks about the tool, means, or instrument.",
    explanationRu: "`Womit` спрашивает о средстве, инструменте или том, с помощью чего что-то делают.",
    explanationDe: "`Womit` fragt nach dem Mittel, Werkzeug oder Instrument.",
    emoji: "🛠️",
    items: [
      ["Ich schreibe mit einem Kuli.", "I write with a pen.", "Я пишу ручкой.", "___ schreibst du?"],
      ["Wir fahren mit der U-Bahn zur Arbeit.", "We go to work by subway.", "Мы едем на работу на метро.", "___ fahrt ihr zur Arbeit?"],
      ["Sie öffnet die Tür mit dem Schlüssel.", "She opens the door with the key.", "Она открывает дверь ключом.", "___ öffnet sie die Tür?"],
      ["Er bezahlt mit seiner Karte.", "He pays with his card.", "Он платит своей картой.", "___ bezahlt er?"],
      ["Die Kinder malen mit Buntstiften.", "The children draw with colored pencils.", "Дети рисуют цветными карандашами.", "___ malen die Kinder?"],
      ["Ich schneide das Brot mit einem Messer.", "I cut the bread with a knife.", "Я режу хлеб ножом.", "___ schneidest du das Brot?"],
      ["Ihr hört den Podcast mit Kopfhörern.", "You listen to the podcast with headphones.", "Вы слушаете подкаст в наушниках.", "___ hört ihr den Podcast?"],
    ],
  },
  {
    id: "worueber",
    level: "B2",
    correctAnswer: "Worüber",
    options: ["Worüber", "Woran", "Wofür", "Warum"],
    explanationEn: "`Worüber` asks about the topic someone is speaking, thinking, or writing about.",
    explanationRu: "`Worüber` спрашивает о теме, о которой кто-то говорит, думает или пишет.",
    explanationDe: "`Worüber` fragt nach dem Thema, über das jemand spricht, nachdenkt oder schreibt.",
    emoji: "💬",
    items: [
      ["Wir sprechen über die neue Wohnung.", "We are talking about the new apartment.", "Мы говорим о новой квартире.", "___ sprecht ihr?"],
      ["Sie schreibt über ihre Reise nach Wien.", "She writes about her trip to Vienna.", "Она пишет о своей поездке в Вену.", "___ schreibt sie?"],
      ["Ich denke oft über meine Zukunft nach.", "I often think about my future.", "Я часто думаю о своём будущем.", "___ denkst du oft nach?"],
      ["Der Artikel berichtet über moderne Lernmethoden.", "The article reports on modern learning methods.", "Статья рассказывает о современных методах обучения.", "___ berichtet der Artikel?"],
      ["Ihr diskutiert über flexible Arbeitszeiten.", "You are discussing flexible working hours.", "Вы обсуждаете гибкий график работы.", "___ diskutiert ihr?"],
      ["Er beschwert sich über den Lärm im Hof.", "He complains about the noise in the courtyard.", "Он жалуется на шум во дворе.", "___ beschwert er sich?"],
      ["Wir lachen über die lustige Geschichte.", "We laugh about the funny story.", "Мы смеёмся над смешной историей.", "___ lacht ihr?"],
    ],
  },
  {
    id: "woran",
    level: "B2",
    correctAnswer: "Woran",
    options: ["Woran", "Worüber", "Womit", "Wann"],
    explanationEn: "`Woran` asks what someone is working on, thinking of, or can recognize something by.",
    explanationRu: "`Woran` спрашивает, над чем кто-то работает, о чём думает или по чему что-то можно узнать.",
    explanationDe: "`Woran` fragt, woran jemand arbeitet, denkt oder woran man etwas erkennt.",
    emoji: "🧠",
    items: [
      ["Ich arbeite gerade an einem neuen Projekt.", "I am currently working on a new project.", "Сейчас я работаю над новым проектом.", "___ arbeitest du gerade?"],
      ["Sie erkennt ihn an seiner Stimme.", "She recognizes him by his voice.", "Она узнаёт его по голосу.", "___ erkennt sie ihn?"],
      ["Wir denken noch an die letzte Besprechung.", "We are still thinking about the last meeting.", "Мы всё ещё думаем о последней встрече.", "___ denkt ihr noch?"],
      ["Er schreibt an seiner Masterarbeit.", "He is writing his master's thesis.", "Он пишет свою магистерскую работу.", "___ schreibt er?"],
      ["Du merkst es an seinem Blick.", "You notice it from his look.", "Ты замечаешь это по его взгляду.", "___ merkst du es?"],
      ["Die Firma arbeitet an einer neuen App.", "The company is working on a new app.", "Компания работает над новым приложением.", "___ arbeitet die Firma?"],
      ["Ich erinnere mich an unser erstes Treffen.", "I remember our first meeting.", "Я помню нашу первую встречу.", "___ erinnerst du dich?"],
    ],
  },
  {
    id: "wofuer",
    level: "B2",
    correctAnswer: "Wofür",
    options: ["Wofür", "Womit", "Warum", "Wessen"],
    explanationEn: "`Wofür` asks about purpose, use, or what something is intended for.",
    explanationRu: "`Wofür` спрашивает о цели, назначении или о том, для чего что-то нужно.",
    explanationDe: "`Wofür` fragt nach Zweck, Verwendung oder dem Nutzen von etwas.",
    emoji: "🎯",
    items: [
      ["Ich spare für einen Sprachkurs.", "I am saving up for a language course.", "Я коплю на языковой курс.", "___ sparst du?"],
      ["Dieses Formular ist für die Anmeldung.", "This form is for the registration.", "Эта форма нужна для регистрации.", "___ ist dieses Formular?"],
      ["Wir nutzen die App für tägliche Übungen.", "We use the app for daily practice.", "Мы используем приложение для ежедневной практики.", "___ nutzt ihr die App?"],
      ["Er bedankt sich für deine Hilfe.", "He thanks you for your help.", "Он благодарит тебя за помощь.", "___ bedankt er sich?"],
      ["Die Tasche ist für meinen Laptop.", "The bag is for my laptop.", "Сумка предназначена для моего ноутбука.", "___ ist die Tasche?"],
      ["Sie interessiert sich für einen Job im Ausland.", "She is interested in a job abroad.", "Она интересуется работой за границей.", "___ interessiert sie sich?"],
      ["Das Geld ist für die Reise reserviert.", "The money is reserved for the trip.", "Эти деньги отложены на поездку.", "___ ist das Geld reserviert?"],
    ],
  },
];

export function getWQuestionExercises(locale: string): WQuestionExercise[] {
  const normalizedLocale = normalizeWQuestionLocale(locale);
  return W_QUESTION_SECTIONS.flatMap((section) =>
    composeWQuestionSection(section, normalizedLocale),
  );
}

export const W_QUESTION_EXERCISES: WQuestionExercise[] = getWQuestionExercises("en");
