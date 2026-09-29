package com.campuspulse

import android.app.Application
import com.campuspulse.notifications.NotificationScheduler

class CampusPulseApp : Application() {

    override fun onCreate() {
        super.onCreate()
        
        // Initialize notification channel for class reminders
        val scheduler = NotificationScheduler(this)
        scheduler.createNotificationChannel()
    }
}
