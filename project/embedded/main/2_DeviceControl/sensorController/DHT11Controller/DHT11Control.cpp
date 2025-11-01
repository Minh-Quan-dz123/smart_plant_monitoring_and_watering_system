#include "DHT11Control.h"

DHT dht11(D2, DHT11);

float getTemp()
{
  float x = dht11.readTemperature();
  if(isnan(x)) return 0;
  return x;
}

float getHum()
{
  float x = dht11.readHumidity();
  if(isnan(x)) return 0;
  return x;
}