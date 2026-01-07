#include <Arduino.h>
#include "wifiControl.h"

ESP8266WebServer server(80);

String wifi_ssid = "";
String wifi_pass = "";

bool wifiConfigured = false;

/*
void setWifi()
{

  // 1 đặt là chế độ thu wifi
  WiFi.mode(WIFI_STA); // đặt ở chế độ chỉ kết nối, ko phát wifi giống wifi_ap

  // 2 in ra khi đang kết nối
  Serial.println("\n Begin connecting to wifi  ... ");
  WiFi.beginSmartConfig();// bắt đầu nghe các gói UDP 

  while(!WiFi.smartConfigDone())// chờ nghe SSID và password từ beginSmartConfig()
  {
    delay(700);
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
}*/

void setWifi()
{
  Serial.println("\n--- CHƯA CÓ WIFI → BẬT AP CONFIG ---");

  WiFi.mode(WIFI_AP_STA);

  // 1. Phát WiFi cho điện thoại kết nối
  WiFi.softAP("ESP8266_Config");
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());

  // 2. Trang nhập WiFi
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html",
      "<html>"
      "<h2>ESP8266 WIFI CONFIG</h2>"
      "<form action='/save' method='POST'>"
        "SSID:<br><input name='ssid'><br>"
        "Password:<br><input name='pass' type='password'><br><br>"
        "<input type='submit' value='SAVE'>"
      "</form>"
      "</html>");
  });

  // 3. Nhận ssid và password
  server.on("/save", HTTP_POST, []() {
    wifi_ssid = server.arg("ssid");
    wifi_pass = server.arg("pass");

    server.send(200, "text/html",
      "<h3>Saved! Connecting...</h3>");

    wifiConfigured = true;
  });

  server.begin();
  Serial.println("Web server started");

  // 4. Chờ user nhập WiFi
  while (!wifiConfigured) {
    server.handleClient();
    delay(10);
  }

  // 5. Kết nối WiFi nhà
  WiFi.softAPdisconnect(true);
  WiFi.begin(wifi_ssid.c_str(), wifi_pass.c_str());

  Serial.println("Dang ket noi WiFi nha...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n--- WIFI CONNECTED ---");
  Serial.println(WiFi.localIP());
}

void reconnectWifi()
{
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("\n--- MAT WIFI → MO LAI AP CONFIG ---");
  wifiConfigured = false;
  setWifi();
}

