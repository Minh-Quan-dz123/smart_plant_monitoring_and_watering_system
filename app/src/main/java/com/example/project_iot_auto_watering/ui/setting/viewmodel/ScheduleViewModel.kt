package com.example.project_iot_auto_watering.ui.setting.viewmodel

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.project_iot_auto_watering.data.model.request.ScheduleBody
import com.example.project_iot_auto_watering.data.model.request.ScheduleBodyUpdate
import com.example.project_iot_auto_watering.data.model.response.ScheduleDTO
import com.example.project_iot_auto_watering.data.repository.ScheduleRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ScheduleViewModel(private val scheduleRepository: ScheduleRepository) : ViewModel() {
    private var _listSchedule = MutableLiveData<List<ScheduleDTO>>()
    val listSchedule: LiveData<List<ScheduleDTO>> = _listSchedule

    fun getScheduleGarden(idGarden: Int, token: String,callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = scheduleRepository.getScheduleGarden(idGarden, token)
            if (response.isSuccessful) {
                val listSchedule = response.body().orEmpty()
                _listSchedule.postValue(listSchedule)
                Log.d("DEBUG", "get success ${response.body().toString()}")
                withContext(Dispatchers.Main){
                    callBack("success")
                }
            } else {
                withContext(Dispatchers.Main){
                    callBack("fail")
                }
                Log.d("DEBUG", "get fail ${response.code()}")
            }
        }
    }

    //create
    fun createSchedule(idGarden: Int,scheduleBody: ScheduleBody, token: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = scheduleRepository.createSchedule(scheduleBody, token)
            withContext(Dispatchers.Main) {
                if (response.isSuccessful) {
//                    response.body()?.let { schedule ->
//                        val newList = _listSchedule.value.orEmpty() + schedule
//                        _listSchedule.value = newList
//                    }
                    getScheduleGarden(idGarden,token,callBack)
                    Log.d("DEBUG", "success: ${response.body()}")
                } else {
                    Log.d("DEBUG", "fail: ${response.body()}${response.code()}")
                }
            }
        }
    }

    fun updateSchedule(idGarden: Int, idSchedule: Int, scheduleBody: ScheduleBodyUpdate, token: String,callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = scheduleRepository.updateSchedule(idSchedule, scheduleBody, token)
            if (response.isSuccessful) {
                Log.d("DEBUG", "success: ${response.body()}")
                getScheduleGarden(idGarden, token,callBack)
            } else {
                Log.e("DEBUG", "CODE: ${response.code()}")
                Log.e("DEBUG", "ERROR: ${response.errorBody()?.string()}")
            }
        }
    }

    fun deleteSchedule(idSchedule: Int, token: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = scheduleRepository.deleteSchedule(idSchedule, token)
            withContext(Dispatchers.Main) {
                if (response.isSuccessful) {
                    callBack(response.body()?.message ?: "")
                    val updatedList = _listSchedule.value?.filterNot { it.id == idSchedule }!!
                    _listSchedule.value = updatedList
                    Log.d("DEBUG", "success: ${response.body()}")
                } else {
                    callBack("Fail")
                    Log.d("DEBUG", "fail: ")
                }
            }
        }
    }

    fun checkSchedule(d: String, t: String): Boolean {
        return listSchedule.value?.none { it.date == d && it.time == t } ?: true
    }
}