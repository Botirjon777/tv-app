package com.karuhun.feature.onboarding.presentation.room

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.domain.usecase.SaveBookingUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RoomInputViewModel @Inject constructor(
    private val saveBookingUseCase: SaveBookingUseCase,
) : ViewModel(),
    MVI<RoomInputContract.UiState, RoomInputContract.UiAction, RoomInputContract.UiEffect> by mvi(
        initialState = RoomInputContract.UiState(),
    ) {

    override fun onAction(action: RoomInputContract.UiAction) {
        when (action) {
            is RoomInputContract.UiAction.AppendDigit -> {
                if (currentUiState.roomNumber.length < 6) {
                    updateUiState { copy(roomNumber = roomNumber + action.digit) }
                }
            }

            RoomInputContract.UiAction.Backspace -> {
                updateUiState { copy(roomNumber = roomNumber.dropLast(1)) }
            }

            is RoomInputContract.UiAction.Confirm -> confirm(action.hotelSlug, action.hotelName)
        }
    }

    private fun confirm(hotelSlug: String, hotelName: String) = viewModelScope.launch {
        val room = currentUiState.roomNumber.trim()
        if (room.isEmpty()) return@launch
        updateUiState { copy(isSaving = true) }
        saveBookingUseCase(hotelSlug = hotelSlug, hotelName = hotelName, roomNumber = room)
        updateUiState { copy(isSaving = false) }
        emitUiEffect(RoomInputContract.UiEffect.Saved)
    }
}
