package com.campuspulse

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.glance.appwidget.updateAll
import androidx.lifecycle.lifecycleScope
import com.campuspulse.database.AppDatabase
import com.campuspulse.database.TimetableEvent
import com.campuspulse.network.ApiClient
import com.campuspulse.notifications.NotificationScheduler
import com.campuspulse.ui.screens.HomeScreen
import com.campuspulse.ui.screens.SyncScreen
import com.campuspulse.ui.screens.TimetableScreen
import com.campuspulse.ui.theme.CampusPulseTheme
import com.campuspulse.ui.theme.Indigo500
import com.campuspulse.ui.theme.Slate400
import com.campuspulse.ui.theme.Slate900
import com.campuspulse.ui.theme.Slate950
import com.campuspulse.ui.theme.White
import com.campuspulse.widget.CampusPulseWidget
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private lateinit var database: AppDatabase
    private lateinit var scheduler: NotificationScheduler

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        // Notification permission granted or denied
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        database = AppDatabase.getDatabase(this)
        scheduler = NotificationScheduler(this)
        scheduler.createNotificationChannel()

        // Request notification permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        setContent {
            CampusPulseTheme {
                val events by database.timetableDao().getAllEvents().collectAsState(initial = emptyList())
                var currentTab by remember { mutableIntStateOf(0) }
                var isSyncing by remember { mutableStateOf(false) }
                var syncError by remember { mutableStateOf<String?>(null) }
                var lastSyncTime by remember { mutableStateOf<String?>(null) }

                Scaffold(
                    containerColor = Slate950,
                    bottomBar = {
                        NavigationBar(
                            containerColor = Slate900,
                            contentColor = White
                        ) {
                            NavigationBarItem(
                                selected = currentTab == 0,
                                onClick = { currentTab = 0 },
                                icon = { Icon(Icons.Default.Home, contentDescription = "Today") },
                                label = { Text("Today") },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Indigo500,
                                    selectedTextColor = Indigo500,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Slate950
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == 1,
                                onClick = { currentTab = 1 },
                                icon = { Icon(Icons.Default.CalendarMonth, contentDescription = "Weekly") },
                                label = { Text("Weekly") },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Indigo500,
                                    selectedTextColor = Indigo500,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Slate950
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == 2,
                                onClick = { currentTab = 2 },
                                icon = { Icon(Icons.Default.Sync, contentDescription = "Sync") },
                                label = { Text("Sync") },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Indigo500,
                                    selectedTextColor = Indigo500,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Slate950
                                )
                            )
                        }
                    }
                ) { paddingValues ->
                    Surface(
                        modifier = Modifier.padding(paddingValues),
                        color = Slate950
                    ) {
                        when (currentTab) {
                            0 -> HomeScreen(
                                events = events,
                                onToggleReminder = { event, enabled ->
                                    handleToggleReminder(event, enabled)
                                },
                                onNavigateToSync = { currentTab = 2 }
                            )
                            1 -> TimetableScreen(
                                events = events,
                                onToggleReminder = { event, enabled ->
                                    handleToggleReminder(event, enabled)
                                }
                            )
                            2 -> SyncScreen(
                                currentServerUrl = ApiClient.getBaseUrl(),
                                totalEventsCount = events.size,
                                isSyncing = isSyncing,
                                syncError = syncError,
                                lastSyncTime = lastSyncTime,
                                onUpdateServerUrl = { newUrl ->
                                    ApiClient.setBaseUrl(newUrl)
                                },
                                onSyncNow = {
                                    performSync(
                                        onStart = {
                                            isSyncing = true
                                            syncError = null
                                        },
                                        onSuccess = { count ->
                                            isSyncing = false
                                            lastSyncTime = SimpleDateFormat("hh:mm a, MMM dd", Locale.getDefault()).format(Date())
                                        },
                                        onError = { error ->
                                            isSyncing = false
                                            syncError = error
                                        }
                                    )
                                },
                                onLoadDemoData = {
                                    loadDemoTimetable()
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun handleToggleReminder(event: TimetableEvent, enabled: Boolean) {
        lifecycleScope.launch(Dispatchers.IO) {
            val updated = event.copy(reminderEnabled = enabled)
            database.timetableDao().update(updated)
            val allWithReminders = database.timetableDao().getEventsWithReminders()
            scheduler.scheduleAllNotifications(allWithReminders)
            refreshWidget()
        }
    }

    private fun performSync(
        onStart: () -> Unit,
        onSuccess: (Int) -> Unit,
        onError: (String) -> Unit
    ) {
        onStart()
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = ApiClient.create()
                val response = api.syncTimetable()

                val domainEvents = response.timetable.events.map { dto ->
                    TimetableEvent(
                        id = dto.id,
                        courseCode = dto.courseCode,
                        courseName = dto.courseName,
                        room = dto.room,
                        dayOfWeek = TimetableEvent.dayNameToNumber(dto.dayOfWeek),
                        startTime = dto.startTime,
                        endTime = dto.endTime,
                        faculty = dto.faculty,
                        reminderEnabled = dto.reminderEnabled
                    )
                }

                database.timetableDao().deleteAll()
                database.timetableDao().insertAll(domainEvents)

                val enabledReminders = domainEvents.filter { it.reminderEnabled }
                scheduler.scheduleAllNotifications(enabledReminders)
                refreshWidget()

                withContext(Dispatchers.Main) {
                    onSuccess(domainEvents.size)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onError("Failed to sync: ${e.localizedMessage ?: "Unknown error"}")
                }
            }
        }
    }

    private fun loadDemoTimetable() {
        lifecycleScope.launch(Dispatchers.IO) {
            val demoList = listOf(
                TimetableEvent("demo-1", "CSE301", "Operating Systems", "TP-401", 1, "08:45", "09:35", "Dr. Rajesh K"),
                TimetableEvent("demo-2", "CSE302", "Database Management", "TP-402", 1, "09:40", "10:30", "Prof. Anita S"),
                TimetableEvent("demo-3", "CSE303", "Computer Networks", "TP-401", 1, "10:45", "11:35", "Dr. Arun M"),
                TimetableEvent("demo-4", "MAT201", "Discrete Mathematics", "UB-201", 2, "08:45", "09:35", "Dr. Geetha V"),
                TimetableEvent("demo-5", "CSE305", "Software Engineering", "TP-502", 2, "09:40", "10:30", "Prof. Ramesh P"),
                TimetableEvent("demo-6", "CSE301L", "OS Laboratory", "LAB-1", 2, "13:30", "15:10", "Dr. Rajesh K"),
                TimetableEvent("demo-7", "CSE302", "Database Management", "TP-402", 3, "08:45", "09:35", "Prof. Anita S"),
                TimetableEvent("demo-8", "CSE303", "Computer Networks", "TP-401", 3, "10:45", "11:35", "Dr. Arun M"),
                TimetableEvent("demo-9", "CSE306", "Web Technology", "TP-403", 4, "08:45", "09:35", "Prof. Kavitha S"),
                TimetableEvent("demo-10", "CSE301", "Operating Systems", "TP-401", 4, "09:40", "10:30", "Dr. Rajesh K"),
                TimetableEvent("demo-11", "MAT201", "Discrete Mathematics", "UB-201", 5, "08:45", "09:35", "Dr. Geetha V"),
                TimetableEvent("demo-12", "CSE305", "Software Engineering", "TP-502", 5, "10:45", "11:35", "Prof. Ramesh P")
            )

            database.timetableDao().deleteAll()
            database.timetableDao().insertAll(demoList)
            scheduler.scheduleAllNotifications(demoList)
            refreshWidget()
        }
    }

    private suspend fun refreshWidget() {
        try {
            CampusPulseWidget().updateAll(this@MainActivity)
        } catch (_: Exception) {}
    }
}
