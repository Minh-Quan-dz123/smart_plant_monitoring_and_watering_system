package com.example.project_iot_auto_watering.data.repository

import com.example.project_iot_auto_watering.data.model.response.Account
import com.example.project_iot_auto_watering.data.model.response.Register
import com.example.project_iot_auto_watering.data.model.response.Token
import com.example.project_iot_auto_watering.data.retrofit.ApiService
import com.example.project_iot_auto_watering.data.retrofit.safeApiCall
import retrofit2.Response

class AuthRepository(private val api: ApiService) {
    suspend fun login(email: String, password: String): Result<Token> {
        return safeApiCall {
            api.loginAccount(Account(email, password))
        }

    }

    suspend fun register(username: String, email: String, password: String): Response<Unit> {
        return api.registerAccount(Register(username, email, password))
    }

}