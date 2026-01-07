#ifndef PUMPCONTROL_H
#define PUMPCONTROL_H
// cấu hình chân pump
#define PUMP D0 // chân điều khiển relay


extern bool pumpStatus;// trạng thái vòi
void initPump(); // khởi tạo
void turnOnPump(); // bật máy bơm thứ 1
void turnOffPump(); // tắt máy bơm

#endif