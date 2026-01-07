package com.example.project_iot_auto_watering.data.model.response


data class Irrigation(
    val id: Int,
    val status: Boolean,
    val timestamp: String,
    val gardenId: Int
) {
}