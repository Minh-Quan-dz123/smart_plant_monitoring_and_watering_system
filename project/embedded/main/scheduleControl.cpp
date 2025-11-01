#include "scheduleControl.h"

const char* scheduleFile = "/schedule.json";
vector<Schedule> schedules;

// tạo 2 hàm cơ bản 
void loadSchedules() // lấy dữ liệu từ file -> RAM
{
  if(!LittleFS.exists(scheduleFile))// nếu chưa có file (nếu lỡ xóa)
  {
    File file = LittleFS.open(scheduleFile, "w"); // mở/ tạo ra 1 file để ghi
    file.print("[]"); file.close();
    return;
  }

  // nếu đã file
  File file = LittleFS.open(scheduleFile, "r"); // lấy ra để đọc
  if(!file) 
  {
    Serial.println("ko the mo file de doc");
    return;
  }

  // Tạo Json động với dung lương bộ nhớ 2048 để chứa nội dung đọc từ flash ra
  // để làm việc
  DynamicJsonDocument docData(2048);

  // kiểm tra nguồn dữ liệu JSON có đọc thành công ko hay bị lỗi (file -> doData)
  DeserializationError error_json = deserializeJson(docData, file);
  if(error_json)
  {
    Serial.println("error reading data from file");
    file.close();
    return;
  }

  // nếu nguồn json được ra oke thì lại tiếp tục đẩy 
  // data từ chuỗi json -> vector
  schedules.clear();// đoạn sạch vector trước
  for(JsonObject obj : docData.as<JsonArray>()) // chuyển hóa thành mảng Json
  {
    Schedule gan;
    gan.day = obj["day"];
    gan.hour = obj["hour"];
    gan.minute = obj["minute"];
    gan.second = obj["second"];
    gan.wateringDuration = obj["wateringDuration"];
    
    // xong thì đẩy vào vector
    schedules.push_back(gan);
  }
  file.close(); return;

}

void saveSchedule() // lưu dữ liệu từ RAM vào file trong bộ nhớ flash
{
  DynamicJsonDocument docData(2048);
  JsonArray arr = docData.to<JsonArray>();

  // lưu dữ liệu từ mảng schedules vào docData
  for(auto &s: schedules)
  {
    JsonObject obj = arr.createNestedObject(); // tạo 1 object bên trong 1 mảng json (arr)
    obj["day"] = s.day;
    obj["hour"] = s.hour;
    obj["minute"] = s.minute;
    obj["second"] = s.second;
    obj["wateringDuration"] = s.wateringDuration;
  }

  File file = LittleFS.open(scheduleFile, "w");// mở file để viết
  if(!file)
  {
    Serial.println("cannot open file for writing");
    return;
  }

  // lưu dữ liệu từ docData vào file
  serializeJsonPretty(docData, file);
  file.close();

  //
}

// 0 khởi tạo lịch
void initScheduleStorage()
{
  if(!LittleFS.begin())// nếu ko thể khởi tạo LittleFS thì báo cáo
  {
    Serial.println("ko the tao LittleFS");
    return;
  }

  // nếu có thì tạo file
  if(!LittleFS.exists(scheduleFile))
  { // kiểm tra file nào có tồn tại ko
    File file = LittleFS.open(scheduleFile, "w"); // nếu có thì mở ra để viết
    file.print("[]"); // ghi để tượng trưng cho đây là file json
    file.close();
  }

  // sau khi tạo file trên flash rồi thì mang ra RAM để làm việc trên RAM(schedules)
  loadSchedules();
  Serial.println("tao file schedule.json hoan tat");
}

// 1 lấy lịch ở vị trí index cho trước
Schedule getScheduleAt(int index)
{
  if(index < 0 || index >= schedules.size()) return {0,0,0,0,0};
  return schedules[index];
}

// 2 lấy ra số lượng lịch hiện có
int getScheduleCount()
{
  return schedules.size();
}

// 3 lấy ra danh sách các lịch
vector<Schedule> getAllSchedule()
{
  return schedules;
}

// 4 lấy ra danh sách lịch có ngày cho trước
vector<Schedule> getScheduleByDay(int day)
{
  vector<Schedule> listScheduleByDay;
  for(auto &x : schedules)
  {
    if(x.day == day)
    {
      listScheduleByDay.push_back(x);
    }
  }
  return listScheduleByDay;
}

// 5 xóa lịch ở vị trí index
void deleteSchedule(int index)
{
  if(index == -99) // lệnh xóa hết lịch
  {
    schedules.clear();
    saveSchedule();
    return;
  }

  if(index < 0 || index > schedules.size()) return;

  schedules.erase(schedules.begin() + index);
  // xóa trên ram sau đó lưu lại vào flash
  saveSchedule();
}

// 6 thêm lịch ở vị trí index
void addSchedule(int index, const Schedule &x)
{
  if(index < 0 || index > schedules.size()) return;
  schedules.insert(schedules.begin() + index, x);
  // lưu vào flash
  saveSchedule();
}

// 7 sắp xếp các lịch từ bé -> lớn 
/*
void sortSchedules()
{
  sort(schedules.begin(), schedules.end(), [](const Schedule &a, const Schedule &b){
    if(a.day != b.day) return a.day < b.day;
    if(a.hour != b.hour) return a.hour < b.hour;
    if(a.minute != b.minute) return a.minute < b.minute;
    return a.second < b.second;
  });
  saveSchedule();
}*/