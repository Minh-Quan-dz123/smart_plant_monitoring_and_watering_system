package com.example.project_iot_auto_watering.data.model.response

data class EspDevice(
    val espId: String,
    val temperature: Float,
    val airHumidity: Float,
    val soilMoisture: Float,
    val lastUpdated: String,
    val isConnected: Boolean
)