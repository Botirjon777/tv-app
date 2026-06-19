package com.karuhun.feature.onboarding.presentation.room

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import kotlinx.coroutines.flow.Flow

@Composable
fun RoomInputScreen(
    modifier: Modifier = Modifier,
    hotelSlug: String,
    hotelName: String,
    uiState: RoomInputContract.UiState,
    uiEffect: Flow<RoomInputContract.UiEffect>,
    onAction: (RoomInputContract.UiAction) -> Unit,
    onSaved: () -> Unit,
) {
    uiEffect.collectWithLifecycle { effect ->
        when (effect) {
            RoomInputContract.UiEffect.Saved -> onSaved()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF1A120D)),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = hotelName,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Enter your room number",
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White,
                modifier = Modifier.padding(top = 4.dp),
            )

            // Current input display
            Box(
                modifier = Modifier
                    .padding(vertical = 20.dp)
                    .width(220.dp)
                    .height(64.dp)
                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = uiState.roomNumber.ifEmpty { "—" },
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                )
            }

            // Numeric keypad (D-pad friendly)
            val rows = listOf(
                listOf("1", "2", "3"),
                listOf("4", "5", "6"),
                listOf("7", "8", "9"),
            )
            rows.forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { digit ->
                        KeypadButton(text = digit) {
                            onAction(RoomInputContract.UiAction.AppendDigit(digit))
                        }
                    }
                }
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(12.dp))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                KeypadButton(text = "⌫") { onAction(RoomInputContract.UiAction.Backspace) }
                KeypadButton(text = "0") { onAction(RoomInputContract.UiAction.AppendDigit("0")) }
                KeypadButton(text = "OK", wide = false) {
                    onAction(RoomInputContract.UiAction.Confirm(hotelSlug, hotelName))
                }
            }
        }
    }
}

@Composable
private fun KeypadButton(
    text: String,
    wide: Boolean = false,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .width(if (wide) 132.dp else 60.dp)
            .height(60.dp),
        colors = ButtonDefaults.colors(
            containerColor = Color.Black.copy(alpha = 0.4f),
            focusedContainerColor = MaterialTheme.colorScheme.primary,
            contentColor = Color.White,
            focusedContentColor = Color.White,
        ),
    ) {
        Text(text = text, style = MaterialTheme.typography.titleMedium)
    }
}
