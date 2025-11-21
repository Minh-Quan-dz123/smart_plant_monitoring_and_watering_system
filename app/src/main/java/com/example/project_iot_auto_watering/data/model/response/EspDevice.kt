package com.example.project_iot_auto_watering.data.model.response

data class Sensor(
    val idSensor: Int,
    val nameSensor: String,
    val stateSensor: String,
    val plantId: Int,
    val timestamp: Long
)