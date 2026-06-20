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
    suspend fun placeOrder(
        hotelSlug: String,
        roomNumber: String,
        note: String,
        items: List<OrderLine>,
    ): Resource<PlacedOrder>
}
