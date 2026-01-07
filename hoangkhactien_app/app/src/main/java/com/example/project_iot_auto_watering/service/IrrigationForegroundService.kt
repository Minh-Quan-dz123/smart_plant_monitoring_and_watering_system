package com.example.project_iot_auto_watering.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.project_iot_auto_watering.MainActivity
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import kotlinx.coroutines.*

class IrrigationForegroundService : Service() {

    private val channelId = "irrigation_service_channel"
    private val notificationId = 2004
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val gardenRepository = GardenRepository(RetrofitInstance.api)
    private var tokenAuth = ""
    private var gardenId = -1

    private var gardenName = ""


    override fun onCreate() {
        super.onCreate()
        tokenAuth = getSharedPreferences("Auth", Context.MODE_PRIVATE)
            .getString("token", "").orEmpty()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        gardenId = intent?.getIntExtra("gardenId", -1)?.toInt() ?: -1
        gardenName = intent?.getStringExtra("name").toString()
        val initialNotification = buildNotification("Đang kết nối...")
        startForeground(notificationId, initialNotification)

        // Bắt đầu vòng lặp polling trạng thái bơm
        serviceScope.launch {
            while (isActive) {
                monitorPump()
                delay(5000)
            }
        }

        return START_STICKY
    }

    private suspend fun monitorPump() {
        try {
            val pump = gardenRepository.pumpStatus(gardenId, tokenAuth)

            // update notification
            val updatedNotification = buildNotification(pump.pumpStatus)
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(notificationId, updatedNotification)

        } catch (e: Exception) {
            e.printStackTrace()
            val updatedNotification = buildNotification("Error: ${e.message}")
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(notificationId, updatedNotification)
        }
    }

    private fun buildNotification(content: String): Notification {
        val pendingIntent: PendingIntent =
            Intent(this, MainActivity::class.java).let { notificationIntent ->
                PendingIntent.getActivity(
                    this, 0, notificationIntent,
                    PendingIntent.FLAG_IMMUTABLE
                )
            }

        val deleteIntent = Intent(this, NotificationReceiver::class.java).apply {
            action = "STOP_IRRIGATION_SERVICE"
        }

        val deletePendingIntent = PendingIntent.getBroadcast(
            this, 0, deleteIntent, PendingIntent.FLAG_UPDATE_CURRENT
                    or PendingIntent.FLAG_IMMUTABLE
        )

        if (content == "on") {
            return NotificationCompat.Builder(this, channelId)
                .setContentTitle("Trạng thái máy bơm")
                .setContentText("$gardenName: máy bơm đang bơm - $content")
                .setSmallIcon(R.drawable.icon_sprinkler)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Trạng thái máy bơm")
            .setContentText(content)
            .setSmallIcon(R.drawable.icon_sprinkler)
            .setContentIntent(pendingIntent)
            .setOngoing(false)
            .setDeleteIntent(deletePendingIntent)
            .build()
    }

    private fun createNotificationChannel() {
        val serviceChannel = NotificationChannel(
            channelId, "Irrigation Foreground Service",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(serviceChannel)
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
