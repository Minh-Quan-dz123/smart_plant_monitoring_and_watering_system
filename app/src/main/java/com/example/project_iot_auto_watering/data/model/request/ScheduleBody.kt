package com.example.project_iot_auto_watering.data.model.request


data class ScheduleBody(
    val date: String,
    val time: String,
    val durationSeconds: Int,
    val repeat: String,
    val gardenId: Int
) {
}