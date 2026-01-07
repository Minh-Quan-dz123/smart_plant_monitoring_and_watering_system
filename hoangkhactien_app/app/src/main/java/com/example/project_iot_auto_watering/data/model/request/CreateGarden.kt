package com.example.project_iot_auto_watering.data.model.request

data class CreateGarden(
    val name: String,
    val plantId: Int,
) {
}