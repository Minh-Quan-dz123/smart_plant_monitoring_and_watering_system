#ifndef CONNECTHIVEMQ_H
#define CONNECTHIVEMQ_H

#include <Arduino.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>


// các biến 
extern const char* mqtt_sever; // đường dẫn tới HiveMQ
extern const int mqtt_port; // tên port
extern const char* mqtt_user;
extern const char* mqtt_pass;
extern const char* clientId;

extern WiFiClientSecure espClient;
extern PubSubClient client;

// khai báo hàm
void setupMQTT();
void callback(char *topic, byte* payload, unsigned int length);// hàm xử lý callback
void reconnectMQTT(); // hàm reconnect với hivemq
void sendDataToHiveMQ(float temperature, float humidity, float soil);

#endif