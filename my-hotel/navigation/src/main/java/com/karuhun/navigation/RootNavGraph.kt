
package com.karuhun.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import com.karuhun.feature.onboarding.presentation.navigation.HotelSelection
import com.karuhun.feature.onboarding.presentation.navigation.onboardingGraph

@Composable
fun OnboardingNavGraph(
    navController: NavHostController,
    onOnboardingComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = HotelSelection,
        modifier = modifier
    ) {
        onboardingGraph(
            navController = navController,
            onNavigateToHome = onOnboardingComplete,
        )
    }
}
