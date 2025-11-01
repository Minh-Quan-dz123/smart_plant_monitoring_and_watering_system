#ifndef CONFIG_H
#define CONFIG_H

#include<Wire.h>
#include<Arduino.h>

// 1 service
#include "ConnectHiveMQ.h"
#include "WateringService.h"

// 2 controll
// 2.1 wifi
#include "wifiControl.h"

// 2.2 dht
#include "DHT11Control.h"
// 2.3 lịch tưới cây
#include "cycleControl.h"
#include "scheduleControl.h"

// 2.4 real time
#include "DS3231Control.h"

// 2.5 máy bơm
#include "PumpControl.h"


// hàm begin
void beginConfig();



#endif