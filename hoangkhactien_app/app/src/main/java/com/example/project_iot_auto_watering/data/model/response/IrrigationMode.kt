package com.example.project_iot_auto_watering.data.model.response

data class IrrigationMode(
    val gardenId:Int,
    val gardenName:String,
    val irrigationMode:String
) {
}