#include "PumpControl.h"
#include <Arduino.h>
bool pumpStatus = false;
void initPump()
{
  pinMode(PUMP, OUTPUT); // chân D0 là đầu ra
  digitalWrite(PUMP, LOW); //tắt chân này đi
}

void turnOnPump()
{
  digitalWrite(PUMP, HIGH);
}

void turnOffPump()
{
  digitalWrite(PUMP, LOW);
}