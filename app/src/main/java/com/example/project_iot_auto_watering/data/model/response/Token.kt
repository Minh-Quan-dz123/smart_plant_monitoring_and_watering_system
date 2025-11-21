package com.example.project_iot_auto_watering.data.model.response

import com.google.gson.annotations.SerializedName

data class Token(
    @SerializedName("access_token")
    val token: String
) {
}