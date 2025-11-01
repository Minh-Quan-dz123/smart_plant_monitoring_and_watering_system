#ifndef DS3231CONTROL_H
#define DS3231CONTROL_H

#include "../../main/config.h"
#include <RTClib.h>
#include <Wire.h>

extern RTC_DS3231 rtc; // đối tượng ds3231
extern DateTime nowTime; // đối tượng thời gian hiện tại

// set real time
void setRealTime(int year, int month, int day, int hour, int minute, int second); // char có dạng sau

// hàm kiểm tra đã đến ngày/giờ/phút/giây hiện tại chưa
int isTimeReached(int day, int hour, int minute, int second);


#endif