import { getMiniGamesGloss, hasMiniGamesGloss } from "./miniGamesGlossary";
import { PRACTICE_MEANING_OVERRIDES } from "./miniGamesPracticeMeaningOverrides";
import { PRACTICE_PHRASE_OVERRIDES } from "./miniGamesPracticePhraseOverrides";

export type MiniGamesPracticeLocale =
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

const FUNCTION_WORDS: Record<
  string,
  Partial<Record<Exclude<MiniGamesPracticeLocale, "en">, string>>
> = {
  the: { de: "", vi: "", ru: "", uk: "", fa: "", ar: "", sq: "", tr: "", fr: "", es: "", it: "", pl: "" },
  a: { de: "", vi: "", ru: "", uk: "", fa: "", ar: "", sq: "", tr: "", fr: "", es: "", it: "", pl: "" },
  an: { de: "", vi: "", ru: "", uk: "", fa: "", ar: "", sq: "", tr: "", fr: "", es: "", it: "", pl: "" },
  i: { de: "ich", vi: "tôi", ru: "я", uk: "я", fa: "من", ar: "أنا", sq: "unë", tr: "ben", fr: "je", es: "yo", it: "io", pl: "ja" },
  we: { de: "wir", vi: "chúng tôi", ru: "мы", uk: "ми", fa: "ما", ar: "نحن", sq: "ne", tr: "biz", fr: "nous", es: "nosotros", it: "noi", pl: "my" },
  you: { de: "du", vi: "bạn", ru: "ты", uk: "ти", fa: "تو", ar: "أنت", sq: "ti", tr: "sen", fr: "tu", es: "tú", it: "tu", pl: "ty" },
  he: { de: "er", vi: "anh ấy", ru: "он", uk: "він", fa: "او", ar: "هو", sq: "ai", tr: "o", fr: "il", es: "él", it: "lui", pl: "on" },
  she: { de: "sie", vi: "cô ấy", ru: "она", uk: "вона", fa: "او", ar: "هي", sq: "ajo", tr: "o", fr: "elle", es: "ella", it: "lei", pl: "ona" },
  they: { de: "sie", vi: "họ", ru: "они", uk: "вони", fa: "آنها", ar: "هم", sq: "ata", tr: "onlar", fr: "ils", es: "ellos", it: "loro", pl: "oni" },
  it: { de: "es", vi: "nó", ru: "это", uk: "це", fa: "آن", ar: "هذا", sq: "ajo", tr: "bu", fr: "cela", es: "eso", it: "questo", pl: "to" },
  my: { de: "mein", vi: "của tôi", ru: "мой", uk: "мій", fa: "مال من", ar: "خاصتي", sq: "im", tr: "benim", fr: "mon", es: "mi", it: "mio", pl: "mój" },
  your: { de: "dein", vi: "của bạn", ru: "твой", uk: "твій", fa: "مال تو", ar: "الخاص بك", sq: "yt", tr: "senin", fr: "ton", es: "tu", it: "tuo", pl: "twój" },
  our: { de: "unser", vi: "của chúng tôi", ru: "наш", uk: "наш", fa: "مال ما", ar: "الخاص بنا", sq: "ynë", tr: "bizim", fr: "notre", es: "nuestro", it: "nostro", pl: "nasz" },
  his: { de: "sein", vi: "của anh ấy", ru: "его", uk: "його", fa: "مال او", ar: "خاصته", sq: "i tij", tr: "onun", fr: "son", es: "su", it: "suo", pl: "jego" },
  her: { de: "ihr", vi: "của cô ấy", ru: "её", uk: "її", fa: "مال او", ar: "خاصتها", sq: "i saj", tr: "onun", fr: "son", es: "su", it: "suo", pl: "jej" },
  their: { de: "ihr", vi: "của họ", ru: "их", uk: "їхній", fa: "مال آنها", ar: "الخاص بهم", sq: "i tyre", tr: "onların", fr: "leur", es: "su", it: "loro", pl: "ich" },
  this: { de: "dies", vi: "này", ru: "этот", uk: "цей", fa: "این", ar: "هذا", sq: "kjo", tr: "bu", fr: "ce", es: "este", it: "questo", pl: "ten" },
  that: { de: "das", vi: "đó", ru: "тот", uk: "той", fa: "آن", ar: "ذلك", sq: "ajo", tr: "şu", fr: "cela", es: "ese", it: "quello", pl: "tamten" },
  here: { de: "hier", vi: "ở đây", ru: "здесь", uk: "тут", fa: "اینجا", ar: "هنا", sq: "këtu", tr: "burada", fr: "ici", es: "aquí", it: "qui", pl: "tutaj" },
  there: { de: "dort", vi: "ở đó", ru: "там", uk: "там", fa: "آنجا", ar: "هناك", sq: "atje", tr: "orada", fr: "là-bas", es: "allí", it: "lì", pl: "tam" },
  what: { de: "was", vi: "gì", ru: "что", uk: "що", fa: "چه", ar: "ماذا", sq: "çfarë", tr: "ne", fr: "quoi", es: "qué", it: "che cosa", pl: "co" },
  who: { de: "wer", vi: "ai", ru: "кто", uk: "хто", fa: "چه کسی", ar: "من", sq: "kush", tr: "kim", fr: "qui", es: "quién", it: "chi", pl: "kto" },
  when: { de: "wann", vi: "khi nào", ru: "когда", uk: "коли", fa: "کی", ar: "متى", sq: "kur", tr: "ne zaman", fr: "quand", es: "cuándo", it: "quando", pl: "kiedy" },
  where: { de: "wo", vi: "ở đâu", ru: "где", uk: "де", fa: "کجا", ar: "أين", sq: "ku", tr: "nerede", fr: "où", es: "dónde", it: "dove", pl: "gdzie" },
  why: { de: "warum", vi: "tại sao", ru: "почему", uk: "чому", fa: "چرا", ar: "لماذا", sq: "pse", tr: "neden", fr: "pourquoi", es: "por qué", it: "perché", pl: "dlaczego" },
  how: { de: "wie", vi: "như thế nào", ru: "как", uk: "як", fa: "چطور", ar: "كيف", sq: "si", tr: "nasıl", fr: "comment", es: "cómo", it: "come", pl: "jak" },
  yes: { de: "ja", vi: "vâng", ru: "да", uk: "так", fa: "بله", ar: "نعم", sq: "po", tr: "evet", fr: "oui", es: "sí", it: "sì", pl: "tak" },
  no: { de: "nein", vi: "không", ru: "нет", uk: "ні", fa: "نه", ar: "لا", sq: "jo", tr: "hayır", fr: "non", es: "no", it: "no", pl: "nie" },
  please: { de: "bitte", vi: "làm ơn", ru: "пожалуйста", uk: "будь ласка", fa: "لطفاً", ar: "من فضلك", sq: "të lutem", tr: "lütfen", fr: "s'il te plaît", es: "por favor", it: "per favore", pl: "proszę" },
  is: { de: "ist", vi: "là", ru: "есть", uk: "є", fa: "است", ar: "هو", sq: "është", tr: "dır", fr: "est", es: "es", it: "è", pl: "jest" },
  are: { de: "sind", vi: "là", ru: "есть", uk: "є", fa: "هستند", ar: "هم", sq: "janë", tr: "dır", fr: "sont", es: "son", it: "sono", pl: "są" },
  was: { de: "war", vi: "đã là", ru: "был", uk: "був", fa: "بود", ar: "كان", sq: "ishte", tr: "idi", fr: "était", es: "era", it: "era", pl: "był" },
  were: { de: "waren", vi: "đã là", ru: "были", uk: "були", fa: "بودند", ar: "كانوا", sq: "ishin", tr: "idi", fr: "étaient", es: "eran", it: "erano", pl: "byli" },
  can: { de: "kann", vi: "có thể", ru: "может", uk: "може", fa: "می‌تواند", ar: "يمكن", sq: "mund", tr: "bilir", fr: "peut", es: "puede", it: "può", pl: "może" },
  should: { de: "sollte", vi: "nên", ru: "должен", uk: "повинен", fa: "باید", ar: "ينبغي", sq: "duhet", tr: "malı", fr: "devrait", es: "debería", it: "dovrebbe", pl: "powinien" },
  must: { de: "muss", vi: "phải", ru: "должен", uk: "мусить", fa: "باید", ar: "يجب", sq: "duhet", tr: "zorunda", fr: "doit", es: "debe", it: "deve", pl: "musi" },
  would: { de: "würde", vi: "muốn", ru: "бы", uk: "б", fa: "می‌خواست", ar: "يريد", sq: "do të", tr: "isterdi", fr: "voudrait", es: "gustaría", it: "vorrebbe", pl: "chciałby" },
  have: { de: "haben", vi: "có", ru: "иметь", uk: "мати", fa: "داشتن", ar: "يملك", sq: "kam", tr: "sahip olmak", fr: "avoir", es: "tener", it: "avere", pl: "mieć" },
  has: { de: "hat", vi: "có", ru: "имеет", uk: "має", fa: "دارد", ar: "لديه", sq: "ka", tr: "var", fr: "a", es: "tiene", it: "ha", pl: "ma" },
  had: { de: "hatte", vi: "đã có", ru: "имел", uk: "мав", fa: "داشت", ar: "كان لديه", sq: "kishte", tr: "vardı", fr: "avait", es: "tenía", it: "aveva", pl: "miał" },
  do: { de: "tun", vi: "làm", ru: "делать", uk: "робити", fa: "انجام دادن", ar: "يفعل", sq: "bëj", tr: "yapmak", fr: "faire", es: "hacer", it: "fare", pl: "robić" },
  does: { de: "macht", vi: "làm", ru: "делает", uk: "робить", fa: "می‌کند", ar: "يفعل", sq: "bën", tr: "yapar", fr: "fait", es: "hace", it: "fa", pl: "robi" },
  did: { de: "tat", vi: "đã làm", ru: "сделал", uk: "зробив", fa: "کرد", ar: "فعل", sq: "bëri", tr: "yaptı", fr: "a fait", es: "hizo", it: "ha fatto", pl: "zrobił" },
  will: { de: "wird", vi: "sẽ", ru: "будет", uk: "буде", fa: "خواهد", ar: "سوف", sq: "do të", tr: "olacak", fr: "va", es: "va a", it: "sarà", pl: "będzie" },
  today: { de: "heute", vi: "hôm nay", ru: "сегодня", uk: "сьогодні", fa: "امروز", ar: "اليوم", sq: "sot", tr: "bugün", fr: "aujourd'hui", es: "hoy", it: "oggi", pl: "dzisiaj" },
  tomorrow: { de: "morgen", vi: "ngày mai", ru: "завтра", uk: "завтра", fa: "فردا", ar: "غدًا", sq: "nesër", tr: "yarın", fr: "demain", es: "mañana", it: "domani", pl: "jutro" },
  yesterday: { de: "gestern", vi: "hôm qua", ru: "вчера", uk: "вчора", fa: "دیروز", ar: "أمس", sq: "dje", tr: "dün", fr: "hier", es: "ayer", it: "ieri", pl: "wczoraj" },
  now: { de: "jetzt", vi: "bây giờ", ru: "сейчас", uk: "зараз", fa: "الان", ar: "الآن", sq: "tani", tr: "şimdi", fr: "maintenant", es: "ahora", it: "adesso", pl: "teraz" },
  later: { de: "später", vi: "sau", ru: "позже", uk: "пізніше", fa: "بعداً", ar: "لاحقًا", sq: "më vonë", tr: "sonra", fr: "plus tard", es: "más tarde", it: "più tardi", pl: "później" },
  earlier: { de: "früher", vi: "sớm hơn", ru: "раньше", uk: "раніше", fa: "زودتر", ar: "أبكر", sq: "më herët", tr: "daha erken", fr: "plus tôt", es: "antes", it: "prima", pl: "wcześniej" },
  after: { de: "nach", vi: "sau", ru: "после", uk: "після", fa: "بعد از", ar: "بعد", sq: "pas", tr: "sonra", fr: "après", es: "después de", it: "dopo", pl: "po" },
  before: { de: "vor", vi: "trước", ru: "до", uk: "перед", fa: "قبل از", ar: "قبل", sq: "para", tr: "önce", fr: "avant", es: "antes de", it: "prima di", pl: "przed" },
  during: { de: "während", vi: "trong lúc", ru: "во время", uk: "під час", fa: "در طول", ar: "أثناء", sq: "gjatë", tr: "sırasında", fr: "pendant", es: "durante", it: "durante", pl: "podczas" },
  because: { de: "weil", vi: "bởi vì", ru: "потому что", uk: "тому що", fa: "چون", ar: "لأن", sq: "sepse", tr: "çünkü", fr: "parce que", es: "porque", it: "perché", pl: "ponieważ" },
  instead: { de: "stattdessen", vi: "thay vào đó", ru: "вместо этого", uk: "замість цього", fa: "به‌جای آن", ar: "بدلًا من ذلك", sq: "në vend të kësaj", tr: "bunun yerine", fr: "à la place", es: "en lugar de eso", it: "invece", pl: "zamiast tego" },
  with: { de: "mit", vi: "với", ru: "с", uk: "з", fa: "با", ar: "مع", sq: "me", tr: "ile", fr: "avec", es: "con", it: "con", pl: "z" },
  without: { de: "ohne", vi: "không có", ru: "без", uk: "без", fa: "بدون", ar: "من دون", sq: "pa", tr: "olmadan", fr: "sans", es: "sin", it: "senza", pl: "bez" },
  for: { de: "für", vi: "cho", ru: "для", uk: "для", fa: "برای", ar: "لـ", sq: "për", tr: "için", fr: "pour", es: "para", it: "per", pl: "dla" },
  to: { de: "zu", vi: "đến", ru: "к", uk: "до", fa: "به", ar: "إلى", sq: "te", tr: "için", fr: "à", es: "a", it: "a", pl: "do" },
  from: { de: "von", vi: "từ", ru: "от", uk: "від", fa: "از", ar: "من", sq: "nga", tr: "den", fr: "de", es: "de", it: "da", pl: "z" },
  in: { de: "in", vi: "trong", ru: "в", uk: "у", fa: "در", ar: "في", sq: "në", tr: "içinde", fr: "dans", es: "en", it: "in", pl: "w" },
  on: { de: "auf", vi: "trên", ru: "на", uk: "на", fa: "روی", ar: "على", sq: "mbi", tr: "üzerinde", fr: "sur", es: "sobre", it: "su", pl: "na" },
  at: { de: "bei", vi: "ở", ru: "у", uk: "біля", fa: "در", ar: "عند", sq: "te", tr: "orada", fr: "à", es: "en", it: "a", pl: "przy" },
  into: { de: "in", vi: "vào", ru: "в", uk: "в", fa: "به داخل", ar: "إلى داخل", sq: "në", tr: "içine", fr: "dans", es: "a", it: "dentro", pl: "do" },
  by: { de: "mit", vi: "bằng", ru: "на", uk: "на", fa: "با", ar: "بـ", sq: "me", tr: "ile", fr: "avec", es: "en", it: "con", pl: "na" },
  about: { de: "über", vi: "về", ru: "о", uk: "про", fa: "درباره", ar: "عن", sq: "për", tr: "hakkında", fr: "sur", es: "sobre", it: "su", pl: "o" },
  of: { de: "", vi: "của", ru: "", uk: "", fa: "", ar: "", sq: "i", tr: "", fr: "de", es: "de", it: "di", pl: "" },
  if: { de: "wenn", vi: "nếu", ru: "если", uk: "якщо", fa: "اگر", ar: "إذا", sq: "nëse", tr: "eğer", fr: "si", es: "si", it: "se", pl: "jeśli" },
  then: { de: "dann", vi: "thì", ru: "тогда", uk: "тоді", fa: "آن‌وقت", ar: "عندها", sq: "atëherë", tr: "o zaman", fr: "alors", es: "entonces", it: "allora", pl: "wtedy" },
  whether: { de: "ob", vi: "liệu", ru: "ли", uk: "чи", fa: "آیا", ar: "ما إذا", sq: "nëse", tr: "acaba", fr: "si", es: "si", it: "se", pl: "czy" },
  and: { de: "und", vi: "và", ru: "и", uk: "і", fa: "و", ar: "و", sq: "dhe", tr: "ve", fr: "et", es: "y", it: "e", pl: "i" },
  but: { de: "aber", vi: "nhưng", ru: "но", uk: "але", fa: "اما", ar: "لكن", sq: "por", tr: "ama", fr: "mais", es: "pero", it: "ma", pl: "ale" },
  or: { de: "oder", vi: "hoặc", ru: "или", uk: "або", fa: "یا", ar: "أو", sq: "ose", tr: "veya", fr: "ou", es: "o", it: "o", pl: "lub" },
  not: { de: "nicht", vi: "không", ru: "не", uk: "не", fa: "نه", ar: "ليس", sq: "jo", tr: "değil", fr: "pas", es: "no", it: "non", pl: "nie" },
  more: { de: "mehr", vi: "nhiều hơn", ru: "больше", uk: "більше", fa: "بیشتر", ar: "أكثر", sq: "më shumë", tr: "daha fazla", fr: "plus", es: "más", it: "più", pl: "więcej" },
  same: { de: "gleich", vi: "giống", ru: "тот же", uk: "той самий", fa: "همان", ar: "نفس", sq: "i njëjtë", tr: "aynı", fr: "même", es: "mismo", it: "stesso", pl: "ten sam" },
  next: { de: "nächste", vi: "tiếp theo", ru: "следующий", uk: "наступний", fa: "بعدی", ar: "التالي", sq: "tjetër", tr: "sonraki", fr: "prochain", es: "siguiente", it: "prossimo", pl: "następny" },
  almost: { de: "fast", vi: "gần như", ru: "почти", uk: "майже", fa: "تقریباً", ar: "تقريبًا", sq: "pothuajse", tr: "neredeyse", fr: "presque", es: "casi", it: "quasi", pl: "prawie" },
  long: { de: "lang", vi: "dài", ru: "долгий", uk: "довгий", fa: "طولانی", ar: "طويل", sq: "i gjatë", tr: "uzun", fr: "long", es: "largo", it: "lungo", pl: "długi" },
  little: { de: "wenig", vi: "ít", ru: "немного", uk: "трохи", fa: "کم", ar: "قليل", sq: "pak", tr: "az", fr: "peu", es: "poco", it: "poco", pl: "trochę" },
  all: { de: "alle", vi: "tất cả", ru: "все", uk: "усі", fa: "همه", ar: "كل", sq: "të gjithë", tr: "hepsi", fr: "tous", es: "todos", it: "tutti", pl: "wszyscy" },
  first: { de: "zuerst", vi: "đầu tiên", ru: "сначала", uk: "спочатку", fa: "اول", ar: "أولًا", sq: "së pari", tr: "önce", fr: "d'abord", es: "primero", it: "prima", pl: "najpierw" },
  new: { de: "neu", vi: "mới", ru: "новый", uk: "новий", fa: "جدید", ar: "جديد", sq: "i ri", tr: "yeni", fr: "nouveau", es: "nuevo", it: "nuovo", pl: "nowy" },
  still: { de: "noch", vi: "vẫn", ru: "ещё", uk: "ще", fa: "هنوز", ar: "ما زال", sq: "ende", tr: "hâlâ", fr: "encore", es: "todavía", it: "ancora", pl: "nadal" },
  already: { de: "schon", vi: "đã", ru: "уже", uk: "вже", fa: "قبلاً", ar: "بالفعل", sq: "tashmë", tr: "zaten", fr: "déjà", es: "ya", it: "già", pl: "już" },
  soon: { de: "bald", vi: "sớm", ru: "скоро", uk: "скоро", fa: "به‌زودی", ar: "قريبًا", sq: "së shpejti", tr: "yakında", fr: "bientôt", es: "pronto", it: "presto", pl: "wkrótce" },
  again: { de: "wieder", vi: "lại", ru: "снова", uk: "знову", fa: "دوباره", ar: "مرة أخرى", sq: "përsëri", tr: "yeniden", fr: "encore", es: "otra vez", it: "di nuovo", pl: "znowu" },
  one: { de: "eins", vi: "một", ru: "один", uk: "один", fa: "یک", ar: "واحد", sq: "një", tr: "bir", fr: "un", es: "uno", it: "uno", pl: "jeden" },
  two: { de: "zwei", vi: "hai", ru: "два", uk: "два", fa: "دو", ar: "اثنان", sq: "dy", tr: "iki", fr: "deux", es: "dos", it: "due", pl: "dwa" },
  answer: { de: "Antwort", vi: "câu trả lời", ru: "ответ", uk: "відповідь", fa: "پاسخ", ar: "إجابة", sq: "përgjigje", tr: "cevap", fr: "réponse", es: "respuesta", it: "risposta", pl: "odpowiedź" },
  reply: { de: "Antwort", vi: "trả lời", ru: "ответ", uk: "відповідь", fa: "پاسخ", ar: "رد", sq: "përgjigje", tr: "yanıt", fr: "réponse", es: "respuesta", it: "risposta", pl: "odpowiedź" },
  problem: { de: "Problem", vi: "vấn đề", ru: "проблема", uk: "проблема", fa: "مشکل", ar: "مشكلة", sq: "problem", tr: "sorun", fr: "problème", es: "problema", it: "problema", pl: "problem" },
  meeting: { de: "Treffen", vi: "cuộc gặp", ru: "встреча", uk: "зустріч", fa: "جلسه", ar: "لقاء", sq: "takim", tr: "toplantı", fr: "rencontre", es: "reunión", it: "incontro", pl: "spotkanie" },
  event: { de: "Event", vi: "sự kiện", ru: "мероприятие", uk: "подія", fa: "رویداد", ar: "فعالية", sq: "ngjarje", tr: "etkinlik", fr: "événement", es: "evento", it: "evento", pl: "wydarzenie" },
  seat: { de: "Platz", vi: "chỗ ngồi", ru: "место", uk: "місце", fa: "صندلی", ar: "مقعد", sq: "vend", tr: "koltuk", fr: "place", es: "asiento", it: "posto", pl: "miejsce" },
  address: { de: "Adresse", vi: "địa chỉ", ru: "адрес", uk: "адреса", fa: "آدرس", ar: "عنوان", sq: "adresë", tr: "adres", fr: "adresse", es: "dirección", it: "indirizzo", pl: "adres" },
  photo: { de: "Foto", vi: "ảnh", ru: "фото", uk: "фото", fa: "عکس", ar: "صورة", sq: "foto", tr: "fotoğraf", fr: "photo", es: "foto", it: "foto", pl: "zdjęcie" },
  document: { de: "Dokument", vi: "tài liệu", ru: "документ", uk: "документ", fa: "مدرک", ar: "مستند", sq: "dokument", tr: "belge", fr: "document", es: "documento", it: "documento", pl: "dokument" },
  homework: { de: "Hausaufgabe", vi: "bài tập về nhà", ru: "домашнее задание", uk: "домашнє завдання", fa: "تکلیف", ar: "واجب منزلي", sq: "detyrë shtëpie", tr: "ödev", fr: "devoir", es: "tarea", it: "compito", pl: "praca domowa" },
  presentation: { de: "Präsentation", vi: "bài thuyết trình", ru: "презентация", uk: "презентація", fa: "ارائه", ar: "عرض تقديمي", sq: "prezantim", tr: "sunum", fr: "présentation", es: "presentación", it: "presentazione", pl: "prezentacja" },
  feedback: { de: "Feedback", vi: "phản hồi", ru: "обратная связь", uk: "відгук", fa: "بازخورد", ar: "ملاحظات", sq: "koment", tr: "geri bildirim", fr: "retour", es: "comentarios", it: "feedback", pl: "opinia" },
  travel: { de: "Reise", vi: "chuyến đi", ru: "поездка", uk: "подорож", fa: "سفر", ar: "رحلة", sq: "udhëtim", tr: "seyahat", fr: "voyage", es: "viaje", it: "viaggio", pl: "podróż" },
};

