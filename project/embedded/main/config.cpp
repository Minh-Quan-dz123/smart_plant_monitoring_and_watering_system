#include "config.h"


void beginConfig()
{
  //0 cấu hình
  Serial.begin(115200); 
  delay(500);

  // 1 set pump
  initPump();

  // 2 setup DS3231
  beginRTC();

  //3 setup EEPROM và LittleFS
  loadEEPROM();
  initScheduleStorage();

  // 4 setup DHT
  initDHT11();
  
  //5 setup wifi
  setWifi();

  //6 setup HiveMQ
  setupMQTT();

  // 7 set con trỏ lịch
  setPointerSchedule();

  if(status == 4)// chưa từng tạo trạng thái
  {
    status = 3;// tưới cây theo chu kì sinh học
  }


}