package com.campuspulse.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.campuspulse.database.TimetableEvent
import com.campuspulse.ui.theme.*
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    events: List<TimetableEvent>,
    onToggleReminder: (TimetableEvent, Boolean) -> Unit,
    onNavigateToSync: () -> Unit
) {
    val calendar = Calendar.getInstance()
    val dayOfWeek = when (calendar.get(Calendar.DAY_OF_WEEK)) {
        Calendar.MONDAY -> 1
        Calendar.TUESDAY -> 2
        Calendar.WEDNESDAY -> 3
        Calendar.THURSDAY -> 4
        Calendar.FRIDAY -> 5
        Calendar.SATURDAY -> 6
        Calendar.SUNDAY -> 7
        else -> 1
    }

    val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    val todayEvents = remember(events, dayOfWeek) {
        events.filter { it.dayOfWeek == dayOfWeek }.sortedBy { it.startMinutes() }
    }

    val nextClass = remember(todayEvents, currentMinutes) {
        todayEvents.firstOrNull { it.endMinutes() > currentMinutes }
    }

    Scaffold(
        containerColor = Slate950,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Brush.linearGradient(listOf(Indigo500, Violet500))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("CP", color = White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                "CampusPulse",
                                color = White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Text(
                                "Smart Timetable & Reminders",
                                color = Slate400,
                                fontSize = 11.sp
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToSync) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Sync",
                            tint = Sky400
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate950)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Next Class Hero Card
            item {
                NextClassHeroCard(nextClass = nextClass, currentMinutes = currentMinutes)
            }

            // Section Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Today's Schedule",
                        color = White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    Text(
                        "${todayEvents.size} Classes",
                        color = Slate400,
                        fontSize = 13.sp
                    )
                }
            }

            // Today's list or empty state
            if (todayEvents.isEmpty()) {
                item {
                    EmptyScheduleCard(onNavigateToSync = onNavigateToSync)
                }
            } else {
                items(todayEvents, key = { it.id }) { event ->
                    val isPast = event.endMinutes() <= currentMinutes
                    ClassCard(
                        event = event,
                        isPast = isPast,
                        isNext = event.id == nextClass?.id,
                        onToggleReminder = { enabled -> onToggleReminder(event, enabled) }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun NextClassHeroCard(nextClass: TimetableEvent?, currentMinutes: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Indigo500.copy(alpha = 0.25f),
                            Slate900
                        )
                    )
                )
                .padding(20.dp)
        ) {
            if (nextClass != null) {
                val minutesUntil = nextClass.startMinutes() - currentMinutes
                val timeStatusText = when {
                    minutesUntil > 0 -> "Starts in $minutesUntil mins"
                    minutesUntil <= 0 && currentMinutes < nextClass.endMinutes() -> "Happening NOW"
                    else -> "Upcoming"
                }

                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = Indigo500.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(50),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Indigo500)
                        ) {
                            Text(
                                "NEXT CLASS",
                                color = Indigo500,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        Surface(
                            color = if (minutesUntil <= 20) Emerald400.copy(alpha = 0.2f) else Slate800,
                            shape = RoundedCornerShape(50)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(if (minutesUntil <= 20) Emerald400 else Slate400)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    timeStatusText,
                                    color = if (minutesUntil <= 20) Emerald400 else Slate400,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        "${nextClass.courseCode}: ${nextClass.courseName}",
                        color = White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 26.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = null,
                                tint = Sky400,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "${nextClass.startTimeFormatted()} - ${nextClass.endTimeFormatted()}",
                                color = Slate200,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Surface(
                            color = Slate800,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                "Room: ${nextClass.room}",
                                color = Sky400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    if (nextClass.faculty.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Faculty: ${nextClass.faculty}",
                            color = Slate400,
                            fontSize = 12.sp
                        )
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "🎉 All Done for Today!",
                        color = White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "No more upcoming classes scheduled for today.",
                        color = Slate400,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

@Composable
fun ClassCard(
    event: TimetableEvent,
    isPast: Boolean,
    isNext: Boolean,
    onToggleReminder: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isNext) Slate800 else Slate900
        ),
        border = if (isNext) androidx.compose.foundation.BorderStroke(1.dp, Indigo500.copy(alpha = 0.6f)) else null
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Time Column
            Column(
                modifier = Modifier.width(80.dp),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    event.startTimeFormatted(),
                    color = if (isPast) Slate600 else White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    event.endTimeFormatted(),
                    color = Slate600,
                    fontSize = 11.sp
                )
            }

            // Divider accent
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(44.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        if (isPast) Slate700 else if (isNext) Emerald400 else Indigo500
                    )
            )

            Spacer(modifier = Modifier.width(14.dp))

            // Details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    event.courseCode,
                    color = if (isPast) Slate400 else Sky400,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    event.courseName,
                    color = if (isPast) Slate600 else White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        "📍 ${event.room}",
                        color = if (isPast) Slate600 else Slate400,
                        fontSize = 11.sp
                    )
                    if (event.faculty.isNotEmpty()) {
                        Text(
                            "• ${event.faculty}",
                            color = Slate600,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                    }
                }
            }

            // Reminder Toggle
            IconButton(
                onClick = { onToggleReminder(!event.reminderEnabled) }
            ) {
                Icon(
                    imageVector = if (event.reminderEnabled) Icons.Default.Notifications else Icons.Default.NotificationsOff,
                    contentDescription = "Toggle reminder",
                    tint = if (event.reminderEnabled) Amber400 else Slate600,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun EmptyScheduleCard(onNavigateToSync: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("No Classes Scheduled Today", color = White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                "Enjoy your free time, or sync your latest timetable if you haven't already.",
                color = Slate400,
                fontSize = 13.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onNavigateToSync,
                colors = ButtonDefaults.buttonColors(containerColor = Indigo500),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Sync Timetable", color = White)
            }
        }
    }
}
