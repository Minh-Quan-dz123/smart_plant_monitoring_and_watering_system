package com.example.project_iot_auto_watering

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.project_iot_auto_watering.data.model.response.Plant
import com.example.project_iot_auto_watering.data.repository.MainRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainViewModel(val mainRepository: MainRepository) : ViewModel() {
    var listPlants = listOf<Plant>()
    var idUser: Int = 0
    var idPlant=-1
    //tên cây với tên vườn là 1
    var nameGarden=""


    fun getAllPlant() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                val receive = mainRepository.getAllPlants()
                withContext(Dispatchers.Main) {
                    if (receive.isSuccessful) {
                        listPlants = receive.body() ?: emptyList()
                        Log.d("api/getAllPlant", "success,$listPlants")
                    } else {
                        Log.d("api/getAllPlant", "fail")
                    }
                }
            }
        }
    }

    fun getIdUser(email: String) {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                val receive = mainRepository.getIdUser(email)
                withContext(Dispatchers.Main) {
                    if (receive.isSuccessful) {
                        idUser = receive.body()?.get("id").toString().toInt()
                        Log.d("api/getIdUser", "success")
                    } else {
                        Log.d("api/getIdUser", "fail")
                    }
                }
            }
        }
    }
    fun getInfoPlant(idPlant:Int): Plant {
        for(p in listPlants){
            if(idPlant==p.id){
                return p
            }
        }
        return Plant(-1,"","",0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,-1)
    }

}