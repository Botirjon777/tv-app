package com.karuhun.feature.home.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Devices.TV_1080p
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import com.karuhun.feature.home.ui.model.MenuItem
import com.karuhun.launcher.core.designsystem.R
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import com.karuhun.launcher.core.designsystem.icon.MoreSvgrepoCom
import com.karuhun.launcher.core.designsystem.icon.Service
import com.karuhun.launcher.core.designsystem.icon.SettingSvgrepoCom
import com.karuhun.launcher.core.designsystem.theme.AppTheme
import com.karuhun.core.common.util.DeviceUtil
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import java.util.Calendar
import java.util.Locale
import java.text.SimpleDateFormat

@Composable
internal fun HomeScreen(
    modifier: Modifier = Modifier,
    uiState: HomeContract.UiState,
    uiAction: (HomeContract.UiAction) -> Unit,
    uiEffect: Flow<HomeContract.UiEffect>,
    onMenuItemClick: (String) -> Unit = { _ -> },
    onOpenMenu: () -> Unit = {},
    onGoToMainMenu: () -> Unit,
) {
    uiEffect.collectWithLifecycle { effect ->
        when (effect) {
            is HomeContract.UiEffect.ShowError -> {}
        }
    }

    // Greet the checked-in guest from the backend; room from the device booking.
    val guestName = uiState.guestName
    val roomNumber = uiState.roomNumber

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 40.dp, vertical = 28.dp),
    ) {
        GuestGreeting(
            modifier = Modifier.align(Alignment.TopStart),
            guestName = guestName,
        )

        RoomInfoPanel(
            modifier = Modifier.align(Alignment.TopEnd),
            roomNumber = roomNumber,
            guestName = guestName,
        )

        AppDock(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth(),
            onMenuItemClick = onMenuItemClick,
            onOpenMenu = onOpenMenu,
            onGoToMainMenu = onGoToMainMenu,
        )
    }
}

@Composable
private fun GuestGreeting(
    modifier: Modifier = Modifier,
    guestName: String,
) {
    Column(modifier = modifier) {
        Text(
            text = greetingForNow(),
            style = MaterialTheme.typography.headlineMedium.copy(
                color = Color(0xFFEFEFEF),
                fontSize = 34.sp,
                fontWeight = FontWeight.Medium,
            ),
        )
        Text(
            text = guestName.ifBlank { "Guest" },
            style = MaterialTheme.typography.headlineLarge.copy(
                color = Color.White,
                fontSize = 52.sp,
                fontWeight = FontWeight.Bold,
            ),
        )
    }
}

@Composable
private fun RoomInfoPanel(
    modifier: Modifier = Modifier,
    roomNumber: String,
    guestName: String,
) {
    var time by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        while (true) {
            val now = Calendar.getInstance().time
            time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(now)
            date = SimpleDateFormat("EEEE, d MMMM", Locale.getDefault()).format(now)
            kotlinx.coroutines.delay(1000L)
        }
    }

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.End,
    ) {
        Text(
            text = if (roomNumber.isBlank()) "ROOM" else "ROOM ${roomNumber.uppercase(Locale.getDefault())}",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = Color.White,
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
            ),
        )
        Text(
            text = "Have a nice day${if (guestName.isBlank()) "" else " $guestName"}",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = Color(0xFFD8D8D8),
                fontWeight = FontWeight.Light,
            ),
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = date,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = Color(0xFFEFEFEF),
                fontWeight = FontWeight.Normal,
            ),
        )
        Text(
            text = time,
            style = MaterialTheme.typography.displayLarge.copy(
                color = Color.White,
                fontSize = 64.sp,
                fontWeight = FontWeight.Bold,
            ),
        )
        Text(
            text = "Have a pleasant stay with us",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = Color(0xFFD8D8D8),
                fontWeight = FontWeight.Light,
            ),
        )
    }
}

@Composable
private fun AppDock(
    modifier: Modifier = Modifier,
    onMenuItemClick: (String) -> Unit,
    onOpenMenu: () -> Unit,
    onGoToMainMenu: () -> Unit,
) {
    val quickApps = MenuItem.quickApps

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        // Large "Menu" card with food image -> opens in-room dining ordering
        MenuHeroCard(
            onClick = onOpenMenu,
        )

        // Center cluster: quick apps on top, service / all apps below
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                quickApps.take(4).forEach { item ->
                    DockTile(
                        title = item.title,
                        icon = item.icon,
                        modifier = Modifier.width(118.dp),
                        onClick = { onMenuItemClick(item.title) },
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                DockTile(
                    title = "Service",
                    icon = Service,
                    modifier = Modifier.width(246.dp),
                    onClick = { onMenuItemClick("Service") },
                )
                DockTile(
                    title = "All apps",
                    icon = MoreSvgrepoCom,
                    modifier = Modifier.width(246.dp),
                    onClick = onGoToMainMenu,
                )
            }
        }

        // Right column: Wi-Fi, Coming soon, Settings
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val wifi = quickApps.first { it.title == "Wi-Fi" }
            DockTile(
                title = wifi.title,
                icon = wifi.icon,
                modifier = Modifier.width(165.dp),
                onClick = { onMenuItemClick(wifi.title) },
            )
            DockTile(
                title = "Coming soon",
                icon = Icons.Filled.WarningAmber,
                modifier = Modifier.width(165.dp),
                onClick = {},
            )
            DockTile(
                title = "Settings",
                icon = SettingSvgrepoCom,
                modifier = Modifier.width(165.dp),
                onClick = { onMenuItemClick("Settings") },
            )
        }
    }
}

@Composable
private fun MenuHeroCard(
    onClick: () -> Unit,
) {
    LauncherCard(
        onClick = onClick,
        // Height = the two-row dock cluster (64 + 10 + 64) so the card's top
        // edge lines up with the Reception card above it.
        modifier = Modifier
            .width(150.dp)
            .height(138.dp),
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(12.dp)) {
            Icon(
                imageVector = Icons.Filled.Restaurant,
                contentDescription = "Menu",
                modifier = Modifier
                    .size(56.dp)
                    .align(Alignment.Center),
                tint = Color.White,
            )
            Text(
                text = "Menu",
                modifier = Modifier.align(Alignment.BottomCenter),
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White,
            )
        }
    }
}

@Composable
private fun DockTile(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    LauncherCard(
        onClick = onClick,
        modifier = modifier.height(64.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                modifier = Modifier.size(24.dp),
                tint = Color(0xFFEFEFEF),
            )
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFEFEFEF),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Start,
            )
        }
    }
}

private fun greetingForNow(): String {
    return when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
        in 5..11 -> "Good morning!"
        in 12..16 -> "Good afternoon!"
        in 17..20 -> "Good evening!"
        else -> "Good night!"
    }
}

@Preview(device = TV_1080p)
@Composable
private fun HomeScreenPreview() {
    AppTheme {
        HomeScreen(
            onMenuItemClick = {},
            uiState = HomeContract.UiState(isLoading = false),
            uiAction = {},
            uiEffect = emptyFlow(),
            onGoToMainMenu = {},
        )
    }
}
