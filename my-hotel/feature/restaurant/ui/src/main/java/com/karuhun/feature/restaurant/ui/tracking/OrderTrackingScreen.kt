package com.karuhun.feature.restaurant.ui.tracking

import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DeliveryDining
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import kotlinx.coroutines.flow.Flow

private fun formatSom(value: Int): String =
    "%,d".format(value).replace(',', ' ') + " so'm"

private val STEP_ICONS = listOf(
    Icons.Filled.Schedule,
    Icons.Filled.Restaurant,
    Icons.Filled.DeliveryDining,
    Icons.Filled.Check,
)

@Composable
fun OrderTrackingScreen(
    modifier: Modifier = Modifier,
    uiState: OrderTrackingContract.UiState,
    uiEffect: Flow<OrderTrackingContract.UiEffect>,
    onBackToMenu: () -> Unit,
    onEdit: (String) -> Unit = {},
) {
    uiEffect.collectWithLifecycle { }

    val order = uiState.order
    val currentIndex = OrderTrackingContract.STEPS.indexOfFirst { it.status == order?.status }
        .coerceAtLeast(0)

    Box(modifier = modifier.fillMaxSize().padding(horizontal = 64.dp, vertical = 24.dp)) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.6f)
                .align(Alignment.TopCenter)
                .verticalScroll(rememberScrollState()),
        ) {
            Text(
                text = "Order status",
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(16.dp))

            // Confirmation banner
            Box(
                Modifier.fillMaxWidth()
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.18f), RoundedCornerShape(12.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Thanks! Your order is in.", color = Color.White, fontWeight = FontWeight.Bold)
                    Text(
                        text = "Order #${order?.id?.takeLast(5)?.uppercase() ?: "—"}  ·  Room ${order?.roomNumber ?: "—"}",
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // Steps timeline
            OrderTrackingContract.STEPS.forEachIndexed { index, step ->
                StepRow(
                    icon = STEP_ICONS[index],
                    title = step.title,
                    done = index <= currentIndex,
                    active = index == currentIndex,
                    showConnector = index < OrderTrackingContract.STEPS.lastIndex,
                )
            }

            Spacer(Modifier.height(24.dp))

            // Order summary
            if (order != null && order.items.isNotEmpty()) {
                Column(
                    Modifier.fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                        .padding(16.dp),
                ) {
                    Text("Order summary", color = Color.White, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    order.items.forEach { item ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${item.quantity}× ${item.name}", color = Color.White.copy(alpha = 0.85f), style = MaterialTheme.typography.bodyMedium)
                            Text(formatSom(item.price * item.quantity), color = Color.White, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total", color = Color.White, fontWeight = FontWeight.Bold)
                        Text(formatSom(order.total), color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Editable only while the kitchen hasn't started it.
                if (order?.status == "PENDING") {
                    LauncherCard(
                        onClick = { onEdit(order.id) },
                        modifier = Modifier.weight(1f).height(52.dp),
                        color = androidx.tv.material3.CardDefaults.colors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = Color.White,
                            focusedContentColor = Color.White,
                            pressedContentColor = Color.White,
                        ),
                    ) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Edit order", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                LauncherCard(
                    onClick = onBackToMenu,
                    modifier = Modifier.weight(1f).height(52.dp),
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Back to menu", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun StepRow(
    icon: ImageVector,
    title: String,
    done: Boolean,
    active: Boolean,
    showConnector: Boolean,
) {
    val accent = MaterialTheme.colorScheme.primary
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(40.dp)
                    .background(if (done) accent else Color.White.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    modifier = Modifier.size(20.dp),
                    tint = if (done) Color.White else Color.White.copy(alpha = 0.5f),
                )
            }
            Spacer(Modifier.width(16.dp))
            Text(
                text = title,
                color = if (done) Color.White else Color.White.copy(alpha = 0.5f),
                fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                style = MaterialTheme.typography.titleMedium,
            )
        }
        if (showConnector) {
            Box(
                Modifier.padding(start = 19.dp).width(2.dp).height(22.dp)
                    .background(if (done) accent else Color.White.copy(alpha = 0.15f)),
            )
        }
    }
}
