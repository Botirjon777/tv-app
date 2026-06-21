package com.karuhun.feature.restaurant.ui.menu

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
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
import androidx.compose.foundation.layout.PaddingValues
import com.karuhun.launcher.core.designsystem.component.BackButton
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import com.karuhun.launcher.core.designsystem.component.LauncherLoadingOverlay
import com.karuhun.launcher.core.designsystem.component.launcherPrimaryButtonColors
import com.karuhun.launcher.core.designsystem.locale.tr
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
    onPastOrders: () -> Unit = {},
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
                    text = "${tr("track_order")} • ${orderStatusText(active.status)}",
                    onClick = { onTrackOrder(active.id) },
                )
            }
            if (uiState.pastOrders.isNotEmpty()) {
                PillButton(
                    text = "${tr("past_orders")} (${uiState.pastOrders.size})",
                    onClick = onPastOrders,
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
                // Breathing room so a focused row scaling 1.2x isn't clipped.
                contentPadding = PaddingValues(vertical = 8.dp, horizontal = 6.dp),
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
                // Top/side padding so a focused card scaling 1.2x is never clipped
                // by the header above or the grid edges.
                contentPadding = PaddingValues(top = 18.dp, bottom = 18.dp, start = 6.dp, end = 6.dp),
            ) {
                items(uiState.products, key = { it.id }) { product ->
                    ProductCard(
                        product = product,
                        onClick = { onAction(MenuOrderContract.UiAction.OpenQuantity(product)) },
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

      // Quantity picker modal
      uiState.quantityProduct?.let { product ->
          QuantityModal(
              product = product,
              quantity = uiState.quantityValue,
              inCart = uiState.quantityInCart,
              onInc = { onAction(MenuOrderContract.UiAction.IncQuantity) },
              onDec = { onAction(MenuOrderContract.UiAction.DecQuantity) },
              onConfirm = { onAction(MenuOrderContract.UiAction.ConfirmQuantity) },
              onDelete = { onAction(MenuOrderContract.UiAction.DeleteFromCart) },
              onDismiss = { onAction(MenuOrderContract.UiAction.DismissQuantity) },
          )
      }

      // Orange busy spinner while the menu loads or an order is being placed.
      if (uiState.isLoading || uiState.isPlacing) {
          LauncherLoadingOverlay()
      }
    }
}

@Composable
private fun QuantityModal(
    product: MenuProduct,
    quantity: Int,
    inCart: Boolean,
    onInc: () -> Unit,
    onDec: () -> Unit,
    onConfirm: () -> Unit,
    onDelete: () -> Unit,
    onDismiss: () -> Unit,
) {
    // A Dialog traps D-pad focus inside the modal so navigation can't leak to the
    // menu behind it; we also request initial focus on the primary action.
    val primaryFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) { primaryFocus.requestFocus() }
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.4f)
                .background(Color(0xFF1C1714), RoundedCornerShape(16.dp))
                .padding(24.dp),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(product.name, color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                Text(formatSom(product.price), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(20.dp))
                // − [qty] +
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                    QtyStepper(text = "−", onClick = onDec)
                    Text("$quantity", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.headlineMedium)
                    QtyStepper(text = "+", onClick = onInc)
                }
                Spacer(Modifier.height(24.dp))
                if (inCart) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ModalButton(text = tr("delete"), filled = false, modifier = Modifier.weight(1f), onClick = onDelete)
                        ModalButton(text = tr("update"), filled = true, modifier = Modifier.weight(1f).focusRequester(primaryFocus), onClick = onConfirm)
                    }
                } else {
                    ModalButton(text = tr("add_to_cart"), filled = true, modifier = Modifier.fillMaxWidth().focusRequester(primaryFocus), onClick = onConfirm)
                }
                Spacer(Modifier.height(8.dp))
                ModalButton(text = tr("cancel"), filled = false, modifier = Modifier.fillMaxWidth(), onClick = onDismiss)
            }
        }
    }
}

@Composable
private fun QtyStepper(text: String, onClick: () -> Unit) {
    LauncherCard(onClick = onClick, modifier = Modifier.size(52.dp)) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text, color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.headlineSmall)
        }
    }
}

@Composable
private fun ModalButton(text: String, filled: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    LauncherCard(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        color = if (filled) launcherPrimaryButtonColors() else androidx.tv.material3.CardDefaults.colors(
            containerColor = Color.White.copy(alpha = 0.08f),
            contentColor = Color.White, focusedContentColor = Color.White, pressedContentColor = Color.White,
        ),
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text, color = Color.White, fontWeight = FontWeight.Bold)
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

@Composable
private fun orderStatusText(status: String): String = when (status) {
    "PENDING" -> tr("order_received")
    "PREPARING" -> tr("order_preparing")
    "READY" -> tr("order_on_its_way")
    "DELIVERED" -> tr("order_delivered")
    "CANCELLED" -> tr("order_cancelled")
    else -> status
}

@Composable
private fun CategoryRow(category: MenuCategory, selected: Boolean, onClick: () -> Unit) {
    // A selected (but unfocused) category gets a soft, lighter-orange fill — clearly
    // distinct from the solid orange focus border so the two aren't confused.
    val selectedColors = androidx.tv.material3.CardDefaults.colors(
        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.28f),
        contentColor = Color.White,
        focusedContentColor = Color.White,
        pressedContentColor = Color.White,
    )
    LauncherCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        color = if (selected) selectedColors else androidx.tv.material3.CardDefaults.colors(
            containerColor = Color.Black.copy(alpha = 0.60f),
            contentColor = Color.White,
            focusedContentColor = Color.White,
            pressedContentColor = Color.White,
        ),
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
            text = "${tr("your_order")}  •  ${tr("room")} ${uiState.booking.roomNumber.ifEmpty { "—" }}",
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
            contentPadding = PaddingValues(vertical = 6.dp, horizontal = 4.dp),
        ) {
            items(uiState.cart.values.toList(), key = { it.product.id }) { line ->
                LauncherCard(
                    // Tapping a cart line re-opens the quantity modal (− n + with
                    // Delete / Update) so the guest can edit it like when adding.
                    onClick = { onAction(MenuOrderContract.UiAction.OpenQuantity(line.product)) },
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
            text = "${tr("total")}: ${formatSom(uiState.cartTotal)}",
            style = MaterialTheme.typography.titleMedium,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 8.dp),
        )
        // Primary action — orange button that lightens on focus.
        LauncherCard(
            onClick = { onAction(MenuOrderContract.UiAction.PlaceOrder) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            color = launcherPrimaryButtonColors(),
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
                            uiState.isPlacing -> tr("saving")
                            uiState.isEditing -> "${tr("update_order")} (${uiState.cartCount})"
                            else -> "${tr("place_order")} (${uiState.cartCount})"
                        },
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                }
            }
        }
    }
}
