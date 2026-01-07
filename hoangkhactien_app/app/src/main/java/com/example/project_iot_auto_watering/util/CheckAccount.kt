package com.example.project_iot_auto_watering.util

fun checkAccount(email: String, password: String): Boolean {
    return !(email == "" || password == "")
}

fun checkAccountRegister(
    username: String,
    email: String,
    password: String,
    cfPassword: String
): Int {
    val regexPw = """^(?=.*[A-Za-z])(?=.*\d).{6,}$""".toRegex()
    if (username == "" || email == "" || password == "") {
        return -1
    }
    if (password != cfPassword) {
        return 0
    }
    if (!regexPw.matches(password)) {
        return -2
    }
    return 1
}