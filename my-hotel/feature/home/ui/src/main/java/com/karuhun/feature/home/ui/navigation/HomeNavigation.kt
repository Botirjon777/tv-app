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
import com.karuhun.feature.home.ui.language.LanguageSelectScreen
import com.karuhun.feature.home.ui.language.LanguageSelectViewModel
import com.karuhun.feature.home.ui.language.LanguageSelectContract
import com.karuhun.feature.home.ui.settings.MyHotelSettingsScreen
import com.karuhun.feature.home.ui.settings.MyHotelSettingsViewModel
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import kotlinx.serialization.Serializable

@Keep
@Serializable data object Home : Screen

@Keep
@Serializable data object LanguageSelect : Screen

@Keep
@Serializable data object MyHotelSettings : Screen

fun NavGraphBuilder.homeScreen(
    onMenuItemClick: (String) -> Unit,
    onOpenMenu: () -> Unit,
    onGoToMainMenu: () -> Unit,
    onOpenLanguage: () -> Unit = {},
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
            onOpenLanguage = onOpenLanguage,
        )
    }
}

fun NavGraphBuilder.languageSelectScreen(
    onBack: () -> Unit,
) {
    composable<LanguageSelect> {
        val viewModel = hiltViewModel<LanguageSelectViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        viewModel.uiEffect.collectWithLifecycle { effect ->
            when (effect) {
                LanguageSelectContract.UiEffect.Done -> onBack()
            }
        }
        LanguageSelectScreen(
            uiState = uiState,
            onSelect = { code -> viewModel.onAction(LanguageSelectContract.UiAction.Select(code)) },
            onBack = onBack,
        )
    }
}

fun NavGraphBuilder.myHotelSettingsScreen(
    onBack: () -> Unit,
) {
    composable<MyHotelSettings> {
        val viewModel = hiltViewModel<MyHotelSettingsViewModel>()
        val uiState by viewModel.uiState.collectAsStateWithLifecycle()
        MyHotelSettingsScreen(
            uiState = uiState,
            onAction = viewModel::onAction,
            onBack = onBack,
        )
    }
}