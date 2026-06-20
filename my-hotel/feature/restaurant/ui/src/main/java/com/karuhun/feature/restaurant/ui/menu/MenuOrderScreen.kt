package com.karuhun.feature.restaurant.ui.menu

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import com.karuhun.launcher.core.designsystem.component.BackButton
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import kotlinx.coroutines.flow.Flow

private fun formatSom(value: Int): String =
    "%,d".format(value).replace(',', ' ') + " so'm"

@Composable
fun MenuOrderScreen(
    modifier: Modifier = Modifier,
    uiState: MenuOrderContract.UiState,
    uiEffect: Flow<MenuOrderContract.UiEffect>,
    onAction: (MenuOrderContract.UiAction) -> Unit,
    onOrderPlaced: (String) -> Unit = {},
    onBack: () -> Unit = {},
    onTrackOrder: (String) -> Unit = {},
) {
    uiEffect.collectWithLifecycle { effect ->
        when (effect) {
            is MenuOrderContract.UiEffect.OrderPlaced -> onOrderPlaced(effect.orderId)
            is MenuOrderContract.UiEffect.ShowError -> {}
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
      Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Header: back + (resume active order) + (past orders) + edit label.
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            BackButton(onClick = onBack)
            val active = uiState.activeOrder
            if (active != null && !uiState.isEditing) {
                PillButton(
                    text = "Track order • ${statusLabel(active.status)}",
                    onClick = { onTrackOrder(active.id) },
                )
            }
            if (uiState.pastOrders.isNotEmpty()) {
                PillButton(
                    text = "Past orders (${uiState.pastOrders.size})",
                    onClick = { onAction(MenuOrderContract.UiAction.ShowPastOrders) },
                )
            }
            if (uiState.isEditing) {
                Text(
                    text = "Editing your order",
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
        Row(modifier = Modifier.fillMaxSize()) {
            // ── Categories ──
            LazyColumn(
                modifier = Modifier.fillMaxHeight().weight(0.22f),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(uiState.categories, key = { it.id }) { category ->
                    CategoryRow(
                        category = category,
                        selected = category.id == uiState.selectedCategoryId,
                        onClick = { onAction(MenuOrderContract.UiAction.SelectCategory(category.id)) },
                    )
                }
            }

            // ── Products grid ──
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxHeight().weight(0.5f).padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(uiState.products, key = { it.id }) { product ->
                    ProductCard(
                        product = product,
                        onClick = { onAction(MenuOrderContract.UiAction.AddToCart(product)) },
                    )
                }
            }

            // ── Cart ──
            CartPanel(
                modifier = Modifier.fillMaxHeight().weight(0.28f),
                uiState = uiState,
                onAction = onAction,
            )
        }
      }

      // Past orders overlay
      if (uiState.showPastOrders) {
          PastOrdersPanel(
              modifier = Modifier.align(Alignment.Center),
              orders = uiState.pastOrders,
              onClose = { onAction(MenuOrderContract.UiAction.HidePastOrders) },
          )
      }
    }
}

@Composable
private fun PillButton(text: String, onClick: () -> Unit) {
    LauncherCard(
        onClick = onClick,
        modifier = Modifier.height(44.dp),
    ) {
        Box(Modifier.fillMaxHeight().padding(horizontal = 16.dp), contentAlignment = Alignment.Center) {
            Text(text = text, color = Color.White, fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

private fun statusLabel(status: String): String = when (status) {
    "PENDING" -> "Received"
    "PREPARING" -> "Preparing"
    "READY" -> "On its way"
    "DELIVERED" -> "Delivered"
    "CANCELLED" -> "Cancelled"
    else -> status
}

@Composable
private fun PastOrdersPanel(
    modifier: Modifier = Modifier,
    orders: List<com.karuhun.core.model.PlacedOrder>,
    onClose: () -> Unit,
) {
    Box(
        modifier = modifier
            .fillMaxWidth(0.6f)
            .fillMaxHeight(0.8f)
            .background(Color(0xFF14100E), RoundedCornerShape(16.dp))
            .padding(20.dp),
    ) {
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Past orders", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                PillButton(text = "Close", onClick = onClose)
            }
            androidx.compose.foundation.layout.Spacer(Modifier.height(12.dp))
            if (orders.isEmpty()) {
                Text("No past orders yet.", color = Color.White.copy(alpha = 0.6f))
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(orders, key = { it.id }) { order ->
                        LauncherCard(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.fillMaxWidth().padding(12.dp)) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(
                                        "Order #${order.id.takeLast(5).uppercase()} • ${statusLabel(order.status)}",
                                        color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium,
                                    )
                                    Text(formatSom(order.total), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                }
                                Text(
                                    order.items.joinToString(", ") { "${it.quantity}× ${it.name}" },
                                    color = Color.White.copy(alpha = 0.7f),
                                    style = MaterialTheme.typography.bodySmall,
                                    maxLines = 2,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CategoryRow(category: MenuCategory, selected: Boolean, onClick: () -> Unit) {
    LauncherCard(
        onClick = onClick,
        isSelected = selected,
        modifier = Modifier.fillMaxWidth().height(56.dp),
    ) {
        Box(Modifier.fillMaxSize().padding(horizontal = 16.dp), contentAlignment = Alignment.CenterStart) {
            Text(
                text = category.name,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
        }
    }
}

@Composable
private fun ProductCard(product: MenuProduct, onClick: () -> Unit) {
    LauncherCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(170.dp),
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomStart) {
            AsyncImage(
                model = product.imageUrl,
                contentDescription = product.name,
                modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)),
                contentScale = ContentScale.Crop,
            )
            Box(
                Modifier.fillMaxSize().background(
                    Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f)), startY = 120f),
                ),
            )
            Column(Modifier.fillMaxWidth().padding(10.dp)) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Text(
                    text = formatSom(product.price),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
private fun CartPanel(
    modifier: Modifier = Modifier,
    uiState: MenuOrderContract.UiState,
    onAction: (MenuOrderContract.UiAction) -> Unit,
) {
    Column(
        modifier = modifier
            .background(Color.Black.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
            .padding(16.dp),
    ) {
        Text(
            text = "Your Order  •  Room ${uiState.booking.roomNumber.ifEmpty { "—" }}",
            style = MaterialTheme.typography.titleMedium,
            color = Color.White,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = uiState.booking.hotelName.ifEmpty { "" },
            style = MaterialTheme.typography.bodySmall,
            color = Color.White.copy(alpha = 0.6f),
            modifier = Modifier.padding(bottom = 8.dp),
        )

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(uiState.cart.values.toList(), key = { it.product.id }) { line ->
                LauncherCard(
                    onClick = { onAction(MenuOrderContract.UiAction.RemoveFromCart(line.product.id)) },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                ) {
                    Row(
                        Modifier.fillMaxSize().padding(horizontal = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            "${line.quantity}× ${line.product.name}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White,
                        )
                        Text(
                            formatSom(line.product.price * line.quantity),
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White,
                        )
                    }
                }
            }
        }

        Text(
            text = "Total: ${formatSom(uiState.cartTotal)}",
            style = MaterialTheme.typography.titleMedium,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 8.dp),
        )
        // Primary action — keeps the focusable orange-border card style.
        LauncherCard(
            onClick = { onAction(MenuOrderContract.UiAction.PlaceOrder) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            color = androidx.tv.material3.CardDefaults.colors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                focusedContentColor = Color.White,
                pressedContentColor = Color.White,
            ),
        ) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(
                        imageVector = Icons.Filled.ShoppingCart,
                        contentDescription = null,
                        modifier = Modifier.height(20.dp),
                        tint = Color.White,
                    )
                    Text(
                        text = when {
                            uiState.isPlacing -> "Saving…"
                            uiState.isEditing -> "Update Order (${uiState.cartCount})"
                            else -> "Place Order (${uiState.cartCount})"
                        },
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                }
            }
        }
    }
}
