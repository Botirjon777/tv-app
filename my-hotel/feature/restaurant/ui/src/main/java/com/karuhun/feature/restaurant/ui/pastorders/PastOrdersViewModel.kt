package com.karuhun.feature.restaurant.ui.pastorders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetRoomOrdersUseCase
import com.karuhun.core.model.PlacedOrder
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

object PastOrdersContract {
    data class UiState(
        val isLoading: Boolean = true,
        val orders: List<PlacedOrder> = emptyList(),
    )
    sealed interface UiAction
    sealed interface UiEffect
}

@HiltViewModel
class PastOrdersViewModel @Inject constructor(
    private val getBookingUseCase: GetBookingUseCase,
    private val getRoomOrdersUseCase: GetRoomOrdersUseCase,
) : ViewModel(),
    MVI<PastOrdersContract.UiState, PastOrdersContract.UiAction, PastOrdersContract.UiEffect> by mvi(
        initialState = PastOrdersContract.UiState(),
    ) {

    private val active = setOf("PENDING", "PREPARING", "READY")

    init {
        load()
    }

    override fun onAction(action: PastOrdersContract.UiAction) {}

    private fun load() = viewModelScope.launch {
        val booking = getBookingUseCase().firstOrNull()
        if (booking == null || booking.hotelSlug.isBlank() || booking.roomNumber.isBlank()) {
            updateUiState { copy(isLoading = false) }
            return@launch
        }
        getRoomOrdersUseCase(booking.hotelSlug, booking.roomNumber, activeOnly = false)
            .onSuccess { orders ->
                updateUiState {
                    copy(isLoading = false, orders = orders.filter { it.status !in active })
                }
            }
    }
}
