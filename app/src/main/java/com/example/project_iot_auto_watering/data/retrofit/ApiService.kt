package com.example.project_iot_auto_watering.data.retrofit

import com.example.project_iot_auto_watering.data.model.response.Account
import com.example.project_iot_auto_watering.data.model.request.CreateGarden
import com.example.project_iot_auto_watering.data.model.request.DurationManual
import com.example.project_iot_auto_watering.data.model.request.EspDeviceRequest
import com.example.project_iot_auto_watering.data.model.request.ModeIrrigation
import com.example.project_iot_auto_watering.data.model.request.ScheduleBody
import com.example.project_iot_auto_watering.data.model.request.ScheduleBodyUpdate
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.EspDevice
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.model.response.IrrigationMode
import com.example.project_iot_auto_watering.data.model.response.Message
import com.example.project_iot_auto_watering.data.model.response.Plant
import com.example.project_iot_auto_watering.data.model.response.PumpStatus
import com.example.project_iot_auto_watering.data.model.response.ReceiveIrrigationManual
import com.example.project_iot_auto_watering.data.model.response.Register
import com.example.project_iot_auto_watering.data.model.response.ScheduleDTO
import com.example.project_iot_auto_watering.data.model.response.Token
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import java.util.Objects

interface ApiService {
    @POST("auth/signin")
    suspend fun loginAccount(@Body account: Account): Response<Token>

    @POST("auth/register")
    suspend fun registerAccount(@Body register: Register): Response<Unit>

    @GET("plants")
    suspend fun getAllPlants(): Response<List<Plant>>

    @GET("user/{email}")
    suspend fun getIdUser(@Path("email") email: String): Response<Map<String, Any>>

    @POST("garden")
    suspend fun createGarden(
        @Body garden: CreateGarden,
        @Header("authorization") token: String
    ): Response<Garden>

    @GET("garden/{id}")
    suspend fun getGarden(
        @Path("id") id: Int,
        @Header("authorization") token: String
    ): Response<Garden>

    @GET("garden")
    suspend fun getListGarden(@Header("authorization") token: String): Response<List<Garden>>

    @DELETE("garden/{id}")
    suspend fun deleteGarden(@Path("id") id: Int,@Header("authorization") token: String): Response<Garden>

    @POST("schedule")
    suspend fun createSchedule(@Body scheduleBody: ScheduleBody, @Header("authorization") token:String): Response<ScheduleDTO>

    @GET("schedule/garden/{gardenId}")
    suspend fun getScheduleGarden(@Path("gardenId") id:Int,@Header("authorization") token: String): Response<List<ScheduleDTO>>

    @PUT("schedule/{id}")
    suspend fun updateSchedule(@Path("id") idSchedule:Int,@Body scheduleBody: ScheduleBodyUpdate,@Header("authorization") token: String): Response<ScheduleDTO>

    @DELETE("schedule/{id}")
    suspend fun deleteSchedule(@Path("id") idSchedule:Int,@Header("authorization") token:String): Response<Message>

    @PATCH("garden/{id}/esp-device")
    suspend fun updateDevice(@Path("id") id:Int,@Body espDeviceRequest: EspDeviceRequest,@Header("authorization") token: String): Response<Garden>

    @GET("sensor/garden/{gardenId}/lastest")
    suspend fun getDataDevice(@Path("gardenId") gardenId:Int,@Header("authorization") token:String): Response<EspDevice>

    @GET("sensor/user/all")
    suspend fun getDataAllDevice(@Header("authorization") token:String): Response<List<DataEspAll>>

    @POST("irrigation/{gardenId}/start")
    suspend fun startIrrigation(@Path("gardenId") gardenId: Int,@Body durationManual: DurationManual,@Header("authorization") token:String): Response<ReceiveIrrigationManual>

    @POST("irrigation/{gardenId}/stop")
    suspend fun stopIrrigation(@Path("gardenId") gardenId: Int,@Header("authorization")token: String): Response<Unit>

    @PATCH("irrigation/{gardenId}/mode")
    suspend fun updateIrrigationMode(@Path("gardenId")gardenId: Int,@Body modeIrrigation: ModeIrrigation,@Header("authorization") token:String): Response<ReceiveIrrigationManual>

    @GET("irrigation/{gardenId}/mode")
    suspend fun getIrrigationMode(@Path("gardenId") gardenId: Int,@Header("authorization") token: String): Response<IrrigationMode>

    @GET("irrigation/{gardenId}/pump-status")
    suspend fun getPumpStatus(@Path("gardenId") gardenId: Int,@Header("authorization") token: String): Response<PumpStatus>

}

object RetrofitInstance {
    private const val BASE_URL_SERVER = "http://10.0.2.2:3000"

    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL_SERVER)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
