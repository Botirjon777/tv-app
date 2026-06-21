package com.karuhun.feature.home.ui.language

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
import androidx.compose.ui.unit.sp
import androidx.tv.material3.CardDefaults
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.feature.home.ui.model.LanguageOption
import com.karuhun.launcher.core.designsystem.component.BackButton
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import com.karuhun.launcher.core.designsystem.locale.tr

@Composable
fun LanguageSelectScreen(
    modifier: Modifier = Modifier,
    uiState: LanguageSelectContract.UiState,
    onSelect: (String) -> Unit,
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
                text = tr("choose_language"),
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
        }

        Spacer(Modifier.height(20.dp))

        LazyColumn(
            modifier = Modifier.fillMaxWidth(0.6f),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 8.dp, horizontal = 6.dp),
        ) {
            items(LanguageOption.ALL, key = { it.code }) { lang ->
                LanguageRow(
                    lang = lang,
                    selected = lang.code.equals(uiState.currentCode, ignoreCase = true),
                    onClick = { onSelect(lang.code) },
                )
            }
        }
    }
}

@Composable
private fun LanguageRow(
    lang: LanguageOption,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val selectedColors = CardDefaults.colors(
        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.28f),
        contentColor = Color.White,
        focusedContentColor = Color.White,
        pressedContentColor = Color.White,
    )
    LauncherCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(64.dp),
        color = if (selected) selectedColors else CardDefaults.colors(
            containerColor = Color.Black.copy(alpha = 0.60f),
            contentColor = Color.White,
            focusedContentColor = Color.White,
            pressedContentColor = Color.White,
        ),
    ) {
        Row(
            Modifier.fillMaxSize().padding(horizontal = 20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column {
                Text(
                    text = lang.nativeName,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    text = lang.englishName,
                    color = Color.White.copy(alpha = 0.55f),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Text(text = lang.flag, fontSize = 34.sp)
        }
    }
}
