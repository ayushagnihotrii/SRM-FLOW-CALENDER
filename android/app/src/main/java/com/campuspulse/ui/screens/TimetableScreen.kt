package com.campuspulse.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.campuspulse.database.TimetableEvent
import com.campuspulse.ui.theme.*
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimetableScreen(
    events: List<TimetableEvent>,
    onToggleReminder: (TimetableEvent, Boolean) -> Unit
) {
    val days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    val fullDays = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

    val calendar = Calendar.getInstance()
    val todayIndex = when (calendar.get(Calendar.DAY_OF_WEEK)) {
        Calendar.MONDAY -> 0
        Calendar.TUESDAY -> 1
        Calendar.WEDNESDAY -> 2
        Calendar.THURSDAY -> 3
        Calendar.FRIDAY -> 4
        Calendar.SATURDAY -> 5
        Calendar.SUNDAY -> 6
        else -> 0
    }

    var selectedDayIndex by remember { mutableStateOf(todayIndex) }

    val dayEvents = remember(events, selectedDayIndex) {
        val targetDayNum = selectedDayIndex + 1
        events.filter { it.dayOfWeek == targetDayNum }.sortedBy { it.startMinutes() }
    }

    Scaffold(
        containerColor = Slate950,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Weekly Schedule",
                        color = White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate950)
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Day selector tabs
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(days.indices.toList()) { index ->
                    val isSelected = selectedDayIndex == index
                    val isToday = todayIndex == index

                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedDayIndex = index },
                        label = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    days[index],
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                                if (isToday) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("•", color = Sky400, fontWeight = FontWeight.Bold)
                                }
                            }
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            containerColor = Slate900,
                            labelColor = Slate400,
                            selectedContainerColor = Indigo500,
                            selectedLabelColor = White
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }

            // Summary bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    fullDays[selectedDayIndex],
                    color = White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Text(
                    "${dayEvents.size} Classes Scheduled",
                    color = Slate400,
                    fontSize = 13.sp
                )
            }

            // Events List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (dayEvents.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Slate900)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    "No Classes Scheduled",
                                    color = White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "No lectures or labs set for ${fullDays[selectedDayIndex]}.",
                                    color = Slate400,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                } else {
                    items(dayEvents, key = { it.id }) { event ->
                        ClassCard(
                            event = event,
                            isPast = false,
                            isNext = false,
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
}
