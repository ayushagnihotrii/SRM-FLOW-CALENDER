package com.campuspulse.notifications

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.campuspulse.database.TimetableEvent
import java.util.Calendar

class NotificationScheduler(private val context: Context) {

    companion object {
        const val CHANNEL_ID = "campuspulse_class_reminders"
        const val CHANNEL_NAME = "Class Reminders"
        const val REMINDER_MINUTES = 20
    }

    fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "20-minute reminders before your classes"
            enableVibration(true)
        }

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    fun scheduleAllNotifications(events: List<TimetableEvent>) {
        // Cancel all existing alarms
        cancelAllNotifications(events)

        // Schedule new alarms for enabled events
        events.filter { it.reminderEnabled }.forEach { event ->
            scheduleNotification(event)
        }
    }

    private fun scheduleNotification(event: TimetableEvent) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, NotificationReceiver::class.java).apply {
            putExtra("event_id", event.id)
            putExtra("course_code", event.courseCode)
            putExtra("course_name", event.courseName)
            putExtra("room", event.room)
            putExtra("start_time", event.startTimeFormatted())
        }

        val requestCode = event.id.hashCode()
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Calculate next occurrence of this class
        val triggerTime = calculateNextTriggerTime(event)

        if (triggerTime != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setRepeating(
                            AlarmManager.RTC_WAKEUP,
                            triggerTime,
                            AlarmManager.INTERVAL_DAY * 7, // Weekly
                            pendingIntent
                        )
                    } else {
                        // Fallback to inexact alarm
                        alarmManager.setRepeating(
                            AlarmManager.RTC_WAKEUP,
                            triggerTime,
                            AlarmManager.INTERVAL_DAY * 7,
                            pendingIntent
                        )
                    }
                } else {
                    alarmManager.setRepeating(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        AlarmManager.INTERVAL_DAY * 7,
                        pendingIntent
                    )
                }
            } catch (e: SecurityException) {
                // Fallback to inexact
                alarmManager.setRepeating(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    AlarmManager.INTERVAL_DAY * 7,
                    pendingIntent
                )
            }
        }
    }

    private fun calculateNextTriggerTime(event: TimetableEvent): Long? {
        val calendar = Calendar.getInstance()
        val now = calendar.timeInMillis

        // Set to the next occurrence of this day
        val targetDay = when (event.dayOfWeek) {
            1 -> Calendar.MONDAY
            2 -> Calendar.TUESDAY
            3 -> Calendar.WEDNESDAY
            4 -> Calendar.THURSDAY
            5 -> Calendar.FRIDAY
            6 -> Calendar.SATURDAY
            7 -> Calendar.SUNDAY
            else -> return null
        }

        val parts = event.startTime.split(":")
        val hour = parts[0].toInt()
        val minute = parts[1].toInt()

        // Set time to 20 minutes before class
        calendar.set(Calendar.HOUR_OF_DAY, hour)
        calendar.set(Calendar.MINUTE, minute - REMINDER_MINUTES)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)

        // Handle minute underflow
        if (calendar.get(Calendar.MINUTE) < 0) {
            calendar.add(Calendar.HOUR_OF_DAY, -1)
            calendar.set(Calendar.MINUTE, calendar.get(Calendar.MINUTE) + 60)
        }

        // Set to the correct day of week
        val currentDay = calendar.get(Calendar.DAY_OF_WEEK)
        var daysUntil = targetDay - currentDay
        if (daysUntil < 0) daysUntil += 7
        if (daysUntil == 0 && calendar.timeInMillis <= now) {
            daysUntil = 7
        }
        calendar.add(Calendar.DAY_OF_YEAR, daysUntil)

        return calendar.timeInMillis
    }

    private fun cancelAllNotifications(events: List<TimetableEvent>) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        events.forEach { event ->
            val intent = Intent(context, NotificationReceiver::class.java)
            val requestCode = event.id.hashCode()
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarmManager.cancel(pendingIntent)
        }
    }
}
