#ifndef CONNECTHIVEMQ_H
#define CONNECTHIVEMQ_H

#include <Arduino.h>
#include <ArduinoMqttClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>


// các biến 
extern const char* mqtt_sever; // đường dẫn tới HiveMQ
extern const uint16_t mqtt_port; // tên port
extern const char* mqtt_user;
extern const char* mqtt_pass;
extern const char* clientId;

extern WiFiClientSecure espClient;
extern MqttClient client;

extern bool emerTurnOff;

// khai báo hàm
void setupMQTT();
void callback(char *topic, byte* payload, unsigned int length);// hàm xử lý callback
void reconnectMQTT(); // hàm reconnect với hivemq

// gửi nhiệt độ độ ẩm
void sendDataToHiveMQ(float temperature, float humidity, float soil);

// gửi log
void writeLog(uint16_t year, uint8_t month, uint8_t day, uint8_t hour, uint8_t minute, uint8_t second, uint16_t time);

#endif