package com.example.project_iot_auto_watering.ui.home.viewmodel

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.project_iot_auto_watering.data.model.request.CreateGarden
import com.example.project_iot_auto_watering.data.model.request.DurationManual
import com.example.project_iot_auto_watering.data.model.request.EspDeviceRequest
import com.example.project_iot_auto_watering.data.model.request.ModeIrrigation
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.EspDevice
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.model.response.IrrigationLog
import com.example.project_iot_auto_watering.data.model.response.IrrigationMode
import com.example.project_iot_auto_watering.data.model.response.PumpStatus
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.io.path.Path

class GardenViewModel(private val gardenRepository: GardenRepository) : ViewModel() {
    private var _listGarden = MutableLiveData<List<Garden>>()
    val listGarden: LiveData<List<Garden>> = _listGarden

    private var _listLog = MutableLiveData<List<IrrigationLog>>()
    val listLog: LiveData<List<IrrigationLog>> = _listLog

    var idGarden = -1
    var espId = ""

    private var _modeIrrigation = MutableLiveData<String>()
    val modeIrrigation: LiveData<String> = _modeIrrigation

    private var _pumpStatus = MutableLiveData<PumpStatus>()
    val pumpStatus: LiveData<PumpStatus> = _pumpStatus
    var durationIrrigation = 0

    var message = ""

    private var _espDevice = MutableLiveData<EspDevice>()
    val espDevice: LiveData<EspDevice> = _espDevice

    private var _listEspDevice = MutableLiveData<List<DataEspAll>>()
    val listEspDevice: LiveData<List<DataEspAll>> = _listEspDevice

    //nên dùng post
    fun getListGarden(token: String) = viewModelScope.launch(Dispatchers.IO) {
        val response = gardenRepository.getListGarden(token)
        if (response.isSuccessful) {
            _listGarden.postValue(response.body() ?: mutableListOf())
            Log.d("DEBUG", "get list garden success ${response.body()}")
        } else {
            Log.d("DEBUG", "fail get garden")
        }
    }

    fun deleteGarden(id: Int, token: String, callBack: (Boolean) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = gardenRepository.deleteGarden(id, token)
            withContext(Dispatchers.Main) {
                if (response.isSuccessful) {
                    callBack(true)
                    val updatedList = _listGarden.value?.filterNot { it.id == id }!!
                    _listGarden.value = updatedList
                    Log.d("DEBUG", "delete garden success")
                } else {
                    callBack(false)
                    Log.d("DEBUG", "delete garden fail")
                }
            }
        }
    }

    fun updateDevice(id: Int, esp: EspDeviceRequest, token: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val espIdReceive = gardenRepository.updateDevice(id, esp, token)
                withContext(Dispatchers.Main) {
                    espId = espIdReceive
                    callBack("Cập nhật thành công")
                    Log.d("DEBUG", "update device success")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    callBack("Không tồn tại idEspDevice trong hệ thống")
                }
                Log.d("DEBUG", "update device fail")
            }
        }
    }

    fun createGarden(garden: CreateGarden, token: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = gardenRepository.createGarden(garden, token)
            withContext(Dispatchers.Main) {
                if (response.isSuccessful) {
                    callBack("Thêm thành công")
                    response.body()?.let { newGarden ->
                        val currentList = _listGarden.value.orEmpty() + newGarden
                        _listGarden.value = currentList
                    }
                    Log.d("DEBUG", "them success")
                } else {
                    callBack("Them thất bại")
                    Log.d("DEBUG", "${response.code()}-${response.message()}")
                }
            }
        }
    }

    fun getDataEsp() {

    }

    fun getAllDataEsp(token: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val listEsp = gardenRepository.getAllDateEsp(token)
                _listEspDevice.postValue(listEsp)
                withContext(Dispatchers.Main) {
                    callBack("Lấy dữ liệu thành công!")
                    Log.d("DEBUG", "get data success ")
                }
            } catch (e: Exception) {
                Log.d("DEBUG", "get data fail ")
            }
        }
    }

    fun getIrrigationMode(gardenId: Int, token: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val mode = gardenRepository.getIrrigationMode(gardenId, token)
                withContext(Dispatchers.Main) {
                    _modeIrrigation.value = mode.irrigationMode
                    Log.d("DEBUG", "get mode success ")
                }
            } catch (e: Exception) {
                Log.d("DEBUG", "get mode fail ")
            }

        }
    }

    fun startIrrigation(
        gardenId: Int,
        durationManual: DurationManual,
        token: String,
        callBack: (String) -> Unit
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val kq = gardenRepository.startIrrigation(gardenId, durationManual, token)
                withContext(Dispatchers.Main) {
                    durationIrrigation = kq.duration
                    message = kq.message
                    callBack(message)
                    Log.d("DEBUG", "Đang tưới $durationManual phút")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    callBack("")
                }
                Log.d("DEBUG", "Bật máy bơm lỗi!")
            }

        }
    }

    fun stopIrrigation(gardenId: Int, token: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val kq = gardenRepository.stopIrrigation(gardenId, token)
                withContext(Dispatchers.Main) {
                    callBack(kq)
                    Log.d("DEBUG", "Dừng tưới")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    callBack("")
                }
                Log.d("DEBUG", "Tắt máy bơm lỗi!")
            }

        }
    }

    fun updateIrrigationMode(gardenId: Int, mode: ModeIrrigation, token: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val kq = gardenRepository.updateIrrigationMode(gardenId, mode, token)
                withContext(Dispatchers.Main) {
                    _modeIrrigation.value = kq.irrigationMode
                    Log.d("DEBUG", "Success Update Mode")
                }
            } catch (e: Exception) {
                Log.d("DEBUG", "Fail Update Mode")
            }
        }
    }

    fun getPumpStatus(gardenId: Int, token: String,callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val kq = gardenRepository.pumpStatus(gardenId, token)
                withContext(Dispatchers.Main) {
                    _pumpStatus.value = kq
                    callBack(kq.toString())
                }
                Log.d("DEBUG", "Success Get Pump Status")
            } catch (e: Exception) {
                Log.d("DEBUG", "Fail Get Pump Status")
            }
        }
    }

    fun getLogGarden(gardenId: Int,token: String,callBack: (String) -> Unit){
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val kq = gardenRepository.getLogGarden(gardenId,token)
                withContext(Dispatchers.Main) {
                    _listLog.value = kq
                    Log.d("DEBUG", "Success get list log")
                }
            } catch (e: Exception) {
                Log.d("DEBUG", "Fail get list log")
            }
        }
    }

    fun deleteLog(id:Int,token: String,callBack: (String) -> Unit){
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val kq = gardenRepository.deleteLog(id,token)
                withContext(Dispatchers.Main) {
                    callBack(kq.toString())
                    Log.d("DEBUG", "Success delete log")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    callBack("fail")
                }
                Log.d("DEBUG", "Fail delete log")
            }
        }
    }
}