package com.example.project_iot_auto_watering.ui.crops

import java.util.Locale

fun formatTime(millis: Long): String {
    val totalSeconds = millis / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60

    return if (hours > 0) {
        String.format(
            Locale.getDefault(),
            "%02d:%02d:%02d",
            hours, minutes, seconds
        )
    } else {
        String.format(
            Locale.getDefault(),
            "%02d:%02d",
            minutes, seconds
        )
    }
}