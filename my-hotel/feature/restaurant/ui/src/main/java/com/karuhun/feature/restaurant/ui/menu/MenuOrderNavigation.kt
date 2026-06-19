package com.karuhun.feature.restaurant.ui.menu

import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import kotlinx.serialization.Serializable

@Serializable
data object MenuOrder

fun NavGraphBuilder.menuOrderGraph() {
    composable<MenuOrder> {
        val viewModel = hiltViewModel<MenuOrderViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        MenuOrderScreen(
            uiState = uiState,
            uiEffect = viewModel.uiEffect,
            onAction = viewModel::onAction,
        )
    }
}
