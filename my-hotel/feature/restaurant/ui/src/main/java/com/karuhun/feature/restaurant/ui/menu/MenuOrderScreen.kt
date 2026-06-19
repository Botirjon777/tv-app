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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.Card
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.karuhun.core.model.MenuCategory
import com.karuhun.core.model.MenuProduct
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import kotlinx.coroutines.flow.Flow

private fun formatSom(value: Int): String =
    "%,d".format(value).replace(',', ' ') + " so'm"

@Composable
fun MenuOrderScreen(
    modifier: Modifier = Modifier,
    uiState: MenuOrderContract.UiState,
    uiEffect: Flow<MenuOrderContract.UiEffect>,
    onAction: (MenuOrderContract.UiAction) -> Unit,
) {
    uiEffect.collectWithLifecycle { /* state-driven banners below */ }

    Box(modifier = modifier.fillMaxSize().background(Color(0xFF1A120D))) {
        Row(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            // ── Categories ──
            LazyColumn(
                modifier = Modifier.fillMaxHeight().weight(0.22f),
                verticalArrangement = Arrangement.spacedBy(8.dp),
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

        // Order placed / error banner
        val banner = uiState.placedMessage ?: uiState.errorMessage
        if (banner != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 16.dp)
                    .background(
                        if (uiState.placedMessage != null) MaterialTheme.colorScheme.primary
                        else Color(0xFFB00020),
                        RoundedCornerShape(12.dp),
                    )
                    .padding(horizontal = 24.dp, vertical = 12.dp),
            ) {
                Text(text = banner, color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun CategoryRow(category: MenuCategory, selected: Boolean, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        colors = CardDefaults.colors(
            containerColor = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
            else Color.Black.copy(alpha = 0.4f),
            focusedContainerColor = MaterialTheme.colorScheme.primary,
            contentColor = Color.White,
            focusedContentColor = Color.White,
        ),
        shape = CardDefaults.shape(RoundedCornerShape(10.dp)),
    ) {
        Box(Modifier.fillMaxSize().padding(horizontal = 16.dp), contentAlignment = Alignment.CenterStart) {
            Text(text = category.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ProductCard(product: MenuProduct, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(170.dp),
        colors = CardDefaults.colors(containerColor = Color.Black.copy(alpha = 0.4f), contentColor = Color.White),
        shape = CardDefaults.shape(RoundedCornerShape(12.dp)),
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
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            items(uiState.cart.values.toList(), key = { it.product.id }) { line ->
                Card(
                    onClick = { onAction(MenuOrderContract.UiAction.RemoveFromCart(line.product.id)) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.colors(
                        containerColor = Color.Black.copy(alpha = 0.4f),
                        focusedContainerColor = MaterialTheme.colorScheme.primary,
                        contentColor = Color.White,
                        focusedContentColor = Color.White,
                    ),
                    shape = CardDefaults.shape(RoundedCornerShape(8.dp)),
                ) {
                    Row(
                        Modifier.fillMaxWidth().padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("${line.quantity}× ${line.product.name}", style = MaterialTheme.typography.bodySmall)
                        Text(formatSom(line.product.price * line.quantity), style = MaterialTheme.typography.bodySmall)
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
        Button(
            onClick = { onAction(MenuOrderContract.UiAction.PlaceOrder) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.colors(
                containerColor = MaterialTheme.colorScheme.primary,
                focusedContainerColor = Color.White,
                contentColor = Color.White,
                focusedContentColor = MaterialTheme.colorScheme.primary,
            ),
        ) {
            Text(
                text = if (uiState.isPlacing) "Placing…" else "Place Order (${uiState.cartCount})",
                fontWeight = FontWeight.Bold,
            )
        }
    }
}
