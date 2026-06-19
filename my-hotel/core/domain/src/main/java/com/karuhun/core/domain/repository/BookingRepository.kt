package com.karuhun.core.domain.repository

import com.karuhun.core.model.Booking
import kotlinx.coroutines.flow.Flow

interface BookingRepository {
    fun getBooking(): Flow<Booking>
    suspend fun saveBooking(hotelSlug: String, hotelName: String, roomNumber: String)
}
