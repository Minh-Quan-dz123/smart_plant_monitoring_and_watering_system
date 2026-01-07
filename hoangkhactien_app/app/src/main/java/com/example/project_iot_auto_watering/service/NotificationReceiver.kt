package com.example.project_iot_auto_watering.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class NotificationReceiver: BroadcastReceiver() {
    override fun onReceive(p0: Context, p1: Intent) {
        if(p1.action=="STOP_IRRIGATION_SERVICE"){
            val stopIntent= Intent(p0, IrrigationForegroundService::class.java)
            p0.stopService(stopIntent)
        }
    }
}