package com.karuhun.core.datastore

data class HotelProfile(
    val id: Int = -1,
    val name: String,
    val phone: String,
    val email: String,
    val website: String,
    val defaultGreeting: String,
    val passwordSetting: String,
    val logoWhite: String,
    val logoBlack: String,
    val primaryColor: String,
    val mainPhoto: String,
    val backgroundPhoto: String,
    val introVideo: String,
    val welcomeText: String,
    val runningText: String,
    val bookingHotelSlug: String = "",
    val bookingHotelName: String = "",
    val bookingRoomNumber: String = "",
    val onboardingComplete: Boolean = false,
) {
    companion object {
        val Empty = HotelProfile(
            id = -1,
            name = "",
            phone = "",
            email = "",
            website = "",
            defaultGreeting = "",
            passwordSetting = "",
            logoWhite = "",
            logoBlack = "",
            primaryColor = "",
            mainPhoto = "",
            backgroundPhoto = "",
            introVideo = "",
            welcomeText = "",
            runningText = "",
            bookingHotelSlug = "",
            bookingHotelName = "",
            bookingRoomNumber = "",
            onboardingComplete = false
        )
    }
}