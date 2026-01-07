package com.example.project_iot_auto_watering.util

import android.annotation.SuppressLint
import android.content.Context
import androidx.core.content.edit

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

fun saveEmailPassword(context: Context,username:String,password:String){
    val prefs=context.getSharedPreferences("accout", Context.MODE_PRIVATE)
    prefs.edit {
        putString("username",username)
        putString("password",password)
    }
}
