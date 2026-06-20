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

@Composable
fun MainAppNavGraph(
    modifier: Modifier = Modifier,
    navController: NavHostController,
) {
    NavHost(
        modifier = modifier,
        navController = navController,
        startDestination = Home,
    ) {
        homeScreen(
            onMenuItemClick = { menuItem ->

            },
            onOpenMenu = {
                navController.navigate(MenuOrder)
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
        menuOrderGraph()
    }
}
