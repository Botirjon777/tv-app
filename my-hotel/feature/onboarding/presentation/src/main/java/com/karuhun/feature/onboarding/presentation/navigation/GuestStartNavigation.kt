package com.karuhun.feature.onboarding.presentation.navigation

import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.karuhun.feature.onboarding.presentation.language.LanguageScreen
import com.karuhun.feature.onboarding.presentation.language.LanguageViewModel
import com.karuhun.feature.onboarding.presentation.splash.SplashScreen
import com.karuhun.feature.onboarding.presentation.splash.SplashViewModel
import kotlinx.serialization.Serializable

// Start of the main (already-configured) app: a loading splash that resolves
// the guest, optionally a per-guest language screen, then home.
@Serializable
data object Splash

@Serializable
data class GuestLanguage(val hotelSlug: String, val roomNumber: String)

fun NavGraphBuilder.splashDestination(
    onGoToLanguage: (hotelSlug: String, roomNumber: String) -> Unit,
    onGoToHome: () -> Unit,
) {
    composable<Splash> {
        val viewModel = hiltViewModel<SplashViewModel>()
        SplashScreen(
            uiEffect = viewModel.uiEffect,
            onGoToLanguage = onGoToLanguage,
            onGoToHome = onGoToHome,
        )
    }
}

fun NavGraphBuilder.languageDestination(onDone: () -> Unit) {
    composable<GuestLanguage> {
        val viewModel = hiltViewModel<LanguageViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        LanguageScreen(
            uiState = uiState,
            uiEffect = viewModel.uiEffect,
            onAction = viewModel::onAction,
            onDone = onDone,
        )
    }
}
