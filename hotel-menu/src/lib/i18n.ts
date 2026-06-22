// Supported menu languages. English is the canonical fallback.
export const LANGS = ["en", "ru", "uz"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  ru: "Русский",
  uz: "O‘zbekcha",
};

// Short code shown in the language switcher.
export const LANG_SHORT: Record<Lang, string> = {
  en: "EN",
  ru: "RU",
  uz: "UZ",
};

export type I18nText = Partial<Record<Lang, string>>;

// Parse a JSON-encoded i18n map stored in the DB; tolerant of bad data.
export function parseI18n(raw: string | null | undefined): I18nText {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj as I18nText;
  } catch {
    /* ignore */
  }
  return {};
}

// Resolve a localized string with graceful fallback: chosen lang → English → raw.
export function resolveText(
  i18n: I18nText | undefined,
  lang: Lang,
  fallback = ""
): string {
  return i18n?.[lang] || i18n?.en || fallback;
}

/* ------------------------- Guest-facing UI strings ------------------------- */
// The POS and admin stay in English (staff tools); only the guest menu is localized.

type UIKey =
  | "inRoomDining"
  | "viewCart"
  | "yourOrder"
  | "total"
  | "add"
  | "emptyCart"
  | "notePlaceholder"
  | "placeOrderHint"
  | "placeOrder"
  | "room"
  | "orderStatus"
  | "backToMenu"
  | "orderSummary"
  | "note"
  | "thanks"
  | "orderNo"
  | "menuSoon"
  | "menuSoonSub"
  | "stepReceived"
  | "stepPreparing"
  | "stepReady"
  | "stepDelivered"
  | "cancelledTitle"
  | "cancelledSub"
  | "couldNotPlace"
  | "couldNotLoad"
  | "recommendedToday"
  | "welcome"
  | "howCanWeHelp"
  | "services"
  | "openMenu"
  | "menuSubtitle"
  | "svcAlarm"
  | "svcAlarmSub"
  | "svcService"
  | "svcServiceSub"
  | "svcReception"
  | "svcReceptionSub"
  | "svcTaxi"
  | "svcTaxiSub"
  | "svcProblem"
  | "svcProblemSub"
  | "writeReview"
  | "writeReviewSub"
  | "reviewModalSub"
  | "wifi"
  | "wifiSub"
  | "wifiNetwork"
  | "wifiPasswordLabel"
  | "copy"
  | "copied"
  | "followUs"
  | "askReception"
  | "requestNotePlaceholder"
  | "send"
  | "cancel"
  | "requestSent"
  | "requestSentSub"
  | "requestFailed"
  | "close";

