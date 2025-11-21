package com.example.project_iot_auto_watering.data.model.response

data class PumpStatus(
    val gardenId: Int,
    val pumpStatus: String,
    val pumpStatusMessage: String,
    val lastPumpFeedbackAt: String,
    val lastPumpSuccess: Boolean
) {
}