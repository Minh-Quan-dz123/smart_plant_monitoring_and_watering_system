package com.example.project_iot_auto_watering.retrofit

import com.example.project_iot_auto_watering.model.Account
import com.example.project_iot_auto_watering.model.Token
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {
    @POST("user/login")
    suspend fun loginAccount(@Body account: Account): Response<Token>
}

object RetrofitInstance {

}
