package com.karuhun.launcher.core.designsystem.component

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Border
import androidx.tv.material3.Card
import androidx.tv.material3.CardBorder
import androidx.tv.material3.CardColors
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.MaterialTheme

@Composable
fun LauncherCard(
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {},
    isSelected: Boolean = false,
    radius: Dp = 12.dp,
    color: CardColors = CardDefaults.colors(
        containerColor = Color.Black.copy(alpha = 0.60f),
        focusedContentColor = Color.White,
        contentColor = Color.White,
        pressedContentColor = Color.White
    ),
    borderColor: Color = MaterialTheme.colorScheme.primary,
    borderWidth: Dp = 1.dp,
    content: @Composable () -> Unit,
) {
    // Selected (but unfocused) state keeps the brand-orange border. The focused
    // state uses a thick WHITE border so the pointer is clearly visible on ANY
    // background — including orange-filled buttons where an orange border vanishes.
    val selectedBorder = Border(
        border = BorderStroke(width = borderWidth, color = borderColor)
    )
    val focusBorder = Border(
        border = BorderStroke(width = 3.dp, color = Color.White)
    )

    Card(
        onClick = onClick,
        modifier = modifier,
        border = CardDefaults.border(
            focusedBorder = focusBorder,
            border = if (isSelected) selectedBorder else Border.None
        ),
        scale = CardDefaults.scale(
            // Pointer feedback: focused control grows noticeably (1.2x).
            focusedScale = 1.2f
        ),
        colors = color,
        shape = CardDefaults.shape(RoundedCornerShape(radius))
    ) {
        content()
    }
}

/** A lighter orange shown when an orange primary button is focused. */
val FocusedOrange = Color(0xFFFF8A3D)

/**
 * Colors for an orange "primary" LauncherCard button. On focus the fill lightens
 * to [FocusedOrange] so the pointer is obvious (a same-orange focus border alone
 * would be invisible on an orange button).
 */
@Composable
fun launcherPrimaryButtonColors(): CardColors = CardDefaults.colors(
    containerColor = MaterialTheme.colorScheme.primary,
    focusedContainerColor = FocusedOrange,
    contentColor = Color.White,
    focusedContentColor = Color.White,
    pressedContentColor = Color.White,
)