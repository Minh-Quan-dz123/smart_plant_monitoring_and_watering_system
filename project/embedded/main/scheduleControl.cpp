#include "scheduleControl.h"


#include <LittleFS.h>
#include <ArduinoJson.h>


using namespace std;

const char* scheduleFile = "/schedule.json";
vector<Schedule> schedules;

void loadSchedules()
{
  // 1 xóa vector cũ đi
  // 2 Load JSON từ file vào 1 object JSON
  // 3 lưu từ JSON vào vector

  schedules.clear();// xóa vector cũ
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
  StaticJsonDocument<1152> doc; // 1 Schedule chiếm 9 byte, 1152 chứa 128 Shedule
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
    x.year   = obj["year"] | 0; // nếu sai tên thuộc tính
    x.month  = obj["month"] | 0;
    x.day    = obj["day"] | 0;
    x.hour   = obj["hour"] | 0;
    x.minute = obj["minute"] | 0;
    x.second = obj["second"] | 0;
    x.wateringDuration = obj["wateringDuration"] | 0;
    
    schedules.push_back(x);
  }

  for(const auto &a: schedules)
  {
    Serial.print("year: "); Serial.print(a.year); Serial.print(" , ");
    Serial.print("month: "); Serial.print(a.month); Serial.print(" , ");
    Serial.print("day: "); Serial.print(a.day); Serial.print(" , ");
    Serial.print("minute: "); Serial.print(a.minute); Serial.print(" , ");
    Serial.print("second: "); Serial.print(a.second); Serial.print(" , ");
    Serial.print("wateringDuration: "); Serial.println(a.wateringDuration); 
  }
  
}

// save
void saveSchedules()
{
  // lưu từ vector->Json
  StaticJsonDocument<1152> doc;
  JsonArray arr = doc.to<JsonArray>();
  for(const auto &s : schedules)
  {
    JsonObject obj = arr.createNestedObject();
    obj["year"] = s.year;
    obj["month"] = s.month;
    obj["day"] = s.day;
    obj["hour"] = s.hour;
    obj["minute"] = s.minute;
    obj["second"] = s.second;
    obj["wateringDuration"] = s.wateringDuration;
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

  for(const auto &a: schedules)
  {
    Serial.print("year: "); Serial.print(a.year); Serial.print(" , ");
    Serial.print("month: "); Serial.print(a.month); Serial.print(" , ");
    Serial.print("day: "); Serial.print(a.day); Serial.print(" , ");
    Serial.print("minute: "); Serial.print(a.minute); Serial.print(" , ");
    Serial.print("second: "); Serial.print(a.second); Serial.print(" , ");
    Serial.print("wateringDuration: "); Serial.println(a.wateringDuration); 
  }
}

void addSchedule(uint8_t index, const Schedule &x)
{
  if(index > 127)// vượt quá không gian lưu trữ
  {
    Serial.println("index > 127 => vuot qua khong gian luu tru");
    return;
  }

  schedules.insert(schedules.begin()+index, x);
  saveSchedules(); // lưu

}

void deleteSchedule(int8_t index)
{
  if(index == -1) schedules.clear();
  else schedules.erase(schedules.begin() + index);
  saveSchedules();
}
