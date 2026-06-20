package com.karuhun.core.model

// Models for the in-room dining menu served by the hotel-menu backend
// (separate from the PHP `Food`/`FoodCategory` used elsewhere in the app).

data class MenuHotel(
    val id: String,
    val name: String,
    val slug: String,
    val floors: Int,
    val roomsPerFloor: Int,
    val roomCount: Int,
)

data class MenuCategory(
    val id: String,
    val name: String,
    val sortOrder: Int,
)

data class MenuProduct(
    val id: String,
    val name: String,
    val description: String,
    val price: Int,
    val imageUrl: String,
    val available: Boolean,
    val categoryId: String,
    val categoryName: String,
)

// What the device stores after onboarding and reuses when ordering.
data class Booking(
    val hotelSlug: String = "",
    val hotelName: String = "",
    val roomNumber: String = "",
    val onboardingComplete: Boolean = false,
)

// A single line in a placed order.
data class OrderLine(
    val productId: String,
    val quantity: Int,
)

// Result of a successful order / a tracked order.
data class PlacedOrder(
    val id: String,
    val status: String,
    val total: Int,
    val roomNumber: String,
    val items: List<PlacedOrderItem> = emptyList(),
    val createdAt: String = "",
)

data class PlacedOrderItem(
    val name: String,
    val price: Int,
    val quantity: Int,
    val productId: String = "",
)

// The guest currently checked into this room (from the backend).
data class MenuGuest(
    val fullName: String = "",
    val hasGuest: Boolean = false,
    val preferredLanguage: String = "",
)
