package com.example.project_iot_auto_watering.data.socket

import io.socket.client.IO
import io.socket.client.Socket

class SensorSocket(private val token: String) {
    private var socket: Socket? = null
    private var onDataSensorReceived: (() -> Unit)? = null
    private var onConnected: (() -> Unit)? = null

    fun connect() {
        try {
            val option = IO.Options().apply {
                forceNew = true

            }
        } catch (e: Exception) {
        }

    }
}