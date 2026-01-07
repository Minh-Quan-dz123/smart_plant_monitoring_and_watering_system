#include "cycleControl.h"

uint8_t status;
uint8_t temp, humi, soil;
uint16_t wateringTime;
int8_t flag;

void loadEEPROM() // lấy ra từ eeprom ra ram
{
  EEPROM.begin(10); // cấp phát 10 byte
  // byte đầu: 123 thì là đã có dữ liệu, khác tức là ko có
  EEPROM.get(0, flag);
  if(flag == 123)
  {
    EEPROM.get(1,temp); // lấy từ index = 1;
    EEPROM.get(2, humi);
    EEPROM.get(3, soil);
    EEPROM.get(4, status);
    EEPROM.get(5, wateringTime);

    if(temp <= 0 || temp > 100)
    {
      temp = 30;
      EEPROM.put(1, temp);
    } 
    if(humi <= 0 || humi > 100)
    {
      humi = 30;
      EEPROM.put(2, humi);
      
    } 
    if(soil <= 0 || soil > 100)
    {
      soil = 30;
      EEPROM.put(3, soil);
    }
    if(status > 3)
    {
      status = 0;
      EEPROM.put(4, status);
    }
    if(wateringTime <= 0 || wateringTime > 10000)
    {
      wateringTime = 4; // tưới 4 giây thôi
      EEPROM.put(5, wateringTime);
    }
    EEPROM.commit(); // xác nhận
  }
  else
  {
    temp = 30;
    humi = 30;
    soil = 30;
    status = 0;
    wateringTime = 4; // tưới 4 giây thôi
  }
  // lấy ra xong rồi end;
  EEPROM.end(); // giải phóng 10 byte đã cấp phát
}

void saveCycle()
{
  EEPROM.begin(10); // cấp phát 10 byte
  flag = 123;
  EEPROM.put(0, flag);// lưu vào
  EEPROM.put(1, temp);
  EEPROM.put(2, humi);
  EEPROM.put(3, soil);
  EEPROM.put(4, status);
  EEPROM.put(5, wateringTime);
  EEPROM.commit(); // xác nhận
  EEPROM.end();
}

void setBioCycle(uint8_t newTemp,uint8_t newHumi, uint8_t newSoil, uint16_t newWateringTime)
{
  temp = newTemp;
  humi = newHumi;
  soil = newSoil;
  wateringTime = newWateringTime;
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

