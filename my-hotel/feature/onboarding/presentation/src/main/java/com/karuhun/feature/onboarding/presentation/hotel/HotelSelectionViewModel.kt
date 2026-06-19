package com.karuhun.feature.onboarding.presentation.hotel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetMenuHotelsUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HotelSelectionViewModel @Inject constructor(
    private val getMenuHotelsUseCase: GetMenuHotelsUseCase,
) : ViewModel(),
    MVI<HotelSelectionContract.UiState, HotelSelectionContract.UiAction, HotelSelectionContract.UiEffect> by mvi(
        initialState = HotelSelectionContract.UiState(),
    ) {

    init {
        onAction(HotelSelectionContract.UiAction.Load)
    }

    override fun onAction(action: HotelSelectionContract.UiAction) {
        when (action) {
            HotelSelectionContract.UiAction.Load -> loadHotels()
        }
    }

    private fun loadHotels() = viewModelScope.launch {
        updateUiState { copy(isLoading = true, errorMessage = null) }
        getMenuHotelsUseCase()
            .onSuccess { hotels ->
                updateUiState { copy(isLoading = false, hotels = hotels) }
            }
            .onFailure { e ->
                updateUiState { copy(isLoading = false, errorMessage = e.message) }
                emitUiEffect(HotelSelectionContract.UiEffect.ShowError(e.message ?: "Failed to load hotels"))
            }
    }
}
