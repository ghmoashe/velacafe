export type MiniGamesText = {
  navLabel: string;
  title: string;
  subtitle: string;
  articleMode: string;
  grammarMode?: string;
  wQuestionMode?: string;
  translateMode: string;
  sentenceMode: string;
  chatMode: string;
  storyMode?: string;
  scoreBadge: string;
  timerBadge: string;
  statsAccuracy: string;
  statsStreak: string;
  statsBest: string;
  articlePrompt: string;
  wQuestionPrompt?: string;
  translatePrompt: string;
  translateInputPlaceholder?: string;
  submitTranslation?: string;
  sentencePrompt: string;
  chatPrompt: string;
  storyPrompt?: string;
  chooseArticle: string;
  chooseGrammar?: string;
  chooseWQuestion?: string;
  chooseTranslation: string;
  chooseSentence: string;
  chooseChat: string;
  chooseStory?: string;
  correct: string;
  incorrect: string;
  nextQuestion: string;
  hintLabel: string;
  sourceLabel: string;
  levelLabel: string;
  scoreLabel: string;
  explainArticle: string;
  explainGrammar?: string;
  explainWQuestion?: string;
  explainTranslation: string;
  explainSentence: string;
  explainChat: string;
  explainStory?: string;
  timeout: string;
  articleMissingLabel: string;
  starsLabel: string;
  checkSentence: string;
  clearSentence: string;
  sentenceHintLabel: string;
  sentenceEmpty: string;
  wQuestionHintLabel?: string;
  wQuestionAnswerLabel?: string;
  chatHintLabel: string;
  chatScenarioLabel: string;
  storyHintLabel?: string;
  storyQuestionLabel?: string;
  storySettingLabel?: string;
  storyCharactersLabel?: string;
  storySceneLabel?: string;
  storyDecisionLabel?: string;
  storyEpisodeScoreLabel?: string;
  storyEpisodeResultLabel?: string;
  nextDecisionLabel?: string;
  nextEpisodeLabel?: string;
  grammarTopicsLabel?: string;
  grammarRuleLabel?: string;
  grammarFlowLabel?: string;
  grammarFocusLabel?: string;
  grammarContrastLabel?: string;
  grammarMixedLabel?: string;
  levelFilterLabel: string;
  livesBadge?: string;
  livesInfinite?: string;
  livesEmptyTitle?: string;
  livesEmptyCopy?: string;
  premiumLivesCopy?: string;
  signInSyncHint?: string;
  dailyChallengeLabel?: string;
  dailyChallengeCopy?: string;
  dailyChallengePlay?: string;
  dailyChallengeDone?: string;
  dailyChallengeComplete?: string;
  dailyChallengeBack?: string;
  leaderboardLabel?: string;
  leaderboardDaily?: string;
  leaderboardAllTime?: string;
  leaderboardEmpty?: string;
  leaderboardUnavailable?: string;
  listenLabel?: string;
  listenAriaLabel?: string;
  speechProviderBrowserLabel?: string;
  speechProviderElevenLabsLabel?: string;
  voiceAutoLabel?: string;
  voiceLoadingLabel?: string;
  voiceSignInLabel?: string;
  voiceSelectAriaLabel?: string;
};

type MiniGamesLocale =
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

