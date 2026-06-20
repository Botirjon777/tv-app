package com.hotel.kitchenpos.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Order lifecycle, mirroring the backend `OrderStatus` union. */
enum class OrderStatus {
    PENDING, PREPARING, READY, DELIVERED, CANCELLED;

    companion object {
        fun fromOrNull(value: String?): OrderStatus? =
            entries.firstOrNull { it.name == value }
    }
}

/** Allowed forward transition in the kitchen workflow (NEXT_STATUS on web). */
val OrderStatus.next: OrderStatus?
    get() = when (this) {
        OrderStatus.PENDING -> OrderStatus.PREPARING
        OrderStatus.PREPARING -> OrderStatus.READY
        OrderStatus.READY -> OrderStatus.DELIVERED
        else -> null
    }

@Serializable
data class OrderItemDTO(
    val id: String,
    val productId: String = "",
    val name: String,
    val price: Long = 0,
    val quantity: Int,
)

@Serializable
data class OrderDTO(
    val id: String,
    val roomId: String = "",
    val roomNumber: String,
    val hotelId: String = "",
    val hotelSlug: String = "",
    val hotelName: String = "",
    val status: String,
    val note: String = "",
    val total: Long = 0,
    val items: List<OrderItemDTO> = emptyList(),
    val createdAt: String,
    val updatedAt: String = "",
) {
    val orderStatus: OrderStatus
        get() = OrderStatus.fromOrNull(status) ?: OrderStatus.PENDING
}

@Serializable
data class HotelDTO(
    val id: String,
    val name: String,
    val slug: String = "",
    val floors: Int = 0,
    val roomsPerFloor: Int = 0,
    val active: Boolean = true,
    val roomCount: Int? = null,
)

/** Live event frames from `GET /api/orders/stream`. */
@Serializable
data class OrderEvent(
    val type: String,
    val order: OrderDTO? = null,
)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class StatusPatch(val status: String)

@Serializable
data class ApiError(@SerialName("error") val error: String = "")
