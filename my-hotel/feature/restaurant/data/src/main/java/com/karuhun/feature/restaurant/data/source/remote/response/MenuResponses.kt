package com.karuhun.feature.restaurant.data.source.remote.response

import com.google.gson.annotations.SerializedName
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuGuest
import com.karuhun.core.model.MenuHotel
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.model.PlacedOrder

data class MenuHotelResponse(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("slug") val slug: String? = null,
    @SerializedName("floors") val floors: Int? = null,
    @SerializedName("roomsPerFloor") val roomsPerFloor: Int? = null,
    @SerializedName("roomCount") val roomCount: Int? = null,
)

fun MenuHotelResponse.toDomain() = MenuHotel(
    id = id.orEmpty(),
    name = name.orEmpty(),
    slug = slug.orEmpty(),
    floors = floors ?: 0,
    roomsPerFloor = roomsPerFloor ?: 0,
    roomCount = roomCount ?: 0,
)

fun List<MenuHotelResponse>.toHotelDomainList() = map { it.toDomain() }

data class MenuCategoryResponse(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("sortOrder") val sortOrder: Int? = null,
)

fun MenuCategoryResponse.toDomain() = MenuCategory(
    id = id.orEmpty(),
    name = name.orEmpty(),
    sortOrder = sortOrder ?: 0,
)

fun List<MenuCategoryResponse>.toCategoryDomainList() = map { it.toDomain() }

data class MenuProductResponse(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("price") val price: Int? = null,
    @SerializedName("imageUrl") val imageUrl: String? = null,
    @SerializedName("available") val available: Boolean? = null,
    @SerializedName("categoryId") val categoryId: String? = null,
    @SerializedName("categoryName") val categoryName: String? = null,
)

fun MenuProductResponse.toDomain() = MenuProduct(
    id = id.orEmpty(),
    name = name.orEmpty(),
    description = description.orEmpty(),
    price = price ?: 0,
    imageUrl = imageUrl.orEmpty(),
    available = available ?: true,
    categoryId = categoryId.orEmpty(),
    categoryName = categoryName.orEmpty(),
)

fun List<MenuProductResponse>.toProductDomainList() = map { it.toDomain() }

// Order POST body (Gson serializes field names verbatim to match the backend).
data class PlaceOrderRequest(
    val hotelSlug: String,
    val roomNumber: String,
    val note: String,
    val items: List<OrderItemRequest>,
)

data class OrderItemRequest(
    val productId: String,
    val quantity: Int,
)

data class OrderItemResponse(
    @SerializedName("name") val name: String? = null,
    @SerializedName("price") val price: Int? = null,
    @SerializedName("quantity") val quantity: Int? = null,
    @SerializedName("productId") val productId: String? = null,
)

data class PlacedOrderResponse(
    @SerializedName("id") val id: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("total") val total: Int? = null,
    @SerializedName("roomNumber") val roomNumber: String? = null,
    @SerializedName("items") val items: List<OrderItemResponse>? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
)

fun PlacedOrderResponse.toDomain() = PlacedOrder(
    id = id.orEmpty(),
    status = status.orEmpty(),
    total = total ?: 0,
    roomNumber = roomNumber.orEmpty(),
    items = items.orEmpty().map {
        com.karuhun.core.model.PlacedOrderItem(
            name = it.name.orEmpty(),
            price = it.price ?: 0,
            quantity = it.quantity ?: 0,
            productId = it.productId.orEmpty(),
        )
    },
    createdAt = createdAt.orEmpty(),
)

fun List<PlacedOrderResponse>.toOrderDomainList() = map { it.toDomain() }

data class UpdateOrderRequest(
    val items: List<OrderItemRequest>,
)

data class MenuGuestResponse(
    @SerializedName("fullName") val fullName: String? = null,
    @SerializedName("hasGuest") val hasGuest: Boolean? = null,
    @SerializedName("preferredLanguage") val preferredLanguage: String? = null,
)

fun MenuGuestResponse.toDomain() = MenuGuest(
    fullName = fullName.orEmpty(),
    hasGuest = hasGuest ?: false,
    preferredLanguage = preferredLanguage.orEmpty(),
)

data class SetLanguageRequest(
    val hotelSlug: String,
    val roomNumber: String,
    val language: String,
)

// Guest service request (alarm / reception / taxi) raised from the TV.
data class CreateServiceRequestBody(
    val hotelSlug: String,
    val roomNumber: String,
    val type: String,
    val note: String = "",
    val guestName: String = "",
    val source: String = "tv",
)

data class ServiceRequestResponse(
    @SerializedName("id") val id: String? = null,
    @SerializedName("type") val type: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("roomNumber") val roomNumber: String? = null,
)
