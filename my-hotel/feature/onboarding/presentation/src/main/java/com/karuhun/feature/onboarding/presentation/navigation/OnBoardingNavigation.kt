package com.karuhun.feature.onboarding.presentation.navigation

import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable
import androidx.navigation.toRoute
import com.karuhun.feature.onboarding.presentation.hotel.HotelSelectionScreen
import com.karuhun.feature.onboarding.presentation.hotel.HotelSelectionViewModel
import com.karuhun.feature.onboarding.presentation.room.RoomInputScreen
import com.karuhun.feature.onboarding.presentation.room.RoomInputViewModel
import kotlinx.serialization.Serializable

@Serializable
data object HotelSelection

@Serializable
data class RoomInput(val hotelSlug: String, val hotelName: String)

fun NavGraphBuilder.onboardingGraph(
    navController: NavHostController,
    onNavigateToHome: () -> Unit,
) {
    composable<HotelSelection> {
        val viewModel = hiltViewModel<HotelSelectionViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        HotelSelectionScreen(
            uiState = uiState,
            uiEffect = viewModel.uiEffect,
            onHotelSelected = { hotel ->
                navController.navigate(RoomInput(hotelSlug = hotel.slug, hotelName = hotel.name))
            },
        )
    }

    composable<RoomInput> { backStackEntry ->
        val args = backStackEntry.toRoute<RoomInput>()
        val viewModel = hiltViewModel<RoomInputViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        RoomInputScreen(
            hotelSlug = args.hotelSlug,
            hotelName = args.hotelName,
            uiState = uiState,
            uiEffect = viewModel.uiEffect,
            onAction = viewModel::onAction,
            onSaved = onNavigateToHome,
        )
    }
}
