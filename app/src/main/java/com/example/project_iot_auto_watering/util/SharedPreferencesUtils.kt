package com.example.project_iot_auto_watering.util

import android.annotation.SuppressLint
import android.content.Context

fun checkOpenAppFirst(context: Context): Boolean {
    val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    return prefs != null
}

@SuppressLint("CommitPrefEdits")
fun setStateOpenedApp(context: Context, state: Boolean) {
    val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    val editor = prefs.edit()
    editor.putBoolean("isFirstRun", state)
}
