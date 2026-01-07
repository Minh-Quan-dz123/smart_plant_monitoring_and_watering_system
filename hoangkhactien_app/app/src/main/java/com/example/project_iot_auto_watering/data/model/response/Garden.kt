package com.example.project_iot_auto_watering.data.model.response

data class Garden(
    val id: Int,
    val name: String,
    val plantId: Int,
    val userId: Int,
    val irrigationMode: String,
    val espId: String,
    val pumpStatus: String,
    val pumpStatusMessage: String?,
    val lastPumpFeedbackAt: String,
    val lastPumpSuccess: Boolean?
) {
}