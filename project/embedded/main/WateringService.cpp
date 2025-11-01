#include "WateringService.h"

// controller -> schedule
#include "scheduleControl.h"

#include "cycleControl.h"

#include "DS3231Control.h"

// tìm tới lịch hiện tại đang cần set
// lấy vector<Schedule> schedules ra để check
int vt_lich_crr = 0;
int wateringDuration = 0;
int sizeVT = schedules.size();


// cài đặt vị trí con trỏ trỏ vào lịch đang so sánh
void setPointerSchedule()
{
  if(sizeVT == 0) return;
  vt_lich_crr = 0; 
  Schedule s = schedules[vt_lich_crr];
  while(isTimeReached(s.day, s.hour, s.minute, s.second) >= 0)// nếu đã qua giờ thì tìm tiếp
  {
    vt_lich_crr++;
    if(vt_lich_crr == sizeVT) return;
  }
  s = schedules[vt_lich_crr];

}

// check xem đã đến lịch tưới cây hiện tại chưa
bool checkIsTimeSchedule()
{
  if(vt_lich_crr >= sizeVT) return false;// đã duyệt hết lịch

  Schedule s = schedules[vt_lich_crr];
  if(isTimeReached(s.day, s.hour, s.minute, s.second) >= 0)// nếu đến giờ
  {
    vt_lich_crr++;
    wateringDuration = s.wateringDuration;
    return true;
  }

  return false;
}


// cài đặt trang thái tưới cây
uint32_t T = 1000;
uint32_t T_copy = 1000;
void setStatus(uint8_t new_status)
{
  status = new_status;
  if(status == 1)
  {
    setPointerSchedule();
  }
  else if(status == 2)// tưới cây theo chu kì cố định
  {
    wateringDuration = wateringDurationFixedCycle;
    T = fixed_cycle;
    T_copy = T;
  }
  else if(status == 3)
  {
    wateringDuration = wateringDurationBioCycle;
    T = biological_cycle;
    T_copy = T;
  }
  saveCycle();
}

// cập nhật FixedCycle
void updateFCycle(uint32_t newFcycle, uint16_t newDuratime)
{
  fixed_cycle = newFcycle;
  wateringDurationFixedCycle = newDuratime;
  setStatus(status);
}

// cập nhật BioCycle
void updateBCycle(uint32_t newBcycle, uint16_t newDuratime)
{
  biological_cycle = newBcycle;
  wateringDurationBioCycle = newDuratime;
  setStatus(status);
}


// thay đổi trạng thái tưới cây khẩn cấp thành true
bool PumpEmer = false;
void emergencyPump()
{
  PumpEmer = true;
}
