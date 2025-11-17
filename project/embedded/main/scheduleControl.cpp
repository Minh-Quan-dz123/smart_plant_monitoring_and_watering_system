#include "scheduleControl.h"
#include "DS3231Control.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

using namespace std;

const char* scheduleFile = "/schedule.json";

vector<Schedule> repeats[3];


// lấy ra
bool isLeapYear(uint16_t year) 
{
    return ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0));
}

int8_t getDaysInMonth(uint16_t year, uint8_t month) 
{
    switch(month) {
        case 1: case 3: case 5: case 7: case 8: case 10: case 12:
            return 31;
        case 4: case 6: case 9: case 11:
            return 30;
        case 2:
            return isLeapYear(year) ? 29 : 28;
        default:
            return 0; // tháng sai
    }
}

void printSchedules()
{
  for(int i = 0; i<3; i++)
  {
    for(auto &s: repeats[i])
    {
      Serial.print("repeat: "); Serial.print(s.repeat); Serial.print(" , ");
      Serial.print("year"); Serial.print(s.year); Serial.print(" , ");
      Serial.print("month: "); Serial.print(s.month); Serial.print(" , ");
      Serial.print("day: "); Serial.print(s.day); Serial.print(" , ");
      Serial.print("hour: "); Serial.print(s.hour); Serial.print(" , ");
      Serial.print("minute: "); Serial.print(s.minute); Serial.print(" , ");
      Serial.print("second: "); Serial.print(s.second); Serial.print(" , ");
      Serial.print("wateringTime: "); Serial.println(s.wateringTime); 
      }
  }
}

bool cmp(const Schedule& a, const Schedule& b)
{
    if(a.year < b.year) return true;
    if(a.year > b.year) return false;

    if(a.month < b.month) return true;
    if(a.month > b.month) return false;

    if(a.day < b.day) return true;
    if(a.day > b.day) return false;

    if(a.hour < b.hour) return true;
    if(a.hour > b.hour) return false;

    if(a.minute < b.minute) return true;
    if(a.minute > b.minute) return false;

    if(a.second < b.second) return true;
    if(a.second > b.second) return false;

    // Nếu tất cả bằng nhau thì không đổi thứ tự
    return false;
}


void loadSchedules()
{
  // 1 xóa vector cũ đi
  // 2 Load JSON từ file vào 1 object JSON
  // 3 lưu từ JSON vào vector

  repeats[0].clear(); repeats[1].clear();repeats[2].clear();// xóa vector cũ
  if(!LittleFS.begin()) // kiểm tra có khởi động được ko
  {
    Serial.println("Little ko begin de load");
    return;
  }

  // kiểm tra có file trc đó ko
  if(!LittleFS.exists(scheduleFile))
  {
    // nếu ko có thì tạo
    File file = LittleFS.open(scheduleFile, "w");
    if(!file)
    {
      Serial.println("ko tao duoc file");
      return;
    }

    //khởi tạo file rỗng
    file.print("[]"); file.close();

  }

  // nếu file có rồi
  File file = LittleFS.open(scheduleFile, "r");
  // nếu file là rỗng thì thôi
  if(file.size() == 0) 
  {
    file.close();
    return;
  }
  // nếu có nội dung thì lấy ra
  StaticJsonDocument<4000> doc; // 1 Schedule chiếm 9 byte, 1152 chứa 128 Shedule
  DeserializationError err = deserializeJson(doc, file);// file -> JSON
  file.close();
  if(err)
  {
    Serial.print(" loi file -> json");
    Serial.println(err.c_str());
    return;
  }

  // nếu ko lỗi thì lưu JSON -> vector
  for(JsonObject obj : doc.as<JsonArray>())
  {
    Schedule x;
    x.repeat  = obj["repeat"] | 0; // nếu sai tên thuộc tính
    x.year = obj["year"] | 0;
    x.month = obj["month"] | 0;
    x.day  = obj["day"] | 0;
    x.hour   = obj["hour"] | 0;
    x.minute = obj["minute"] | 0;
    x.second = obj["second"] | 0;
    x.wateringTime= obj["wateringTime"] | 0;
    
    repeats[x.repeat].push_back(x);
  }

  for(int i=0; i<3;i++) sort(repeats[i].begin(), repeats[i].end(), cmp);
  printSchedules();
  
}

// save: lưu lại toàn bộ
void saveSchedules()
{
  // lưu từ vector->Json
  StaticJsonDocument<4000> doc;
  JsonArray arr = doc.to<JsonArray>();
  for(int8_t i = 0; i<3; i++)
  {
    for(const auto &s : repeats[i])
    {
      JsonObject obj = arr.createNestedObject();
      obj["repeat"] = s.repeat;
      obj["year"] = s.year;
      obj["month"] = s.month;
      obj["day"] = s.day;
      obj["hour"] = s.hour;
      obj["minute"] = s.minute;
      obj["second"] = s.second;
      obj["wateringTime"] = s.wateringTime;
    }
  }
  
  // lưu Json -> flash
  File file = LittleFS.open(scheduleFile, "w");
  if(!file)
  {
    Serial.println("file bi loi open"); return;
  }
  if(serializeJson(doc, file) == 0) // nếu ko ghi được gì
  {
    Serial.println("ko gi duoc tu json -> file");
  }
  file.close();

  printSchedules();
  
}



void addSchedule(Schedule &x)
{
  nowTime = rtc.now();
  uint8_t MaxDayInMonth = getDaysInMonth(nowTime.year(), nowTime.month());
  Serial.print("MaxDayInMonth = "); Serial.println(MaxDayInMonth);
  // lặp 1 lần
  if(x.repeat == 0 || x.repeat == 1)
  {
    Serial.println("1");
    while(isTimeReached(x.year, x.month, x.day, x.hour, x.minute, x.second) >= 0)
    {
      Serial.println("2");
      // tăng lên
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
    }
  }
  else if(x.repeat == 2)
  {
    Serial.println("3");
    while(isTimeReached(x.year, x.month, x.day, x.hour, x.minute, x.second) >= 0)
    {
      Serial.println("4");
      // tăng lên
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
    }
  }


  auto it = lower_bound(repeats[x.repeat].begin(), repeats[x.repeat].end(), x, cmp);
  repeats[x.repeat].insert(it, x);
  
  Serial.println("5");
  saveSchedules();
}

void deleteSchedule(int8_t repeat, uint8_t day, uint8_t hour, uint8_t minute, uint8_t second)
{
  if(repeat == -1)// xóa hết
  {
    for(int i=0; i<3; i++) repeats[i].clear();
  }
  else
  {
    if(repeats[repeat].size() == 0) return;

    if(repeat == 0 || repeat == 2)// day hợp lệ
    {
      for(int i = 0; i < repeats[repeat].size(); i++)
      {
        Schedule x = repeats[repeat][i];
        if(x.second == second && x.minute == minute && x.hour == hour && ((x.day) % 7 == day % 7))
        {
          repeats[repeat].erase(repeats[repeat].begin() + i);
          return;
        }
      }
    }
    else if(repeat == 1)
    {
      for(int i = 0; i < repeats[repeat].size(); i++)
      {
        Schedule x = repeats[repeat][i];
        if(x.second == second && x.minute == minute && x.hour == hour)
        {
          repeats[repeat].erase(repeats[repeat].begin() + i);
          return;
        }
      }
    }
    
  }
  saveSchedules();
}
