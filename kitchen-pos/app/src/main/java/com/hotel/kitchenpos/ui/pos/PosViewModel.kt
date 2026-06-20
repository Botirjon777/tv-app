package com.hotel.kitchenpos.ui.pos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hotel.kitchenpos.data.AppSession
import com.hotel.kitchenpos.data.HotelDTO
import com.hotel.kitchenpos.data.KitchenApi
import com.hotel.kitchenpos.data.OrderDTO
import com.hotel.kitchenpos.data.OrderStatus
import com.hotel.kitchenpos.data.OrderStream
import com.hotel.kitchenpos.data.StreamEvent
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PosUiState(
    val loading: Boolean = true,
    val connected: Boolean = false,
    val orders: List<OrderDTO> = emptyList(),
    val hotels: List<HotelDTO> = emptyList(),
    val hotelId: String = "",
) {
    /** Active orders for the selected hotel, oldest first, grouped by status. */
    fun column(status: OrderStatus): List<OrderDTO> =
        orders.asSequence()
            .filter { hotelId.isEmpty() || it.hotelId == hotelId }
            .filter { it.orderStatus == status }
            .sortedBy { it.createdAt }
            .toList()
}

class PosViewModel : ViewModel() {
    private val _state = MutableStateFlow(PosUiState())
    val state: StateFlow<PosUiState> = _state.asStateFlow()

    init {
        loadHotels()
        loadOrders()
        listenForEvents()
        pollOrders()
    }

    // Periodic refresh as a safety net on top of the live SSE stream.
    private fun pollOrders() {
        viewModelScope.launch {
            while (true) {
                delay(POLL_INTERVAL_MS)
                loadOrders()
            }
        }
    }

    private fun loadOrders() {
        viewModelScope.launch {
            runCatching { KitchenApi.activeOrders() }
                .onSuccess { orders -> _state.update { it.copy(orders = orders, loading = false) } }
                .onFailure { _state.update { it.copy(loading = false) } }
        }
    }

    private fun loadHotels() {
        viewModelScope.launch {
            val saved = AppSession.posHotelId
            runCatching { KitchenApi.hotels() }
                .onSuccess { hotels ->
                    val initial = when {
                        saved != null && hotels.any { it.id == saved } -> saved
                        else -> hotels.firstOrNull()?.id.orEmpty()
                    }
                    _state.update { it.copy(hotels = hotels, hotelId = initial) }
                }
        }
    }

    /** Optimistic status change, then PATCH (refetch on failure). */
    fun updateStatus(orderId: String, status: OrderStatus) {
        _state.update { s ->
            s.copy(orders = s.orders.map { o ->
                if (o.id == orderId) o.copy(status = status.name) else o
            })
        }
        viewModelScope.launch {
            runCatching { KitchenApi.updateStatus(orderId, status) }
                .onFailure { loadOrders() }
        }
    }

    fun selectHotel(id: String) {
        AppSession.posHotelId = id
        _state.update { it.copy(hotelId = id) }
    }

    private fun upsert(order: OrderDTO) {
        _state.update { s ->
            val idx = s.orders.indexOfFirst { it.id == order.id }
            val next = if (idx == -1) listOf(order) + s.orders
            else s.orders.toMutableList().also { it[idx] = order }
            s.copy(orders = next)
        }
    }

    // okhttp-sse does not auto-reconnect (unlike the browser EventSource),
    // so we re-establish the stream after a short backoff on disconnect, and
    // refetch to catch anything missed while we were away.
    private fun listenForEvents() {
        viewModelScope.launch {
            while (true) {
                OrderStream.connect().collect { event ->
                    when (event) {
                        is StreamEvent.Connected -> _state.update { it.copy(connected = true) }
                        is StreamEvent.Disconnected -> _state.update { it.copy(connected = false) }
                        is StreamEvent.Order -> upsert(event.order)
                    }
                }
                // Flow completed → connection dropped. Back off, then resync.
                _state.update { it.copy(connected = false) }
                delay(3000)
                loadOrders()
            }
        }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            KitchenApi.logout()
            onDone()
        }
    }

    private companion object {
        const val POLL_INTERVAL_MS = 2 * 60 * 1000L // refresh every 2 minutes
    }
}
