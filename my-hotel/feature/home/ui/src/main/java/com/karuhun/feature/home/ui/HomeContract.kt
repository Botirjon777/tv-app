package com.karuhun.feature.home.ui

import com.karuhun.core.datastore.HotelProfile
import com.karuhun.core.model.Hotel
import com.karuhun.core.model.RoomDetail

internal object HomeContract {
    data class UiState(
        val isLoading: Boolean = false,
        val hotelProfile: HotelProfile? = HotelProfile.Empty,
        val roomDetail: RoomDetail? = RoomDetail.Empty,
        // From the device booking + backend guest lookup.
        val roomNumber: String = "",
        val hotelName: String = "",
        val guestName: String = "",
        // True when the guest has an in-progress dining order (PENDING/PREPARING/READY).
        val hasActiveOrder: Boolean = false,
    )
    sealed interface UiAction {
        data object OnMenuItemClick : UiAction
        data object OnMoreClick : UiAction
        data object LoadMenuItems : UiAction
        data object LoadRoomDetail : UiAction
        // Re-check whether a dining order is in progress (e.g. on returning home).
        data object RefreshActiveOrder : UiAction
    }

    sealed interface UiEffect {
        data class ShowError(val message: String) : UiEffect
    }
}