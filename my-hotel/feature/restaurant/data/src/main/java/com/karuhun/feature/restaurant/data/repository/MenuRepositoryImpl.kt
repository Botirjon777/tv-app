package com.karuhun.feature.restaurant.data.repository

import com.karuhun.core.common.Resource
import com.karuhun.core.common.map
import com.karuhun.core.domain.repository.MenuRepository
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuGuest
import com.karuhun.core.model.MenuHotel
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.model.OrderLine
import com.karuhun.core.model.PlacedOrder
import com.karuhun.core.network.safeApiCall
import com.karuhun.feature.restaurant.data.source.MenuApiService
import com.karuhun.feature.restaurant.data.source.remote.response.OrderItemRequest
import com.karuhun.feature.restaurant.data.source.remote.response.PlaceOrderRequest
import com.karuhun.feature.restaurant.data.source.remote.response.SetLanguageRequest
import com.karuhun.feature.restaurant.data.source.remote.response.UpdateOrderRequest
import com.karuhun.feature.restaurant.data.source.remote.response.toCategoryDomainList
import com.karuhun.feature.restaurant.data.source.remote.response.toDomain
import com.karuhun.feature.restaurant.data.source.remote.response.toHotelDomainList
import com.karuhun.feature.restaurant.data.source.remote.response.toOrderDomainList
import com.karuhun.feature.restaurant.data.source.remote.response.toProductDomainList
import javax.inject.Inject

class MenuRepositoryImpl @Inject constructor(
    private val api: MenuApiService,
) : MenuRepository {

    override suspend fun getHotels(): Resource<List<MenuHotel>> =
        safeApiCall { api.getHotels() }.map { it.data?.toHotelDomainList() ?: emptyList() }

    override suspend fun getCategories(): Resource<List<MenuCategory>> =
        safeApiCall { api.getCategories() }.map { it.data?.toCategoryDomainList() ?: emptyList() }

    override suspend fun getProducts(
        categoryId: String?,
        availableOnly: Boolean,
    ): Resource<List<MenuProduct>> =
        safeApiCall {
            api.getProducts(
                categoryId = categoryId,
                availableOnly = if (availableOnly) "1" else null,
            )
        }.map { it.data?.toProductDomainList() ?: emptyList() }

    override suspend fun getGuest(hotelSlug: String, roomNumber: String): Resource<MenuGuest> =
        safeApiCall { api.getGuest(hotelSlug, roomNumber) }
            .map { it.data?.toDomain() ?: MenuGuest() }

    override suspend fun setGuestLanguage(
        hotelSlug: String,
        roomNumber: String,
        language: String,
    ): Resource<Unit> =
        safeApiCall {
            api.setGuestLanguage(SetLanguageRequest(hotelSlug, roomNumber, language))
        }.map { Unit }

    override suspend fun getOrder(orderId: String): Resource<PlacedOrder> =
        safeApiCall { api.getOrder(orderId) }
            .map { it.data?.toDomain() ?: PlacedOrder("", "", 0, "") }

    override suspend fun getRoomOrders(
        hotelSlug: String,
        roomNumber: String,
        activeOnly: Boolean,
    ): Resource<List<PlacedOrder>> =
        safeApiCall {
            api.getRoomOrders(hotelSlug, roomNumber, if (activeOnly) "1" else null)
        }.map { it.data?.toOrderDomainList() ?: emptyList() }

    override suspend fun updateOrder(orderId: String, items: List<OrderLine>): Resource<PlacedOrder> =
        safeApiCall {
            api.updateOrder(orderId, UpdateOrderRequest(items.map { OrderItemRequest(it.productId, it.quantity) }))
        }.map { it.data?.toDomain() ?: PlacedOrder("", "", 0, "") }

    override suspend fun placeOrder(
        hotelSlug: String,
        roomNumber: String,
        note: String,
        items: List<OrderLine>,
    ): Resource<PlacedOrder> =
        safeApiCall {
            api.placeOrder(
                PlaceOrderRequest(
                    hotelSlug = hotelSlug,
                    roomNumber = roomNumber,
                    note = note,
                    items = items.map { OrderItemRequest(it.productId, it.quantity) },
                )
            )
        }.map { it.data?.toDomain() ?: PlacedOrder("", "", 0, roomNumber) }
}
