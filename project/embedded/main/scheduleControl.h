#ifndef SCHEDULECONTROL_H
#define SCHEDULECONTROL_H

#include <Arduino.h>
#include <LittleFS.h>
#include <FS.h>
#include <ArduinoJson.h>
#include <vector>
#include <iostream>
using namespace std;

// lịch có dạng json lưu 4 chỉ số day, hour, minute, second

// cấu trúc lịch hẹn tưới cây
struct Schedule {
  int day;
  int hour;
  int minute;
  int second;
  int wateringDuration;// thời gian tưới
};

extern vector<Schedule> schedules;

// khai báo các hàm
// 0 tạo file chứa dữ liệu và nó sẽ được lưu vĩnh viễn
void initScheduleStorage();

// 1 lấy ra lịch ở vị trí index cho trước
Schedule getScheduleAt(int index);

// 2 lấy ra số lượng lịch hiện có
int getScheduleCount();

// 3 lấy ra danh sách các lịch
vector<Schedule> getAllSchedule();

// 4 lấy ra danh sách lịch có ngày cho trước
vector<Schedule> getScheduleByDay(int day);

// 5 xóa lịch ở vị trí index
void deleteSchedule(int index);

// 6 thêm lịch ở vị trí index
void addSchedule(int index, const Schedule &x);

// 7 sắp xếp các lịch từ bé -> lớn 
//void sortSchedules();

#endif