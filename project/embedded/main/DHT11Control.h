#ifndef DHT11CONTROL_H
#define DHT11CONTROL_H

#include<DHT.h>

#define DHT_PIN D2

/// tham số
extern DHT dht;

// khai báo hàm, tham số
void initDHT(); // bật cả biến
float getTemp();// lấy ra nhiệt độ kk
float getHum(); // lấy ra độ ẩm kk

#endif