const IRREGULAR_BASES: Record<string, string> = {
  asks: "ask",
  says: "say",
  thinks: "think",
  wants: "want",
  needs: "need",
  looks: "look",
  meets: "meet",
  comes: "come",
  goes: "go",
  waits: "wait",
  buys: "buy",
  finds: "find",
  sends: "send",
  explains: "explain",
  helps: "help",
  works: "work",
  travels: "travel",
  visits: "visit",
  speaks: "speak",
  arrives: "arrive",
  changes: "change",
  cancels: "cancel",
  gives: "give",
  takes: "take",
  sees: "see",
  writes: "write",
  brings: "bring",
  reserves: "reserve",
  receives: "receive",
  includes: "include",
  manages: "manage",
  finishes: "finish",
  postpones: "postpone",
  improves: "improve",
  divides: "divide",
  loads: "load",
  prepares: "prepare",
  ordered: "order",
  looked: "look",
  changed: "change",
  cancelled: "cancel",
  booked: "book",
  included: "include",
  arrived: "arrive",
  received: "receive",
  finished: "finish",
  needed: "need",
  wanted: "want",
  invited: "invite",
  worried: "worry",
  planning: "plan",
  waiting: "wait",
  traveling: "travel",
  travelling: "travel",
  studying: "study",
  working: "work",
  looking: "look",
  using: "use",
  speaking: "speak",
  going: "go",
  coming: "come",
  writing: "write",
  making: "make",
  taking: "take",
  giving: "give",
  children: "child",
  women: "woman",
  men: "man",
  people: "person",
  documents: "document",
  tickets: "ticket",
  minutes: "minute",
  points: "point",
  helpers: "helper",
  guests: "guest",
  tasks: "task",
  problems: "problem",
  friends: "friend",
  groups: "group",
  messages: "message",
};

