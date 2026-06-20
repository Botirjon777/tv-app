package com.karuhun.feature.restaurant.ui.tracking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetOrderUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderTrackingViewModel @Inject constructor(
    private val getOrderUseCase: GetOrderUseCase,
    savedStateHandle: SavedStateHandle,
) : ViewModel(),
    MVI<OrderTrackingContract.UiState, OrderTrackingContract.UiAction, OrderTrackingContract.UiEffect> by mvi(
        initialState = OrderTrackingContract.UiState(),
    ) {

    private val orderId: String = savedStateHandle.get<String>("orderId").orEmpty()

    init {
        pollOrder()
    }

    override fun onAction(action: OrderTrackingContract.UiAction) {
        when (action) {
            OrderTrackingContract.UiAction.Refresh -> fetchOnce()
        }
    }

    // Poll the backend so the guest sees the kitchen advance the order live.
    private fun pollOrder() = viewModelScope.launch {
        while (isActive) {
            fetchOnce()
            val status = currentUiState.order?.status
            if (status == "DELIVERED" || status == "CANCELLED") break
            delay(4000)
        }
    }

    private fun fetchOnce() = viewModelScope.launch {
        if (orderId.isBlank()) {
            updateUiState { copy(isLoading = false, errorMessage = "Missing order id") }
            return@launch
        }
        getOrderUseCase(orderId)
            .onSuccess { order -> updateUiState { copy(isLoading = false, order = order) } }
            .onFailure { e -> updateUiState { copy(isLoading = false, errorMessage = e.message) } }
    }
}
