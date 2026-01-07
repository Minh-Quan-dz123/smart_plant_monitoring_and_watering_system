package com.example.project_iot_auto_watering.ui.login.viewmodel

import android.util.Log
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.project_iot_auto_watering.data.repository.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AuthViewModel(val authRepository: AuthRepository) : ViewModel() {

    var tokenAuth: String? = null
    var username: String = "Your Name"
    val emailLogin = MutableLiveData<String>()
    val passwordLogin = MutableLiveData<String>()

    fun login(email: String, password: String, callBack: (Boolean) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val response = authRepository.login(email, password)
            withContext(Dispatchers.Main) {
                response.onSuccess { receive ->
                    tokenAuth = receive.token
                    callBack(true)
                    Log.d("DEBUG", receive.token)
                }.onFailure { e ->
                    Log.d("DEBUG", "$e")
                    callBack(false)
                }
            }
        }
    }


    fun register(nameUser: String, email: String, password: String, callBack: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try{
                val response = authRepository.register(nameUser, email, password)
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        username = nameUser
                        Log.d("DEBUG", "Đăng ký thành công!")
                        callBack("success")
                    } else {
                        val errorMessage = response.errorBody()?.string()
                        Log.d("DEBUG", "$errorMessage")
                        callBack("$errorMessage")
                    }
                }
            }
            catch (e: Exception){
                Log.d("DEBUG","loi server")
            }
        }
    }

    fun getAccountFromRegister(e: String, p: String) {
        emailLogin.value = e
        passwordLogin.value = p
    }
}