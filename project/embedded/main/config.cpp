#include "config.h"


void beginConfig()
{
  //0 cấu hình
  Serial.begin(115200); 
  delay(500);

  // 1 khởi tạo cycleControl, schedule
  loadEEPROM();
  loadSchedules();

  // 2 cảm biến DHT, soil
  initDHT();
  initSoil();

  // 3 pump
  initPump();

  // 4 RTC
  beginRTC();

  // 5 wifi
  setWifi();

  // 6 HiveMQ
  setupMQTT();

  // 7 đặt con trỏ
  setPointer(0);setPointer(1);setPointer(2);
  initWatering();


}