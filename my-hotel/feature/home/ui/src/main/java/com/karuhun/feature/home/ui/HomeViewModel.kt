package com.karuhun.feature.home.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetHotelProfileUseCase
import com.karuhun.core.domain.usecase.GetMenuGuestUseCase
import com.karuhun.core.domain.usecase.GetRoomDetailUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class HomeViewModel @Inject constructor(
    private val getHotelProfileUseCase: GetHotelProfileUseCase,
    private val getRoomDetailUseCase: GetRoomDetailUseCase,
    private val getBookingUseCase: GetBookingUseCase,
    private val getMenuGuestUseCase: GetMenuGuestUseCase,
) : ViewModel(),
    MVI<HomeContract.UiState, HomeContract.UiAction, HomeContract.UiEffect> by mvi(initialState = HomeContract.UiState()) {

    init {
        onAction(HomeContract.UiAction.LoadMenuItems)
        onAction(HomeContract.UiAction.LoadRoomDetail)
        observeBookingAndGuest()
    }

    // Reads the stored hotel + room, then fetches the checked-in guest from the
    // backend so the welcome screen greets them by name (or "Guest" if none).
    private fun observeBookingAndGuest() = viewModelScope.launch {
        getBookingUseCase().collect { booking ->
            updateUiState {
                copy(roomNumber = booking.roomNumber, hotelName = booking.hotelName)
            }
            if (booking.hotelSlug.isNotBlank() && booking.roomNumber.isNotBlank()) {
                getMenuGuestUseCase(booking.hotelSlug, booking.roomNumber)
                    .onSuccess { guest -> updateUiState { copy(guestName = guest.fullName) } }
                    .onFailure { updateUiState { copy(guestName = "") } }
            }
        }
    }
    override fun onAction(action: HomeContract.UiAction) {
        when (action) {
            HomeContract.UiAction.LoadMenuItems -> {
                loadMenuItems()
            }

            HomeContract.UiAction.OnMenuItemClick -> {}
            HomeContract.UiAction.OnMoreClick -> {}
            HomeContract.UiAction.LoadRoomDetail -> { loadRoomDetail() }
        }
    }

    private fun loadMenuItems() = viewModelScope.launch {
        updateUiState { copy(isLoading = true) }
        getHotelProfileUseCase().collect { hotelProfile ->
            updateUiState {
                copy(
                    isLoading = false,
                    hotelProfile = hotelProfile,
                )
            }
        }
    }

    private fun loadRoomDetail() = viewModelScope.launch {
        getRoomDetailUseCase().onSuccess { roomDetail ->

        }
            .onSuccess {
                updateUiState {
                    copy(
                        roomDetail = it
                    )
                }
            }
            .onFailure { error ->

            }
    }
}