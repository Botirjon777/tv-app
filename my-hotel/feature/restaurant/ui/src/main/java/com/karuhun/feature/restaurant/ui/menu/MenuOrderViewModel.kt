package com.karuhun.feature.restaurant.ui.menu

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetMenuCategoriesUseCase
import com.karuhun.core.domain.usecase.GetMenuProductsUseCase
import com.karuhun.core.domain.usecase.GetOrderUseCase
import com.karuhun.core.domain.usecase.GetRoomOrdersUseCase
import com.karuhun.core.domain.usecase.PlaceMenuOrderUseCase
import com.karuhun.core.domain.usecase.UpdateOrderUseCase
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.model.OrderLine
import androidx.navigation.toRoute
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
    private val updateOrderUseCase: UpdateOrderUseCase,
    private val getRoomOrdersUseCase: GetRoomOrdersUseCase,
    private val getOrderUseCase: GetOrderUseCase,
    private val getBookingUseCase: GetBookingUseCase,
    savedStateHandle: SavedStateHandle,
) : ViewModel(),
    MVI<MenuOrderContract.UiState, MenuOrderContract.UiAction, MenuOrderContract.UiEffect> by mvi(
        initialState = MenuOrderContract.UiState(),
    ) {

    private val editOrderId: String? =
        runCatching { savedStateHandle.toRoute<MenuOrder>().editOrderId }.getOrNull()

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
            MenuOrderContract.UiAction.ShowPastOrders -> updateUiState { copy(showPastOrders = true) }
            MenuOrderContract.UiAction.HidePastOrders -> updateUiState { copy(showPastOrders = false) }
        }
    }

    private fun load() = viewModelScope.launch {
        updateUiState { copy(isLoading = true, isEditing = editOrderId != null, editOrderId = editOrderId) }
        getBookingUseCase().firstOrNull()?.let { booking ->
            updateUiState { copy(booking = booking) }
            refreshOrders(booking.hotelSlug, booking.roomNumber)
        }
        getMenuCategoriesUseCase()
            .onSuccess { categories ->
                updateUiState { copy(isLoading = false, categories = categories) }
                categories.firstOrNull()?.let { selectCategory(it.id) }
            }
            .onFailure { e ->
                updateUiState { copy(isLoading = false, errorMessage = e.message) }
            }

        // Edit mode: preload the existing order's items into the cart, keyed by
        // the real productId so an update sends valid lines.
        editOrderId?.let { id ->
            getOrderUseCase(id).onSuccess { order ->
                val lines = order.items
                    .filter { it.productId.isNotBlank() }
                    .associate { item ->
                        item.productId to MenuOrderContract.CartLine(
                            product = MenuProduct(
                                id = item.productId,
                                name = item.name,
                                description = "",
                                price = item.price,
                                imageUrl = "",
                                available = true,
                                categoryId = "",
                                categoryName = "",
                            ),
                            quantity = item.quantity,
                        )
                    }
                updateUiState { copy(cart = lines, isEditing = true, editOrderId = editOrderId) }
            }
        }
    }

    private fun refreshOrders(hotelSlug: String, roomNumber: String) = viewModelScope.launch {
        if (hotelSlug.isBlank() || roomNumber.isBlank()) return@launch
        getRoomOrdersUseCase(hotelSlug, roomNumber, activeOnly = false).onSuccess { orders ->
            updateUiState {
                copy(
                    activeOrders = orders.filter { it.status in ACTIVE_STATUSES },
                    pastOrders = orders.filter { it.status !in ACTIVE_STATUSES },
                )
            }
        }
    }

    private fun selectCategory(id: String) = viewModelScope.launch {
        updateUiState { copy(selectedCategoryId = id) }
        getMenuProductsUseCase(categoryId = id, availableOnly = true)
            .onSuccess { products -> updateUiState { copy(products = products) } }
            .onFailure { e -> updateUiState { copy(errorMessage = e.message) } }
    }

    private fun addToCart(product: MenuProduct) {
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

        // Decide on the stable nav arg (not racy UI state).
        val editId = editOrderId
        val result = if (editId != null) {
            updateOrderUseCase(editId, items)
        } else {
            placeMenuOrderUseCase(
                hotelSlug = state.booking.hotelSlug,
                roomNumber = state.booking.roomNumber,
                note = "",
                items = items,
            )
        }

        result
            .onSuccess { order ->
                updateUiState { copy(isPlacing = false, cart = emptyMap()) }
                emitUiEffect(MenuOrderContract.UiEffect.OrderPlaced(order.id))
            }
            .onFailure { e ->
                updateUiState { copy(isPlacing = false, errorMessage = e.message) }
                emitUiEffect(MenuOrderContract.UiEffect.ShowError(e.message ?: "Order failed"))
            }
    }

    companion object {
        private val ACTIVE_STATUSES = setOf("PENDING", "PREPARING", "READY")
    }
}
