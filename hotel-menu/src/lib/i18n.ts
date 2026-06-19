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
  | "couldNotLoad";

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
  },
};

export function t(lang: Lang, key: UIKey): string {
  return UI[lang]?.[key] ?? UI.en[key];
}
