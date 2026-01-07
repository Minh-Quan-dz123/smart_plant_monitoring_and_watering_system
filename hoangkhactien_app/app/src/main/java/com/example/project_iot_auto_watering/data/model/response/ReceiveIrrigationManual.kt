package com.example.project_iot_auto_watering.data.model.response

data class ReceiveIrrigationManual(
    val message: String = "",
    val gardenId: Int = -1,
    val duration: Int = 0,
    val irrigationMode: String? = "manual"
) {
}