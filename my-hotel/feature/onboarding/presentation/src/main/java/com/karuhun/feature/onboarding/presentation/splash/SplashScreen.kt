package com.karuhun.feature.onboarding.presentation.splash

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import kotlinx.coroutines.flow.Flow

@Composable
fun SplashScreen(
    modifier: Modifier = Modifier,
    uiEffect: Flow<SplashContract.UiEffect>,
    onGoToLanguage: (hotelSlug: String, roomNumber: String) -> Unit,
    onGoToHome: () -> Unit,
) {
    uiEffect.collectWithLifecycle { effect ->
        when (effect) {
            is SplashContract.UiEffect.GoToLanguage -> onGoToLanguage(effect.hotelSlug, effect.roomNumber)
            SplashContract.UiEffect.GoToHome -> onGoToHome()
        }
    }

    Box(
        modifier = modifier.fillMaxSize().background(Color(0xFF1A120D)),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator()
    }
}
