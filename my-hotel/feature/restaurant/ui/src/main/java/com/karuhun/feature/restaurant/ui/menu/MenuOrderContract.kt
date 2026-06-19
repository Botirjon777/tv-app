package com.karuhun.feature.restaurant.ui.menu

import com.karuhun.core.model.Booking
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuProduct

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
    ) {
        val cartTotal: Int get() = cart.values.sumOf { it.product.price * it.quantity }
        val cartCount: Int get() = cart.values.sumOf { it.quantity }
    }

    sealed interface UiAction {
        data object Load : UiAction
        data class SelectCategory(val id: String) : UiAction
        data class AddToCart(val product: MenuProduct) : UiAction
        data class RemoveFromCart(val productId: String) : UiAction
        data object PlaceOrder : UiAction
        data object DismissMessage : UiAction
    }

    sealed interface UiEffect {
        data class ShowError(val message: String) : UiEffect
        data object OrderPlaced : UiEffect
    }
}
