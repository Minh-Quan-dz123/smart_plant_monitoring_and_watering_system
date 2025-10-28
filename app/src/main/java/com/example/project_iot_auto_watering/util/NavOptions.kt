package com.example.project_iot_auto_watering.util

import androidx.navigation.NavOptions
import com.example.project_iot_auto_watering.R


object NavOption {
    val animationFragment = NavOptions.Builder()
        .setEnterAnim(R.anim.slide_in_right)
        .setExitAnim(R.anim.slide_out_left)
        .setPopEnterAnim(R.anim.slide_in_left)
        .setPopExitAnim(R.anim.slide_out_right)
        .build()
}