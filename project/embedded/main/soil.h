#ifndef SOIL_H
#define SOIL_H


/// tham số
#define SOIL_PIN D1 // chân bật tắt
#define SOIL_ANALOG A0 // chân thu giữ liệu

// khai báo hàm, tham số
void initSoil(); // bật cả biến
void endSoil(); // tắt soil
float getSoil();// lấy ra độ ẩm đất

#endif