#include "PumpControl.h"

void initPump()
{
  pinMode(PUMP, OUTPUT); // chân D1 là đầu ra
  digitalWrite(PUMP, LOW); //tắt chân này đi
}

void startPump()
{
  digitalWrite(PUMP, HIGH); // truyền điện vào
}

void offPump()
{
  digitalWrite(PUMP, LOW); //tắt chân này đi
}