function normalizePracticeLocale(locale: string): MiniGamesPracticeLocale {
  const normalizedLocale = locale.toLowerCase();
  if (normalizedLocale.startsWith("de")) return "de";
  if (normalizedLocale.startsWith("ru")) return "ru";
  if (normalizedLocale.startsWith("uk")) return "uk";
  if (normalizedLocale.startsWith("vi")) return "vi";
  if (normalizedLocale.startsWith("fa")) return "fa";
  if (normalizedLocale.startsWith("ar")) return "ar";
  if (normalizedLocale.startsWith("sq")) return "sq";
  if (normalizedLocale.startsWith("tr")) return "tr";
  if (normalizedLocale.startsWith("fr")) return "fr";
  if (normalizedLocale.startsWith("es")) return "es";
  if (normalizedLocale.startsWith("it")) return "it";
  if (normalizedLocale.startsWith("pl")) return "pl";
  return "en";
}

type PhraseOverrideLocale = "fa" | "ar";

const PHRASE_OVERRIDE_ENTRIES = Object.entries(PRACTICE_PHRASE_OVERRIDES)
  .map(([phrase, translations]) => ({
    phrase,
    lowered: phrase.toLowerCase(),
    translations,
  }))
  .sort((left, right) => right.phrase.length - left.phrase.length);

