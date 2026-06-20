package com.karuhun.feature.home.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetHotelProfileUseCase
import com.karuhun.core.domain.usecase.GetMenuGuestUseCase
import com.karuhun.core.domain.usecase.GetRoomDetailUseCase
import com.karuhun.core.domain.usecase.GetRoomOrdersUseCase
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
    private val getRoomOrdersUseCase: GetRoomOrdersUseCase,
) : ViewModel(),
    MVI<HomeContract.UiState, HomeContract.UiAction, HomeContract.UiEffect> by mvi(initialState = HomeContract.UiState()) {

    // Latest booking, kept so we can re-query active orders on demand.
    private var currentHotelSlug: String = ""
    private var currentRoomNumber: String = ""

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
                copy(
                    roomNumber = booking.roomNumber,
                    hotelName = booking.hotelName,
                    languageCode = booking.preferredLanguage.ifBlank { "en" },
                )
            }
            currentHotelSlug = booking.hotelSlug
            currentRoomNumber = booking.roomNumber
            if (booking.hotelSlug.isNotBlank() && booking.roomNumber.isNotBlank()) {
                getMenuGuestUseCase(booking.hotelSlug, booking.roomNumber)
                    .onSuccess { guest -> updateUiState { copy(guestName = guest.fullName) } }
                    .onFailure { updateUiState { copy(guestName = "") } }
                refreshActiveOrder()
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
            HomeContract.UiAction.RefreshActiveOrder -> { refreshActiveOrder() }
        }
    }

    private fun refreshActiveOrder() = viewModelScope.launch {
        if (currentHotelSlug.isBlank() || currentRoomNumber.isBlank()) return@launch
        getRoomOrdersUseCase(currentHotelSlug, currentRoomNumber, activeOnly = true)
            .onSuccess { orders -> updateUiState { copy(hasActiveOrder = orders.isNotEmpty()) } }
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