#ifndef SCHEDULECONTROL_H
#define SCHEDULECONTROL_H

#include <Arduino.h>
#include <vector>
#include <iostream>
using namespace std;

// cấu trúc lịch hẹn tưới cây
struct Schedule {
  uint16_t year;
  uint8_t month;
  uint8_t day;
  uint8_t hour;
  uint8_t minute;
  uint8_t second;
  uint16_t wateringDuration;// thời gian tưới
};

extern vector<Schedule> schedules;

// khai báo các hàm
// 1 hàm lấy dữ liệu từ littleFS ra ram
void loadSchedules();

// 2 thêm lịch ở vị trí index
void addSchedule(uint8_t index, const Schedule &x);

// 3 xóa lịch ở vị trí index
void deleteSchedule(int8_t index);

// 4 lưu lịch
void saveSchedules();


#endif