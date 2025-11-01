#ifndef WATERINGSERVICE_H
#define WATERINGSERVICE_H


extern int vt_lich_crr;// lịch gì đang được set
extern int wateringDuration;// tưới cây bao lâu

// hàm xử lý check lịch tưới cây đã đến chưa nếu tưới theo lịch cá nhân
void setPointerSchedule(); // set con trỏ tưới vị trí lịch thích hợp (để tối ưu hàm so sánh)
bool checkIsTimeSchedule(); // so sánh đã tới lịch chưa

void setStatus(uint8_t new_status); // quản lý trạng thái
extern uint32_t T; // chu kì tưới

// hàm tưới cây khẩn cấp
extern bool PumpEmer; // tưới cây khẩn cấp
void emergencyPump();


#endif