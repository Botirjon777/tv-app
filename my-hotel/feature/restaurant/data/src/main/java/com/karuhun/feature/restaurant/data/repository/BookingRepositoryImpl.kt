package com.karuhun.feature.restaurant.data.repository

import com.karuhun.core.datastore.LauncherPreferencesDatastore
import com.karuhun.core.domain.repository.BookingRepository
import com.karuhun.core.model.Booking
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class BookingRepositoryImpl @Inject constructor(
    private val datastore: LauncherPreferencesDatastore,
) : BookingRepository {

    override fun getBooking(): Flow<Booking> = datastore.hotelData.map {
        Booking(
            hotelSlug = it.bookingHotelSlug,
            hotelName = it.bookingHotelName,
            roomNumber = it.bookingRoomNumber,
            onboardingComplete = it.onboardingComplete,
        )
    }

    override suspend fun saveBooking(
        hotelSlug: String,
        hotelName: String,
        roomNumber: String,
    ) {
        datastore.updateHotelData {
            copy(
                bookingHotelSlug = hotelSlug,
                bookingHotelName = hotelName,
                bookingRoomNumber = roomNumber,
                onboardingComplete = true,
            )
        }
    }
}
