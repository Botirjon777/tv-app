package com.karuhun.launcher

import com.karuhun.core.datastore.HotelProfile
import com.karuhun.core.model.RoomDetail
import com.karuhun.core.model.Weather

object MainContract {
    data class UiState(
        val isLoading: Boolean = false,
        val errorMessage: String? = null,
        val isRefreshing: Boolean = false,
        val hotelProfile: HotelProfile? = HotelProfile.Empty,
        val roomDetail: RoomDetail? = RoomDetail.Empty,
        val isSyncing: Boolean = false,
        val weather: Weather? = null,
        val isOnboardingCompleted: Boolean = false,
        val roomNumber: String = "",
        // A short order-status message shown as a top-left toast overlay.
        val orderStatusToast: String? = null,
    )
    sealed interface UiEffect {
        data class ShowError(val message: String) : UiEffect

    }
    sealed interface UiAction {
        data class ChangeWallpaper(val wallpaper: String) : UiAction
        data class ShowError(val message: String) : UiAction
        data object LoadHotelProfile : UiAction
        data object LoadRoomDetail : UiAction
        data object SubscribeSyncStatus: UiAction
        data object LoadWeather : UiAction
        data object OnboardingCompleted : UiAction
    }
}