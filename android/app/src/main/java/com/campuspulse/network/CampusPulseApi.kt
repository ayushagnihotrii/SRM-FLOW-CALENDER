package com.campuspulse.network

import retrofit2.http.GET

interface CampusPulseApi {
    @GET("/api/timetable/sync")
    suspend fun syncTimetable(): SyncResponse
}
