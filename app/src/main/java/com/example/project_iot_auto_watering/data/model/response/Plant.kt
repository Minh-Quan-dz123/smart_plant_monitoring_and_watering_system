package com.example.project_iot_auto_watering.data.model.response

import com.bumptech.glide.load.model.FileLoader

data class Plant(
    val id: Int,
    val name: String,
    val description: String?,
    val minTemperature: Float,
    val maxTemperature: Float,
    val minAirHumidity: Float,
    val maxAirHumidity: Float,
    val minSoilMoisture: Float,
    val maxSoilMoisture: Float,
    val createdById: Int,
)