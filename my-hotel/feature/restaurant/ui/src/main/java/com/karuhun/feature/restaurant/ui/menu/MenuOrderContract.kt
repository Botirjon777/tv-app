package com.karuhun.feature.restaurant.ui.menu

import com.karuhun.core.model.Booking
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.model.PlacedOrder

object MenuOrderContract {
    data class CartLine(val product: MenuProduct, val quantity: Int)

    data class UiState(
        val isLoading: Boolean = false,
        val categories: List<MenuCategory> = emptyList(),
        val selectedCategoryId: String? = null,
        val products: List<MenuProduct> = emptyList(),
        val cart: Map<String, CartLine> = emptyMap(),
        val booking: Booking = Booking(),
        val isPlacing: Boolean = false,
        val placedMessage: String? = null,
        val errorMessage: String? = null,
        // Order resume / past orders / edit mode.
        val activeOrders: List<PlacedOrder> = emptyList(),
        val pastOrders: List<PlacedOrder> = emptyList(),
        val showPastOrders: Boolean = false,
        val isEditing: Boolean = false,
        val editOrderId: String? = null,
    ) {
        val cartTotal: Int get() = cart.values.sumOf { it.product.price * it.quantity }
        val cartCount: Int get() = cart.values.sumOf { it.quantity }
        val activeOrder: PlacedOrder? get() = activeOrders.firstOrNull()
    }

    sealed interface UiAction {
        data object Load : UiAction
        data class SelectCategory(val id: String) : UiAction
        data class AddToCart(val product: MenuProduct) : UiAction
        data class RemoveFromCart(val productId: String) : UiAction
        data object PlaceOrder : UiAction
        data object DismissMessage : UiAction
        data object ShowPastOrders : UiAction
        data object HidePastOrders : UiAction
    }

    sealed interface UiEffect {
        data class ShowError(val message: String) : UiEffect
        data class OrderPlaced(val orderId: String) : UiEffect
    }
}