const ENGLISH_TEXT: MiniGamesText = {
  navLabel: "Practice",
  title: "Mini games",
  subtitle:
    "Train vocabulary with quick rounds: guess the article, translate words, build sentences, and pick natural chat replies.",
  articleMode: "Guess article",
  grammarMode: "Grammar cases",
  wQuestionMode: "W-Fragen",
  translateMode: "Translate words",
  sentenceMode: "Build sentence",
  chatMode: "Chat simulator",
  storyMode: "Story mode",
  scoreBadge: "Score",
  timerBadge: "Time",
  statsAccuracy: "Accuracy",
  statsStreak: "Streak",
  statsBest: "Best streak",
  articlePrompt: "Choose the correct German article.",
  wQuestionPrompt: "Choose the correct W-question word.",
  translatePrompt: "Choose the correct translation.",
  translateInputPlaceholder: "Type the translation",
  submitTranslation: "Check answer",
  sentencePrompt: "Put the words in the correct order.",
  chatPrompt: "Choose the best reply in the chat.",
  storyPrompt: "Read the scene and choose the best continuation.",
  chooseArticle: "Pick der, die, or das.",
  chooseGrammar: "Choose the correct case form.",
  chooseWQuestion: "Pick the W-word that completes the question.",
  chooseTranslation: "Pick the right meaning.",
  chooseSentence: "Tap the words to build the sentence.",
  chooseChat: "Pick the most natural reply.",
  chooseStory: "Pick the answer that fits the story best.",
  correct: "Correct",
  incorrect: "Not quite",
  nextQuestion: "Next question",
  hintLabel: "Hint",
  sourceLabel: "Word",
  levelLabel: "Level",
  scoreLabel: "Score",
  explainArticle: "Remember the noun together with its article.",
  explainGrammar:
    "Watch the signal word: verb, preposition, and movement vs. location decide the case.",
  explainWQuestion:
    "Match the missing information: person, thing, place, time, reason, direction, or possession.",
  explainTranslation: "Repeat the pair aloud to lock it in faster.",
  explainSentence: "Build the sentence from left to right and listen for the rhythm.",
  explainChat: "Focus on the goal of the message: confirm, ask, help, or respond politely.",
  explainStory: "Look for the response that solves the situation clearly and naturally.",
  timeout: "Time is up",
  articleMissingLabel: "Choose article:",
  starsLabel: "Streak",
  checkSentence: "Check sentence",
  clearSentence: "Clear",
  sentenceHintLabel: "Meaning",
  sentenceEmpty: "Tap a word below to start the sentence.",
  wQuestionHintLabel: "Meaning",
  wQuestionAnswerLabel: "Answer",
  chatHintLabel: "Meaning",
  chatScenarioLabel: "Scenario",
  storyHintLabel: "Story",
  storyQuestionLabel: "Question",
  storySettingLabel: "Place",
  storyCharactersLabel: "Characters",
  storySceneLabel: "Scene",
  storyDecisionLabel: "Decision",
  storyEpisodeScoreLabel: "Episode score",
  storyEpisodeResultLabel: "Episode result",
  nextDecisionLabel: "Next decision",
  nextEpisodeLabel: "Next episode",
  grammarTopicsLabel: "Grammar topics",
  grammarRuleLabel: "Rule",
  grammarFlowLabel: "Training flow",
  grammarFocusLabel: "Focus",
  grammarContrastLabel: "Contrast",
  grammarMixedLabel: "Mixed traps",
  levelFilterLabel: "Level filter",
  livesBadge: "Lives",
  livesInfinite: "Premium",
  livesEmptyTitle: "No lives left",
  livesEmptyCopy:
    "You lose one life for a wrong answer or timeout. One life comes back every 2 hours.",
  premiumLivesCopy: "Premium keeps your lives unlimited.",
  signInSyncHint:
    "Sign in to save progress, daily challenge, and leaderboard results.",
  dailyChallengeLabel: "Daily challenge",
  dailyChallengeCopy:
    "One fixed challenge every day. Finish it once to enter the daily leaderboard.",
  dailyChallengePlay: "Play daily challenge",
  dailyChallengeDone: "Completed for today.",
  dailyChallengeComplete: "Completed",
  dailyChallengeBack: "Back to practice",
  leaderboardLabel: "Leaderboard",
  leaderboardDaily: "Today",
  leaderboardAllTime: "All time",
  leaderboardEmpty: "No results yet.",
  leaderboardUnavailable:
    "Leaderboard is temporarily unavailable. Check your connection and try again.",
  listenLabel: "Listen",
  listenAriaLabel: "Play German pronunciation",
  speechProviderBrowserLabel: "Browser",
  speechProviderElevenLabsLabel: "11Labs",
  voiceAutoLabel: "Auto",
  voiceLoadingLabel: "Loading voices...",
  voiceSignInLabel: "Sign in to use ElevenLabs",
  voiceSelectAriaLabel: "Select pronunciation voice",
};

