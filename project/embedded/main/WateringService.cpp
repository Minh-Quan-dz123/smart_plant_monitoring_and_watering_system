#include "WateringService.h"



uint16_t wateringDuration = 0;
long long T_bio = 0;


bool checkIsTimeSchedule()
{
  if(schedules.size() == 0) return false;
  nowTime = rtc.now();
  Schedule crr = schedules[0];
  int8_t res = isTimeReached(crr.year, crr.month, crr.day, crr.hour, crr.minute, crr.second);
  if(res == 0)
  {
    wateringDuration = crr.wateringDuration;
    schedules.erase(schedules.begin());
    return true;
  }
  return false;

}

void setPointer() // lọc danh sach
{
  if(schedules.size() == 0) return;
  nowTime = rtc.now();
  Schedule crr = schedules[0];

  int8_t index = 0;
  while(isTimeReached(crr.year, crr.month, crr.day, crr.hour, crr.minute, crr.second) > -1)
  {
    index++;
    if(index >= schedules.size()) break;

    crr = schedules[index]; 
  }
  schedules.erase(schedules.begin(), schedules.begin() + index);

}

void addNewSchedule(uint8_t index, const Schedule &x)
{
  addSchedule(index, x);
  setPointer();
}


void managerStatus(uint8_t newStatus)
{
  if(newStatus == status) return;

  if(newStatus == 3) status == 0;

  else
  {
    status = newStatus;
    if(status == 2)
    {
      T_bio =  (long long)bioCycle;
      wateringDuration = wateringTime;
    }
    
  }
  saveCycle();
}
