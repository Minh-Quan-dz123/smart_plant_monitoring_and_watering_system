#include "cycleControl.h"

uint32_t fixed_cycle;
uint16_t wateringDurationFixedCycle;

uint32_t biological_cycle;
uint16_t wateringDurationBioCycle;

uint8_t status;

void loadEEPROM()
{
  EEPROM.begin(18); // cấp phát 18 byte

  uint8_t flag = EEPROM.read(0);// đọc dữ liệu ở byte thứ 0 để kiểm tra
  if(flag != 0xAA) // tự quy định để kiểm tra dữ liệu
  {
    Serial.println("EEPROM chua co du lieu gi");
    fixed_cycle = 10000;
    wateringDurationFixedCycle = 1000;
    biological_cycle = 10000;
    wateringDurationBioCycle = 1000;
    status = 3; // tưới theo chu kì sinh học

    EEPROM.write(0,0xAA);// đánh dấu là đã lưu;
    EEPROM.put(1, fixed_cycle);
    EEPROM.put(5, wateringDurationFixedCycle);
    EEPROM.put(7, biological_cycle);
    EEPROM.put(11,wateringDurationBioCycle);
    EEPROM.put(13,status);
    EEPROM.commit();
  }
  else // có dữ liệu từ trước
  {
    EEPROM.get(1, fixed_cycle);
    EEPROM.get(5, wateringDurationFixedCycle);
    EEPROM.get(7, biological_cycle);
    EEPROM.get(11,wateringDurationBioCycle);
    EEPROM.get(13,status);
    Serial.println("✅ Dữ liệu đã nạp từ EEPROM!");
  }

  EEPROM.end();

  Serial.print("fixed_cycle = ");
  Serial.print(fixed_cycle);
  Serial.print(", biological_cycle = ");
  Serial.println(biological_cycle);
  Serial.print(", status = ");
  Serial.println(status);
  
}

void saveCycle()
{
  EEPROM.begin(18); // cấp phát 20 byte

  EEPROM.put(1, fixed_cycle);// lưu vào
  EEPROM.put(5, wateringDurationFixedCycle);// lưu vào
  EEPROM.put(7, biological_cycle);
  EEPROM.put(11, wateringDurationBioCycle);
  EEPROM.put(13, status);
  EEPROM.commit(); // xác nhận
  EEPROM.end();

  Serial.print("da luu 2 du lieu la: ");
  Serial.print(fixed_cycle);
  Serial.print(", ");
  Serial.println(biological_cycle);
}