export const UI: Record<Lang, Record<UIKey, string>> = {
  en: {
    inRoomDining: "In-room dining",
    viewCart: "View cart",
    yourOrder: "Your order",
    total: "Total",
    add: "Add",
    emptyCart: "Your cart is empty.",
    notePlaceholder: "Add a note for the kitchen (allergies, preferences…)",
    placeOrderHint: "Your order will be sent straight to the kitchen.",
    placeOrder: "Place order",
    room: "Room",
    orderStatus: "Order status",
    backToMenu: "Back to menu",
    orderSummary: "Order summary",
    note: "Note",
    thanks: "Thanks! Your order is in.",
    orderNo: "Order",
    menuSoon: "Menu coming soon",
    menuSoonSub: "No items are available right now.",
    stepReceived: "Order received",
    stepPreparing: "Being prepared",
    stepReady: "On its way",
    stepDelivered: "Delivered",
    cancelledTitle: "This order was cancelled.",
    cancelledSub: "Please contact the front desk if this is unexpected.",
    couldNotPlace: "Could not place your order",
    couldNotLoad: "We couldn’t load your order.",
    recommendedToday: "Recommended today",
    welcome: "Welcome",
    howCanWeHelp: "How can we help you today?",
    services: "Services",
    openMenu: "In-room dining",
    menuSubtitle: "Browse the menu & order to your room",
    svcAlarm: "Wake-up call",
    svcAlarmSub: "Request an alarm or wake-up",
    svcService: "Services",
    svcServiceSub: "Request housekeeping or assistance",
    svcReception: "Reception",
    svcReceptionSub: "Call the front desk",
    svcTaxi: "Taxi",
    svcTaxiSub: "Request a taxi",
    svcProblem: "Report a problem",
    svcProblemSub: "Tell us about an issue",
    writeReview: "Write a review",
    writeReviewSub: "Share your experience",
    reviewModalSub: "We'd love your feedback — choose where to leave a review:",
    wifi: "Wi-Fi",
    wifiSub: "Connect to our network",
    wifiNetwork: "Network",
    wifiPasswordLabel: "Password",
    copy: "Copy",
    copied: "Copied",
    followUs: "Follow us on social media",
    askReception: "Not available yet — please contact the front desk.",
    requestNotePlaceholder: "Add a note (optional)",
    send: "Send request",
    cancel: "Cancel",
    requestSent: "Request sent",
    requestSentSub: "Our staff have been notified and will assist you shortly.",
    requestFailed: "Could not send your request. Please try again.",
    close: "Close",
  },
  ru: {
    inRoomDining: "Обслуживание в номере",
    viewCart: "Корзина",
    yourOrder: "Ваш заказ",
    total: "Итого",
    add: "Добавить",
    emptyCart: "Ваша корзина пуста.",
    notePlaceholder: "Примечание для кухни (аллергия, пожелания…)",
    placeOrderHint: "Ваш заказ будет отправлен прямо на кухню.",
    placeOrder: "Оформить заказ",
    room: "Номер",
    orderStatus: "Статус заказа",
    backToMenu: "Вернуться в меню",
    orderSummary: "Состав заказа",
    note: "Примечание",
    thanks: "Спасибо! Ваш заказ принят.",
    orderNo: "Заказ",
    menuSoon: "Меню скоро появится",
    menuSoonSub: "Сейчас нет доступных блюд.",
    stepReceived: "Заказ получен",
    stepPreparing: "Готовится",
    stepReady: "В пути",
    stepDelivered: "Доставлено",
    cancelledTitle: "Заказ отменён.",
    cancelledSub: "Свяжитесь со стойкой регистрации, если это неожиданно.",
    couldNotPlace: "Не удалось оформить заказ",
    couldNotLoad: "Не удалось загрузить ваш заказ.",
    recommendedToday: "Рекомендуем сегодня",
    welcome: "Добро пожаловать",
    howCanWeHelp: "Чем можем помочь?",
    services: "Услуги",
    openMenu: "Обслуживание в номере",
    menuSubtitle: "Посмотрите меню и закажите в номер",
    svcAlarm: "Будильник",
    svcAlarmSub: "Запросить будильник",
    svcService: "Услуги",
    svcServiceSub: "Запросить уборку или помощь",
    svcReception: "Рецепция",
    svcReceptionSub: "Позвонить на стойку регистрации",
    svcTaxi: "Такси",
    svcTaxiSub: "Вызвать такси",
    svcProblem: "Сообщить о проблеме",
    svcProblemSub: "Расскажите нам о неполадке",
    writeReview: "Оставить отзыв",
    writeReviewSub: "Поделитесь впечатлениями",
    reviewModalSub: "Будем рады вашему отзыву — выберите, где его оставить:",
    wifi: "Wi-Fi",
    wifiSub: "Подключитесь к нашей сети",
    wifiNetwork: "Сеть",
    wifiPasswordLabel: "Пароль",
    copy: "Копировать",
    copied: "Скопировано",
    followUs: "Подписывайтесь на нас в соцсетях",
    askReception: "Пока недоступно — обратитесь на стойку регистрации.",
    requestNotePlaceholder: "Добавить примечание (необязательно)",
    send: "Отправить запрос",
    cancel: "Отмена",
    requestSent: "Запрос отправлен",
    requestSentSub: "Персонал уведомлён и скоро вам поможет.",
    requestFailed: "Не удалось отправить запрос. Попробуйте снова.",
    close: "Закрыть",
  },
  uz: {
    inRoomDining: "Xona xizmati",
    viewCart: "Savat",
    yourOrder: "Buyurtmangiz",
    total: "Jami",
    add: "Qo‘shish",
    emptyCart: "Savatingiz bo‘sh.",
    notePlaceholder: "Oshxona uchun izoh (allergiya, xohishlar…)",
    placeOrderHint: "Buyurtmangiz to‘g‘ridan-to‘g‘ri oshxonaga yuboriladi.",
    placeOrder: "Buyurtma berish",
    room: "Xona",
    orderStatus: "Buyurtma holati",
    backToMenu: "Menyuga qaytish",
    orderSummary: "Buyurtma tarkibi",
    note: "Izoh",
    thanks: "Rahmat! Buyurtmangiz qabul qilindi.",
    orderNo: "Buyurtma",
    menuSoon: "Menyu tez orada",
    menuSoonSub: "Hozircha mavjud taomlar yo‘q.",
    stepReceived: "Buyurtma qabul qilindi",
    stepPreparing: "Tayyorlanmoqda",
    stepReady: "Yo‘lda",
    stepDelivered: "Yetkazildi",
    cancelledTitle: "Buyurtma bekor qilindi.",
    cancelledSub: "Agar bu kutilmagan bo‘lsa, qabulxonaga murojaat qiling.",
    couldNotPlace: "Buyurtma berib bo‘lmadi",
    couldNotLoad: "Buyurtmangizni yuklab bo‘lmadi.",
    recommendedToday: "Bugungi tavsiya",
    welcome: "Xush kelibsiz",
    howCanWeHelp: "Sizga qanday yordam bera olamiz?",
    services: "Xizmatlar",
    openMenu: "Xona xizmati",
    menuSubtitle: "Menyuni ko‘ring va xonangizga buyurtma bering",
    svcAlarm: "Budilnik",
    svcAlarmSub: "Budilnik so‘rash",
    svcService: "Xizmatlar",
    svcServiceSub: "Tozalash yoki yordam so‘rash",
    svcReception: "Qabulxona",
    svcReceptionSub: "Qabulxonaga qo‘ng‘iroq qilish",
    svcTaxi: "Taksi chaqirish",
    svcTaxiSub: "Taksi chaqirish",
    svcProblem: "Muammo haqida xabar berish",
    svcProblemSub: "Muammo haqida bizga xabar bering",
    writeReview: "Sharh qoldirish",
    writeReviewSub: "Taassurotlaringiz bilan o‘rtoqlashing",
    reviewModalSub: "Fikringizdan mamnun bo‘lamiz — sharhni qayerda qoldirishni tanlang:",
    wifi: "Wi-Fi",
    wifiSub: "Tarmog‘imizga ulaning",
    wifiNetwork: "Tarmoq",
    wifiPasswordLabel: "Parol",
    copy: "Nusxa olish",
    copied: "Nusxa olindi",
    followUs: "Bizni ijtimoiy tarmoqlarda kuzatib boring",
    askReception: "Hozircha mavjud emas — qabulxonaga murojaat qiling.",
    requestNotePlaceholder: "Izoh qo‘shish (ixtiyoriy)",
    send: "So‘rov yuborish",
    cancel: "Bekor qilish",
    requestSent: "So‘rov yuborildi",
    requestSentSub: "Xodimlarimiz xabardor qilindi va tez orada yordam berishadi.",
    requestFailed: "So‘rovni yuborib bo‘lmadi. Qayta urinib ko‘ring.",
    close: "Yopish",
  },
};

export function t(lang: Lang, key: UIKey): string {
  return UI[lang]?.[key] ?? UI.en[key];
}
