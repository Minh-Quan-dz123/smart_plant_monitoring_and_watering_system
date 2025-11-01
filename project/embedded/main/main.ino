#include "config.h" // thư viện chứa các cấu hình

#include "1_Service/MQTTService/ConnectHiveMQ.h"

#include "1_Service/PlantWateringService/WateringService.h"

#include "2_DeviceControl/wifiController/wifiControl.h"

#include "2_DeviceControl/sensorController/DHT11Controller/DHT11Control.h"
//#include "2_DeviceControl/sensorController/soilSensorController/soilSensorControl.h"

#include "2_DeviceControl/scheduleController/cycleControl.h"
#include "2_DeviceControl/scheduleController/scheduleControl.h"

#include "2_DeviceControl/RTC_DS3231Controller/DS3231Control.h"

#include "2_DeviceControl/pumpController/PumpControl.h"

void setup() {
  // gọi setup cấu hình
  beginConfig();
}


uint32_t t_check = millis();// biến để so sánh thời gian
uint32_t t_pump = millis(); // biến chạy thời gian tưới
int TIMEONPUMP = 0; // 
bool pumpStatus = false;// chưa tưới
uint32_t t_mqtt = millis();


void loop() {

  // 1 if kiểm tra hệ thống đang tưới cây không - không
  if(pumpStatus == false)
  {
    // kiểm tra đã qua 1 giây chưa
    if(millis() - t_check > 1000)
    {
      t_check = millis();

      //  kiểm tra dữ liệu
      if(PumpEmer == false)
      {
        // 1 nếu đang tưới theo lịch cá nhân
        if(status == 1) // tưới cây theo lịch
        {
          if(checkIsTimeSchedule())// kiểm tra tới lịch chưa
          {
            // nếu tới giờ tưới thì tưới
            pumpStatus =  true;// đang tưới
            startPump();// bật máy bơm
            TIMEONPUMP = wateringDuration; // thời gian bật máy bơm là thời gian trên lịch
            t_pump = millis();// bắt đầu đếm
          }
        }

        // 2 nếu tưới cây theo chu kì cố định
        else if(status == 2)// else gọi hàm check chu kì cố định
        { 
          T_copy--;
          if(T_copy <= 0)// đến giờ thì tưới
          {
            pumpStatus =  true;// đang tưới
            startPump();// bật máy bơm
            TIMEONPUMP = wateringDurationFixedCycle;
            t_pump = millis();
          }
        }

        // 3 nếu tưới cây theo chu kì sinh học (dựa vào điều kiện môi trường)
        else if(status == 3)// else gọi hàm check chu kì sinh học
        {
          if(getTemp() > 30 || getHum() < 40) //thời tiết khắc nghiệt
          {
            T_copy -= 2;
          }
          else T_copy--;

          if(T_copy <= 0)// đến giờ thì tưới
          {
            pumpStatus =  true;// đang tưới
            startPump();// bật máy bơm
            TIMEONPUMP = wateringDurationBioCycle;
            t_pump = millis();
          }

        }
      }
      else // PumpEmer == true
      {
        pumpStatus = true;
        startPump();
        TIMEONPUMP = 3000;
        t_pump = millis();
      }

      
    }
  }
  // 1 else kiểm tra hệ thống đang tưới cây ko - có
  else
  {
    // kiểm tra đã hết thời gian tưới chưa
    if(millis() - t_pump >= TIMEONPUMP)
    {
      // tắt pump
      offPump();
      pumpStatus = false;
      if(PumpEmer)
      {
        PumpEmer = false; // tắt tưới cây khẩn cấp
      }
      if(status != 1)
      {
        T_copy = T;
      }
    }
  }
  

  // 2 kiểm tra wifi
  reconnectWifi();

  // 3 kiểm tra MQTT
  if(!client.connected())// nếu chưa kết nối
  {
    reconnectMQTT();
  }

  // 4 gửi dữ liệu tới MQTT sau 3 giây
  if(millis() - t_mqtt >= 3000)
  {
    t_mqtt = millis();
    sendDataToHiveMQ(getTemp(),getHum(),1);
  }

  delay(100);
}
