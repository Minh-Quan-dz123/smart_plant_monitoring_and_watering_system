#include "ConnectHiveMQ.h"

#include "wifiControl.h"

// controller
#include "DHT11Control.h"

#include "scheduleControl.h"

#include "cycleControl.h"

#include "DS3231Control.h"

#include "PumpControl.h"

#include "WateringService.h"


const char* mqtt_server ="8c8b67f172b549eba06b16f265f2f580.s1.eu.hivemq.cloud";
const int mqtt_port = 8883; // tên port
const char* mqtt_user = "MinhQuan5386";
const char* mqtt_pass = "ABC";
const char* clientId = "123456789";

const char* topic1 = "pump"; // bật máy bơm (chỉ subcribe)
const char* topic2 = "temp"; // nhiệt độ (chỉ pushlish)
const char* topic3 = "humi"; // độ ẩm (chỉ pushlish)
const char* topic4 = "soil"; // độ ẩm đất (chỉ pushlish)
const char* topic5 = "fixed_cycle"; // chu kì cố định - thời gian tưới mỗi lần (chỉ subcribe)
const char* topic6 = "bio_cycle"; // chu kì sinh học - thời gian sinh học (chỉ subscribe)
const char* topic7 = "addSchedule"; // "ngày - giờ - phút - giây - thời gian tưới" (chỉ subcribe)
const char* topic8 = "deleteSchedule"; // vị trí lịch bị xóa (chỉ subcribe), mã đặc biệt thì là xóa hết
const char* topic9 = "setTimeRTC"; // cài đặt lại thời gian (chỉ subcribe)
const char* topic10 = "selectStatus"; // user chọn tưới cây theo chế độ gì (chỉ subcribe)

WiFiClientSecure espClient;
PubSubClient client(espClient);

void sendDataToHiveMQ(float temperature, float humidity, float soil)
{
  // đổi float sang char
  char tempStr[6], humiStr[6], soilStr[6];
  dtostrf(temperature, 4, 2, tempStr);
  dtostrf(humidity, 4, 2, humiStr);
  dtostrf(soil, 4, 2, soilStr);

  if(client.publish(topic2, tempStr))
  {
    Serial.println("da gui topic 2: "+ (String)temperature);
  }
  if(client.publish(topic3, humiStr))
  {
    Serial.println("da gui topic 3: "+ (String)humidity);
  }
  if(client.publish(topic4, soilStr))
  {
    Serial.println("da gui topic 4: "+ (String)soilStr);
  }
}


