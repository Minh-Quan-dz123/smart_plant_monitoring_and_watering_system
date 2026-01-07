package com.example.project_iot_auto_watering

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.project_iot_auto_watering.data.repository.AuthRepository
import com.example.project_iot_auto_watering.data.repository.MainRepository
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModel

class MainViewModelFactory(private val mainRepository: MainRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MainViewModel(mainRepository) as T
        } else {
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}