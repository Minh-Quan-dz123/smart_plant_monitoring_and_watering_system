package com.example.project_iot_auto_watering.data.model.response

class ScheduleDTO(
    val id: Int,
    val date: String,
    val time: String,
    val durationSeconds:Int,
    val repeat: String,
    val enabled: Boolean,
    val gardenId: Int
) {
}