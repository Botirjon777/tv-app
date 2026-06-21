package com.karuhun.core.domain.usecase

import com.karuhun.core.common.Resource
import com.karuhun.core.domain.repository.BookingRepository
import com.karuhun.core.domain.repository.MenuRepository
import com.karuhun.core.model.Booking
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuGuest
import com.karuhun.core.model.MenuHotel
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.model.OrderLine
import com.karuhun.core.model.PlacedOrder
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetMenuHotelsUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(): Resource<List<MenuHotel>> = repository.getHotels()
}

class GetMenuCategoriesUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(): Resource<List<MenuCategory>> = repository.getCategories()
}

class GetMenuProductsUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(
        categoryId: String? = null,
        availableOnly: Boolean = true,
    ): Resource<List<MenuProduct>> = repository.getProducts(categoryId, availableOnly)
}

class PlaceMenuOrderUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(
        hotelSlug: String,
        roomNumber: String,
        note: String,
        items: List<OrderLine>,
    ): Resource<PlacedOrder> = repository.placeOrder(hotelSlug, roomNumber, note, items)
}

class CreateServiceRequestUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(
        hotelSlug: String,
        roomNumber: String,
        type: String,
        note: String = "",
    ): Resource<Unit> = repository.createServiceRequest(hotelSlug, roomNumber, type, note)
}

class GetMenuGuestUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(hotelSlug: String, roomNumber: String): Resource<MenuGuest> =
        repository.getGuest(hotelSlug, roomNumber)
}

class SaveGuestLanguageUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(hotelSlug: String, roomNumber: String, language: String) =
        repository.setGuestLanguage(hotelSlug, roomNumber, language)
}

class GetOrderUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(orderId: String): Resource<PlacedOrder> =
        repository.getOrder(orderId)
}

class GetRoomOrdersUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(
        hotelSlug: String,
        roomNumber: String,
        activeOnly: Boolean = false,
    ): Resource<List<PlacedOrder>> = repository.getRoomOrders(hotelSlug, roomNumber, activeOnly)
}

class UpdateOrderUseCase @Inject constructor(
    private val repository: MenuRepository,
) {
    suspend operator fun invoke(orderId: String, items: List<OrderLine>): Resource<PlacedOrder> =
        repository.updateOrder(orderId, items)
}

class GetBookingUseCase @Inject constructor(
    private val repository: BookingRepository,
) {
    operator fun invoke(): Flow<Booking> = repository.getBooking()
}

class SaveBookingUseCase @Inject constructor(
    private val repository: BookingRepository,
) {
    suspend operator fun invoke(hotelSlug: String, hotelName: String, roomNumber: String) =
        repository.saveBooking(hotelSlug, hotelName, roomNumber)
}
