package com.campuspulse.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.campuspulse.database.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val scheduler = NotificationScheduler(context)
            scheduler.createNotificationChannel()

            CoroutineScope(Dispatchers.IO).launch {
                val db = AppDatabase.getDatabase(context)
                val events = db.timetableDao().getEventsWithReminders()
                scheduler.scheduleAllNotifications(events)
            }
        }
    }
}
