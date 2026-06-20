package com.karuhun.feature.onboarding.presentation.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karuhun.core.common.onFailure
import com.karuhun.core.common.onSuccess
import com.karuhun.core.domain.usecase.GetBookingUseCase
import com.karuhun.core.domain.usecase.GetMenuGuestUseCase
import com.karuhun.core.ui.navigation.delegate.mvi.MVI
import com.karuhun.core.ui.navigation.delegate.mvi.mvi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

object SplashContract {
    data class UiState(val isLoading: Boolean = true)
    sealed interface UiAction
    sealed interface UiEffect {
        // A guest is checked in but has no preferred language yet.
        data class GoToLanguage(val hotelSlug: String, val roomNumber: String) : UiEffect
        data object GoToHome : UiEffect
    }
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val getBookingUseCase: GetBookingUseCase,
    private val getMenuGuestUseCase: GetMenuGuestUseCase,
) : ViewModel(),
    MVI<SplashContract.UiState, SplashContract.UiAction, SplashContract.UiEffect> by mvi(
        initialState = SplashContract.UiState(),
    ) {

    init {
        resolve()
    }

    override fun onAction(action: SplashContract.UiAction) {}

    // On boot: look up the room's guest. If they're checked in and haven't
    // picked a TV language yet, send them to the language screen; otherwise go
    // straight home.
    private fun resolve() = viewModelScope.launch {
        val booking = getBookingUseCase().firstOrNull()
        if (booking == null || booking.hotelSlug.isBlank() || booking.roomNumber.isBlank()) {
            emitUiEffect(SplashContract.UiEffect.GoToHome)
            return@launch
        }
        getMenuGuestUseCase(booking.hotelSlug, booking.roomNumber)
            .onSuccess { guest ->
                if (guest.hasGuest && guest.preferredLanguage.isBlank()) {
                    emitUiEffect(
                        SplashContract.UiEffect.GoToLanguage(booking.hotelSlug, booking.roomNumber),
                    )
                } else {
                    emitUiEffect(SplashContract.UiEffect.GoToHome)
                }
            }
            .onFailure { emitUiEffect(SplashContract.UiEffect.GoToHome) }
    }
}
