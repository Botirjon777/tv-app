package com.karuhun.feature.home.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.karuhun.launcher.core.designsystem.component.BackButton
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import com.karuhun.launcher.core.designsystem.component.launcherPrimaryButtonColors
import com.karuhun.launcher.core.designsystem.locale.tr

// A handful of warm hotel-room/lobby wallpapers the staff can pick from (entering a
// URL on a TV remote is impractical, so we offer presets). Served from our own
// backend so TVs never depend on an external CDN being reachable.
private val WALLPAPERS = listOf(
    "http://10.0.2.2:3000/img/walls/photo-1618773928121-c32242e63f39.jpg",
    "http://10.0.2.2:3000/img/walls/photo-1582719478250-c89cae4dc85b.jpg",
    "http://10.0.2.2:3000/img/walls/photo-1611892440504-42a792e24d32.jpg",
    "http://10.0.2.2:3000/img/walls/photo-1566073771259-6a8506099945.jpg",
    "http://10.0.2.2:3000/img/walls/photo-1631049307264-da0ec9d70304.jpg",
    "http://10.0.2.2:3000/img/walls/photo-1445019980597-93fa8acb246c.jpg",
)

@Composable
fun MyHotelSettingsScreen(
    modifier: Modifier = Modifier,
    uiState: MyHotelSettingsContract.UiState,
    onAction: (MyHotelSettingsContract.UiAction) -> Unit,
    onBack: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 40.dp, vertical = 24.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            BackButton(onClick = onBack)
            Text(
                text = tr("my_hotel_settings"),
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            uiState.savedMessage?.let { msg ->
                Text(
                    text = "•  $msg",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleSmall,
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        if (!uiState.unlocked) {
            PinGate(uiState = uiState, onAction = onAction)
        } else {
            Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                RoomSection(
                    modifier = Modifier.fillMaxHeight().weight(0.36f),
                    uiState = uiState,
                    onAction = onAction,
                )
                WallpaperSection(
                    modifier = Modifier.fillMaxHeight().weight(0.64f),
                    currentUrl = uiState.wallpaperUrl,
                    onSelect = { onAction(MyHotelSettingsContract.UiAction.SelectWallpaper(it)) },
                )
            }
        }
    }
}

@Composable
private fun PinGate(
    uiState: MyHotelSettingsContract.UiState,
    onAction: (MyHotelSettingsContract.UiAction) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = if (uiState.pinError) tr("wrong_pin") else tr("enter_pin"),
            color = if (uiState.pinError) MaterialTheme.colorScheme.primary else Color.White,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.titleLarge,
        )
        Spacer(Modifier.height(16.dp))
        // Six dots showing how many digits entered.
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            repeat(6) { i ->
                val filled = i < uiState.pinInput.length
                Box(
                    Modifier.size(18.dp)
                        .clip(RoundedCornerShape(50))
                        .background(if (filled) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.18f)),
                )
            }
        }
        Spacer(Modifier.height(24.dp))
        val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "")
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(8.dp),
            modifier = Modifier.width(320.dp),
        ) {
            items(keys) { key ->
                if (key.isEmpty()) {
                    Box(Modifier.fillMaxWidth().height(56.dp))
                } else {
                    KeypadButton(
                        label = key,
                        onClick = {
                            if (key == "⌫") onAction(MyHotelSettingsContract.UiAction.PinBackspace)
                            else onAction(MyHotelSettingsContract.UiAction.PinDigit(key))
                        },
                        highlight = false,
                    )
                }
            }
        }
    }
}

@Composable
private fun RoomSection(
    modifier: Modifier = Modifier,
    uiState: MyHotelSettingsContract.UiState,
    onAction: (MyHotelSettingsContract.UiAction) -> Unit,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .padding(4.dp),
    ) {
        Text(
            text = uiState.hotelName.ifBlank { "Hotel" },
            color = Color.White.copy(alpha = 0.7f),
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(tr("room_number"), color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Box(
            Modifier.fillMaxWidth().height(56.dp)
                .clip(RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = uiState.roomInput.ifBlank { "—" },
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 30.sp,
            )
        }
        Spacer(Modifier.height(8.dp))
        // 3x4 numeric keypad: 1-9, backspace, 0, save.
        val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓")
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            items(keys) { key ->
                KeypadButton(
                    label = key,
                    onClick = {
                        when (key) {
                            "⌫" -> onAction(MyHotelSettingsContract.UiAction.RoomBackspace)
                            "✓" -> onAction(MyHotelSettingsContract.UiAction.SaveRoom)
                            else -> onAction(MyHotelSettingsContract.UiAction.RoomDigit(key))
                        }
                    },
                    highlight = key == "✓",
                )
            }
        }
    }
}

@Composable
private fun KeypadButton(label: String, onClick: () -> Unit, highlight: Boolean) {
    LauncherCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        color = if (highlight) launcherPrimaryButtonColors() else CardDefaults.colors(
            containerColor = Color.Black.copy(alpha = 0.55f),
            contentColor = Color.White, focusedContentColor = Color.White, pressedContentColor = Color.White,
        ),
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
        }
    }
}

@Composable
private fun WallpaperSection(
    modifier: Modifier = Modifier,
    currentUrl: String,
    onSelect: (String) -> Unit,
) {
    Column(modifier = modifier) {
        Text(tr("wallpaper"), color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(12.dp),
            modifier = Modifier.fillMaxSize(),
        ) {
            items(WALLPAPERS) { url ->
                val selected = url == currentUrl
                LauncherCard(
                    onClick = { onSelect(url) },
                    modifier = Modifier.fillMaxWidth().height(110.dp),
                    isSelected = selected,
                    borderColor = if (selected) MaterialTheme.colorScheme.primary else Color.White,
                ) {
                    Box(Modifier.fillMaxSize()) {
                        AsyncImage(
                            model = url,
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop,
                        )
                        if (selected) {
                            Box(
                                Modifier.fillMaxSize()
                                    .clip(RoundedCornerShape(12.dp))
                                    .padding(8.dp),
                                contentAlignment = Alignment.TopEnd,
                            ) {
                                Text("✓", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
