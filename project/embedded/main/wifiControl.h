#ifndef WIFICONTROL_H
#define WIFICONTROL_H

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ESP8266WebServer.h>

void setWifi();// kết nối wifi
void reconnectWifi(); // nếu lỡ đang kết nối mà xịt thì kiểm tra và gọi lại

#endif