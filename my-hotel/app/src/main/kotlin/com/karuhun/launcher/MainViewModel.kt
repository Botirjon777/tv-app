package com.karuhun.launcher

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.common.util.SyncManager
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetHotelProfileUseCase
import com.karuhun.core.domain.usecase.GetRoomDetailUseCase
import com.karuhun.core.domain.usecase.GetRoomOrdersUseCase
import com.karuhun.core.domain.usecase.GetWeatherUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val getHotelProfileUseCase: GetHotelProfileUseCase,
    private val getRoomDetailUseCase: GetRoomDetailUseCase,
    private val getWeatherUseCase: GetWeatherUseCase,
    private val getBookingUseCase: GetBookingUseCase,
    private val getRoomOrdersUseCase: GetRoomOrdersUseCase,
    private val orderNotifier: OrderNotifier,
    private val syncManager: SyncManager
) : ViewModel(),
    MVI<MainContract.UiState, MainContract.UiAction, MainContract.UiEffect> by mvi(initialState = MainContract.UiState()) {

    private var hotelSlug: String = ""
    private var roomNumber: String = ""

    init {
        onAction(MainContract.UiAction.LoadHotelProfile)
        onAction(MainContract.UiAction.LoadRoomDetail)
        onAction(MainContract.UiAction.SubscribeSyncStatus)
        onAction(MainContract.UiAction.LoadWeather)
        observeBooking()
        pollOrderStatus()
    }

    // Persisted onboarding gate: once a hotel + room are saved on this device,
    // skip onboarding on every subsequent launch.
    private fun observeBooking() = viewModelScope.launch {
        getBookingUseCase().collect { booking ->
            hotelSlug = booking.hotelSlug
            roomNumber = booking.roomNumber
            updateUiState {
                copy(
                    isOnboardingCompleted = booking.onboardingComplete,
                    roomNumber = booking.roomNumber,
                )
            }
        }
    }

    // App-wide watcher: polls this room's orders and, whenever one changes
    // status, shows a top-left toast and posts a system notification — so the
    // guest is informed wherever they are (home, menu, or another app).
    private fun pollOrderStatus() = viewModelScope.launch {
        val lastStatus = mutableMapOf<String, String>()
        var primed = false
        while (isActive) {
            if (hotelSlug.isNotBlank() && roomNumber.isNotBlank()) {
                getRoomOrdersUseCase(hotelSlug, roomNumber, activeOnly = false)
                    .onSuccess { orders ->
                        for (order in orders) {
                            val prev = lastStatus[order.id]
                            if (primed && prev != null && prev != order.status) {
                                val msg = statusMessage(order.status)
                                showToast(msg)
                                orderNotifier.notifyStatus(order.id, "Order ${order.id.takeLast(5).uppercase()}", msg)
                            }
                            lastStatus[order.id] = order.status
                        }
                        primed = true
                    }
            }
            delay(5000)
        }
    }

    private fun showToast(message: String) = viewModelScope.launch {
        updateUiState { copy(orderStatusToast = message) }
        delay(6000)
        updateUiState { if (orderStatusToast == message) copy(orderStatusToast = null) else this }
    }

    private fun statusMessage(status: String): String = when (status) {
        "PENDING" -> "Order received"
        "PREPARING" -> "Your order is being prepared"
        "READY" -> "Your order is on its way"
        "DELIVERED" -> "Your order has been delivered"
        "CANCELLED" -> "Your order was cancelled"
        else -> "Order updated"
    }

    override fun onAction(action: MainContract.UiAction) {
        when (action) {
            is MainContract.UiAction.ChangeWallpaper -> {}
            is MainContract.UiAction.ShowError -> {}
            is MainContract.UiAction.LoadHotelProfile -> {
                loadHotelProfile()
            }

            is MainContract.UiAction.LoadRoomDetail -> {
                loadRoomDetail()
            }

            MainContract.UiAction.SubscribeSyncStatus -> {
                subscribeSyncStatus()
            }

            MainContract.UiAction.LoadWeather -> loadWeather()
            MainContract.UiAction.OnboardingCompleted -> {
                updateUiState { copy(isOnboardingCompleted = true) }
            }
        }
    }

    private fun subscribeSyncStatus() = viewModelScope.launch {
        syncManager.isSyncing.collect { isSyncing ->
            updateUiState { copy(isSyncing = isSyncing) }
        }
    }

    private fun loadHotelProfile() = viewModelScope.launch {
        updateUiState { copy(isLoading = true) }
        getHotelProfileUseCase()
            .collect {
                updateUiState {
                    copy(hotelProfile = it)
                }
            }
    }

    private fun loadRoomDetail() = viewModelScope.launch {
        updateUiState { copy(isLoading = true) }
        getRoomDetailUseCase()
            .onSuccess {
                updateUiState {
                    copy(
                        isLoading = false,
                        roomDetail = it
                    )
                }
            }
            .onFailure {

            }
    }

    private fun loadWeather() = viewModelScope.launch {
        getWeatherUseCase()
            .onSuccess {
                Log.d("loadWeather", "loadWeather: $it")
                updateUiState {
                    copy(weather = it)
                }
            }
            .onFailure {
                Log.d("loadWeather", "loadWeather: $it")
            }
    }
}