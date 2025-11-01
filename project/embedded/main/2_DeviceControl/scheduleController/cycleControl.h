#ifndef CYCLECONTRO_H
#define CYCLECONTRO_H

#include <Arduino.h>
#include <EEPROM.h>

extern uint32_t fixed_cycle; // cứ sau bao lâu thì tưới
extern uint16_t wateringDurationFixedCycle; // tưới bao lâu

extern uint32_t biological_cycle;
extern uint16_t wateringDurationBioCycle;

extern uint8_t status;// trạng thái là đang tưới loại nào

// A hàm lưu dữ liệu từ ram vào flash(khởi động)
void saveCycle();

// B hàm lấy dữ liệu từ flash ra ram để chạy
void loadEEPROM();


#endif