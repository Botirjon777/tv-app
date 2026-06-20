package com.karuhun.feature.hotelprofile.data.repository

import android.content.Context
import com.karuhun.core.common.Resource
import com.karuhun.core.common.map
import com.karuhun.core.common.orZero
import com.karuhun.core.common.toModel
import com.karuhun.core.common.util.DeviceUtil
import com.karuhun.core.common.util.Synchronizer
import com.karuhun.core.common.util.syncSimpleData
import com.karuhun.core.datastore.HotelProfile
import com.karuhun.core.datastore.LauncherPreferencesDatastore
import com.karuhun.core.domain.repository.HotelRepository
import com.karuhun.core.model.RoomDetail
import com.karuhun.core.network.safeApiCall
import com.karuhun.feature.hotelprofile.data.source.HotelApiService
import com.karuhun.feature.hotelprofile.data.source.remote.response.toDomain
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class HotelRepositoryImpl @Inject constructor(
    private val api : HotelApiService,
    @ApplicationContext private val context: Context,
    private val launcherDatastore: LauncherPreferencesDatastore
) : HotelRepository{
    override suspend fun getHotelProfile(): Flow<HotelProfile> = launcherDatastore.hotelData
        .map { hotel ->
            HotelProfile(
                id = hotel.id,
                name = hotel.name,
                phone = hotel.phone,
                email = hotel.email,
                website = hotel.website,
                defaultGreeting = hotel.defaultGreeting,
                passwordSetting = hotel.passwordSetting,
                logoWhite = hotel.logoWhite,
                logoBlack = hotel.logoBlack,
                primaryColor = hotel.primaryColor,
                mainPhoto = hotel.mainPhoto,
                backgroundPhoto = hotel.backgroundPhoto,
                introVideo = hotel.introVideo,
                welcomeText = hotel.welcomeText,
                runningText = hotel.runningText
            )
        }
        .catch {
            emit(HotelProfile.Empty)
        }

    override suspend fun getRoomDetail(): Resource<RoomDetail> {
        return safeApiCall { api.getRoomDetail(DeviceUtil.getDeviceName(context)) }.map {
            it.data.toDomain()
        }
    }

    override suspend fun syncWith(synchronizer: Synchronizer): Boolean {
        return synchronizer.syncSimpleData(
            fetchData = {
                val hotelProfile = safeApiCall { api.getHotelProfile() }
                hotelProfile.toModel()?.data.toDomain()
            },
            saveData = { hotel ->
                // IMPORTANT: copy() over the existing record so the device's booking
                // (hotel/room), onboarding flag and local preferences are preserved —
                // building a fresh HotelProfile here would wipe them and bounce the
                // guest back into onboarding on every sync.
                launcherDatastore.updateHotelData {
                    copy(
                        id = hotel.id.orZero(),
                        name = hotel.name.orEmpty(),
                        phone = hotel.phone.orEmpty(),
                        email = hotel.email.orEmpty(),
                        website = hotel.website.orEmpty(),
                        defaultGreeting = hotel.defaultGreeting.orEmpty(),
                        passwordSetting = hotel.passwordSetting.orEmpty(),
                        logoWhite = hotel.logoWhite.orEmpty(),
                        logoBlack = hotel.logoBlack.orEmpty(),
                        primaryColor = hotel.primaryColor.orEmpty(),
                        mainPhoto = hotel.mainPhoto.orEmpty(),
                        backgroundPhoto = hotel.backgroundPhoto.orEmpty(),
                        introVideo = hotel.introVideo.orEmpty(),
                        welcomeText = hotel.welcomeText.orEmpty(),
                        runningText = hotel.runningText.orEmpty(),
                    )
                }

            }
        )
    }
}