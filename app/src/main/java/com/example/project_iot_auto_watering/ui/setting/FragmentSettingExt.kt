package com.example.project_iot_auto_watering.ui.setting
import android.util.Log
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

fun checkInputValid(d:String,t:String,repeat:String,duration:Int,callBack:(Boolean,String)-> Unit){
    Log.d("DEBUG_CHECKInPUT","$d-$t-$repeat-$duration")
    if(d=="" || t=="" || repeat=="" ||duration<1){
        callBack(false,"Vui lòng nhập đầy đủ thông tin tưới")
        return
    }

    if(!checkDate(d)){
        callBack(false,"Lỗi chọn thời gian trước hiện tại lớn hơn 3 tháng")
        return
    }

    callBack(true,"ok")

}

fun checkDate(d: String): Boolean {
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    val localDate = LocalDate.parse(d, formatter)

    val today = LocalDate.now()
    val threeMonthsAgo = today.minusMonths(3)

    return !localDate.isBefore(threeMonthsAgo)
}