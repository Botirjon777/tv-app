package com.karuhun.feature.onboarding.presentation.room

object RoomInputContract {
    data class UiState(
        val roomNumber: String = "",
        val isSaving: Boolean = false,
    )

    sealed interface UiAction {
        data class AppendDigit(val digit: String) : UiAction
        data object Backspace : UiAction
        data class Confirm(val hotelSlug: String, val hotelName: String) : UiAction
    }

    sealed interface UiEffect {
        data object Saved : UiEffect
    }
}
