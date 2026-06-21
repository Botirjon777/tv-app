package com.karuhun.feature.restaurant.ui.pastorders

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.core.model.PlacedOrder
import com.karuhun.launcher.core.designsystem.component.BackButton
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import com.karuhun.launcher.core.designsystem.locale.tr
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private fun formatSom(value: Int): String =
    "%,d".format(value).replace(',', ' ') + " so'm"

private val DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm")
private fun formatDateTime(iso: String): String = runCatching {
    Instant.parse(iso).atZone(ZoneId.systemDefault()).format(DATE_FMT)
}.getOrDefault("")

@androidx.compose.runtime.Composable
private fun statusLabel(status: String): String = when (status) {
    "DELIVERED" -> tr("order_delivered")
    "CANCELLED" -> tr("order_cancelled")
    else -> status
}

@Composable
fun PastOrdersScreen(
    modifier: Modifier = Modifier,
    uiState: PastOrdersContract.UiState,
    onBack: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 48.dp, vertical = 28.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            BackButton(onClick = onBack)
            Text(
                text = tr("past_orders"),
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
        }

        Spacer(Modifier.height(20.dp))

        if (uiState.orders.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = if (uiState.isLoading) tr("loading") else tr("no_past_orders"),
                    color = Color.White.copy(alpha = 0.6f),
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(uiState.orders, key = { it.id }) { order ->
                    PastOrderCard(order)
                }
            }
        }
    }
}

@Composable
private fun PastOrderCard(order: PlacedOrder) {
    LauncherCard(onClick = {}, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(
                        text = "Order #${order.id.takeLast(5).uppercase()} • ${statusLabel(order.status)}",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleSmall,
                    )
                    Text(
                        text = formatDateTime(order.createdAt),
                        color = Color.White.copy(alpha = 0.55f),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Text(
                    text = formatSom(order.total),
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = order.items.joinToString(", ") { "${it.quantity}× ${it.name}" },
                color = Color.White.copy(alpha = 0.75f),
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}
