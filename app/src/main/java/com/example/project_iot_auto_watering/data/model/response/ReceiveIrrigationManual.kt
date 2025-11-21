package com.example.project_iot_auto_watering.data.model.response

data class ReceiveIrrigationManual(
    val message: String,
    val gardenId: Int,
    val duration: Int=0,//Phút
    val irrigationMode:String="manual"
) {
}