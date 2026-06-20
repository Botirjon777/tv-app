package com.karuhun.launcher

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

// Posts a system notification when an in-room dining order changes status, so
// the guest is informed even when the launcher isn't on screen (e.g. watching
// TV). Best-effort: silently no-ops if notifications are disabled.
@Singleton
class OrderNotifier @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Order status",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply { description = "In-room dining order updates" }
            context.getSystemService(NotificationManager::class.java)
                ?.createNotificationChannel(channel)
        }
    }

    fun notifyStatus(orderId: String, title: String, message: String) {
        try {
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()
            NotificationManagerCompat.from(context).notify(orderId.hashCode(), notification)
        } catch (_: SecurityException) {
            // Notifications not permitted — the in-app toast still covers it.
        }
    }

    companion object {
        private const val CHANNEL_ID = "order_status"
    }
}
