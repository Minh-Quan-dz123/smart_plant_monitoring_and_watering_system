#include "ConnectHiveMQ.h"

#include "wifiControl.h"

// controller
#include "DHT11Control.h"
#include "soil.h"

#include "scheduleControl.h"
#include "cycleControl.h"

#include "DS3231Control.h"

#include "PumpControl.h"

#include "WateringService.h"


const char* mqtt_server ="8c8b67f172b549eba06b16f265f2f580.s1.eu.hivemq.cloud";
const uint16_t mqtt_port = 8883; // tên port
const char* mqtt_user = "MinhQuan5386";
const char* mqtt_pass = "ABC";
const char* esp_id = "0001"; // id của esp


char topic1[64]; // conditions
char topic2[64]; //"logs"; ghi log dữ liệu: pushlish
char topic3[64]; //"garden"; // subcribe: khởi tạo/tắt bộ cảm biến của garden
char topic4[64]; //"pump"; // subcribe: tưới ngay
char topic5[64]; //"bioCycle"; // subcribe: tưới theo chu kì sinh học
char topic6[64];//"selects"; // subcribe: chọn chế độ tưới
char topic7[64];//"Schedules"; // / thêm  sub
char topic8[64];//"Schedules"; // / xóa sub
char topic9[64]; //"connect";// cmd subcribe
char topic10[64]; // "connect"; /reponse publish
char topic11[64]; // "setRealTime"; sub

WiFiClientSecure espClient;
MqttClient client(espClient);

// 1 gửi conditions
void sendDataToHiveMQ(float temp, float hum, float soil)
{
  // tạo json 
  char condition[60];
  sprintf(condition, "{\"temp\": %.2f, \"hum\": %.2f, \"soil\": %.2f}", temp, hum, soil);

  client.beginMessage(topic1, false, 1);  // bắt đầu gửi
  client.print(condition);      // gửi payload
  client.endMessage();          // kết thúc gửi

  Serial.print("Da gui topic ");
  Serial.print(topic1);
  Serial.print(": ");
  Serial.println(condition);
}

// 2 gửi log
void writeLog(uint8_t year, uint8_t month, uint8_t day, uint8_t hour, uint8_t minute, uint8_t second, uint8_t time)
{
  // tạo json
  char log[128];
  sprintf(log,
          "{\"year\":%u,\"month\":%u,\"day\":%u,"
          "\"hour\":%u,\"minute\":%u,\"second\":%u,\"time\":%u}",
          year, month, day, hour, minute, second, time);
  
  client.beginMessage(topic2,false,2);  // bắt đầu gửi
  client.print(log);      // gửi payload
  client.endMessage();          // kết thúc gửi

  Serial.print("Da gui topic ");
  Serial.print(topic2);
  Serial.print(": ");
  Serial.println(log);

}


