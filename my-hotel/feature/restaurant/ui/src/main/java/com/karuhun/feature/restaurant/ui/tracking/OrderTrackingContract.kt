package com.karuhun.feature.restaurant.ui.tracking

import com.karuhun.core.model.PlacedOrder

object OrderTrackingContract {
    data class UiState(
        val isLoading: Boolean = true,
        val order: PlacedOrder? = null,
        val errorMessage: String? = null,
    )

    sealed interface UiAction {
        data object Refresh : UiAction
    }

    sealed interface UiEffect {
        data class ShowError(val message: String) : UiEffect
    }

    // The four tracking steps, in order, mapped to backend statuses.
    data class Step(val status: String, val title: String)

    val STEPS = listOf(
        Step("PENDING", "Order received"),
        Step("PREPARING", "Being prepared"),
        Step("READY", "On its way"),
        Step("DELIVERED", "Delivered"),
    )
}
