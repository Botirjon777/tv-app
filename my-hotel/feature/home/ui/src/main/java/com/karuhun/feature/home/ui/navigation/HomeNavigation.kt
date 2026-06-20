package com.karuhun.feature.home.ui.navigation

import androidx.annotation.Keep
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.karuhun.core.ui.navigation.Screen
import com.karuhun.feature.home.ui.HomeScreen
import com.karuhun.feature.home.ui.HomeViewModel
import kotlinx.serialization.Serializable

@Keep
@Serializable data object Home : Screen

fun NavGraphBuilder.homeScreen(
    onMenuItemClick: (String) -> Unit,
    onOpenMenu: () -> Unit,
    onGoToMainMenu: () -> Unit,
){
    composable<Home> {
        val viewModel = hiltViewModel<HomeViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        val uiEffect = viewModel.uiEffect
        val uiAction = viewModel::onAction
        HomeScreen(
            onMenuItemClick = onMenuItemClick,
            onOpenMenu = onOpenMenu,
            uiState = uiState,
            uiAction = uiAction,
            uiEffect = uiEffect,
            onGoToMainMenu = onGoToMainMenu,
        )
    }
}