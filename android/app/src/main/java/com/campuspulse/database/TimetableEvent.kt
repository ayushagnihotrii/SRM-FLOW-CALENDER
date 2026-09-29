package com.campuspulse.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "timetable_events")
data class TimetableEvent(
    @PrimaryKey
    val id: String,
    val courseCode: String,
    val courseName: String,
    val room: String,
    val dayOfWeek: Int, // 1=Monday, 2=Tuesday, ..., 7=Sunday
    val startTime: String, // HH:MM format
    val endTime: String,   // HH:MM format
    val faculty: String,
    val reminderEnabled: Boolean = true
) {
    fun dayName(): String = when (dayOfWeek) {
        1 -> "Monday"
        2 -> "Tuesday"
        3 -> "Wednesday"
        4 -> "Thursday"
        5 -> "Friday"
        6 -> "Saturday"
        7 -> "Sunday"
        else -> "Unknown"
    }

    fun startTimeFormatted(): String {
        val parts = startTime.split(":")
        val hour = parts[0].toInt()
        val minute = parts[1]
        val period = if (hour >= 12) "PM" else "AM"
        val displayHour = if (hour % 12 == 0) 12 else hour % 12
        return "$displayHour:$minute $period"
    }

    fun endTimeFormatted(): String {
        val parts = endTime.split(":")
        val hour = parts[0].toInt()
        val minute = parts[1]
        val period = if (hour >= 12) "PM" else "AM"
        val displayHour = if (hour % 12 == 0) 12 else hour % 12
        return "$displayHour:$minute $period"
    }

    fun startMinutes(): Int {
        val parts = startTime.split(":")
        return parts[0].toInt() * 60 + parts[1].toInt()
    }

    fun endMinutes(): Int {
        val parts = endTime.split(":")
        return parts[0].toInt() * 60 + parts[1].toInt()
    }

    companion object {
        fun dayNameToNumber(name: String): Int = when (name) {
            "Monday" -> 1
            "Tuesday" -> 2
            "Wednesday" -> 3
            "Thursday" -> 4
            "Friday" -> 5
            "Saturday" -> 6
            "Sunday" -> 7
            else -> 1
        }
    }
}
