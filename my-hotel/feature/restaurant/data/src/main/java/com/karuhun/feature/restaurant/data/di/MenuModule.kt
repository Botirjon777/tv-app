package com.karuhun.feature.restaurant.data.di

import com.karuhun.core.domain.repository.BookingRepository
import com.karuhun.core.domain.repository.MenuRepository
import com.karuhun.feature.restaurant.data.repository.BookingRepositoryImpl
import com.karuhun.feature.restaurant.data.repository.MenuRepositoryImpl
import com.karuhun.feature.restaurant.data.source.MenuApiService
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal object MenuNetworkModule {
    @Provides
    @Singleton
    fun provideMenuApiService(
        @Named("menu") retrofit: Retrofit,
    ): MenuApiService = retrofit.create(MenuApiService::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class MenuRepositoryModule {
    @Binds
    @Singleton
    abstract fun bindMenuRepository(impl: MenuRepositoryImpl): MenuRepository

    @Binds
    @Singleton
    abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository
}
