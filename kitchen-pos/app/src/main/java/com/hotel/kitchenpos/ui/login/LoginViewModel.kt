package com.hotel.kitchenpos.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hotel.kitchenpos.data.AppSession
import com.hotel.kitchenpos.data.KitchenApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val submitting: Boolean = false,
    val error: String? = null,
    // Server URL is configured in a settings dialog, not on the main form.
    val showSettings: Boolean = false,
    val serverUrl: String = AppSession.baseUrl,
)

class LoginViewModel : ViewModel() {
    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) =
        _state.update { it.copy(email = value, error = null) }

    fun onPasswordChange(value: String) =
        _state.update { it.copy(password = value, error = null) }

    fun openSettings() =
        _state.update { it.copy(showSettings = true, serverUrl = AppSession.baseUrl) }

    fun dismissSettings() =
        _state.update { it.copy(showSettings = false) }

    fun onServerUrlChange(value: String) =
        _state.update { it.copy(serverUrl = value) }

    fun saveServerUrl() {
        AppSession.baseUrl = _state.value.serverUrl
        _state.update { it.copy(showSettings = false, serverUrl = AppSession.baseUrl) }
    }

    fun submit(onSuccess: () -> Unit) {
        val current = _state.value
        if (current.submitting) return
        if (current.email.isBlank() || current.password.isBlank()) {
            _state.update { it.copy(error = "Email va parolni kiriting") }
            return
        }
        _state.update { it.copy(submitting = true, error = null) }
        viewModelScope.launch {
            runCatching { KitchenApi.login(current.email.trim(), current.password) }
                .onSuccess {
                    _state.update { it.copy(submitting = false) }
                    onSuccess()
                }
                .onFailure { e ->
                    _state.update {
                        it.copy(
                            submitting = false,
                            error = e.message ?: "Kirishda xatolik",
                        )
                    }
                }
        }
    }
}