const MINI_GAMES_TEXT: Record<MiniGamesLocale, MiniGamesText> = {
  en: ENGLISH_TEXT,
  de: {
    navLabel: "Übung",
    title: "Minispiele",
    subtitle:
      "Trainiere deinen Wortschatz in schnellen Runden: Artikel raten, Wörter übersetzen, Sätze bauen und natürliche Chat-Antworten wählen.",
    articleMode: "Artikel raten",
    grammarMode: "Fälle trainieren",
    translateMode: "Wörter übersetzen",
    sentenceMode: "Satz bauen",
    chatMode: "Chat-Simulator",
    scoreBadge: "Punkte",
    timerBadge: "Zeit",
    statsAccuracy: "Trefferquote",
    statsStreak: "Serie",
    statsBest: "Beste Serie",
    articlePrompt: "Wähle den richtigen deutschen Artikel.",
    translatePrompt: "Wähle die richtige Übersetzung.",
    sentencePrompt: "Bringe die Wörter in die richtige Reihenfolge.",
    chatPrompt: "Wähle die beste Antwort im Chat.",
    chooseArticle: "Wähle der, die oder das.",
    chooseGrammar: "Wähle die richtige Kasusform.",
    chooseTranslation: "Wähle die richtige Bedeutung.",
    chooseSentence: "Tippe auf die Wörter, um den Satz zu bauen.",
    chooseChat: "Wähle die natürlichste Antwort.",
    correct: "Richtig",
    incorrect: "Fast",
    nextQuestion: "Nächste Frage",
    hintLabel: "Hinweis",
    sourceLabel: "Wort",
    levelLabel: "Niveau",
    scoreLabel: "Punkte",
    explainArticle: "Lerne das Nomen immer zusammen mit seinem Artikel.",
    explainGrammar:
      "Achte auf Signalwörter: Verb, Präposition und Bewegung oder Ort entscheiden den Fall.",
    explainTranslation: "Sprich das Wortpaar laut aus, damit es besser hängen bleibt.",
    explainSentence: "Baue den Satz von links nach rechts und achte auf den Rhythmus.",
    explainChat: "Achte auf das Ziel der Nachricht: bestätigen, fragen, helfen oder höflich reagieren.",
    timeout: "Zeit ist abgelaufen",
    articleMissingLabel: "Artikel wählen:",
    starsLabel: "Serie",
    checkSentence: "Satz prüfen",
    clearSentence: "Leeren",
    sentenceHintLabel: "Bedeutung",
    sentenceEmpty: "Tippe unten auf ein Wort, um den Satz zu starten.",
    chatHintLabel: "Bedeutung",
    chatScenarioLabel: "Situation",
    grammarTopicsLabel: "Grammatikthemen",
    grammarRuleLabel: "Regel",
    grammarFlowLabel: "Trainingsfluss",
    grammarFocusLabel: "Fokus",
    grammarContrastLabel: "Kontrast",
    grammarMixedLabel: "Mischfallen",
    levelFilterLabel: "Niveaufilter",
  },
  vi: {
    navLabel: "Luyện tập",
    title: "Trò chơi nhỏ",
    subtitle:
      "Luyện từ vựng với các vòng chơi nhanh: đoán mạo từ, dịch từ, sắp xếp câu và chọn câu trả lời tự nhiên trong chat.",
    articleMode: "Đoán mạo từ",
    translateMode: "Dịch từ",
    sentenceMode: "Xây câu",
    chatMode: "Mô phỏng chat",
    scoreBadge: "Điểm",
    timerBadge: "Thời gian",
    statsAccuracy: "Độ chính xác",
    statsStreak: "Chuỗi đúng",
    statsBest: "Chuỗi tốt nhất",
    articlePrompt: "Chọn mạo từ tiếng Đức đúng.",
    translatePrompt: "Chọn bản dịch đúng.",
    sentencePrompt: "Sắp xếp các từ theo đúng thứ tự.",
    chatPrompt: "Chọn câu trả lời tốt nhất trong đoạn chat.",
    chooseArticle: "Chọn der, die hoặc das.",
    chooseTranslation: "Chọn nghĩa đúng.",
    chooseSentence: "Chạm vào các từ để ghép câu.",
    chooseChat: "Chọn câu trả lời tự nhiên nhất.",
    correct: "Đúng",
    incorrect: "Chưa đúng",
    nextQuestion: "Câu tiếp theo",
    hintLabel: "Gợi ý",
    sourceLabel: "Từ",
    levelLabel: "Trình độ",
    scoreLabel: "Điểm",
    explainArticle: "Hãy nhớ danh từ cùng với mạo từ của nó.",
    explainTranslation: "Đọc to cặp từ để nhớ nhanh hơn.",
    explainSentence: "Ghép câu từ trái sang phải và cảm nhận nhịp điệu.",
    explainChat: "Tập trung vào mục đích của tin nhắn: xác nhận, hỏi, giúp đỡ hoặc trả lời lịch sự.",
    timeout: "Hết giờ",
    articleMissingLabel: "Chọn mạo từ:",
    starsLabel: "Chuỗi đúng",
    checkSentence: "Kiểm tra câu",
    clearSentence: "Xóa",
    sentenceHintLabel: "Nghĩa",
    sentenceEmpty: "Chạm vào một từ bên dưới để bắt đầu câu.",
    chatHintLabel: "Nghĩa",
    chatScenarioLabel: "Tình huống",
    levelFilterLabel: "Lọc trình độ",
  },
  ru: {
    navLabel: "Практика",
    title: "Мини-игры",
    subtitle:
      "Тренируй словарный запас в быстрых раундах: угадывай артикль, переводи слова, собирай предложения и выбирай естественные ответы в чате.",
    articleMode: "Угадай артикль",
    grammarMode: "Падежи",
    translateMode: "Перевод слов",
    sentenceMode: "Собери предложение",
    chatMode: "Симулятор чата",
    scoreBadge: "Счёт",
    timerBadge: "Время",
    statsAccuracy: "Точность",
    statsStreak: "Серия",
    statsBest: "Лучшая серия",
    articlePrompt: "Выбери правильный немецкий артикль.",
    translatePrompt: "Выбери правильный перевод.",
    sentencePrompt: "Поставь слова в правильном порядке.",
    chatPrompt: "Выбери лучший ответ в чате.",
    chooseArticle: "Выбери der, die или das.",
    chooseGrammar: "Выбери правильную падежную форму.",
    chooseTranslation: "Выбери правильное значение.",
    chooseSentence: "Нажимай на слова, чтобы собрать предложение.",
    chooseChat: "Выбери самый естественный ответ.",
    correct: "Верно",
    incorrect: "Не совсем",
    nextQuestion: "Следующий вопрос",
    hintLabel: "Подсказка",
    sourceLabel: "Слово",
    levelLabel: "Уровень",
    scoreLabel: "Счёт",
    explainArticle: "Запоминай существительное сразу вместе с артиклем.",
    explainGrammar:
      "Смотри на сигнал в предложении: глагол, предлог и направление движения или место определяют падеж.",
    explainTranslation: "Повторяй пару слов вслух, чтобы быстрее запомнить.",
    explainSentence: "Собирай предложение слева направо и слушай его ритм.",
    explainChat: "Смотри на цель сообщения: подтвердить, спросить, помочь или ответить вежливо.",
    timeout: "Время вышло",
    articleMissingLabel: "Выбери артикль:",
    starsLabel: "Серия",
    checkSentence: "Проверить предложение",
    clearSentence: "Очистить",
    sentenceHintLabel: "Значение",
    sentenceEmpty: "Нажми на слово ниже, чтобы начать предложение.",
    chatHintLabel: "Значение",
    chatScenarioLabel: "Ситуация",
    grammarTopicsLabel: "Темы грамматики",
    grammarRuleLabel: "Правило",
    grammarFlowLabel: "Тренировочный поток",
    grammarFocusLabel: "Фокус",
    grammarContrastLabel: "Контраст",
    grammarMixedLabel: "Смешанные ловушки",
    levelFilterLabel: "Фильтр уровня",
  },
  uk: {
    navLabel: "Практика",
    title: "Мініігри",
    subtitle:
      "Тренуй словниковий запас у швидких раундах: вгадуй артикль, перекладай слова, збирай речення та обирай природні відповіді в чаті.",
    articleMode: "Вгадай артикль",
    translateMode: "Переклад слів",
    sentenceMode: "Збери речення",
    chatMode: "Симулятор чату",
    scoreBadge: "Рахунок",
    timerBadge: "Час",
    statsAccuracy: "Точність",
    statsStreak: "Серія",
    statsBest: "Найкраща серія",
    articlePrompt: "Обери правильний німецький артикль.",
    translatePrompt: "Обери правильний переклад.",
    sentencePrompt: "Розташуй слова у правильному порядку.",
    chatPrompt: "Обери найкращу відповідь у чаті.",
    chooseArticle: "Обери der, die або das.",
    chooseTranslation: "Обери правильне значення.",
    chooseSentence: "Натискай на слова, щоб скласти речення.",
    chooseChat: "Обери найприроднішу відповідь.",
    correct: "Правильно",
    incorrect: "Не зовсім",
    nextQuestion: "Наступне питання",
    hintLabel: "Підказка",
    sourceLabel: "Слово",
    levelLabel: "Рівень",
    scoreLabel: "Рахунок",
    explainArticle: "Запам'ятовуй іменник разом з артиклем.",
    explainTranslation: "Повторюй пару слів уголос, щоб швидше запам'ятати.",
    explainSentence: "Будуй речення зліва направо й відчуй його ритм.",
    explainChat: "Дивись на мету повідомлення: підтвердити, запитати, допомогти або відповісти ввічливо.",
    timeout: "Час вийшов",
    articleMissingLabel: "Обери артикль:",
    starsLabel: "Серія",
    checkSentence: "Перевірити речення",
    clearSentence: "Очистити",
    sentenceHintLabel: "Значення",
    sentenceEmpty: "Натисни на слово нижче, щоб почати речення.",
    chatHintLabel: "Значення",
    chatScenarioLabel: "Ситуація",
    levelFilterLabel: "Фільтр рівня",
  },
  fa: {
    navLabel: "تمرین",
    title: "مینی‌گیم‌ها",
    subtitle:
      "واژگان را در دورهای سریع تمرین کن: آرتیکل را حدس بزن، واژه‌ها را ترجمه کن، جمله بساز و در گفت‌وگو طبیعی‌ترین پاسخ را انتخاب کن.",
    articleMode: "حدس آرتیکل",
    translateMode: "ترجمه کلمات",
    sentenceMode: "ساخت جمله",
    chatMode: "شبیه‌ساز گفت‌وگو",
    scoreBadge: "امتیاز",
    timerBadge: "زمان",
    statsAccuracy: "دقت",
    statsStreak: "رشته",
    statsBest: "بهترین رشته",
    articlePrompt: "آرتیکل درست آلمانی را انتخاب کن.",
    translatePrompt: "ترجمه درست را انتخاب کن.",
    sentencePrompt: "کلمه‌ها را به ترتیب درست بچین.",
    chatPrompt: "بهترین پاسخ را در گفت‌وگو انتخاب کن.",
    chooseArticle: "بین der، die و das انتخاب کن.",
    chooseTranslation: "ترجمهٔ درست را انتخاب کن.",
    chooseSentence: "برای ساختن جمله روی واژه‌ها بزن.",
    chooseChat: "طبیعی‌ترین پاسخ را انتخاب کن.",
    correct: "درست",
    incorrect: "کاملاً درست نیست",
    nextQuestion: "پرسش بعدی",
    hintLabel: "راهنما",
    sourceLabel: "واژه",
    levelLabel: "سطح",
    scoreLabel: "امتیاز",
    explainArticle: "اسم را همراه با آرتیکل آن حفظ کن.",
    explainTranslation: "جفت واژه را با صدای بلند تکرار کن تا سریع‌تر در ذهن بماند.",
    explainSentence: "جمله را از چپ به راست بساز و به آهنگ طبیعی آن گوش بده.",
    explainChat: "روی هدف پیام تمرکز کن: تأیید کردن، پرسیدن، کمک خواستن یا پاسخ مؤدبانه.",
    timeout: "زمان تمام شد",
    articleMissingLabel: "آرتیکل را انتخاب کن",
    starsLabel: "رشته",
    checkSentence: "بررسی جمله",
    clearSentence: "پاک کردن",
    sentenceHintLabel: "معنی",
    sentenceEmpty: "برای شروع جمله، روی یکی از واژه‌های پایین بزن.",
    chatHintLabel: "معنی",
    chatScenarioLabel: "موقعیت",
    levelFilterLabel: "فیلتر سطح",
  },
  ar: {
    navLabel: "تدرّب",
    title: "ألعاب مصغّرة",
    subtitle:
      "درّب مفرداتك في جولات سريعة: خمّن أداة التعريف، ترجم الكلمات، كوّن الجمل، واختر الردّ الأنسب في الدردشة.",
    articleMode: "تخمين الأداة",
    translateMode: "ترجمة الكلمات",
    sentenceMode: "تركيب جملة",
    chatMode: "محاكي المحادثة",
    scoreBadge: "النقاط",
    timerBadge: "الوقت",
    statsAccuracy: "الدقة",
    statsStreak: "السلسلة",
    statsBest: "أفضل سلسلة",
    articlePrompt: "اختر أداة التعريف الألمانية الصحيحة.",
    translatePrompt: "اختر الترجمة الصحيحة.",
    sentencePrompt: "رتّب الكلمات بالترتيب الصحيح.",
    chatPrompt: "اختر أفضل ردّ في الدردشة.",
    chooseArticle: "اختر der أو die أو das.",
    chooseTranslation: "اختر المعنى الصحيح.",
    chooseSentence: "اضغط على الكلمات لتكوين الجملة.",
    chooseChat: "اختر الردّ الأكثر طبيعية.",
    correct: "صحيح",
    incorrect: "ليس صحيحًا تمامًا",
    nextQuestion: "السؤال التالي",
    hintLabel: "تلميح",
    sourceLabel: "الكلمة",
    levelLabel: "المستوى",
    scoreLabel: "النقاط",
    explainArticle: "احفظ الاسم مع أداة التعريف الخاصة به.",
    explainTranslation: "كرّر الكلمتين بصوت عالٍ لتثبيت المعنى بسرعة أكبر.",
    explainSentence: "كوّن الجملة من اليسار إلى اليمين واستمع إلى إيقاعها.",
    explainChat: "ركّز على هدف الرسالة: تأكيد، سؤال، مساعدة، أو ردّ مهذب.",
    timeout: "انتهى الوقت",
    articleMissingLabel: "اختر أداة التعريف",
    starsLabel: "السلسلة",
    checkSentence: "تحقّق من الجملة",
    clearSentence: "مسح",
    sentenceHintLabel: "المعنى",
    sentenceEmpty: "اضغط على كلمة من الأسفل لبدء الجملة.",
    chatHintLabel: "المعنى",
    chatScenarioLabel: "الموقف",
    levelFilterLabel: "تصفية المستوى",
  },
  sq: {
    navLabel: "Praktikë",
    title: "Mini-lojëra",
    subtitle:
      "Stërvit fjalorin me raunde të shpejta: gjej artikullin, përkthe fjalët, ndërto fjali dhe zgjidh përgjigjen natyrale në chat.",
    articleMode: "Gjej artikullin",
    translateMode: "Përkthe fjalët",
    sentenceMode: "Ndërto fjali",
    chatMode: "Simulator chati",
    scoreBadge: "Pikë",
    timerBadge: "Koha",
    statsAccuracy: "Saktësia",
    statsStreak: "Seria",
    statsBest: "Seria më e mirë",
    articlePrompt: "Zgjidh artikullin e saktë gjerman.",
    translatePrompt: "Zgjidh përkthimin e saktë.",
    sentencePrompt: "Vendosi fjalët në rendin e saktë.",
    chatPrompt: "Zgjidh përgjigjen më të mirë në chat.",
    chooseArticle: "Zgjidh der, die ose das.",
    chooseTranslation: "Zgjidh kuptimin e saktë.",
    chooseSentence: "Prek fjalët për të ndërtuar fjalinë.",
    chooseChat: "Zgjidh përgjigjen më natyrale.",
    correct: "Saktë",
    incorrect: "Jo tamam",
    nextQuestion: "Pyetja tjetër",
    hintLabel: "Ndihmë",
    sourceLabel: "Fjala",
    levelLabel: "Niveli",
    scoreLabel: "Pikë",
    explainArticle: "Mbaje mend emrin bashkë me artikullin e tij.",
    explainTranslation: "Përsërite çiftin me zë për ta fiksuar më shpejt.",
    explainSentence: "Ndërto fjalinë nga e majta në të djathtë dhe ndieje ritmin.",
    explainChat: "Fokusoju qëllimit të mesazhit: konfirmo, pyet, ndihmo ose përgjigju me mirësjellje.",
    timeout: "Koha mbaroi",
    articleMissingLabel: "Zgjidh artikullin:",
    starsLabel: "Seria",
    checkSentence: "Kontrollo fjalinë",
    clearSentence: "Pastro",
    sentenceHintLabel: "Kuptimi",
    sentenceEmpty: "Prek një fjalë më poshtë për të nisur fjalinë.",
    chatHintLabel: "Kuptimi",
    chatScenarioLabel: "Situata",
    levelFilterLabel: "Filtri i nivelit",
  },
  tr: {
    navLabel: "Alıştırma",
    title: "Mini oyunlar",
    subtitle:
      "Kelime bilgisini hızlı turlarla geliştir: artikeli tahmin et, kelimeleri çevir, cümle kur ve sohbette en doğal cevabı seç.",
    articleMode: "Artikel tahmini",
    translateMode: "Kelime çevirisi",
    sentenceMode: "Cümle kur",
    chatMode: "Chat simülatörü",
    scoreBadge: "Puan",
    timerBadge: "Süre",
    statsAccuracy: "Doğruluk",
    statsStreak: "Seri",
    statsBest: "En iyi seri",
    articlePrompt: "Doğru Almanca artikeli seç.",
    translatePrompt: "Doğru çeviriyi seç.",
    sentencePrompt: "Kelimeleri doğru sıraya koy.",
    chatPrompt: "Sohbette en iyi cevabı seç.",
    chooseArticle: "der, die veya das seç.",
    chooseTranslation: "Doğru anlamı seç.",
    chooseSentence: "Cümleyi kurmak için kelimelere dokun.",
    chooseChat: "En doğal cevabı seç.",
    correct: "Doğru",
    incorrect: "Tam değil",
    nextQuestion: "Sonraki soru",
    hintLabel: "İpucu",
    sourceLabel: "Kelime",
    levelLabel: "Seviye",
    scoreLabel: "Puan",
    explainArticle: "İsmi artikeliyle birlikte öğren.",
    explainTranslation: "Kelime çiftini yüksek sesle tekrar et, daha hızlı akılda kalır.",
    explainSentence: "Cümleyi soldan sağa kur ve ritmini dinle.",
    explainChat: "Mesajın amacına odaklan: onayla, sor, yardım et ya da kibarca cevap ver.",
    timeout: "Süre doldu",
    articleMissingLabel: "Artikeli seç:",
    starsLabel: "Seri",
    checkSentence: "Cümleyi kontrol et",
    clearSentence: "Temizle",
    sentenceHintLabel: "Anlam",
    sentenceEmpty: "Cümleyi başlatmak için aşağıdaki bir kelimeye dokun.",
    chatHintLabel: "Anlam",
    chatScenarioLabel: "Durum",
    levelFilterLabel: "Seviye filtresi",
  },
  fr: {
    navLabel: "Pratique",
    title: "Mini-jeux",
    subtitle:
      "Travaille le vocabulaire avec des manches rapides : devine l'article, traduis les mots, construis des phrases et choisis la réponse naturelle dans le chat.",
    articleMode: "Deviner l'article",
    translateMode: "Traduire les mots",
    sentenceMode: "Construire une phrase",
    chatMode: "Simulateur de chat",
    scoreBadge: "Score",
    timerBadge: "Temps",
    statsAccuracy: "Précision",
    statsStreak: "Série",
    statsBest: "Meilleure série",
    articlePrompt: "Choisis le bon article allemand.",
    translatePrompt: "Choisis la bonne traduction.",
    sentencePrompt: "Mets les mots dans le bon ordre.",
    chatPrompt: "Choisis la meilleure réponse dans le chat.",
    chooseArticle: "Choisis der, die ou das.",
    chooseTranslation: "Choisis le bon sens.",
    chooseSentence: "Appuie sur les mots pour construire la phrase.",
    chooseChat: "Choisis la réponse la plus naturelle.",
    correct: "Correct",
    incorrect: "Pas tout à fait",
    nextQuestion: "Question suivante",
    hintLabel: "Indice",
    sourceLabel: "Mot",
    levelLabel: "Niveau",
    scoreLabel: "Score",
    explainArticle: "Mémorise le nom avec son article.",
    explainTranslation: "Répète la paire à voix haute pour mieux la retenir.",
    explainSentence: "Construis la phrase de gauche à droite et écoute son rythme.",
    explainChat: "Concentre-toi sur l'objectif du message : confirmer, demander, aider ou répondre poliment.",
    timeout: "Le temps est écoulé",
    articleMissingLabel: "Choisir l'article :",
    starsLabel: "Série",
    checkSentence: "Vérifier la phrase",
    clearSentence: "Effacer",
    sentenceHintLabel: "Sens",
    sentenceEmpty: "Appuie sur un mot ci-dessous pour commencer la phrase.",
    chatHintLabel: "Sens",
    chatScenarioLabel: "Situation",
    levelFilterLabel: "Filtre de niveau",
  },
  es: {
    navLabel: "Práctica",
    title: "Mini juegos",
    subtitle:
      "Entrena vocabulario con rondas rápidas: adivina el artículo, traduce palabras, construye frases y elige la respuesta natural en el chat.",
    articleMode: "Adivina el artículo",
    translateMode: "Traducir palabras",
    sentenceMode: "Construir frase",
    chatMode: "Simulador de chat",
    scoreBadge: "Puntos",
    timerBadge: "Tiempo",
    statsAccuracy: "Precisión",
    statsStreak: "Racha",
    statsBest: "Mejor racha",
    articlePrompt: "Elige el artículo alemán correcto.",
    translatePrompt: "Elige la traducción correcta.",
    sentencePrompt: "Pon las palabras en el orden correcto.",
    chatPrompt: "Elige la mejor respuesta en el chat.",
    chooseArticle: "Elige der, die o das.",
    chooseTranslation: "Elige el significado correcto.",
    chooseSentence: "Toca las palabras para construir la frase.",
    chooseChat: "Elige la respuesta más natural.",
    correct: "Correcto",
    incorrect: "Casi",
    nextQuestion: "Siguiente pregunta",
    hintLabel: "Pista",
    sourceLabel: "Palabra",
    levelLabel: "Nivel",
    scoreLabel: "Puntos",
    explainArticle: "Recuerda el sustantivo junto con su artículo.",
    explainTranslation: "Repite la pareja en voz alta para fijarla más rápido.",
    explainSentence: "Construye la frase de izquierda a derecha y escucha el ritmo.",
    explainChat: "Concéntrate en el objetivo del mensaje: confirmar, preguntar, ayudar o responder con cortesía.",
    timeout: "Se acabó el tiempo",
    articleMissingLabel: "Elige el artículo:",
    starsLabel: "Racha",
    checkSentence: "Comprobar frase",
    clearSentence: "Borrar",
    sentenceHintLabel: "Significado",
    sentenceEmpty: "Toca una palabra abajo para empezar la frase.",
    chatHintLabel: "Significado",
    chatScenarioLabel: "Situación",
    levelFilterLabel: "Filtro de nivel",
  },
  it: {
    navLabel: "Pratica",
    title: "Mini giochi",
    subtitle:
      "Allena il vocabolario con round veloci: indovina l'articolo, traduci le parole, costruisci frasi e scegli la risposta naturale nella chat.",
    articleMode: "Indovina l'articolo",
    translateMode: "Traduci parole",
    sentenceMode: "Costruisci frase",
    chatMode: "Simulatore chat",
    scoreBadge: "Punteggio",
    timerBadge: "Tempo",
    statsAccuracy: "Precisione",
    statsStreak: "Serie",
    statsBest: "Migliore serie",
    articlePrompt: "Scegli l'articolo tedesco corretto.",
    translatePrompt: "Scegli la traduzione corretta.",
    sentencePrompt: "Metti le parole nell'ordine giusto.",
    chatPrompt: "Scegli la risposta migliore nella chat.",
    chooseArticle: "Scegli der, die o das.",
    chooseTranslation: "Scegli il significato giusto.",
    chooseSentence: "Tocca le parole per costruire la frase.",
    chooseChat: "Scegli la risposta più naturale.",
    correct: "Corretto",
    incorrect: "Non proprio",
    nextQuestion: "Prossima domanda",
    hintLabel: "Suggerimento",
    sourceLabel: "Parola",
    levelLabel: "Livello",
    scoreLabel: "Punteggio",
    explainArticle: "Ricorda il sostantivo insieme al suo articolo.",
    explainTranslation: "Ripeti la coppia ad alta voce per fissarla più in fretta.",
    explainSentence: "Costruisci la frase da sinistra a destra e ascoltane il ritmo.",
    explainChat: "Concentrati sull'obiettivo del messaggio: confermare, chiedere, aiutare o rispondere con cortesia.",
    timeout: "Tempo scaduto",
    articleMissingLabel: "Scegli l'articolo:",
    starsLabel: "Serie",
    checkSentence: "Controlla frase",
    clearSentence: "Cancella",
    sentenceHintLabel: "Significato",
    sentenceEmpty: "Tocca una parola sotto per iniziare la frase.",
    chatHintLabel: "Significato",
    chatScenarioLabel: "Situazione",
    levelFilterLabel: "Filtro livello",
  },
  pl: {
    navLabel: "Ćwiczenia",
    title: "Mini gry",
    subtitle:
      "Trenuj słownictwo w szybkich rundach: zgaduj rodzajnik, tłumacz słowa, układaj zdania i wybieraj naturalną odpowiedź na czacie.",
    articleMode: "Zgadnij rodzajnik",
    translateMode: "Tłumaczenie słów",
    sentenceMode: "Ułóż zdanie",
    chatMode: "Symulator czatu",
    scoreBadge: "Wynik",
    timerBadge: "Czas",
    statsAccuracy: "Dokładność",
    statsStreak: "Seria",
    statsBest: "Najlepsza seria",
    articlePrompt: "Wybierz poprawny niemiecki rodzajnik.",
    translatePrompt: "Wybierz poprawne tłumaczenie.",
    sentencePrompt: "Ułóż słowa we właściwej kolejności.",
    chatPrompt: "Wybierz najlepszą odpowiedź na czacie.",
    chooseArticle: "Wybierz der, die lub das.",
    chooseTranslation: "Wybierz poprawne znaczenie.",
    chooseSentence: "Klikaj słowa, aby zbudować zdanie.",
    chooseChat: "Wybierz najbardziej naturalną odpowiedź.",
    correct: "Dobrze",
    incorrect: "Jeszcze nie",
    nextQuestion: "Następne pytanie",
    hintLabel: "Wskazówka",
    sourceLabel: "Słowo",
    levelLabel: "Poziom",
    scoreLabel: "Wynik",
    explainArticle: "Zapamiętuj rzeczownik razem z jego rodzajnikiem.",
    explainTranslation: "Powtarzaj parę słów na głos, żeby szybciej ją utrwalić.",
    explainSentence: "Buduj zdanie od lewej do prawej i wsłuchaj się w jego rytm.",
    explainChat: "Skup się na celu wiadomości: potwierdzić, zapytać, pomóc albo odpowiedzieć uprzejmie.",
    timeout: "Czas minął",
    articleMissingLabel: "Wybierz rodzajnik:",
    starsLabel: "Seria",
    checkSentence: "Sprawdź zdanie",
    clearSentence: "Wyczyść",
    sentenceHintLabel: "Znaczenie",
    sentenceEmpty: "Kliknij słowo poniżej, aby rozpocząć zdanie.",
    chatHintLabel: "Znaczenie",
    chatScenarioLabel: "Sytuacja",
    levelFilterLabel: "Filtr poziomu",
  },
};

