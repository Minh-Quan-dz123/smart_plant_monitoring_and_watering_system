#ifndef SCHEDULECONTROL_H
#define SCHEDULECONTROL_H

#include <Arduino.h>
#include <vector>
#include <iostream>
using namespace std;

// cấu trúc lịch hẹn tưới cây
struct Schedule {
  int8_t repeat;
  uint16_t year;
  uint8_t month;
  uint8_t day;
  uint8_t hour;
  uint8_t minute;
  uint8_t second;
  uint16_t wateringTime;// thời gian tưới
};

bool cmp(const Schedule& a, const Schedule& b);

// 0 là once, 1 là daily, 2 là weekly
extern vector<Schedule> repeats[3];

// khai báo các hàm
// 1 hàm lấy dữ liệu từ littleFS ra ram
void loadSchedules();

// 2 thêm lịch 
void addSchedule(Schedule &x);

// 3 xóa lịch ở vị trí index
void deleteSchedule(int8_t repeat, uint8_t dayOfWeek = 1, uint8_t hour = 1, uint8_t minute = 1, uint8_t second = 1);

// 4 lưu lịch toàn bộ O(n)
void saveSchedules();


// hàm hỗ trợ khác
bool isLeapYear(uint16_t year) ;
int8_t getDaysInMonth(uint16_t year, uint8_t month) ;
void printSchedules();


#endif