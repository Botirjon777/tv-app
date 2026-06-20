package com.karuhun.feature.onboarding.presentation.language

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.karuhun.core.ui.navigation.extension.collectWithLifecycle
import com.karuhun.launcher.core.designsystem.component.LauncherCard
import kotlinx.coroutines.flow.Flow

// The four primary languages first, then other popular ones alphabetically.
private val MAIN_LANGUAGES = listOf("Uzbek", "English", "Russian", "Spanish")
private val OTHER_LANGUAGES = listOf(
    "Arabic", "Chinese", "French", "German", "Hindi",
    "Italian", "Japanese", "Korean", "Portuguese", "Turkish",
)
private val LANGUAGES = MAIN_LANGUAGES + OTHER_LANGUAGES

@Composable
fun LanguageScreen(
    modifier: Modifier = Modifier,
    uiState: LanguageContract.UiState,
    uiEffect: Flow<LanguageContract.UiEffect>,
    onAction: (LanguageContract.UiAction) -> Unit,
    onDone: () -> Unit,
) {
    uiEffect.collectWithLifecycle { effect ->
        when (effect) {
            LanguageContract.UiEffect.Done -> onDone()
        }
    }

    Box(
        modifier = modifier.fillMaxSize().background(Color(0xFF1A120D)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(0.7f).padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Choose your language",
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Til tanlang · Выберите язык · Elija su idioma",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.6f),
                modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(LANGUAGES, key = { it }) { language ->
                    LauncherCard(
                        onClick = { onAction(LanguageContract.UiAction.Select(language)) },
                        modifier = Modifier.fillMaxWidth().height(64.dp),
                    ) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(
                                text = language,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                    }
                }
            }
        }
    }
}
