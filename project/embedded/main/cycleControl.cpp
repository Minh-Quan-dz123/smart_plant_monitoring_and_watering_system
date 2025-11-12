#include "cycleControl.h"

uint32_t bioCycle; // 4 byte
uint16_t wateringTime; // 2 byte
uint8_t status; // 1 byte
uint8_t flag;// 1 byte


void loadEEPROM() // lấy ra từ eeprom ra ram
{
  EEPROM.begin(10); // cấp phát 10 byte
  // byte đầu: 123 thì là đã có dữ liệu, khác tức là ko có
   EEPROM.get(0, flag);
  if(flag == 123)
  {
    EEPROM.get(1,status); // lấy từ index = 1;
    EEPROM.get(2, wateringTime);
    EEPROM.get(4, bioCycle);
  }
  else
  {
    status = 0;// chưa có gì
    wateringTime = 0;
    bioCycle = 0;
  }
  // lấy ra xong rồi end;
  EEPROM.end(); // giải phóng 10 byte đã cấp phát
  
}

void saveCycle()
{
  EEPROM.begin(10); // cấp phát 10 byte
  flag = 123;
  EEPROM.put(0, flag);// lưu vào
  EEPROM.put(1, status);// lưu vào
  EEPROM.put(2, wateringTime);
  EEPROM.put(4, bioCycle);
  EEPROM.commit(); // xác nhận
  EEPROM.end();

  Serial.print("da luu vao eeprom: ");
  Serial.print(flag); Serial.print(", ");
  Serial.print(status); Serial.print(", ");
  Serial.print(wateringTime); Serial.print(", ");
  Serial.println(bioCycle);
}

void setBioCycle(uint32_t newBioCycle, uint16_t newWateringTime)
{
  wateringTime = newWateringTime;
  bioCycle = newBioCycle;
  saveCycle();
}

void clearEEPROM()
{
  EEPROM.begin(10);
  flag = 101;
  EEPROM.put(0,flag);
  EEPROM.commit();
  EEPROM.end();
  Serial.println("da clear EEPROM");
}

