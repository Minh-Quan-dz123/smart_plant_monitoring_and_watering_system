package com.example.project_iot_auto_watering.data.model.response

data class IrrigationLog(
    val id: Int,
    val irrigationTime: String,
    val duration: String,
    val status: String,
    val type: String,
    val notes: String,
    val gardenId: String,
    val createdAt: String
) {
}