package com.karuhun.feature.home.ui.language

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetMenuGuestUseCase
import com.karuhun.core.domain.usecase.SaveGuestLanguageUseCase
import com.karuhun.core.domain.usecase.SavePreferredLanguageUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

object LanguageSelectContract {
    data class UiState(
        val currentCode: String = "en",
        val isSaving: Boolean = false,
    )
    sealed interface UiAction {
        data class Select(val code: String) : UiAction
    }
    sealed interface UiEffect {
        data object Done : UiEffect
    }
}

@HiltViewModel
class LanguageSelectViewModel @Inject constructor(
    private val getBookingUseCase: GetBookingUseCase,
    private val getMenuGuestUseCase: GetMenuGuestUseCase,
    private val saveGuestLanguageUseCase: SaveGuestLanguageUseCase,
    private val savePreferredLanguageUseCase: SavePreferredLanguageUseCase,
) : ViewModel(),
    MVI<LanguageSelectContract.UiState, LanguageSelectContract.UiAction, LanguageSelectContract.UiEffect> by mvi(
        initialState = LanguageSelectContract.UiState(),
    ) {

    private var hotelSlug: String = ""
    private var roomNumber: String = ""

    init {
        viewModelScope.launch {
            getBookingUseCase().firstOrNull()?.let { booking ->
                hotelSlug = booking.hotelSlug
                roomNumber = booking.roomNumber
                updateUiState {
                    copy(currentCode = booking.preferredLanguage.ifBlank { "en" })
                }
            }
        }
    }

    override fun onAction(action: LanguageSelectContract.UiAction) {
        when (action) {
            is LanguageSelectContract.UiAction.Select -> select(action.code)
        }
    }

    private fun select(code: String) = viewModelScope.launch {
        updateUiState { copy(isSaving = true, currentCode = code) }
        // Always remember the choice locally on the TV.
        savePreferredLanguageUseCase(code)
        // If a named guest is checked in for this room, also store their preference
        // on the backend so it persists with the reservation.
        if (hotelSlug.isNotBlank() && roomNumber.isNotBlank()) {
            getMenuGuestUseCase(hotelSlug, roomNumber).onSuccess { guest ->
                if (guest.hasGuest) {
                    saveGuestLanguageUseCase(hotelSlug, roomNumber, code)
                }
            }
        }
        updateUiState { copy(isSaving = false) }
        emitUiEffect(LanguageSelectContract.UiEffect.Done)
    }
}
