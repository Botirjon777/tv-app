package com.karuhun.launcher.core.designsystem.locale

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf

/**
 * The currently selected UI language code (e.g. "en", "ru", "uz"), provided at the
 * app root from the device booking. UI chrome is translated via [tr]; menu item
 * names/descriptions are intentionally NOT translated here (they come from the
 * backend with their own per-language fields).
 */
val LocalAppLanguage = staticCompositionLocalOf { "en" }

/** Look up a UI string for the current language, falling back to English. */
@Composable
@ReadOnlyComposable
fun tr(key: String): String = translate(key, LocalAppLanguage.current)

fun translate(key: String, lang: String): String {
    val row = STRINGS[key] ?: return key
    return row[lang.lowercase()] ?: row["en"] ?: key
}

// key -> (langCode -> text). English is the fallback for any missing language.
private val STRINGS: Map<String, Map<String, String>> = mapOf(
    "greeting_morning" to mapOf("en" to "Good morning!", "ru" to "Доброе утро!", "uz" to "Xayrli tong!"),
    "greeting_afternoon" to mapOf("en" to "Good afternoon!", "ru" to "Добрый день!", "uz" to "Xayrli kun!"),
    "greeting_evening" to mapOf("en" to "Good evening!", "ru" to "Добрый вечер!", "uz" to "Xayrli kech!"),
    "greeting_night" to mapOf("en" to "Good night!", "ru" to "Доброй ночи!", "uz" to "Xayrli tun!"),
    "guest" to mapOf("en" to "Guest", "ru" to "Гость", "uz" to "Mehmon"),
    "have_nice_day" to mapOf("en" to "Have a nice day", "ru" to "Хорошего дня", "uz" to "Yaxshi kun tilaymiz"),
    "pleasant_stay" to mapOf("en" to "Have a pleasant stay with us", "ru" to "Приятного отдыха у нас", "uz" to "Yoqimli dam olishingizni tilaymiz"),
    "room" to mapOf("en" to "ROOM", "ru" to "НОМЕР", "uz" to "XONA"),
    "menu" to mapOf("en" to "Menu", "ru" to "Меню", "uz" to "Menyu"),
    "menu_track" to mapOf("en" to "Menu (Track Order)", "ru" to "Меню (Заказ)", "uz" to "Menyu (Buyurtma)"),
    "back" to mapOf("en" to "Back", "ru" to "Назад", "uz" to "Orqaga"),
    "all_apps" to mapOf("en" to "All apps", "ru" to "Все приложения", "uz" to "Barcha ilovalar"),
    "service" to mapOf("en" to "Service", "ru" to "Сервис", "uz" to "Xizmat"),
    "settings" to mapOf("en" to "Settings", "ru" to "Настройки", "uz" to "Sozlamalar"),
    "coming_soon" to mapOf("en" to "Coming soon", "ru" to "Скоро", "uz" to "Tez kunda"),
    "reception" to mapOf("en" to "Reseption", "ru" to "Ресепшн", "uz" to "Qabulxona"),
    "alarm" to mapOf("en" to "Alarm", "ru" to "Будильник", "uz" to "Signal"),
    "choose_language" to mapOf("en" to "Choose your language", "ru" to "Выберите язык", "uz" to "Tilni tanlang"),
    "my_hotel_settings" to mapOf("en" to "My Hotel Settings", "ru" to "Настройки отеля", "uz" to "Mehmonxona sozlamalari"),
    "room_number" to mapOf("en" to "Room number", "ru" to "Номер комнаты", "uz" to "Xona raqami"),
    "wallpaper" to mapOf("en" to "Wallpaper", "ru" to "Обои", "uz" to "Fon rasmi"),
    "enter_pin" to mapOf("en" to "Enter staff PIN", "ru" to "Введите PIN персонала", "uz" to "Xodim PIN kodini kiriting"),
    "wrong_pin" to mapOf("en" to "Wrong PIN — try again", "ru" to "Неверный PIN — попробуйте снова", "uz" to "Noto‘g‘ri PIN — qayta urining"),
    "enter_room" to mapOf("en" to "Enter your room number", "ru" to "Введите номер комнаты", "uz" to "Xona raqamingizni kiriting"),
    "your_order" to mapOf("en" to "Your Order", "ru" to "Ваш заказ", "uz" to "Buyurtmangiz"),
    "total" to mapOf("en" to "Total", "ru" to "Итого", "uz" to "Jami"),
    "place_order" to mapOf("en" to "Place Order", "ru" to "Оформить заказ", "uz" to "Buyurtma berish"),
    "update_order" to mapOf("en" to "Update Order", "ru" to "Обновить заказ", "uz" to "Buyurtmani yangilash"),
    "saving" to mapOf("en" to "Saving…", "ru" to "Сохранение…", "uz" to "Saqlanmoqda…"),
    "add_to_cart" to mapOf("en" to "Add to cart", "ru" to "В корзину", "uz" to "Savatga qo‘shish"),
    "update" to mapOf("en" to "Update", "ru" to "Обновить", "uz" to "Yangilash"),
    "delete" to mapOf("en" to "Delete", "ru" to "Удалить", "uz" to "O‘chirish"),
    "cancel" to mapOf("en" to "Cancel", "ru" to "Отмена", "uz" to "Bekor qilish"),
    "past_orders" to mapOf("en" to "Past orders", "ru" to "Прошлые заказы", "uz" to "Oldingi buyurtmalar"),
    "track_order" to mapOf("en" to "Track order", "ru" to "Отследить заказ", "uz" to "Buyurtmani kuzatish"),
    "order_status" to mapOf("en" to "Order status", "ru" to "Статус заказа", "uz" to "Buyurtma holati"),
    "no_past_orders" to mapOf("en" to "No past orders yet.", "ru" to "Пока нет прошлых заказов.", "uz" to "Hozircha buyurtmalar yo‘q."),
    "loading" to mapOf("en" to "Loading…", "ru" to "Загрузка…", "uz" to "Yuklanmoqda…"),
    "order_received" to mapOf("en" to "Received", "ru" to "Принят", "uz" to "Qabul qilindi"),
    "order_preparing" to mapOf("en" to "Preparing", "ru" to "Готовится", "uz" to "Tayyorlanmoqda"),
    "order_on_its_way" to mapOf("en" to "On its way", "ru" to "В пути", "uz" to "Yo‘lda"),
    "order_delivered" to mapOf("en" to "Delivered", "ru" to "Доставлен", "uz" to "Yetkazildi"),
    "order_cancelled" to mapOf("en" to "Cancelled", "ru" to "Отменён", "uz" to "Bekor qilindi"),
    "back_to_menu" to mapOf("en" to "Back to menu", "ru" to "Назад в меню", "uz" to "Menyuga qaytish"),
    "edit_order" to mapOf("en" to "Edit order", "ru" to "Изменить заказ", "uz" to "Buyurtmani tahrirlash"),
    "thanks_order" to mapOf("en" to "Thanks! Your order is in.", "ru" to "Спасибо! Заказ принят.", "uz" to "Rahmat! Buyurtma qabul qilindi."),
    "order_summary" to mapOf("en" to "Order summary", "ru" to "Состав заказа", "uz" to "Buyurtma tarkibi"),
    "step_received" to mapOf("en" to "Order received", "ru" to "Заказ принят", "uz" to "Buyurtma qabul qilindi"),
    "step_preparing" to mapOf("en" to "Being prepared", "ru" to "Готовится", "uz" to "Tayyorlanmoqda"),
    "step_on_way" to mapOf("en" to "On its way", "ru" to "В пути", "uz" to "Yo‘lda"),
    "step_delivered" to mapOf("en" to "Delivered", "ru" to "Доставлен", "uz" to "Yetkazildi"),
)
