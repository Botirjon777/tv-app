package com.karuhun.launcher.core.designsystem.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Icon
import androidx.tv.material3.Text

// Focusable "Back" affordance — same orange-border card style as the launcher.
@Composable
fun BackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LauncherCard(
        onClick = onClick,
        modifier = modifier
            .width(108.dp)
            .height(44.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxHeight()
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                modifier = Modifier.size(20.dp),
                tint = Color.White,
            )
            Text(
                text = "Back",
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}
