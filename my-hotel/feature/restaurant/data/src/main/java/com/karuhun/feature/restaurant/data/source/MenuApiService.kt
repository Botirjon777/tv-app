package com.karuhun.feature.restaurant.data.source

import com.karuhun.core.network.model.BaseResponse
import com.karuhun.feature.restaurant.data.source.remote.response.MenuCategoryResponse
import com.karuhun.feature.restaurant.data.source.remote.response.MenuGuestResponse
import com.karuhun.feature.restaurant.data.source.remote.response.MenuHotelResponse
import com.karuhun.feature.restaurant.data.source.remote.response.MenuProductResponse
import com.karuhun.feature.restaurant.data.source.remote.response.PlaceOrderRequest
import com.karuhun.feature.restaurant.data.source.remote.response.PlacedOrderResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

// Talks to the hotel-menu backend (Node/Fastify) via the @Named("menu") Retrofit.
interface MenuApiService {
    @GET("menu/hotels")
    suspend fun getHotels(): BaseResponse<List<MenuHotelResponse>>

    @GET("menu/categories")
    suspend fun getCategories(): BaseResponse<List<MenuCategoryResponse>>

    @GET("menu/products")
    suspend fun getProducts(
        @Query("categoryId") categoryId: String?,
        @Query("availableOnly") availableOnly: String?,
    ): BaseResponse<List<MenuProductResponse>>

    @GET("menu/guest")
    suspend fun getGuest(
        @Query("hotelSlug") hotelSlug: String,
        @Query("roomNumber") roomNumber: String,
    ): BaseResponse<MenuGuestResponse>

    @POST("menu/orders")
    suspend fun placeOrder(@Body body: PlaceOrderRequest): BaseResponse<PlacedOrderResponse>
}
