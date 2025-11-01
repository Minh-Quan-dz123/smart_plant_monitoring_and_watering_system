#include "config.h"

#include "1_Service/MQTTService/ConnectHiveMQ.h"
#include "1_Service/MQTTService/ConnectHiveMQ.cpp"

#include "1_Service/PlantWateringService/WateringService.h"
#include "1_Service/PlantWateringService/WateringService.cpp"

#include "2_DeviceControl/wifiController/wifiControl.h"
#include "2_DeviceControl/wifiController/wifiControl.cpp"

#include "2_DeviceControl/sensorController/DHT11Controller/DHT11Control.h"
#include "2_DeviceControl/sensorController/DHT11Controller/DHT11Control.cpp"
//#include "2_DeviceControl/sensorController/soilSensorController/soilSensorControl.h"

#include "2_DeviceControl/scheduleController/cycleControl.h"
#include "2_DeviceControl/scheduleController/cycleControl.cpp"

#include "2_DeviceControl/scheduleController/scheduleControl.h"
#include "2_DeviceControl/scheduleController/scheduleControl.cpp"

#include "2_DeviceControl/RTC_DS3231Controller/DS3231Control.h"
#include "2_DeviceControl/RTC_DS3231Controller/DS3231Control.cpp"

#include "2_DeviceControl/pumpController/PumpControl.h"
#include "2_DeviceControl/pumpController/PumpControl.cpp"

void beginConfig()
{
  //0 cấu hình
  Serial.begin(115200); 
  delay(500);

  // 1 set pump
  initPump();

  // 2 setup DS3231
  Wire.begin(SDA,SCL); //khởi tạo i2c giao tiếp ở 2 chân này ( DS3231)
  rtc.begin();
  setRealTime(2025,1,1,1,1,1);

  //3 setup EEPROM và LittleFS
  loadEEPROM();
  initScheduleStorage();

  // 4 setup DHT
  dht11.begin();
  
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