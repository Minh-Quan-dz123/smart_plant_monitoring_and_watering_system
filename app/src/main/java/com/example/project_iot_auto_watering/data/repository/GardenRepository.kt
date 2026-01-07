package com.example.project_iot_auto_watering.data.repository

import android.util.Log
import com.example.project_iot_auto_watering.data.model.request.CreateGarden
import com.example.project_iot_auto_watering.data.model.request.DurationManual
import com.example.project_iot_auto_watering.data.model.request.EspDeviceRequest
import com.example.project_iot_auto_watering.data.model.request.ModeIrrigation
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.model.response.IrrigationLog
import com.example.project_iot_auto_watering.data.model.response.IrrigationMode
import com.example.project_iot_auto_watering.data.model.response.PumpStatus
import com.example.project_iot_auto_watering.data.model.response.ReceiveIrrigationManual
import com.example.project_iot_auto_watering.data.model.response.Token
import com.example.project_iot_auto_watering.data.retrofit.ApiService
import retrofit2.Response

class GardenRepository(private val api: ApiService) {
    suspend fun createGarden(garden: CreateGarden, token: String): Response<Garden> {
        return api.createGarden(garden, "Bearer $token")
    }

    suspend fun getListGarden(token: String): Response<List<Garden>> {
        return api.getListGarden("Bearer $token")
    }

    suspend fun deleteGarden(id: Int, token: String): Response<Garden> {
        return api.deleteGarden(id, "Bearer $token")
    }

    suspend fun updateDevice(id: Int, espDeviceRequest: EspDeviceRequest, token: String): String {
        val response = api.updateDevice(id, espDeviceRequest, "Bearer $token")
        if (response.isSuccessful) {
            return espDeviceRequest.espId
        } else {
            val errorBody = response.errorBody()?.string()
            Log.e(
                "DEBUG",
                "Update device failed: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed to get list garden: ${response.code()}")
        }
    }

    suspend fun getDataEsp() {

    }

    suspend fun getAllDateEsp(token: String): List<DataEspAll> {
        val response = api.getDataAllDevice("Bearer $token")
        if (response.isSuccessful) {
            return response.body() ?: emptyList()
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "GET DATA: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed to get list garden: ${response.code()}")
        }
    }

    suspend fun getIrrigationMode(gardenId: Int, token: String): IrrigationMode {
        val response = api.getIrrigationMode(gardenId, "Bearer $token")
        if (response.isSuccessful) {
            return response.body()!!
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "GET Irrigation Mode: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed to get Irrigation Mode: ${response.code()}")
        }
    }

    suspend fun startIrrigation(
        gardenId: Int,
        durationManual: DurationManual,
        token: String
    ): ReceiveIrrigationManual {
        val response = api.startIrrigation(gardenId, durationManual, "Bearer $token")
        if (response.isSuccessful) {
            Log.d(
                "DEBUG__xx",
                "${response.body()}"
            )
            return response.body()?: ReceiveIrrigationManual("",-1,0)
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "Error Start Irrigation: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed Start Irrigation: ${response.code()}")
        }
    }

    suspend fun stopIrrigation(gardenId: Int, token: String): String {
        val response = api.stopIrrigation(gardenId, "Bearer $token")
        if (response.isSuccessful) {
            return "Tắt"
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "Error Start Irrigation: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed Start Irrigation: ${response.code()}")
        }
    }

    suspend fun updateIrrigationMode(
        gardenId: Int,
        mode: ModeIrrigation,
        token: String
    ): ReceiveIrrigationManual {
        val response = api.updateIrrigationMode(gardenId, mode, "Bearer $token")
        if (response.isSuccessful) {
            return response.body() ?: ReceiveIrrigationManual("", -1)
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "Error Update Mode: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed Update Mode: ${response.code()}")
        }
    }

    suspend fun pumpStatus(gardenId: Int, token: String): PumpStatus {
        val response = api.getPumpStatus(gardenId, "Bearer $token")
        if (response.isSuccessful) {
            return response.body() ?: PumpStatus(-1, "idle", "", "", false)
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "Error Get Pump Status: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed Get Pump Status: ${response.code()}")
        }
    }

    suspend fun getLogGarden(gardenId: Int, token: String): List<IrrigationLog> {
        val response = api.getLogGarden(gardenId, "Bearer $token")
        if (response.isSuccessful) {
            return response.body() ?: emptyList()
        } else {
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "Error Get Log: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed Get Log Garden: ${response.code()}")
        }
    }

    suspend fun deleteLog(id: Int, token: String): Boolean {
        val response = api.getLogGarden(id, "Bearer $token")
        if (response.isSuccessful) {
            return true
        }
        else{
            val errorBody = response.errorBody()?.string()
            Log.d(
                "DEBUG",
                "Error deleteLog: ${response.code()} ${response.message()} - $errorBody"
            )
            throw Exception("Failed deleteLog: ${response.code()}")
        }
    }

}