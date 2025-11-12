#ifndef WATERINGSERVICE_H
#define WATERINGSERVICE_H

#include <Arduino.h>
#include "scheduleControl.h"
#include "cycleControl.h"
#include "DS3231Control.h"

extern uint16_t wateringDuration;// biến toàn cục cho tưới cây
extern long long T_bio; // chu kì tưới cây theo độ chịu hạn

// 1 hàm xử lý check lịch tưới cây đã đến chưa nếu tưới theo lịch cá nhân
bool checkIsTimeSchedule(); // so sánh đã tới lịch chưa
void setPointer();
void addNewSchedule(uint8_t index, const Schedule &x);

// 2 hàm tính tạo thời gian tưới cây
uint16_t computerWateringDuration(uint8_t status);

// 3 quản lý trạng thái
void managerStatus(uint8_t newStatus);


#endif