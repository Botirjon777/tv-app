package com.karuhun.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import com.karuhun.feature.home.ui.navigation.Home
import com.karuhun.feature.itemlist.ui.navigation.contentScreen
import com.karuhun.feature.home.ui.navigation.homeScreen
import com.karuhun.feature.itemlist.ui.navigation.ContentDetail
import com.karuhun.feature.itemlist.ui.navigation.ContentItems
import com.karuhun.feature.mainmenu.ui.navigation.MainMenu
import com.karuhun.feature.mainmenu.ui.navigation.mainMenuScreen
import com.karuhun.feature.restaurant.ui.navigation.RestaurantCategory
import com.karuhun.feature.restaurant.ui.navigation.restaurantGraph
import com.karuhun.feature.restaurant.ui.menu.MenuOrder
import com.karuhun.feature.restaurant.ui.menu.menuOrderGraph
import com.karuhun.feature.onboarding.presentation.navigation.GuestLanguage
import com.karuhun.feature.onboarding.presentation.navigation.Splash
import com.karuhun.feature.onboarding.presentation.navigation.languageDestination
import com.karuhun.feature.onboarding.presentation.navigation.splashDestination

@Composable
fun MainAppNavGraph(
    modifier: Modifier = Modifier,
    navController: NavHostController,
) {
    NavHost(
        modifier = modifier,
        navController = navController,
        startDestination = Splash,
    ) {
        splashDestination(
            onGoToLanguage = { hotelSlug, roomNumber ->
                navController.navigate(GuestLanguage(hotelSlug, roomNumber)) {
                    popUpTo(Splash) { inclusive = true }
                }
            },
            onGoToHome = {
                navController.navigate(Home) { popUpTo(Splash) { inclusive = true } }
            },
        )
        languageDestination(
            onDone = {
                navController.navigate(Home) {
                    popUpTo<GuestLanguage> { inclusive = true }
                }
            },
        )
        homeScreen(
            onMenuItemClick = { menuItem ->

            },
            onOpenMenu = {
                navController.navigate(MenuOrder())
            },
            onGoToMainMenu = {
                navController.navigate(MainMenu)
            },
        )
        mainMenuScreen(
            onNavigateToContentItems = { content ->
                navController.navigate(
                    ContentItems(
                        id = content.id!!,
                        name = content.title,
                        image = content.image,
                    ),
                )
            },
            onNavigateToRestaurant = {
                navController.navigate(MenuOrder)
            },
            onBack = { navController.popBackStack() },
        )
        contentScreen(
            onNavigateToDetail = {
                navController.navigate(
                    ContentDetail(
                        contentId = it.id,
                        contentImage = it.image,
                        contentTitle = it.name,
                        contentDescription = it.description,
                    ),
                )
            },
        )
        restaurantGraph()
        menuOrderGraph(navController)
    }
}
