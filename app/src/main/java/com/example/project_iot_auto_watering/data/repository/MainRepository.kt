package com.example.project_iot_auto_watering.data.repository

import com.example.project_iot_auto_watering.data.model.response.Plant
import com.example.project_iot_auto_watering.data.retrofit.ApiService
import retrofit2.Response

class MainRepository(private val apiService: ApiService) {
    suspend fun getAllPlants(): Response<List<Plant>> {
        return apiService.getAllPlants()
    }

    suspend fun getIdUser(email: String): Response<Map<String, Any>> {
        return apiService.getIdUser(email)
    }
}