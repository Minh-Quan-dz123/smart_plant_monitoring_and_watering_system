#ifndef CONFIG_H
#define CONFIG_H

#include<Wire.h>
#include<Arduino.h>

// cấu hình I2C
#define SDA D4 // chân data
#define SCL D3 // chân clock


// hàm begin
void beginConfig();

#endif