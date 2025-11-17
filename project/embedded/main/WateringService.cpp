#include "WateringService.h"

uint16_t wateringDuration = 0;



bool checkIsTimeSchedule()
{
  nowTime = rtc.now();
  uint8_t MaxDayInMonth = getDaysInMonth(nowTime.year(), nowTime.month());
  // kiểm tra lịch lặp hàng ngày
  if(repeats[1].size() > 0)
  {
    if(isTimeReached(repeats[1][0].year, repeats[1][0].month, repeats[1][0].day, repeats[1][0].hour, repeats[1][0].minute, repeats[1][0].second) >= 0) // đến giờ hoặc vừa qua giờ
    {
      wateringDuration = repeats[1][0].wateringTime;
      Serial.print("Year: "); Serial.println(repeats[1][0].year);
      Serial.print("Month: "); Serial.println(repeats[1][0].month);
      Serial.print("Day: "); Serial.println(repeats[1][0].day);
      Serial.print("Hour: "); Serial.println(repeats[1][0].hour);
      Serial.print("Minute: "); Serial.println(repeats[1][0].minute);
      Serial.print("Second: "); Serial.println(repeats[1][0].second);
      Schedule x = repeats[1][0];
      repeats[1].erase(repeats[1].begin());

      if(x.day < MaxDayInMonth ) x.day++;// nếu lớn hơn hoặc = thì bỏ
      else// sang tháng => tăng tháng reset lại ngày bằng 1
      {
        x.day = 1;
        if(x.month == 12)
        {
          x.year++;
          x.month = 1;
        }
        else x.month++;
      }
      addSchedule(x);
      Serial.print("wateringTime = "); Serial.println(wateringDuration);
      return true;
    }
  }
  

  // kiểm tra lịch chạy 1 lần
  if(repeats[0].size() > 0)
  {
    if(isTimeReached(repeats[0][0].year, repeats[0][0].month, repeats[0][0].day, repeats[0][0].hour, repeats[0][0].minute, repeats[0][0].second) >= 0)
    {
      wateringDuration = repeats[0][0].wateringTime;
      Serial.print("Year: "); Serial.println(repeats[0][0].year);
    Serial.print("Month: "); Serial.println(repeats[0][0].month);
    Serial.print("Day: "); Serial.println(repeats[0][0].day);
    Serial.print("Hour: "); Serial.println(repeats[0][0].hour);
    Serial.print("Minute: "); Serial.println(repeats[0][0].minute);
    Serial.print("Second: "); Serial.println(repeats[0][0].second);
      repeats[0].erase(repeats[0].begin());
      
      Serial.print("wateringTime = "); Serial.println(wateringDuration);
      return true;
    }
  }

  // kiểm tra lịch lặp hàng tuần
  if(repeats[2].size() > 0)
  {
    if(isTimeReached(repeats[2][0].year, repeats[2][0].month, repeats[2][0].day, repeats[2][0].hour, repeats[2][0].minute, repeats[2][0].second) >= 0)
    {
      wateringDuration = repeats[2][0].wateringTime;
      Serial.print("Year: "); Serial.println(repeats[2][0].year);
    Serial.print("Month: "); Serial.println(repeats[2][0].month);
    Serial.print("Day: "); Serial.println(repeats[2][0].day);
    Serial.print("Hour: "); Serial.println(repeats[2][0].hour);
    Serial.print("Minute: "); Serial.println(repeats[2][0].minute);
    Serial.print("Second: "); Serial.println(repeats[2][0].second);
      Schedule x = repeats[2][0];
      repeats[2].erase(repeats[2].begin());

      if(x.day + 7 <= MaxDayInMonth ) // nếu lớn hơn hoặc = thì bỏ
      {
        x.day += 7;
      }
      else// sang tháng => tăng tháng reset lại ngày bằng 1
      {
        x.day = x.day - MaxDayInMonth + 7; // ví dụ 29 - 31 + 7 = 5;
        if(x.month == 12)
        {
          x.year++;
          x.month = 1;
        }
        else x.month++;
      }
      addSchedule(x);
      Serial.print("wateringTime = "); Serial.println(wateringDuration);
      return true;
    }
  }
  
  return false;
}

bool checkSoil(float x)
{
  if(x < soil)
  {
    wateringDuration = wateringTime;
    return true;
  }
  return false;
}

void setPointer(int8_t i) // lọc danh sach
{
  nowTime = rtc.now();
  uint8_t MaxDayInMonth = getDaysInMonth(nowTime.year(), nowTime.month());
  // lặp 1 lần duy nhất => qua thì xóa
  if(i == 0)
  {
    if(repeats[i].size() == 0) return;
    Schedule crr = repeats[i][0];

    int8_t index = 0;
    while(isTimeReached(crr.year, crr.month, crr.day, crr.hour, crr.minute, crr.second) >= 0)
    {
      index++;
      if(index >= repeats[i].size()) break;

      crr = repeats[i][index]; 
    }
    repeats[i].erase(repeats[i].begin(), repeats[i].begin() + index);
  }  

  // lặp hàng ngày, ko xóa
  else if(i == 1)
  {
    if(repeats[i].size() == 0) return;
    Schedule x = repeats[i][0];

    int8_t index = 0;
    while(isTimeReached(x.year, x.month, x.day, x.hour, x.minute, x.second) >= 0)
    {
      repeats[i].erase(repeats[i].begin());
      if(x.day < MaxDayInMonth ) x.day++;// nếu lớn hơn hoặc = thì bỏ
      else// sang tháng => tăng tháng reset lại ngày bằng 1
      {
        x.day = 1;
        if(x.month == 12)
        {
          x.year++;
          x.month = 1;
        }
        else x.month++;
      }
      addSchedule(x);
    }
  }

  else if( i == 2)
  {
    if(repeats[i].size() == 0) return;
    Schedule x = repeats[i][0];

    while(isTimeReached(x.year, x.month, x.day, x.hour, x.minute, x.second) >= 0)
    {
      repeats[i].erase(repeats[i].begin());
      if(x.day + 7 <= MaxDayInMonth ) // nếu lớn hơn hoặc = thì bỏ
      {
        x.day += 7;
      }
      else// sang tháng => tăng tháng reset lại ngày bằng 1
      {
        x.day = x.day - MaxDayInMonth + 7; // ví dụ 29 - 31 + 7 = 5;
        if(x.month == 12)
        {
          x.year++;
          x.month = 1;
        }
        else x.month++;
      }
      addSchedule(x);
    }   
  }
}


void initWatering()
{
  if(status == 3) status = 0;
  saveCycle();
}


void managerStatus(uint8_t newStatus)
{
  if(newStatus == 3) return;
  status = newStatus;

  saveCycle();
}
