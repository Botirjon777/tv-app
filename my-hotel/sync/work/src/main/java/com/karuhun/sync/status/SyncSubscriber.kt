package com.karuhun.sync.status

interface SyncSubscriber {
    suspend fun subscribe()
}
