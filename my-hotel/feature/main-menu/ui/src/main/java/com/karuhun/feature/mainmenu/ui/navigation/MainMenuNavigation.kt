package com.karuhun.feature.mainmenu.ui.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.karuhun.core.model.Content
import com.karuhun.core.model.ContentItem
import com.karuhun.core.ui.navigation.Screen
import com.karuhun.feature.mainmenu.ui.MainMenuScreen
import com.karuhun.feature.mainmenu.ui.MainMenuViewModel
import kotlinx.serialization.Serializable

@Serializable data object MainMenu : Screen

fun NavGraphBuilder.mainMenuScreen(
    onNavigateToContentItems: (Content) -> Unit,
    onNavigateToRestaurant: () -> Unit,
    onBack: () -> Unit = {},
) {
    composable<MainMenu> {
        val viewModel = hiltViewModel<MainMenuViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        val uiEffect = viewModel.uiEffect
        val uiAction = viewModel::onAction
        MainMenuScreen(
            modifier = Modifier.fillMaxSize(),
            uiState = uiState,
            uiEffect = uiEffect,
            uiAction = uiAction,
            onNavigateToContentItems = onNavigateToContentItems,
            onNavigateToRestaurant = onNavigateToRestaurant,
            onBack = onBack,
        )
    }
}