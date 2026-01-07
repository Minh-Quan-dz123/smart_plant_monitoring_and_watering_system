package com.example.project_iot_auto_watering.data.repository

import com.example.project_iot_auto_watering.data.model.request.ScheduleBody
import com.example.project_iot_auto_watering.data.model.request.ScheduleBodyUpdate
import com.example.project_iot_auto_watering.data.model.response.Message
import com.example.project_iot_auto_watering.data.model.response.ScheduleDTO
import com.example.project_iot_auto_watering.data.retrofit.ApiService
import retrofit2.Response

class ScheduleRepository(private val api: ApiService) {
    suspend fun createSchedule(scheduleBody: ScheduleBody, token: String): Response<ScheduleDTO> {
        return api.createSchedule(scheduleBody, "Bearer $token")
    }

    suspend fun getScheduleGarden(gardenId: Int, token: String): Response<List<ScheduleDTO>> {
        return api.getScheduleGarden(gardenId, "Bearer $token")
    }

    suspend fun deleteSchedule(scheduleId: Int, token: String): Response<Message> {
        return api.deleteSchedule(scheduleId, "Bearer $token")
    }

    suspend fun updateSchedule(id:Int,scheduleBody: ScheduleBodyUpdate,token:String): Response<ScheduleDTO>{
        return api.updateSchedule(id,scheduleBody,"Bearer $token")
    }
}