#include "DHT11Control.h"

DHT dht(DHT_PIN, DHT11);


void initDHT()
{
  dht.begin();
  delay(100);
}


float getTemp()
{
  float x = dht.readTemperature();
  if(isnan(x)) return 0;
  return x;
}

float getHum()
{
  float x = dht.readHumidity();
  if(isnan(x)) return 0;
  return x;
}