package com.karuhun.feature.onboarding.presentation.hotel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Card
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.core.model.MenuHotel
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import kotlinx.coroutines.flow.Flow

@Composable
fun HotelSelectionScreen(
    modifier: Modifier = Modifier,
    uiState: HotelSelectionContract.UiState,
    uiEffect: Flow<HotelSelectionContract.UiEffect>,
    onHotelSelected: (MenuHotel) -> Unit,
) {
    uiEffect.collectWithLifecycle { /* errors surfaced via uiState.errorMessage */ }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF1A120D)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Welcome",
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Select your hotel to get started",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White.copy(alpha = 0.7f),
                modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
            )

            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(modifier = Modifier.padding(24.dp))
                }

                uiState.errorMessage != null -> {
                    Text(
                        text = uiState.errorMessage,
                        color = Color(0xFFFF6B6B),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(uiState.hotels, key = { it.id }) { hotel ->
                            HotelRow(hotel = hotel, onClick = { onHotelSelected(hotel) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HotelRow(
    hotel: MenuHotel,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp),
        colors = CardDefaults.colors(
            containerColor = Color.Black.copy(alpha = 0.4f),
            focusedContainerColor = MaterialTheme.colorScheme.primary,
            contentColor = Color.White,
            focusedContentColor = Color.White,
        ),
        shape = CardDefaults.shape(RoundedCornerShape(12.dp)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentAlignment = Alignment.CenterStart,
        ) {
            Column {
                Text(
                    text = hotel.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "${hotel.roomCount} rooms",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.7f),
                )
            }
        }
    }
}
