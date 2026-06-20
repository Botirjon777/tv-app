package com.karuhun.launcher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Devices
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import com.karuhun.core.common.util.DeviceUtil
import com.karuhun.launcher.core.designsystem.component.RunningText
import com.karuhun.launcher.core.designsystem.component.TopBar
import com.karuhun.launcher.core.designsystem.theme.AppTheme
import com.karuhun.navigation.MainAppNavGraph
import com.karuhun.navigation.OnboardingNavGraph
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import java.time.LocalDate
import java.time.format.DateTimeFormatter

// Warm hotel-room interior used as the launcher background.
private const val DEFAULT_ROOM_BACKGROUND =
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1920&q=80"

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                val viewModel = hiltViewModel<MainViewModel>()
                val uiState by viewModel.uiState.collectAsStateWithLifecycle()
                val navController = rememberNavController()

                if (uiState.isOnboardingCompleted) {
                    LauncherApplication(
                        modifier = Modifier.fillMaxSize(),
                        appState = rememberAppState(navController = navController),
                        uiState = uiState,
                        uiEffect = viewModel.uiEffect,
                        onAction = viewModel::onAction,
                        onMenuItemClick = {},
                    )
                } else {
                    OnboardingNavGraph(
                        navController = navController,
                        onOnboardingComplete = {
                            viewModel.onAction(MainContract.UiAction.OnboardingCompleted)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun LauncherApplication(
    modifier: Modifier = Modifier,
    appState: LauncherAppState,
    uiState: MainContract.UiState,
    uiEffect: Flow<MainContract.UiEffect>,
    onAction: (MainContract.UiAction) -> Unit,
    onMenuItemClick: (String) -> Unit,
) {
    Box(
        modifier = modifier,
    ) {
        // Background Image — a warm in-room interior (matches the welcome design).
        AsyncImage(
            model = DEFAULT_ROOM_BACKGROUND,
            contentDescription = null,
            modifier = Modifier
                .fillMaxSize(),
            contentScale = ContentScale.Crop,
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.35f)),
        )

        Column(
            modifier =
            Modifier
                .fillMaxSize()
        ) {
            val formatter = remember { DateTimeFormatter.ofPattern("dd MMMM yyyy") }
            var formattedDate by remember { mutableStateOf(LocalDate.now().format(formatter)) }

            LaunchedEffect(Unit) {
                while (true) {
                    val newFormattedDate = LocalDate.now().format(formatter)
                    if (formattedDate != newFormattedDate) {
                        formattedDate = newFormattedDate
                    }
                    delay(1000L)
                }
            }

            // The home screen draws its own greeting / room-info hero, so the
            // shared top bar and running text are only shown on other screens.
            val navBackStackEntry by appState.navController.currentBackStackEntryAsState()
            val isHome = navBackStackEntry?.destination?.route?.contains("Home") == true

            if (!isHome) {
                TopBar(
                    modifier = Modifier
                        .height(80.dp),
                    roomNumber = uiState.roomNumber.ifBlank { "—" },
                    date = formattedDate,
                    temperature = "20°C",
                    imageUrl = uiState.hotelProfile?.logoWhite.orEmpty(),
                    weatherText = "01d"
                )
            }

            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(
                        bottom = 0.dp,
                    ),
            ) {
                MainAppNavGraph(
                    modifier = Modifier
                        .fillMaxSize(),
                    navController = appState.navController,
                )
            }

            if (!isHome) {
                Spacer(modifier = Modifier.height(24.dp))
                RunningText(
                    modifier = Modifier
                        .padding(bottom = 4.dp)
                        .fillMaxWidth(),
                    text = uiState.hotelProfile?.runningText.orEmpty(),
                )
            }
        }

        // Top-left order-status toast (shows on every launcher screen).
        uiState.orderStatusToast?.let { message ->
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(24.dp)
                    .background(Color(0xFFF4511E), RoundedCornerShape(10.dp))
                    .padding(horizontal = 16.dp, vertical = 10.dp),
            ) {
                Text(
                    text = "🔔  $message",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

@Composable
@Preview(device = Devices.TV_1080p)
fun LauncherApplicationPreview() {
    val navController = rememberNavController()
    val coroutineScope = CoroutineScope(Dispatchers.Main)
    val viewModel = hiltViewModel<MainViewModel>()
    val appState = LauncherAppState(
        navController = navController,
        coroutineScope = coroutineScope,
        viewModel = viewModel,
    )
    LauncherApplication(
        modifier = Modifier.fillMaxSize(),
        appState = appState,
        onMenuItemClick = {},
        uiState = MainContract.UiState(isOnboardingCompleted = true),
        uiEffect = emptyFlow(),
        onAction = {},
    )
}