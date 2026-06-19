package com.karuhun.feature.onboarding.presentation.hotel

import com.karuhun.core.model.MenuHotel

object HotelSelectionContract {
    data class UiState(
        val isLoading: Boolean = false,
        val hotels: List<MenuHotel> = emptyList(),
        val errorMessage: String? = null,
    )

    sealed interface UiAction {
        data object Load : UiAction
    }

    sealed interface UiEffect {
        data class ShowError(val message: String) : UiEffect
    }
}
