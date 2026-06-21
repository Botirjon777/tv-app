package com.karuhun.launcher.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text

/** A small orange spinner — the app's standard "busy" indicator. */
@Composable
fun LauncherLoading(
    modifier: Modifier = Modifier,
    size: Int = 48,
) {
    CircularProgressIndicator(
        modifier = modifier.size(size.dp),
        color = MaterialTheme.colorScheme.primary,
        strokeWidth = 4.dp,
        trackColor = Color.White.copy(alpha = 0.15f),
    )
}

/** Full-screen dimmed overlay with the orange spinner and an optional label. */
@Composable
fun LauncherLoadingOverlay(
    modifier: Modifier = Modifier,
    label: String? = null,
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.45f)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            LauncherLoading()
            label?.let {
                Text(it, color = Color.White, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
