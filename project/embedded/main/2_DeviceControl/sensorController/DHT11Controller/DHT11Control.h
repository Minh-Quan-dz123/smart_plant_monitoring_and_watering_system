#ifndef DHT11CONTROL_H
#define DHT11CONTROL_H

#include<DHT.h>
#include <Arduino.h>

/// tham số
extern DHT dht11;

// khai báo hàm, tham số
float getTemp();// lấy ra nhiệt độ kk
float getHum(); // lấy ra độ ẩm kk

#endif