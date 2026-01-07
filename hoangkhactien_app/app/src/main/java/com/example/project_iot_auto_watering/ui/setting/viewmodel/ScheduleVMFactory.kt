package com.example.project_iot_auto_watering.ui.setting.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.project_iot_auto_watering.data.repository.ScheduleRepository

class ScheduleVMFactory(private val scheduleRepository: ScheduleRepository) :
    ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ScheduleViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ScheduleViewModel(scheduleRepository) as T
        } else {
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}