const FA_SENTENCE_POLISH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^من (?=(می|باید|دار|فکر می|پیشنهاد می|متوجه شدم|می‌خواهم))/u, ""],
  [/^ما (?=(می|باید|دار|فکر می|پیشنهاد می|متوجه شدیم|می‌خواهیم))/u, ""],
  [/دوست من/gu, "دوستم"],
  [/در وقت استراحت/gu, "سرِ استراحت"],
  [/وقت ناهار/gu, "برای ناهار"],
  [/پیش خانواده/gu, "با خانواده"],
  [/فوراً صورت‌حساب را/gu, "صورت‌حساب را همان‌جا"],
  [/باور داریم/gu, "فکر می‌کنیم"],
  [/این برداشت را دارم که/gu, "به نظرم"],
  [/این برداشت را داریم که/gu, "به نظرمان"],
  [/همکارم این برداشت را دارد که/gu, "همکارم فکر می‌کند که"],
  [/مشتری این برداشت را دارد که/gu, "مشتری فکر می‌کند که"],
  [/گروه این برداشت را دارد که/gu, "گروه فکر می‌کند که"],
  [/می‌خواهم روشن کنم که/gu, "می‌خواهم روشن کنم"],
  [/می‌خواهیم روشن کنیم که/gu, "می‌خواهیم روشن کنیم"],
  [/روی یک برنامه زمانی واقع‌بینانه توافق کنیم/gu, "روی یک زمان‌بندی واقع‌بینانه به توافق برسیم"],
  [/اول پرسش‌های فوری‌تر را روشن کنیم/gu, "اول تکلیف پرسش‌های فوری‌تر را روشن کنیم"],
];

