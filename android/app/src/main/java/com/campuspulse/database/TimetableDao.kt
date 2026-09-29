package com.campuspulse.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface TimetableDao {
    @Query("SELECT * FROM timetable_events ORDER BY dayOfWeek, startTime")
    fun getAllEvents(): Flow<List<TimetableEvent>>

    @Query("SELECT * FROM timetable_events ORDER BY dayOfWeek, startTime")
    suspend fun getAllEventsList(): List<TimetableEvent>

    @Query("SELECT * FROM timetable_events WHERE dayOfWeek = :dayOfWeek ORDER BY startTime")
    fun getEventsForDay(dayOfWeek: Int): Flow<List<TimetableEvent>>

    @Query("SELECT * FROM timetable_events WHERE dayOfWeek = :dayOfWeek ORDER BY startTime")
    suspend fun getEventsForDayList(dayOfWeek: Int): List<TimetableEvent>

    @Query("SELECT * FROM timetable_events WHERE id = :id")
    suspend fun getEventById(id: String): TimetableEvent?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(events: List<TimetableEvent>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: TimetableEvent)

    @Update
    suspend fun update(event: TimetableEvent)

    @Delete
    suspend fun delete(event: TimetableEvent)

    @Query("DELETE FROM timetable_events")
    suspend fun deleteAll()

    @Query("SELECT * FROM timetable_events WHERE reminderEnabled = 1 ORDER BY dayOfWeek, startTime")
    suspend fun getEventsWithReminders(): List<TimetableEvent>
}
