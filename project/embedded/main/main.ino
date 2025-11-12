#include "config.h" // thư viện chứa các cấu hình

uint32_t t_check = millis();// biến chạy thời gian hệ thống
uint32_t t_pump = millis(); // biến chạy thời gian tưới
uint32_t t_mqtt = millis(); // biến chạy thời gian để gửi dữ liệu
uint32_t TIME_ON_PUMP = 0; // thời gian tưới, đơn vị ms giây

void setup() {
  // gọi setup cấu hình
  beginConfig();
}

void loop() {

  // 1 if kiểm tra hệ thống đang tưới cây không - không
  if(pumpStatus == false)
  {
    // kiểm tra đã qua 1 giây chưa
    if(millis() - t_check >= 1000)
    {
      t_check = millis();

      // kiểm tra đang ở trạng thái tưới nào
      if(status == 1) // tưới cây theo lịch
      {
        // đã đến giờ tưới chưa
        if(checkIsTimeSchedule())
        {
          pumpStatus = true;
          TIME_ON_PUMP = wateringDuration*1000;
          t_pump = millis();
          turnOnPump();// bật máy bơm
        }
      }
      else if(status == 2) // theo độ chịu hạn
      {
        // T-- và kiểm tra
        if(getTemp() == 0 || getHum() == 0) initDHT();
        if(getSoil() == 0) initSoil();

        if(getTemp() > 30 || getHum() < 33 || getSoil() < 33)
        {
          T_bio -= 2;
        }
        else T_bio--;

        if(T_bio <= 0) // đến giờ tưới
        {
          pumpStatus = true;
          TIME_ON_PUMP = wateringDuration*1000;
          t_pump = millis();
          turnOnPump();// bật máy bơm
        }
        
      }
      else if(status == 3) // bấm tưới ngay
      {
        pumpStatus = true;
        TIME_ON_PUMP = wateringDuration*1000;
        t_pump = millis();
        turnOnPump();// bật máy bơm
      }
    
    }
  }

  // 1 else kiểm tra hệ thống đang tưới cây ko - có
  else
  {
    // kiểm tra đã hết thời gian tưới chưa
    if(millis() - t_pump >= TIME_ON_PUMP)
    {
      pumpStatus = false;
      turnOffPump(); // tắt máy bơm
      if(status == 2)
      {
        T_bio = (long long)bioCycle;
      }
      if(status == 3) status = 0; // tắt tưới ngay
    }
    else// chưa tưới xong
    {
      delay(50);
      return;
    }
  }
  

  // 2 kiểm tra wifi
  reconnectWifi();

  // 3 kiểm tra MQTT
  if(!client.connected()) reconnectMQTT();
  client.poll(); // nhận message và gọi callback

  // 4 gửi dữ liệu tới MQTT sau 3 giây
  if(millis() - t_mqtt >= 3000)
  {
    t_mqtt = millis();
    float tem = getTemp();
    float hum = getHum();
    float soi = getSoil();
    if(tem == 0 || hum == 0) initDHT();// nếu có lỗi gì đó
    if(soi == 0) initSoil();
    sendDataToHiveMQ(tem,hum,soi);
  }

  delay(50);
}
