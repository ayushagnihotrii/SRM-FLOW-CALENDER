package com.campuspulse.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.campuspulse.MainActivity
import com.campuspulse.database.AppDatabase
import com.campuspulse.database.TimetableEvent
import java.util.Calendar

class CampusPulseWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val db = AppDatabase.getDatabase(context)
        val calendar = Calendar.getInstance()
        val currentDayOfWeek = when (calendar.get(Calendar.DAY_OF_WEEK)) {
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
        val todayEvents = db.timetableDao().getEventsForDayList(currentDayOfWeek)
        val upcomingEvents = todayEvents.filter { it.endMinutes() > currentMinutes }
        val nextClass = upcomingEvents.firstOrNull()

        provideContent {
            WidgetContent(
                dayName = when (currentDayOfWeek) {
                    1 -> "Monday"
                    2 -> "Tuesday"
                    3 -> "Wednesday"
                    4 -> "Thursday"
                    5 -> "Friday"
                    6 -> "Saturday"
                    7 -> "Sunday"
                    else -> "Today"
                },
                nextClass = nextClass,
                remainingCount = upcomingEvents.size
            )
        }
    }

    @Composable
    private fun WidgetContent(
        dayName: String,
        nextClass: TimetableEvent?,
        remainingCount: Int
    ) {
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(Color(0xFF0F172A))
                .clickable(actionStartActivity<MainActivity>())
                .padding(14.dp)
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize()
            ) {
                // Header
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CampusPulse",
                        style = TextStyle(
                            color = androidx.glance.unit.ColorProvider(Color(0xFF38BDF8)),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = dayName,
                        style = TextStyle(
                            color = androidx.glance.unit.ColorProvider(Color(0xFF94A3B8)),
                            fontSize = 12.sp
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(10.dp))

                if (nextClass != null) {
                    // Next Class Card
                    Box(
                        modifier = GlanceModifier
                            .fillMaxWidth()
                            .background(Color(0xFF1E293B))
                            .padding(12.dp)
                    ) {
                        Column {
                            Row(
                                modifier = GlanceModifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "NEXT CLASS",
                                    style = TextStyle(
                                        color = androidx.glance.unit.ColorProvider(Color(0xFF818CF8)),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Spacer(modifier = GlanceModifier.defaultWeight())
                                Text(
                                    text = nextClass.startTimeFormatted(),
                                    style = TextStyle(
                                        color = androidx.glance.unit.ColorProvider(Color(0xFF34D399)),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }

                            Spacer(modifier = GlanceModifier.height(4.dp))

                            Text(
                                text = "${nextClass.courseCode} - ${nextClass.courseName}",
                                style = TextStyle(
                                    color = androidx.glance.unit.ColorProvider(Color.White),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                maxLines = 1
                            )

                            Spacer(modifier = GlanceModifier.height(4.dp))

                            Row {
                                Text(
                                    text = "📍 Room: ${nextClass.room}",
                                    style = TextStyle(
                                        color = androidx.glance.unit.ColorProvider(Color(0xFFCBD5E1)),
                                        fontSize = 11.sp
                                    )
                                )
                                if (nextClass.faculty.isNotEmpty()) {
                                    Spacer(modifier = GlanceModifier.width(8.dp))
                                    Text(
                                        text = "• ${nextClass.faculty}",
                                        style = TextStyle(
                                            color = androidx.glance.unit.ColorProvider(Color(0xFF94A3B8)),
                                            fontSize = 11.sp
                                        ),
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = GlanceModifier.height(8.dp))

                    Text(
                        text = if (remainingCount > 1) "${remainingCount - 1} more classes today" else "Last class of the day",
                        style = TextStyle(
                            color = androidx.glance.unit.ColorProvider(Color(0xFF64748B)),
                            fontSize = 11.sp
                        )
                    )
                } else {
                    // Empty state
                    Box(
                        modifier = GlanceModifier
                            .fillMaxWidth()
                            .background(Color(0xFF1E293B))
                            .padding(14.dp)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = GlanceModifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "🎉 All done for today!",
                                style = TextStyle(
                                    color = androidx.glance.unit.ColorProvider(Color.White),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            )
                            Spacer(modifier = GlanceModifier.height(4.dp))
                            Text(
                                text = "No more upcoming classes scheduled.",
                                style = TextStyle(
                                    color = androidx.glance.unit.ColorProvider(Color(0xFF94A3B8)),
                                    fontSize = 11.sp
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}
