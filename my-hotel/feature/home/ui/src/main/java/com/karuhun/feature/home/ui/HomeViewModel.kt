package com.karuhun.feature.home.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.CreateServiceRequestUseCase
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
    private val createServiceRequestUseCase: CreateServiceRequestUseCase,
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
                copy(
                    hotelSlug = booking.hotelSlug,
                    roomNumber = booking.roomNumber,
                    hotelName = booking.hotelName,
                )
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
            is HomeContract.UiAction.RequestService -> requestService(action.type)
        }
    }

    // Sends a guest service request (alarm / reception / taxi) to the backend
    // using the stored booking, then surfaces success/failure as an effect.
    private fun requestService(type: String) = viewModelScope.launch {
        val state = uiState.value
        if (state.hotelSlug.isBlank() || state.roomNumber.isBlank()) {
            emitUiEffect(HomeContract.UiEffect.ShowError("Room not set up yet"))
            return@launch
        }
        if (state.isSubmittingRequest) return@launch
        updateUiState { copy(isSubmittingRequest = true) }
        createServiceRequestUseCase(
            hotelSlug = state.hotelSlug,
            roomNumber = state.roomNumber,
            type = type,
        )
            .onSuccess {
                emitUiEffect(HomeContract.UiEffect.ServiceRequested(type))
            }
            .onFailure {
                emitUiEffect(HomeContract.UiEffect.ShowError("Could not send request"))
            }
        updateUiState { copy(isSubmittingRequest = false) }
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