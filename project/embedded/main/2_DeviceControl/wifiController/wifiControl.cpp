#include <Arduino.h>
#include "wifiControl.h"

void setWifi()
{

  // 1 đặt là chế độ thu wifi
  WiFi.mode(WIFI_STA); // đặt ở chế độ chỉ kết nối, ko phát wifi giống wifi_ap

  // 2 in ra khi đang kết nối
  Serial.println("\n Begin connecting to wifi  ... ");
  WiFi.beginSmartConfig();// bắt đầu nghe các gói UDP 

  while(!WiFi.smartConfigDone())// chờ nghe SSID và password
  {
    delay(650);
    Serial.println(".....Connecting......");
  }

  // 3 nếu thành công thì thông báo
  Serial.println("------Wifi Connected successful------");
  Serial.print("dia chi IP: ");
  Serial.println(WiFi.localIP());
  
}

void reconnectWifi()
{
  if(WiFi.status() == WL_CONNECTED) return; // đang kết nối rồi
  // nếu tự dưng mất
  Serial.println("-----Mất kết nối Wifi-----");
  WiFi.beginSmartConfig();// bật nghe UDP nếu thay đổi wifi khác

  while(!WiFi.smartConfigDone())// chờ nghe SSID và password
  {
    delay(650);
    Serial.println(".....Connecting......");
  }

  // 3 nếu thành công thì thông báo
  Serial.println("------Wifi Connected successful------");
  Serial.print("dia chi IP: ");
  Serial.println(WiFi.localIP());
  return;
}