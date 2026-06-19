package com.karuhun.feature.restaurant.ui.menu

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetMenuCategoriesUseCase
import com.karuhun.core.domain.usecase.GetMenuProductsUseCase
import com.karuhun.core.domain.usecase.PlaceMenuOrderUseCase
import com.karuhun.core.model.OrderLine
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MenuOrderViewModel @Inject constructor(
    private val getMenuCategoriesUseCase: GetMenuCategoriesUseCase,
    private val getMenuProductsUseCase: GetMenuProductsUseCase,
    private val placeMenuOrderUseCase: PlaceMenuOrderUseCase,
    private val getBookingUseCase: GetBookingUseCase,
) : ViewModel(),
    MVI<MenuOrderContract.UiState, MenuOrderContract.UiAction, MenuOrderContract.UiEffect> by mvi(
        initialState = MenuOrderContract.UiState(),
    ) {

    init {
        onAction(MenuOrderContract.UiAction.Load)
    }

    override fun onAction(action: MenuOrderContract.UiAction) {
        when (action) {
            MenuOrderContract.UiAction.Load -> load()
            is MenuOrderContract.UiAction.SelectCategory -> selectCategory(action.id)
            is MenuOrderContract.UiAction.AddToCart -> addToCart(action.product)
            is MenuOrderContract.UiAction.RemoveFromCart -> removeFromCart(action.productId)
            MenuOrderContract.UiAction.PlaceOrder -> placeOrder()
            MenuOrderContract.UiAction.DismissMessage ->
                updateUiState { copy(placedMessage = null, errorMessage = null) }
        }
    }

    private fun load() = viewModelScope.launch {
        updateUiState { copy(isLoading = true) }
        getBookingUseCase().firstOrNull()?.let { booking ->
            updateUiState { copy(booking = booking) }
        }
        getMenuCategoriesUseCase()
            .onSuccess { categories ->
                updateUiState { copy(isLoading = false, categories = categories) }
                categories.firstOrNull()?.let { selectCategory(it.id) }
            }
            .onFailure { e ->
                updateUiState { copy(isLoading = false, errorMessage = e.message) }
            }
    }

    private fun selectCategory(id: String) = viewModelScope.launch {
        updateUiState { copy(selectedCategoryId = id) }
        getMenuProductsUseCase(categoryId = id, availableOnly = true)
            .onSuccess { products -> updateUiState { copy(products = products) } }
            .onFailure { e -> updateUiState { copy(errorMessage = e.message) } }
    }

    private fun addToCart(product: com.karuhun.core.model.MenuProduct) {
        updateUiState {
            val existing = cart[product.id]
            val line = MenuOrderContract.CartLine(product, (existing?.quantity ?: 0) + 1)
            copy(cart = cart + (product.id to line))
        }
    }

    private fun removeFromCart(productId: String) {
        updateUiState {
            val existing = cart[productId] ?: return@updateUiState this
            if (existing.quantity <= 1) {
                copy(cart = cart - productId)
            } else {
                copy(cart = cart + (productId to existing.copy(quantity = existing.quantity - 1)))
            }
        }
    }

    private fun placeOrder() = viewModelScope.launch {
        val state = currentUiState
        if (state.cart.isEmpty() || state.isPlacing) return@launch
        if (state.booking.hotelSlug.isBlank() || state.booking.roomNumber.isBlank()) {
            updateUiState { copy(errorMessage = "No room configured on this device") }
            return@launch
        }
        updateUiState { copy(isPlacing = true) }
        val items = state.cart.values.map { OrderLine(it.product.id, it.quantity) }
        placeMenuOrderUseCase(
            hotelSlug = state.booking.hotelSlug,
            roomNumber = state.booking.roomNumber,
            note = "",
            items = items,
        )
            .onSuccess { order ->
                updateUiState {
                    copy(
                        isPlacing = false,
                        cart = emptyMap(),
                        placedMessage = "Order placed! Room ${order.roomNumber}",
                    )
                }
                emitUiEffect(MenuOrderContract.UiEffect.OrderPlaced)
            }
            .onFailure { e ->
                updateUiState { copy(isPlacing = false, errorMessage = e.message) }
                emitUiEffect(MenuOrderContract.UiEffect.ShowError(e.message ?: "Order failed"))
            }
    }
}
