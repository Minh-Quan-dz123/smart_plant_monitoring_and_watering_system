package com.example.project_iot_auto_watering.data.model

data class Crops(
    val plantId: String,
    val namePlant: String,
    val idSensor: String,
    val timeStamp: Long = System.currentTimeMillis()
)
