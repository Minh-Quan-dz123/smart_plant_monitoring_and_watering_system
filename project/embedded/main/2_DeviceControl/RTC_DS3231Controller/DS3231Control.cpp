#include "DS3231Control.h"
#include <Arduino.h>

RTC_DS3231 rtc;
DateTime nowTime;

void setRealTime(int year, int month, int day, int hour, int minute, int second)
{
  rtc.adjust(DateTime(year, month, day, hour, minute, second));// đẩy vào biến nowTime
} 

int isTimeReached(int day, int hour, int minute, int second)
{

  nowTime = rtc.now();
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