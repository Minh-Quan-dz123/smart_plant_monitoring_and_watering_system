package com.example.project_iot_auto_watering.ui.home.viewmodel

import android.view.View
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.project_iot_auto_watering.data.repository.GardenRepository

class GardenVMFactory(private val gardenRepository: GardenRepository): ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if(modelClass.isAssignableFrom(GardenViewModel::class.java)){
            @Suppress("UNCHECKED_CAST")
            return GardenViewModel(gardenRepository) as T
        }
        else{
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}