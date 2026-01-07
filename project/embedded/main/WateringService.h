#ifndef WATERINGSERVICE_H
#define WATERINGSERVICE_H

#include <Arduino.h>
#include "scheduleControl.h"
#include "cycleControl.h"
#include "DS3231Control.h"

extern uint16_t wateringDuration;// biến toàn cục cho tưới cây
// 1 hàm xử lý check lịch tưới cây đã đến chưa nếu tưới theo lịch cá nhân
bool checkIsTimeSchedule(); // so sánh đã tới lịch chưa
bool checkSoil(float soil); // kiểm tra đã khô ch
void setPointer(int8_t i);
void initWatering();

// 2 hàm tính tạo thời gian tưới cây
uint16_t computerWateringDuration(uint8_t status);

// 3 quản lý trạng thái
void managerStatus(uint8_t newStatus);




#endif