// được gọi khi nó nhận được 1 tin từ HiveMQ
void callback(char *topic, uint8_t* payload, unsigned int length)
{
  //1 kiểm tra đầu vào
  if(length <= 0) return;

  //2 lấy dữ liệu
  char mess[length+1];// mảng lưu giá trị gửi về
  memcpy(mess, payload, length); // copy payload vào mess
  mess[length]='\0';  // Thêm ký tự kết thúc chuỗi
  String msg = String(mess); // tạo chuỗi từ mảng mess
  msg.trim(); // cắt đoạn trắng đầu cuối của string
  Serial.print("da nhan lenh lenh la:");
  Serial.print(msg);

  //3 tiến hành kiểm tra
  //3.1 nếu là topic 5: cài đặt chu kì cố định
  if(strcmp(topic,topic5) == 0)
  {
    Serial.print("nhan duoc topic5: ");
    // chuỗi gửi về là chuỗi JSON dạng: {Fcycle: int, duratime: int}
    StaticJsonDocument<100> doc; // tạo object json dài 100 byte để đọc dữ liệu
    DeserializationError error = deserializeJson(doc, msg);
    if(error)
    {
      Serial.println("JSON parsing failed topic5!");
      return;
    }

    // cập nhật dữ liệu
    fixed_cycle = doc["Fcycle"];
    wateringDurationFixedCycle = doc["duratime"];
    saveCycle();// gọi để lưu vào flash

    Serial.print(fixed_cycle); Serial.print(" - ");
    Serial.println(wateringDurationFixedCycle);
  }

  //3.2 nếu là topic 6: cài đặt chu kì sinh học
  else if(strcmp(topic,topic6) == 0)
  {
    Serial.print("nhan duoc topic6: ");
    // chuỗi gửi về là chuỗi JSON dạng: {Bcycle: int, duratime: int}
    StaticJsonDocument<100> doc; // tạo object json dài 100 byte để đọc dữ liệu
    DeserializationError error = deserializeJson(doc, msg);
    if(error)
    {
      Serial.println("JSON parsing failed topic6!");
      return;
    }

    // cập nhật dữ liệu
    biological_cycle = doc["Bcycle"];
    wateringDurationBioCycle = doc["duratime"];
    saveCycle();// gọi để lưu vào flash

    Serial.print(biological_cycle); Serial.print(" - ");
    Serial.println(wateringDurationBioCycle);
  }

  //3.3 nếu là topic 7: addSchedule
  else if(strcmp(topic,topic7) == 0)
  {
    Serial.println("nhan duoc topic7: ");
    Serial.println(msg);
    // chuỗi gửi về là chuỗi JSON dạng: {vt:int, day:int, hour: int, minute: int, second: int, drt: int}
    StaticJsonDocument<128> doc; // tạo object json dài 128 byte để đọc dữ liệu
    DeserializationError error = deserializeJson(doc, msg);
    if(error)
    {
      Serial.println("JSON parsing failed topic7!");
      return;
    }

    // cập nhật dữ liệu
    Schedule x = (Schedule){(int)doc["day"],(int)doc["hour"], (int)doc["minute"], (int)doc["second"], (int)doc["drt"]};// tạo dữ liệu
    addSchedule((int)doc["vt"], x);

    Serial.println("📋 Danh sách lịch tưới:");

    // in ra màn hình
    for (size_t i = 0; i < schedules.size(); i++) 
    {
      Schedule s = schedules[i];
      Serial.print("[" + String(i) + "] ");
      Serial.print("Day: "); Serial.print(s.day);
      Serial.print(", Hour: "); Serial.print(s.hour);
      Serial.print(", Minute: "); Serial.print(s.minute);
      Serial.print(", Second: "); Serial.print(s.second);
      Serial.print(", Duration: "); Serial.println(s.wateringDuration);
    }

    Serial.println("------------------------");
    // thêm lịch thì phải set lại con trỏ lịch
    setPointerSchedule();
  }

  //3.4 nếu là topic 8: deleteSchedule, dữ liệu gửi về là 1 int
  else if(strcmp(topic,topic8) == 0)
  {
    
    Serial.print("nhan duoc topic8: ");
    Serial.println(msg);
    deleteSchedule(atoi(msg.c_str()));// mỗi lần xóa lịch thì phải set lại con trỏ
    setPointerSchedule();

     // in ra màn hình
    for (size_t i = 0; i < schedules.size(); i++) 
    {
      Schedule s = schedules[i];
      Serial.print("[" + String(i) + "] ");
      Serial.print("Day: "); Serial.print(s.day);
      Serial.print(", Hour: "); Serial.print(s.hour);
      Serial.print(", Minute: "); Serial.print(s.minute);
      Serial.print(", Second: "); Serial.print(s.second);
      Serial.print(", Duration: "); Serial.println(s.wateringDuration);
    }

    Serial.println("------------------------");
    // thêm lịch thì phải set lại con trỏ lịch

  }

  //3.5 nếu là topic 9: set thời gian thực
  //: dữ liệu gửi về là JSON: {year: int, month: int, day: int, hour:int , minute:int , second: int}
  else if(strcmp(topic,topic9) == 0)
  {
    Serial.print("nhan duoc topic9: ");
    Serial.println(msg);

    StaticJsonDocument<100> doc;
    DeserializationError error = deserializeJson(doc, payload, length); // Parse JSON

    if (error) // nếu lỗi
    {
      Serial.print("JSON parsing failed for topic8: ");
      Serial.println(error.c_str());
      return;
    }
    setRealTime((int)doc["year"], (int)doc["month"], (int)doc["day"], (int)doc["hour"], (int)doc["minute"], (int)doc["second"]);
  }

  // 3.6 nếu là topic1: tưới cây khẩn cấp: gửi về là lệnh ON
  else if(strcmp(topic,topic1) == 0)
  {
    if(msg == "ON" || msg == "on" || msg == "On")
    {
      Serial.print("nhan duoc topic1: ");
      Serial.println(msg);
      emergencyPump();// gọi hàm tưới cây khẩn cấp
    }
  }

  // 3.7 nếu là topic10: thay đổi trạng thái tưới cây
  else if(strcmp(topic,topic10) == 0)
  {
    int newStatus = atoi(msg.c_str());
    setStatus(newStatus);
  }

}

// hàm reconnect với hivemq
void reconnectMQTT()
{
  // nếu chưa kết nối thì kiểm tra
  while(!client.connected())
  {
    Serial.println("dang ket noi toi MQTT...");
    reconnectWifi();
  }

  //xong rồi thì đăng nhập ssid, password và đăng ký topic để nhận dữ liệu
  if(client.connect(clientId,mqtt_user,mqtt_pass))
  {
    Serial.println("da ket noi voi hivemq");
    if(client.subscribe(topic1)){Serial.println("Subscribed to topic1 successfully!");}
    if(client.subscribe(topic5)){Serial.println("Subscribed to topic5 successfully!");}
    if(client.subscribe(topic6)){Serial.println("Subscribed to topic6 successfully!");}
    if(client.subscribe(topic7)){Serial.println("Subscribed to topic7 successfully!");}
    if(client.subscribe(topic8)){Serial.println("Subscribed to topic8 successfully!");}
    if(client.subscribe(topic9)){Serial.println("Subscribed to topic9 successfully!");}
    if(client.subscribe(topic10)){Serial.println("Subscribed to topic10 successfully!");}
  }
  else
  {
    Serial.print("ket noi that bai: ");
    Serial.println(client.state());// lấy ra mã lỗi;
    delay(1000); // chặn luồng để kết nối HiveMQ
  }

}

void setupMQTT()
{
  espClient.setInsecure();// ko kiểm tra chứng chỉ SSL
  client.setServer(mqtt_server, mqtt_port);// chọn server
  client.setCallback([](char* topic, uint8_t* payload, unsigned int length) 
  {
      callback(topic, payload, length);
  });// nhận hàm "callback()" là xử lý callback
  reconnectMQTT();// gọi để đảm bảo kết nối
}








