#include "DS3231Control.h"
#include <Arduino.h>

RTC_DS3231 rtc;
DateTime nowTime;

void beginRTC()
{
  Wire.begin(SDA,SCL);
  rtc.begin();
  setRealTime(2025,1,1,1,1,1);
}

void setRealTime(uint16_t year, uint8_t month, uint8_t day, uint8_t hour, uint8_t minute, uint8_t second)
{
  rtc.adjust(DateTime(year, month, day, hour, minute, second));// đẩy vào biến nowTime
} 

int8_t isTimeReached(uint16_t year, uint8_t month, uint8_t day, uint8_t hour, uint8_t minute, uint8_t second)
{

  nowTime = rtc.now();
  if(nowTime.year() > year) return 1;
  if(nowTime.year() > year) return -1;

  if(nowTime.month() > month ) return 1;
  if(nowTime.month() < month ) return -1;

  // ngày 23 > ngày 21
  if(nowTime.day() > day) return 1;// đã qua ngày 
  if(nowTime.day() < day) return -1;// chưa tới 
  
  // nếu đúng này
  if(nowTime.hour() > hour) return 1;// đã qua giờ
  if(nowTime.hour() < hour) return -1; // chưa tới

  //nếu đúng giờ
  if(nowTime.minute() > minute) return 1;
  if(nowTime.minute() < minute) return -1;

  if(nowTime.second() > second) return 1;
  if(nowTime.second() < second) return -1;

  // 2 thời gian đã cho bằng nhau
  return 0;
}