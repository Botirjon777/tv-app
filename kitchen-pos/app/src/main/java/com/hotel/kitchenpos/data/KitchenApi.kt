package com.hotel.kitchenpos.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiException(val code: Int, message: String) : Exception(message)

/**
 * Thin client over the hotel-menu backend's REST API. Cookie auth is handled
 * transparently by [AppSession.cookieJar].
 */
object KitchenApi {
    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    // A short read timeout would kill the SSE stream, so the stream uses its
    // own long-lived client (see OrderStream); this one is for plain calls.
    val client: OkHttpClient = OkHttpClient.Builder()
        .cookieJar(AppSession.cookieJar)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private fun url(path: String) = "${AppSession.baseUrl}$path"

    /** POST /api/auth/login — email + password. Throws [ApiException] on failure. */
    suspend fun login(email: String, password: String): Unit = withContext(Dispatchers.IO) {
        val body = json.encodeToString(LoginRequest.serializer(), LoginRequest(email, password))
            .toRequestBody(jsonMedia)
        val request = Request.Builder().url(url("/api/auth/login")).post(body).build()
        client.newCall(request).execute().use { resp ->
            if (!resp.isSuccessful) throw errorFrom(resp.code, resp.body?.string())
        }
    }

    /** POST /api/auth/logout (best effort) and clear the local cookie. */
    suspend fun logout() = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder()
                .url(url("/api/auth/logout"))
                .post(ByteArray(0).toRequestBody(null))
                .build()
            client.newCall(request).execute().close()
        }
        AppSession.logout()
    }

    /** GET /api/orders?active=1&limit=200 */
    suspend fun activeOrders(): List<OrderDTO> = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(url("/api/orders?active=1&limit=200")).get().build()
        client.newCall(request).execute().use { resp ->
            val text = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) throw errorFrom(resp.code, text)
            json.decodeFromString(kotlinx.serialization.builtins.ListSerializer(OrderDTO.serializer()), text)
        }
    }

    /** GET /api/hotels — the hotel switcher list. */
    suspend fun hotels(): List<HotelDTO> = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(url("/api/hotels")).get().build()
        client.newCall(request).execute().use { resp ->
            val text = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) throw errorFrom(resp.code, text)
            json.decodeFromString(kotlinx.serialization.builtins.ListSerializer(HotelDTO.serializer()), text)
        }
    }

    /** PATCH /api/orders/:id { status } */
    suspend fun updateStatus(orderId: String, status: OrderStatus): OrderDTO =
        withContext(Dispatchers.IO) {
            val body = json.encodeToString(StatusPatch.serializer(), StatusPatch(status.name))
                .toRequestBody(jsonMedia)
            val request = Request.Builder().url(url("/api/orders/$orderId")).patch(body).build()
            client.newCall(request).execute().use { resp ->
                val text = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) throw errorFrom(resp.code, text)
                json.decodeFromString(OrderDTO.serializer(), text)
            }
        }

    private fun errorFrom(code: Int, body: String?): ApiException {
        val message = body?.let {
            runCatching { json.decodeFromString(ApiError.serializer(), it).error }
                .getOrNull()
                ?.takeIf(String::isNotBlank)
        } ?: "Request failed ($code)"
        return ApiException(code, message)
    }
}
