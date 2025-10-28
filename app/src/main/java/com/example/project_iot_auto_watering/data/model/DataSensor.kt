package com.example.project_iot_auto_watering.data.model


data class DataSensor(
    val idSensor: String,
    val temperature: String,
    val humidity: String,
    val soilMoisture: String
) {
}