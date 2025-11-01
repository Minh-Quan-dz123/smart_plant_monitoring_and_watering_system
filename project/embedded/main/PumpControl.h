#ifndef PUMPCONTROL_H
#define PUMPCONTROL_H

#include <Arduino.h>
// cấu hình chân pump
#define PUMP D1 // chân điều khiển relay

extern bool pumpStatus;// trạng thái vòi
void initPump();
void startPump(); // bật máy bơm
void offPump();

#endif