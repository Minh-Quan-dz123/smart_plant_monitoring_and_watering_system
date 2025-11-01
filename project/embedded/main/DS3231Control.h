#ifndef DS3231CONTROL_H
#define DS3231CONTROL_H

#include <RTClib.h>
#include <Wire.h>

// cấu hình I2C
#define SDA D4 // chân data
#define SCL D3 // chân clock

extern RTC_DS3231 rtc; // đối tượng ds3231
extern DateTime nowTime; // đối tượng thời gian hiện tại


// khởi tạo RTC
void beginRTC();

// set real time
void setRealTime(int year, int month, int day, int hour, int minute, int second); // char có dạng sau

// hàm kiểm tra đã đến ngày/giờ/phút/giây hiện tại chưa
int isTimeReached(int day, int hour, int minute, int second);


#endif