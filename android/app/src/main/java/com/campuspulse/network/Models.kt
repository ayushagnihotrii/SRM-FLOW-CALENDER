package com.campuspulse.network

import com.google.gson.annotations.SerializedName

data class SyncResponse(
    val timetable: TimetableData,
    val syncToken: String
)

data class TimetableData(
    val id: String,
    val name: String,
    val semesterStart: String,
    val semesterEnd: String,
    val timezone: String,
    val events: List<EventData>,
    val createdAt: String,
    val updatedAt: String
)

data class EventData(
    val id: String,
    val courseCode: String,
    val courseName: String,
    val room: String,
    val dayOfWeek: String,
    val startTime: String,
    val endTime: String,
    val faculty: String,
    val reminderEnabled: Boolean = true
)
