package com.hotel.kitchenpos.ui.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.hotel.kitchenpos.data.OrderStatus
import com.hotel.kitchenpos.ui.theme.Palette

private data class ColumnSpec(val status: OrderStatus, val title: String, val tone: Color)

private val COLUMNS = listOf(
    ColumnSpec(OrderStatus.PENDING, "Yangi", Palette.Amber500),
    ColumnSpec(OrderStatus.PREPARING, "Tayyorlanmoqda", Palette.Blue500),
    ColumnSpec(OrderStatus.READY, "Tayyor", Palette.Emerald500),
)

@Composable
fun PosBoard(
    onLoggedOut: () -> Unit,
    viewModel: PosViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Palette.Slate900)
            .systemBarsPadding(),
    ) {
        Header(
            connected = state.connected,
            hotels = state.hotels,
            hotelId = state.hotelId,
            onSelectHotel = viewModel::selectHotel,
            onLogout = { viewModel.logout(onLoggedOut) },
        )

        if (state.loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Palette.Brand500, strokeWidth = 3.dp)
                    Spacer(Modifier.height(12.dp))
                    Text("Buyurtmalar yuklanmoqda…", color = Palette.Slate400, fontSize = 13.sp)
                }
            }
        } else {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Palette.White.copy(alpha = 0.10f)),
                horizontalArrangement = Arrangement.spacedBy(1.dp),
            ) {
                COLUMNS.forEach { col ->
                    StatusColumn(
                        spec = col,
                        orders = state.column(col.status),
                        onUpdateStatus = viewModel::updateStatus,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(),
                    )
                }
            }
        }
    }
}

@Composable
private fun Header(
    connected: Boolean,
    hotels: List<com.hotel.kitchenpos.data.HotelDTO>,
    hotelId: String,
    onSelectHotel: (String) -> Unit,
    onLogout: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Palette.Slate900)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Palette.Brand600),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Filled.Restaurant,
                    contentDescription = null,
                    tint = Palette.White,
                    modifier = Modifier.size(20.dp),
                )
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(
                    text = "Oshxona ekrani",
                    color = Palette.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (connected) Icons.Filled.Wifi else Icons.Filled.WifiOff,
                        contentDescription = null,
                        tint = if (connected) Palette.Emerald400 else Palette.Rose400,
                        modifier = Modifier.size(12.dp),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = if (connected) "Jonli" else "Qayta ulanmoqda…",
                        color = Palette.Slate400,
                        fontSize = 11.sp,
                    )
                }
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            if (hotels.size > 1) {
                HotelSwitcher(hotels = hotels, hotelId = hotelId, onSelect = onSelectHotel)
                Spacer(Modifier.width(12.dp))
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onLogout)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    tint = Palette.Slate400,
                    modifier = Modifier.size(16.dp),
                )
                Spacer(Modifier.width(6.dp))
                Text("Chiqish", color = Palette.Slate400, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun HotelSwitcher(
    hotels: List<com.hotel.kitchenpos.data.HotelDTO>,
    hotelId: String,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val current = hotels.firstOrNull { it.id == hotelId } ?: hotels.firstOrNull()

    Box {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(Palette.Slate800)
                .clickable { expanded = true }
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            Text(
                text = current?.name ?: "—",
                color = Palette.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
            )
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = null,
                tint = Palette.Slate400,
                modifier = Modifier.size(18.dp),
            )
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            hotels.forEach { hotel ->
                DropdownMenuItem(
                    text = { Text(hotel.name) },
                    onClick = {
                        onSelect(hotel.id)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun StatusColumn(
    spec: ColumnSpec,
    orders: List<com.hotel.kitchenpos.data.OrderDTO>,
    onUpdateStatus: (String, OrderStatus) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.background(Palette.Slate900)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(spec.tone),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = spec.title,
                    color = Palette.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp,
                )
            }
            Text(
                text = orders.size.toString(),
                color = Palette.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Palette.White.copy(alpha = 0.10f))
                    .padding(horizontal = 8.dp, vertical = 2.dp),
            )
        }

        if (orders.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text("Buyurtmalar yo‘q", color = Palette.Slate600, fontSize = 13.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 12.dp, end = 12.dp, bottom = 12.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(orders, key = { it.id }) { order ->
                    OrderTicket(order = order, onUpdateStatus = onUpdateStatus)
                }
            }
        }
    }
}
