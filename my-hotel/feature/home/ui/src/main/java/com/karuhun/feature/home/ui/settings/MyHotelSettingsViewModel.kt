package com.karuhun.feature.home.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.SaveBookingUseCase
import com.karuhun.core.domain.usecase.SaveWallpaperUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

object MyHotelSettingsContract {
    data class UiState(
        val hotelName: String = "",
        val hotelSlug: String = "",
        val savedRoomNumber: String = "",
        // Live edit buffer for the room keypad.
        val roomInput: String = "",
        val wallpaperUrl: String = "",
        val savedMessage: String? = null,
    )
    sealed interface UiAction {
        data class RoomDigit(val digit: String) : UiAction
        data object RoomBackspace : UiAction
        data object SaveRoom : UiAction
        data class SelectWallpaper(val url: String) : UiAction
        data object DismissMessage : UiAction
    }
    sealed interface UiEffect
}

@HiltViewModel
class MyHotelSettingsViewModel @Inject constructor(
    private val getBookingUseCase: GetBookingUseCase,
    private val saveBookingUseCase: SaveBookingUseCase,
    private val saveWallpaperUseCase: SaveWallpaperUseCase,
) : ViewModel(),
    MVI<MyHotelSettingsContract.UiState, MyHotelSettingsContract.UiAction, MyHotelSettingsContract.UiEffect> by mvi(
        initialState = MyHotelSettingsContract.UiState(),
    ) {

    init {
        viewModelScope.launch {
            getBookingUseCase().firstOrNull()?.let { booking ->
                updateUiState {
                    copy(
                        hotelName = booking.hotelName,
                        hotelSlug = booking.hotelSlug,
                        savedRoomNumber = booking.roomNumber,
                        roomInput = booking.roomNumber,
                        wallpaperUrl = booking.wallpaperUrl,
                    )
                }
            }
        }
    }

    override fun onAction(action: MyHotelSettingsContract.UiAction) {
        when (action) {
            is MyHotelSettingsContract.UiAction.RoomDigit -> updateUiState {
                if (roomInput.length >= 6) this else copy(roomInput = roomInput + action.digit)
            }
            MyHotelSettingsContract.UiAction.RoomBackspace -> updateUiState {
                copy(roomInput = roomInput.dropLast(1))
            }
            MyHotelSettingsContract.UiAction.SaveRoom -> saveRoom()
            is MyHotelSettingsContract.UiAction.SelectWallpaper -> selectWallpaper(action.url)
            MyHotelSettingsContract.UiAction.DismissMessage -> updateUiState { copy(savedMessage = null) }
        }
    }

    private fun saveRoom() = viewModelScope.launch {
        val state = currentUiState
        val room = state.roomInput.trim()
        if (room.isBlank()) {
            updateUiState { copy(savedMessage = "Enter a room number") }
            return@launch
        }
        saveBookingUseCase(state.hotelSlug, state.hotelName, room)
        updateUiState { copy(savedRoomNumber = room, savedMessage = "Room updated to $room") }
    }

    private fun selectWallpaper(url: String) = viewModelScope.launch {
        saveWallpaperUseCase(url)
        updateUiState { copy(wallpaperUrl = url, savedMessage = "Wallpaper updated") }
    }
}
