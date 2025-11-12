#ifndef CYCLECONTROL_H
#define CYCLECONTROL_H

#include <Arduino.h>
#include <EEPROM.h>

extern uint8_t status;
extern uint16_t wateringTime;
extern uint32_t bioCycle;

// 1 hàm lưu dữ liệu từ ram vào flash(khởi động)
void saveCycle();

// 2 hàm lấy dữ liệu từ flash ra ram để chạy
void loadEEPROM();

// 3 set status == 2;
void setBioCycle(uint32_t newBioCycle, uint16_t newWateringTime);

// 4 clear
void clearEEPROM();


#endif