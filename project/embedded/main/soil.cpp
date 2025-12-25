#include <Arduino.h>
#include "soil.h"
// khai báo hàm, tham số
void initSoil() // bật cả biến
{
  
}

void endSoil() // tắt soil
{
  
}

float getSoil()
{
  float x = analogRead(SOIL_ANALOG);

  // 0 là ướt, 1023 là khô => cần x = 0 <=> 100, x = 1023 <=> 0
  // (x,y) = (0, 100), (1023, 0), y=ax+b
  // b=100, và 1023a+100=0 => a = -100/1023 và b = 100
  // y = -100x/1023 + 100

  float moisture =(100.0*x)/1023.0;
  return moisture;
}