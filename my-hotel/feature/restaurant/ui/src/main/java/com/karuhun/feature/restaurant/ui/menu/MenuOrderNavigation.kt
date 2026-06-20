package com.karuhun.feature.restaurant.ui.menu

import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable
import com.karuhun.feature.restaurant.ui.tracking.OrderTrackingScreen
import com.karuhun.feature.restaurant.ui.tracking.OrderTrackingViewModel
import kotlinx.serialization.Serializable

@Serializable
data class MenuOrder(val editOrderId: String? = null)

@Serializable
data class OrderTracking(val orderId: String)

fun NavGraphBuilder.menuOrderGraph(navController: NavHostController) {
    composable<MenuOrder> {
        val viewModel = hiltViewModel<MenuOrderViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        MenuOrderScreen(
            uiState = uiState,
            uiEffect = viewModel.uiEffect,
            onAction = viewModel::onAction,
            onOrderPlaced = { orderId ->
                navController.navigate(OrderTracking(orderId))
            },
            onBack = { navController.popBackStack() },
            onTrackOrder = { orderId -> navController.navigate(OrderTracking(orderId)) },
        )
    }

    composable<OrderTracking> {
        val viewModel = hiltViewModel<OrderTrackingViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        OrderTrackingScreen(
            uiState = uiState,
            uiEffect = viewModel.uiEffect,
            onBackToMenu = { navController.popBackStack() },
            onEdit = { orderId -> navController.navigate(MenuOrder(orderId)) },
        )
    }
}