const AR_SENTENCE_POLISH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^أنا /u, ""],
  [/^نحن /u, ""],
  [/^أود أن /u, "أريد أن "],
  [/^نود أن /u, "نريد أن "],
  [/صديقي يود أن/gu, "صديقي يريد أن"],
  [/السائح يود أن/gu, "السائح يريد أن"],
  [/الزائر يود أن/gu, "الزائر يريد أن"],
  [/الضيف يود أن/gu, "الضيف يريد أن"],
  [/المجموعة تود أن/gu, "المجموعة تريد أن"],
  [/زميلتي تود أن توضح/gu, "زميلتي تريد أن توضح"],
  [/العميل يود أن يوضح/gu, "العميل يريد أن يوضح"],
  [/الإدارة تود أن توضح/gu, "الإدارة تريد أن توضح"],
  [/لدي انطباع بأن/gu, "أشعر أن"],
  [/لدينا انطباع بأن/gu, "نشعر أن"],
  [/لدى زميلتي انطباع بأن/gu, "تشعر زميلتي أن"],
  [/لدى العميل انطباع بأن/gu, "يشعر العميل أن"],
  [/لدى المجموعة انطباع بأن/gu, "تشعر المجموعة أن"],
  [/في المقهى عند الثامنة\./gu, "في المقهى الساعة الثامنة."],
];

