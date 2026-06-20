package com.karuhun.feature.home.ui.model

/**
 * A TV-display language the guest can pick. [code] is the value persisted (locally
 * and to the backend guest), [flag] is the emoji shown on the home chip and list.
 */
data class LanguageOption(
    val code: String,
    val englishName: String,
    val nativeName: String,
    val flag: String,
) {
    companion object {
        val ALL = listOf(
            LanguageOption("en", "English", "English", "🇬🇧"),
            LanguageOption("ru", "Russian", "Русский", "🇷🇺"),
            LanguageOption("uz", "Uzbek", "O'zbekcha", "🇺🇿"),
            LanguageOption("es", "Spanish", "Español", "🇪🇸"),
            LanguageOption("ar", "Arabic", "العربية", "🇸🇦"),
            LanguageOption("tr", "Turkish", "Türkçe", "🇹🇷"),
            LanguageOption("de", "German", "Deutsch", "🇩🇪"),
            LanguageOption("fr", "French", "Français", "🇫🇷"),
            LanguageOption("zh", "Chinese", "中文", "🇨🇳"),
            LanguageOption("hi", "Hindi", "हिन्दी", "🇮🇳"),
            LanguageOption("ja", "Japanese", "日本語", "🇯🇵"),
            LanguageOption("ko", "Korean", "한국어", "🇰🇷"),
            LanguageOption("it", "Italian", "Italiano", "🇮🇹"),
            LanguageOption("pt", "Portuguese", "Português", "🇵🇹"),
        )

        private val DEFAULT = ALL.first()

        fun byCode(code: String): LanguageOption =
            ALL.firstOrNull { it.code.equals(code, ignoreCase = true) } ?: DEFAULT
    }
}