const W_QUESTION_TEXT_OVERRIDES: Partial<
  Record<MiniGamesLocale, Partial<MiniGamesText>>
> = {
  de: {
    wQuestionMode: "W-Fragen",
    wQuestionPrompt: "Wähle das passende W-Fragewort.",
    chooseWQuestion: "Wähle das W-Wort, das die Frage ergänzt.",
    explainWQuestion:
      "Achte darauf, ob nach Person, Sache, Ort, Richtung, Grund, Mittel oder Zweck gefragt wird.",
    wQuestionHintLabel: "Bedeutung",
    wQuestionAnswerLabel: "Antwortsatz",
  },
  ru: {
    wQuestionMode: "W-вопросы",
    wQuestionPrompt: "Выбери правильное W-слово для вопроса.",
    chooseWQuestion: "Выбери W-слово, которое дополняет вопрос.",
    explainWQuestion:
      "Смотри, спрашивает ли вопрос о человеке, предмете, месте, направлении, причине, средстве или цели.",
    wQuestionHintLabel: "Перевод",
    wQuestionAnswerLabel: "Пример ответа",
  },
};

const W_QUESTION_TEXT_OVERRIDES_ALL_LOCALES: Partial<
  Record<MiniGamesLocale, Partial<MiniGamesText>>
