package com.karuhun.feature.onboarding.presentation.language

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.domain.usecase.SaveGuestLanguageUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

object LanguageContract {
    data class UiState(val isSaving: Boolean = false)
    sealed interface UiAction {
        data class Select(val language: String) : UiAction
    }
    sealed interface UiEffect {
        data object Done : UiEffect
    }
}

@HiltViewModel
class LanguageViewModel @Inject constructor(
    private val saveGuestLanguageUseCase: SaveGuestLanguageUseCase,
    savedStateHandle: SavedStateHandle,
) : ViewModel(),
    MVI<LanguageContract.UiState, LanguageContract.UiAction, LanguageContract.UiEffect> by mvi(
        initialState = LanguageContract.UiState(),
    ) {

    private val hotelSlug: String = savedStateHandle.get<String>("hotelSlug").orEmpty()
    private val roomNumber: String = savedStateHandle.get<String>("roomNumber").orEmpty()

    override fun onAction(action: LanguageContract.UiAction) {
        when (action) {
            is LanguageContract.UiAction.Select -> select(action.language)
        }
    }

    private fun select(language: String) = viewModelScope.launch {
        updateUiState { copy(isSaving = true) }
        // Persist to the backend so this guest skips the language screen next time.
        if (hotelSlug.isNotBlank() && roomNumber.isNotBlank()) {
            saveGuestLanguageUseCase(hotelSlug, roomNumber, language)
        }
        updateUiState { copy(isSaving = false) }
        emitUiEffect(LanguageContract.UiEffect.Done)
    }
}