// 3 callback: được gọi khi nó nhận được 1 tin từ HiveMQ
void callback(int messageSize)
{
  // 1 đọc mess
  String topic = client.messageTopic();
  String msg = "";
  while(client.available()) {msg += (char)client.read();}
  msg.trim(); // cắt đoạn trắng đầu  cuối của string
  Serial.print("nhan duoc topic "); 
  Serial.print(topic); 
  Serial.print(": "); 
  Serial.println(msg);

  //3 tiến hành kiểm tra
  //3.1 nếu là topic 3: garden/esp_id - tạo garden
  if(topic.equals(topic3))
  {
    if(msg.equalsIgnoreCase("ON"))
    {
      initSoil(); // 1 bật soil
      loadEEPROM(); // 2 load để đặt flag lại cho eeprom
      Serial.println("da khoi tao esp");
    }
    else if(msg.equalsIgnoreCase("OFF"))
    {
      // tắt dht11, soil, xóa LittleFS
      deleteSchedule(-1);// 1 xóa littleFS
      clearEEPROM();// 2 xóa eeprom
      status = 0; // 3 tắt tất cả trạng thái
      endSoil(); // 4 tắt soil
      Serial.println("da xoa du lieu");
    }
  }

  //3.2 nếu là topic 4: pump/thời gian tưới: tưới ngay
  else if(topic.equals(topic4))
  {
    // gán thời gian tưới
    status = 3;
    wateringDuration = msg.toInt();
  }

  //3.3 nếu là topic 5: bioCycle, time
  else if(topic.equals(topic5))
  {
    Serial.println(" => nhan duoc topic5: ");
    // chuỗi gửi về là chuỗi JSON dạng: {bioCycle:  , time: }
    StaticJsonDocument<50> doc; // tạo object json dài 50 byte để đọc dữ liệu
    DeserializationError error = deserializeJson(doc, msg);
    if(error) // kiểm tra có phải dưới JSON không
    {
      Serial.print("loi json: ");
      Serial.println(error.c_str());
      return;
    }
    setBioCycle((uint32_t)doc["bioCycle"], (uint16_t)doc["time"]);

  }

  // topic 6 - selects
  else if(topic.equals(topic6))
  {
    uint8_t newStatus = msg.toInt();
    managerStatus(newStatus);

    Serial.println(" => nhan duoc topic6: ");
  }

  // topic 7 schedue add
  else if(topic.equals(topic7))
  {
    Serial.println(" => nhan duoc topic7: ");
    StaticJsonDocument<256> doc; // tạo object json dài 256 byte để đọc dữ liệu
    DeserializationError error = deserializeJson(doc, msg);
    if(error) // kiểm tra có phải dưới JSON không
    {
      Serial.print("loi json: ");
      Serial.println(error.c_str());
      return;
    }
    uint8_t index = doc["index"];
    Schedule x;
    x.year =  doc["year"];
    x.month = doc["month"];
    x.day = doc["day"];
    x.hour = doc["hour"];
    x.minute = doc["minute"];
    x.second = doc["second"];
    x.wateringDuration = doc["time"];
    addSchedule(index, x);
  }

  // topic 8 schedue delete
  else if(topic.equals(topic8))
  {
    Serial.println(" => nhan duoc topic8: ");
    int8_t index = msg.toInt();
    deleteSchedule(index);
  }

  // topic 9 connect cmd
  else if(topic.equals(topic9))
  {
    Serial.println(" => topic 9");
    client.beginMessage(topic10);  // bắt đầu gửi
    client.print("on");      // gửi payload
    client.endMessage();          // kết thúc gửi

    Serial.print("Da gui topic ");
    Serial.print(topic10);
    Serial.print(": ");
    Serial.println("on");
  }
  // topic 10 connect response

  // topic 11 realtime
  else if(topic.equals(topic11))
  {
    Serial.println(" => nhan duoc topic11: ");
    StaticJsonDocument<256> doc; // tạo object json dài 200 byte để đọc dữ liệu
    DeserializationError error = deserializeJson(doc, msg);
    if(error) // kiểm tra có phải dưới JSON không
    {
      Serial.print("loi json: ");
      Serial.println(error.c_str());
      return;
    }
    setRealTime((uint16_t)doc["year"], (uint8_t)doc["month"], (uint8_t)doc["day"], (uint8_t)doc["hour"], (uint8_t)doc["minute"], (uint8_t)doc["second"]);
  }
}

// 4 hàm reconnect với hivemq
void reconnectMQTT()
{
  // nếu chưa kết nối thì kiểm tra
  while(!client.connected())
  {
    Serial.println("dang ket noi toi HiveMQ...");
    reconnectWifi();

    espClient.setInsecure();// ko kiểm tra chứng chỉ SSL
    client.setId(esp_id);
    client.setUsernamePassword(mqtt_user, mqtt_pass);

    // thiết lập will
    client.beginWill(topic10, false, 1);
    client.print("off");
    client.endWill();

  
    //xong rồi kết nối tới server 
    if(client.connect(mqtt_server, mqtt_port))
    {
      Serial.println("da ket noi voi hivemq");
      client.onMessage(callback);// gán callback
      
      // Subscribe tất cả topic
      const char* topics[] = {topic3, topic4, topic5, topic6, topic7, topic8, topic9, topic11};
      for(int i=0; i<8; i++)
      {
        if(client.subscribe(topics[i]), 2)
        {
          Serial.print("Subscribed: "); Serial.println(topics[i]);
        } 
        else 
        {
          Serial.print("Subscribe failed: "); Serial.println(topics[i]);
        }
      }
    }
    else
    {
      Serial.print("ket noi that bai: ");
      Serial.println(client.connectError());// lấy ra mã lỗi;
      delay(800); // chặn luồng để kết nối HiveMQ
    }
    
  }
}


// 5 hàm khởi tạo
void setupMQTT()
{
  // gán các topic
  sprintf(topic1, "conditions/%s", esp_id);
  sprintf(topic2, "logs/%s", esp_id);
  sprintf(topic3, "garden/%s",esp_id);
  sprintf(topic4, "pump/%s", esp_id);
  sprintf(topic5, "bioCycle/%s", esp_id);
  sprintf(topic6, "selects/%s", esp_id);
  sprintf(topic7, "schedules/%s/add", esp_id);
  sprintf(topic8, "schedules/%s/delete", esp_id);
  sprintf(topic9, "connect/%s/cmd", esp_id);
  sprintf(topic10, "connect/%s/response", esp_id);
  sprintf(topic11, "setRealTime/%s", esp_id);

  reconnectMQTT();// gọi để đảm bảo kết nối
}








