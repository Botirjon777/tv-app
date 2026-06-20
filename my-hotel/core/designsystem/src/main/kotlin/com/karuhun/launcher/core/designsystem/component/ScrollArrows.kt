package com.karuhun.launcher.core.designsystem.component

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

private const val SCROLL_STEP = 340

// Clickable (and D-pad focusable) orange up/down arrows shown over a scrollable
// column when there is more content above/below than fits on screen.
@Composable
fun BoxScope.VerticalScrollArrows(
    scrollState: ScrollState,
    scope: CoroutineScope,
) {
    if (scrollState.canScrollBackward) {
        ArrowButton(
            icon = Icons.Filled.KeyboardArrowUp,
            description = "Scroll up",
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 4.dp),
            onClick = {
                scope.launch {
                    scrollState.animateScrollTo((scrollState.value - SCROLL_STEP).coerceAtLeast(0))
                }
            },
        )
    }
    if (scrollState.canScrollForward) {
        ArrowButton(
            icon = Icons.Filled.KeyboardArrowDown,
            description = "Scroll down",
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 4.dp),
            onClick = {
                scope.launch {
                    scrollState.animateScrollTo(scrollState.value + SCROLL_STEP)
                }
            },
        )
    }
}

@Composable
private fun ArrowButton(
    icon: ImageVector,
    description: String,
    modifier: Modifier,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = modifier.size(44.dp),
        shape = ButtonDefaults.shape(CircleShape),
        colors = ButtonDefaults.colors(
            containerColor = MaterialTheme.colorScheme.primary,
            focusedContainerColor = Color.White,
            contentColor = Color.White,
            focusedContentColor = MaterialTheme.colorScheme.primary,
        ),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
    ) {
        Icon(imageVector = icon, contentDescription = description, modifier = Modifier.size(26.dp))
    }
}