const FA_CONVERSATIONAL_SENTENCE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^من /u, ""],
  [/^ما /u, ""],
  [/برای دوره به یک دفتر/gu, "برای کلاس یک دفتر"],
  [/در ایستگاه به کمی اطلاعات/gu, "در ایستگاه به کمی راهنمایی"],
  [/بعداً با اداره تماس می‌گیرم/gu, "بعداً به دفتر زنگ می‌زنم"],
  [/فردا با هتل تماس می‌گیرم/gu, "فردا به هتل زنگ می‌زنم"],
  [/بعد از دوره دوباره تماس می‌گیرم/gu, "بعد از کلاس دوباره زنگ می‌زنم"],
  [/امروز یک بار دیگر تماس می‌گیرم/gu, "امروز یک بار دیگر زنگ می‌زنم"],
  [/اول تکلیف پرسش‌های فوری‌تر را روشن کنیم/gu, "اول تکلیف پرسش‌های فوری‌تر را مشخص کنیم"],
];

const AR_CONVERSATIONAL_SENTENCE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/ما الأولويات التي نحددها اليوم\./gu, "ما أولوياتنا اليوم؟"],
  [/هل لا يزال من الممكن تغيير الاقتراح\./gu, "هل ما زال بالإمكان تغيير الاقتراح؟"],
  [/كيف ينبغي أن نتصرف بأفضل طريقة في هذه الحالة\./gu, "ما أفضل طريقة للتصرف في هذه الحالة؟"],
  [/من الذي سيتولى الخطوة التالية\./gu, "من سيتولى الخطوة التالية؟"],
  [/العملية أصبحت معقدة جدًا\./gu, "العملية صارت معقدة جدًا."],
  [/علينا أن نبلغ أبكر\./gu, "علينا أن نبلّغ في وقت أبكر."],
  [/المهام موزعة بشكل غير عادل\./gu, "المهام موزعة بطريقة غير عادلة."],
  [/لا تزال هناك تفاصيل مهمة ناقصة\./gu, "ما زالت هناك تفاصيل مهمة ناقصة."],
  [/إعادة هيكلة العملية من جديد\./gu, "إعادة تنظيم سير العمل من جديد."],
  [/تدوين الملاحظات كتابةً\./gu, "توثيق الملاحظات كتابيًا."],
  [/توضيح الأسئلة الأكثر إلحاحًا أولًا\./gu, "حسم الأسئلة الأكثر إلحاحًا أولًا."],
  [/الاتفاق على جدول زمني واقعي\./gu, "وضع جدول زمني واقعي."],
];

