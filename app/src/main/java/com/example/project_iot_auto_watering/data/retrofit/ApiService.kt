package com.example.project_iot_auto_watering.data.retrofit

import com.example.project_iot_auto_watering.data.model.Account
import com.example.project_iot_auto_watering.data.model.Token
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("user/login")
    suspend fun loginAccount(@Body account: Account): Response<Token>

    @POST("user/register")
    suspend fun registerAccount()
}

object RetrofitInstance {

}
