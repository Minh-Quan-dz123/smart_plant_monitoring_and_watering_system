package com.example.project_iot_auto_watering.data.retrofit

import retrofit2.Response

suspend fun <T> safeApiCall(apiCall: suspend () -> Response<T>): Result<T> {
    return try {
        val response = apiCall()
        if (response.isSuccessful) {
            Result.success(response.body()!!)
        } else {
            Result.failure(Exception("Lỗi server: ${response.code()}"))
        }
    } catch (e: Exception) {
        Result.failure(Exception("Server không phải hồi hoặc ${e.message}. Vui lòng thử lại"))
    }
}