function normalizeEnglishWord(word: string): string {
  const lower = word.toLowerCase().replace(/^'+|'+$/g, "");
  if (!lower) return lower;
  if (IRREGULAR_BASES[lower]) return IRREGULAR_BASES[lower];
  if (lower.endsWith("'s")) return lower.slice(0, -2);
  if (lower.endsWith("ies") && lower.length > 4) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith("ing") && lower.length > 5) {
    const withoutIng = lower.slice(0, -3);
    return withoutIng.endsWith("v") ? `${withoutIng}e` : withoutIng;
  }
  if (lower.endsWith("ed") && lower.length > 4) {
    const withoutEd = lower.slice(0, -2);
    return withoutEd.endsWith("v") ? `${withoutEd}e` : withoutEd;
  }
  if (lower.endsWith("es") && lower.length > 4) return lower.slice(0, -2);
  if (lower.endsWith("s") && lower.length > 3) return lower.slice(0, -1);
  return lower;
}

function preserveCase(source: string, target: string): string {
  if (!target) return target;
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return `${target[0]?.toUpperCase() ?? ""}${target.slice(1)}`;
  }
  return target;
}

function translateWord(word: string, locale: Exclude<MiniGamesPracticeLocale, "en" | "de">): string {
  const normalized = normalizeEnglishWord(word);
  const direct = FUNCTION_WORDS[normalized]?.[locale];
  if (typeof direct === "string") return preserveCase(word, direct);
  if (hasMiniGamesGloss(normalized, locale)) {
    return preserveCase(word, getMiniGamesGloss(normalized, locale));
  }
  return word;
}