> = {
  de: {
    wQuestionMode: "W-Fragen",
    wQuestionPrompt: "Wähle das passende W-Fragewort.",
    chooseWQuestion: "Wähle das W-Wort, das die Frage ergänzt.",
    explainWQuestion:
      "Achte darauf, ob nach Person, Sache, Ort, Richtung, Grund, Mittel oder Zweck gefragt wird.",
    wQuestionHintLabel: "Bedeutung",
    wQuestionAnswerLabel: "Antwortsatz",
  },
  vi: {
    wQuestionMode: "Câu hỏi W",
    wQuestionPrompt: "Chọn từ hỏi W phù hợp.",
    chooseWQuestion: "Chọn từ W hoàn thành câu hỏi.",
    explainWQuestion:
      "Hãy chú ý xem câu hỏi hỏi về người, vật, địa điểm, hướng, lý do, phương tiện hay mục đích.",
    wQuestionHintLabel: "Nghĩa",
    wQuestionAnswerLabel: "Câu trả lời mẫu",
  },
  ru: {
    wQuestionMode: "W-вопросы",
    wQuestionPrompt: "Выбери правильное W-слово для вопроса.",
    chooseWQuestion: "Выбери W-слово, которое дополняет вопрос.",
    explainWQuestion:
      "Смотри, спрашивает ли вопрос о человеке, предмете, месте, направлении, причине, средстве или цели.",
    wQuestionHintLabel: "Перевод",
    wQuestionAnswerLabel: "Пример ответа",
  },
  uk: {
    wQuestionMode: "W-запитання",
    wQuestionPrompt: "Вибери правильне W-слово для запитання.",
    chooseWQuestion: "Вибери W-слово, яке доповнює запитання.",
    explainWQuestion:
      "Дивись, чи йдеться про людину, предмет, місце, напрямок, причину, засіб або мету.",
    wQuestionHintLabel: "Переклад",
    wQuestionAnswerLabel: "Приклад відповіді",
  },
  fa: {
    wQuestionMode: "پرسش‌های W",
    wQuestionPrompt: "واژهٔ W مناسب را انتخاب کن.",
    chooseWQuestion: "واژهٔ W را انتخاب کن که پرسش را کامل می‌کند.",
    explainWQuestion:
      "دقت کن که پرسش دربارهٔ شخص، چیز، مکان، جهت، دلیل، وسیله یا هدف است.",
    wQuestionHintLabel: "معنی",
    wQuestionAnswerLabel: "نمونهٔ پاسخ",
  },
  ar: {
    wQuestionMode: "أسئلة W",
    wQuestionPrompt: "اختر كلمة W المناسبة.",
    chooseWQuestion: "اختر كلمة W التي تُكمل السؤال.",
    explainWQuestion:
      "انتبه: هل السؤال عن شخص، شيء، مكان، اتجاه، سبب، وسيلة، أم غاية؟",
    wQuestionHintLabel: "المعنى",
    wQuestionAnswerLabel: "مثال جواب",
  },
  sq: {
    wQuestionMode: "Pyetjet W",
    wQuestionPrompt: "Zgjidh fjalën e duhur W për pyetjen.",
    chooseWQuestion: "Zgjidh fjalën W që plotëson pyetjen.",
    explainWQuestion:
      "Shiko nëse pyetja kërkon person, send, vend, drejtim, arsye, mjet ose qëllim.",
    wQuestionHintLabel: "Kuptimi",
    wQuestionAnswerLabel: "Fjalia e përgjigjes",
  },
  tr: {
    wQuestionMode: "W soruları",
    wQuestionPrompt: "Soru için doğru W sözcüğünü seç.",
    chooseWQuestion: "Soruyu tamamlayan W sözcüğünü seç.",
    explainWQuestion:
      "Sorunun kişi, şey, yer, yön, neden, araç ya da amaç sorduğuna dikkat et.",
    wQuestionHintLabel: "Anlam",
    wQuestionAnswerLabel: "Cevap cümlesi",
  },
  fr: {
    wQuestionMode: "Questions en W",
    wQuestionPrompt: "Choisis le bon mot interrogatif en W.",
    chooseWQuestion: "Choisis le mot en W qui complète la question.",
    explainWQuestion:
      "Regarde si la question porte sur une personne, une chose, un lieu, une direction, une raison, un moyen ou un but.",
    wQuestionHintLabel: "Sens",
    wQuestionAnswerLabel: "Phrase-réponse",
  },
  es: {
    wQuestionMode: "Preguntas con W",
    wQuestionPrompt: "Elige la palabra W correcta para la pregunta.",
    chooseWQuestion: "Elige la palabra W que completa la pregunta.",
    explainWQuestion:
      "Fíjate si la pregunta va sobre una persona, una cosa, un lugar, una dirección, una razón, un medio o una finalidad.",
    wQuestionHintLabel: "Significado",
    wQuestionAnswerLabel: "Frase de respuesta",
  },
  it: {
    wQuestionMode: "Domande con W",
    wQuestionPrompt: "Scegli la parola W corretta per la domanda.",
    chooseWQuestion: "Scegli la parola W che completa la domanda.",
    explainWQuestion:
      "Osserva se la domanda riguarda una persona, una cosa, un luogo, una direzione, una ragione, un mezzo o uno scopo.",
    wQuestionHintLabel: "Significato",
    wQuestionAnswerLabel: "Frase di risposta",
  },
  pl: {
    wQuestionMode: "Pytania z W",
    wQuestionPrompt: "Wybierz poprawne słowo W do pytania.",
    chooseWQuestion: "Wybierz słowo W, które uzupełnia pytanie.",
    explainWQuestion:
      "Zwróć uwagę, czy pytanie dotyczy osoby, rzeczy, miejsca, kierunku, powodu, środka czy celu.",
    wQuestionHintLabel: "Znaczenie",
    wQuestionAnswerLabel: "Zdanie z odpowiedzią",
  },
};

function normalizeMiniGamesLocale(locale: string): MiniGamesLocale {
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

export function getMiniGamesText(locale: string): MiniGamesText {
  const normalizedLocale = normalizeMiniGamesLocale(locale);
  return {
    ...ENGLISH_TEXT,
    ...(MINI_GAMES_TEXT[normalizedLocale] ?? MINI_GAMES_TEXT.en),
    ...(W_QUESTION_TEXT_OVERRIDES[normalizedLocale] ?? {}),
    ...(W_QUESTION_TEXT_OVERRIDES_ALL_LOCALES[normalizedLocale] ?? {}),
  };
}
