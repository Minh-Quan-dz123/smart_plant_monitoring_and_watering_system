package com.example.project_iot_auto_watering.data.repository

import com.example.project_iot_auto_watering.data.model.Account
import com.example.project_iot_auto_watering.data.model.Token
import com.example.project_iot_auto_watering.data.retrofit.ApiService

class AuthRepository(private val api: ApiService) {
    suspend fun login(email: String, password: String): Result<Token> {
        return try {
            val response = api.loginAccount(Account(email, password))
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("login failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


}