function isEnglishWordChar(value: string | undefined): boolean {
  return typeof value === "string" && /[A-Za-z']/.test(value);
}

function matchPhraseOverride(
  source: string,
  index: number,
  locale: PhraseOverrideLocale,
): { translated: string; length: number } | null {
  const loweredSource = source.toLowerCase();

  for (const entry of PHRASE_OVERRIDE_ENTRIES) {
    const translated = entry.translations[locale];
    if (typeof translated !== "string" || !translated.trim()) continue;
    if (!loweredSource.startsWith(entry.lowered, index)) continue;

    const previousChar = source[index - 1];
    const nextChar = source[index + entry.phrase.length];
    if (isEnglishWordChar(previousChar) || isEnglishWordChar(nextChar)) continue;

    return {
      translated,
      length: entry.phrase.length,
    };
  }

  return null;
}

function translateEnglishMeaning(
  englishText: string,
  locale: Exclude<MiniGamesPracticeLocale, "en" | "de">,
): string {
  if (locale === "fa" || locale === "ar") {
    const translatedParts: string[] = [];
    let index = 0;

    while (index < englishText.length) {
      const phraseMatch = matchPhraseOverride(englishText, index, locale);
      if (phraseMatch) {
        translatedParts.push(phraseMatch.translated);
        index += phraseMatch.length;
        continue;
      }

      const currentChar = englishText[index];
      if (isEnglishWordChar(currentChar)) {
        let wordEnd = index + 1;
        while (wordEnd < englishText.length && isEnglishWordChar(englishText[wordEnd])) {
          wordEnd += 1;
        }
        translatedParts.push(translateWord(englishText.slice(index, wordEnd), locale));
        index = wordEnd;
        continue;
      }

      translatedParts.push(currentChar);
      index += 1;
    }

    return translatedParts
      .join("")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,!?;:])/g, "$1")
      .trim();
  }

  const parts = englishText.match(/([A-Za-z']+|[^A-Za-z']+)/g) ?? [englishText];
  const translatedParts: string[] = [];

  for (const part of parts) {
    if (!/[A-Za-z']/.test(part)) {
      translatedParts.push(part);
      continue;
    }
    const translated = translateWord(part, locale);
    if (!translated.trim() && translatedParts.length) {
      continue;
    }
    translatedParts.push(translated);
  }

  return translatedParts
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

export function localizePracticeMeaning(
  englishText: string,
  locale: string,
  germanFallback?: string,
): string {
  const normalizedLocale = normalizePracticeLocale(locale);
  if (normalizedLocale === "de") return germanFallback ?? englishText;
  if (normalizedLocale === "en") return englishText;
  const exactOverride =
    PRACTICE_MEANING_OVERRIDES[englishText]?.[
      normalizedLocale as keyof (typeof PRACTICE_MEANING_OVERRIDES)[string]
    ];
  if (typeof exactOverride === "string" && exactOverride.trim()) return exactOverride;
  return translateEnglishMeaning(
    englishText,
    normalizedLocale as Exclude<MiniGamesPracticeLocale, "en" | "de">,
  );
}

export function localizePracticeMeta(
  englishText: string,
  locale: string,
  germanFallback?: string,
): string {
  const normalizedLocale = normalizePracticeLocale(locale);
  if (normalizedLocale === "en") return englishText;
  if (normalizedLocale === "de") return germanFallback ?? englishText;
  return translateEnglishMeaning(
    englishText,
    normalizedLocale as Exclude<MiniGamesPracticeLocale, "en" | "de">,
  );
}

export function polishSentenceMeaningForLocale(text: string, locale: string): string {
  const normalizedLocale = normalizePracticeLocale(locale);
  const replacements =
    normalizedLocale === "fa"
      ? FA_SENTENCE_POLISH_REPLACEMENTS
      : normalizedLocale === "ar"
        ? AR_SENTENCE_POLISH_REPLACEMENTS
        : null;
  const conversationalReplacements =
    normalizedLocale === "fa"
      ? FA_CONVERSATIONAL_SENTENCE_REPLACEMENTS
      : normalizedLocale === "ar"
        ? AR_CONVERSATIONAL_SENTENCE_REPLACEMENTS
        : null;

  if (!replacements && !conversationalReplacements) return text;

  let polished = text;
  for (const [pattern, replacement] of replacements ?? []) {
    polished = polished.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of conversationalReplacements ?? []) {
    polished = polished.replace(pattern, replacement);
  }

  return polished.replace(/\s+/g, " ").trim();
}
