package com.karuhun.core.domain.repository

import com.karuhun.core.common.Resource
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuGuest
import com.karuhun.core.model.MenuHotel
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.model.OrderLine
import com.karuhun.core.model.PlacedOrder

interface MenuRepository {
    suspend fun getHotels(): Resource<List<MenuHotel>>
    suspend fun getCategories(): Resource<List<MenuCategory>>
    suspend fun getProducts(categoryId: String?, availableOnly: Boolean): Resource<List<MenuProduct>>
    suspend fun getGuest(hotelSlug: String, roomNumber: String): Resource<MenuGuest>
    suspend fun setGuestLanguage(hotelSlug: String, roomNumber: String, language: String): Resource<Unit>
    suspend fun getOrder(orderId: String): Resource<PlacedOrder>
    suspend fun getRoomOrders(hotelSlug: String, roomNumber: String, activeOnly: Boolean): Resource<List<PlacedOrder>>
    suspend fun updateOrder(orderId: String, items: List<OrderLine>): Resource<PlacedOrder>
    suspend fun placeOrder(
        hotelSlug: String,
        roomNumber: String,
        note: String,
        items: List<OrderLine>,
    ): Resource<PlacedOrder>
    suspend fun createServiceRequest(
        hotelSlug: String,
        roomNumber: String,
        type: String,
        note: String,
    ): Resource<Unit>
}
