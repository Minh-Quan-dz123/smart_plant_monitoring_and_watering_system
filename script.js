//-- script.js--

// code thêm begin
// 0. kết nối tới server backend đang chạy
const socket = io("http://localhost:3323");


// Phần 1. Cập nhật dữ liệu cảm biến
socket.on('connect', () => {
});

socket.on('mqtt-data', (data) => {
  document.getElementById('tempValue').textContent = `${data.temperature}°C`;
  document.getElementById('humidityValue').textContent = `${data.humidity}%`;
});

function login() {
  window.location.href = 'system-login.html';
}


//Phần 2. Điều khiển máy bơm
function Bat_May_Bom() {
  const button = document.getElementById('An_button');
  const status = document.getElementById('status_bom');

  //button.textContent = 'BẬT'; // Nút luôn hiển thị "BẬT"
  status.textContent = 'BẬT'; // Cập nhật trạng thái
  button.style.backgroundColor = '#45b9c6';
  socket.emit('relay-control', 'ON'); // Chỉ gửi lệnh ON
}


// Phần 3 DANH SACH CAY
let DuLieuCay = [];
let ChonIndexCay = null;
// 3.1 quản lý cây
function MoModalCay() {
  document.getElementById('QuanLyCay').style.display = 'block';
  document.getElementById('ThemCay').style.display = 'block'; // Nếu muốn mở luôn phần thêm cây
  document.getElementById('EditChonCay').style.display = 'none';
}
function DongModalCay() {
  document.getElementById("QuanLyCay").style.display = "none";
}

// 3.2 Cập nhật danh sách cây
function UpdateListCay() {
  const DanhSachCay = document.getElementById('DanhSachCay');
  DanhSachCay.innerHTML = ''; // Xóa danh sách cũ

  DuLieuCay.forEach((plant, index) => {
    const li = document.createElement('li');
    li.textContent = plant.name;
    li.onclick = () => {
      ChonIndexCay = index;
      showEditCayOption(plant.name);
    };
    DanhSachCay.appendChild(li);
  });
}
// 3.3 Lưu tên cây mới
function LuuTenCay() {
  const Tencay = document.getElementById('ThemTenCay');
  const name = Tencay.value.trim();

  if (name === '') {
    alert("Vui lòng nhập tên cây.");
    return;
  }
  DuLieuCay.push({ name }); // Thêm cây mới vào danh sách
  Tencay.value = '';
  UpdateListCay(); // Cập nhật giao diện danh sách
  showThemCay() 
}

function showDanhSachCay() {
  document.getElementById('QuanLyCay').style.display = 'block';
  document.getElementById('ThemCay').style.display = 'none';
  document.getElementById('EditChonCay').style.display = 'none';
  UpdateListCay(); 
  
}

// 3.4 Hàm quay lại màn hình danh sách cây
function HuyThemCay() {
  document.getElementById('ThemTenCay').value = ''; // Xoá ô nhập tên cây
  ChonIndexCay = null; // Bỏ chọn cây
  document.getElementById('ThemCay').style.display = 'block'; // Đảm bảo form thêm cây vẫn hiện nếu cần
  document.getElementById('EditChonCay').style.display = 'none'; // Ẩn khung sửa
  document.getElementById('QuanLyCay').style.display = 'none'; // Quay về màn hình chính
}


// 3.5 Hàm mở phần chỉnh sửa cây
function showEditCayOption(plantName) {
  document.getElementById('EditChonCay').style.display = 'block';
  document.getElementById('ChonTenCay').textContent = "Cây đã chọn: " + plantName;
  document.getElementById('ThemCay').style.display = 'none';
  
  let editButton = document.getElementById('editButtonCay');
  let editNameInput = document.querySelector('#EditChonCay input');

    // Nếu có ô chỉnh sửa cũ, xóa nó đi
  if (editButton) {
    editButton.remove();
  }

  if (editNameInput) {
    editNameInput.remove();
  }

  // Tạo ô nhập tên mới để chỉnh sửa
  const ThemTenMoi = document.createElement('input');
  ThemTenMoi.value = plantName;
  document.getElementById('EditChonCay').appendChild(ThemTenMoi);

  // Tạo nút "Lưu chỉnh sửa"
  editButton = document.createElement('button');
  editButton.textContent = "Lưu";
  editButton.id = 'editButtonCay'; // Gán id để tránh tạo lại
  editButton.onclick = LuuEditCay;
  document.getElementById('EditChonCay').appendChild(editButton);
}

// 3.6 Hàm lưu tên cây đã chỉnh sửa
function LuuEditCay() {
  const ThemTenMoi = document.querySelector('#EditChonCay input');
  const TenMoi = ThemTenMoi.value.trim();
  
  if (TenMoi === '') {
    alert("Tên cây không thể để trống.");
    return;
  }

  // Cập nhật tên cây đã chọn
  DuLieuCay[ChonIndexCay].name = TenMoi;
  UpdateListCay();
  showDanhSachCay() 
  // Xóa nút "Lưu chỉnh sửa" nếu đã lưu
  const editButton = document.getElementById('editButtonCay');
  if (editButton) {
    editButton.remove();
  }
}

// 3.7 Xóa cây được chọn
function XoaCayDaChon() {
  if (ChonIndexCay !== null) {
    DuLieuCay.splice(ChonIndexCay, 1);
    ChonIndexCay = null;
    document.getElementById('EditChonCay').style.display = 'none';
    document.getElementById('ThemTenCay').value = '';
    UpdateListCay();
  }
}


// Phần 4 thời gian tưới cây

// Mở modal nhập chu kỳ
function MoChuKy() {
  document.getElementById("ModalChuky").style.display = "block";
}

// Đóng modal
function DongModal() {
  document.getElementById("ModalChuky").style.display = "none";
}

// Nút đóng riêng (cùng chức năng)
function DongChuKy() {
  DongModal();
}

// 4.1 lưu thời gian tưới cây
function LuuChuKy() {
  const chuKyInput = document.getElementById("InputChuky").value;
  const chuKyValue = parseInt(chuKyInput);

  if (!isNaN(chuKyValue) && chuKyValue > 0) {
    // Hiển thị lên giao diện
    document.getElementById("DanhsachChuKy").textContent = `${chuKyValue}`;

    // Gửi về backend (ESP8266 hoặc NodeJS)
    socket.emit("set_wateringtime", chuKyValue);
    //console.log("Đã gửi chu kỳ tưới:", chuKyValue);

    // Đóng modal và xóa input
    DongModal();
    document.getElementById("InputChuky").value = "";
  } else {
    alert("Vui lòng nhập một số nguyên dương!");
  }
}

// 4.2 lấy giá trị thời gian tưới cây từ esp8266
document.addEventListener("DOMContentLoaded", () => {
  socket.emit("request_watering_cycle");
});

// Nhận thời gian tiếu cây từ backend và cập nhật giao diện
socket.on("get_watering_cycle", (chuKyValue) => {
  if (!isNaN(chuKyValue) && chuKyValue > 0) {
    document.getElementById("DanhsachChuKy").textContent = `${chuKyValue}`;
  }
});


// Phần 5 cập nhật thời gian

// 5.1 hàm lấy thời gian và hiển thị trên màn hình
function updateTime() {
  const now = new Date();
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const dayOfWeek = days[now.getDay()];

  const timeString = `${dayOfWeek}, ${hours}:${minutes}:${seconds}`;
  document.getElementById("timeDisplay").innerText = timeString;
}

// 5.2 Cập nhật mỗi giây
setInterval(updateTime, 1000);
updateTime(); // chạy lần đầu khi tải trang



// Phần 6 quản lý lịch tưới cây của user
let LichTuois = []; // Mảng lưu các lịch tưới cây

// 6.1 Khi trang web load, yêu cầu backend gửi lại lịch tưới từ database
window.addEventListener('load', () => {
  socket.emit('request_schedule_upload'); //Yêu cầu lịch từ backend
});

// 6.1.1 Lắng nghe dữ liệu từ backend qua sự kiện upload_schedule
socket.on("upload_schedule", function (scheduleList) {
  LichTuois = scheduleList.map((schedule) => ({
    day: getDayName(schedule.weekday).dayName, // tên "chủ nhật","thứ 2,.."
    dayIndex: schedule.weekday,// chỉ số 0,1,2.. <=> chủ nhật, thứ 2,..
    hour: schedule.hour,
    minute: schedule.minute,
    second: schedule.second,

    //biến dùng để sắp xếp thôi
    timestamp: new Date(2025, 0, 1, schedule.hour, schedule.minute, schedule.second).getTime(),
  }));

  // 6.1.2 Sắp xếp theo thứ tự: chủ nhật, thứ 2 -> thứ 7, sau đó theo giờ, phút, giây
  LichTuois.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex; // So sánh thứ tự ngày (thứ 2 đến Chủ Nhật)
    return a.timestamp - b.timestamp; // Nếu ngày giống nhau, so sánh theo giờ, phút, giây
  });

  // 6.1.3 tính giá trị order (vị trí của các lịch)
  LichTuois.forEach((schedule, index) => { 
    schedule.order = index;// luôn bắt đầu từ chỉ số 0
  });

  updateLichTuoiList(); // ✅ Cập nhật UI
});

// 6.2 Chuyển đổi số thứ thành tên ngày và chỉ số
function getDayName(index) {
  const days = ["Chủ Nhật","Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return { dayName: days[index], dayIndex: index }; // Trả về cả tên ngày và chỉ số ngày
}

// Mở modal các tùy chọn
function openLichTuoiOptions() {
  document.getElementById("LichTuoiOptionsModal").style.display = "block";
}

function dongLichTuoiOptionsModal() {
  document.getElementById("LichTuoiOptionsModal").style.display = "none";
}

// Mở modal thêm lịch
function openAddLichTuoiModal() {
  document.getElementById("LichTuoiModal").style.display = "block";
  dongLichTuoiOptionsModal();
}

function cancelLichTuoi() {
  document.getElementById("LichTuoiModal").style.display = "none"; // Đóng modal khi hủy
}

// 6.3 Thêm lịch mới từ user
document.getElementById("LichTuoiForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // 6.3.1 lấy dữ liệu người dùng
  const time = document.getElementById("wateringTime").value; // ví dụ 03:34 (giờ phút)
  const selectedDay = document.querySelector('input[name="day"]:checked')?.value; //(thứ)
  const secondsInput = document.getElementById("wateringSecond").value; // giây thứ

  // phải nhập đầy đủ thông tin
  if (time && selectedDay && secondsInput !== "") {
    const [hours, minutes] = time.split(":");
    const seconds = parseInt(secondsInput);
    const now = new Date();

    // Bản đồ chỉ số ngày theo chuẩn JavaScript
    const daysMap = {
      "Sun": 0,
      "Mon": 1,
      "Tue": 2,
      "Wed": 3,
      "Thu": 4,
      "Fri": 5,
      "Sat": 6
    };

    const dayIndex = daysMap[selectedDay];

    if (dayIndex !== undefined) {

      // kiểm tra trùng lịch
      const isDuplicate = LichTuois.some(schedule =>
        schedule.dayIndex === dayIndex &&
        schedule.hour === parseInt(hours) &&
        schedule.minute === parseInt(minutes) &&
        schedule.second === seconds
      );

      if (isDuplicate) { // thông báo
        alert("Lịch tưới này đã tồn tại! Vui lòng chọn thời gian hoặc ngày khác.");
        return; // Dừng xử lý nếu lịch trùng
      }

      // ko trùng lịch thì tiếp tục
      const schedule = {
        day: getDayName(dayIndex).dayName, // Tên ngày (ví dụ: "Thứ 2")
        dayIndex: dayIndex,
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: seconds,

        // dùng để sắp xếp thời gian theo giờ (coi các chỉ số còn lại là bằng nhau)
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds).getTime()
      };

      // 6.3.2 Thêm và sắp xếp lịch
      LichTuois.push(schedule);
      LichTuois.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex; // ngày bằng thì sắp xếp theo giờ,phút,giây
        return a.timestamp - b.timestamp;
      });

      // Tính lại order cho tất cả lịch
      LichTuois.forEach((sched, index) => {
        sched.order = index;
      });

      // Lấy order của lịch mới
      const newScheduleOrder = LichTuois.indexOf(schedule);

      // cập nhật giao diện
      updateLichTuoiList();
      cancelLichTuoi(); // Đóng modal

      // 6.3.3 Gửi lịch mới đến backend
      socket.emit("add_schedule", {
        weekday: dayIndex,
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: seconds,
        order: newScheduleOrder
      });
    } 
    else {
      alert("Vui lòng chọn ngày hợp lệ.");
    }
  } 
  else {
    alert("Vui lòng nhập đầy đủ giờ, phút, giây và chọn ngày.");
  }
});

// Hàm trả về tên ngày (có thể tùy biến)
function getDayName(index) {
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return {
    dayName: dayNames[index]
  };
}

// 6.4 Hiển thị danh sách lịch tưới cây với giờ AM/PM
function updateLichTuoiList() {
  const scheduleListDiv = document.getElementById("scheduleList");
  scheduleListDiv.innerHTML = ""; // Xóa nội dung cũ

  // 6.4.1 Nếu không có lịch, hiển thị thông báo
  if (LichTuois.length === 0) {
    scheduleListDiv.innerHTML = "Chưa có lịch tưới cây."; 
  } 
  else {
    LichTuois.forEach((schedule, index) => {
      const scheduleDiv = document.createElement("div");

      const hour = convertTo12HourFormat(schedule.hour); // Chuyển đổi giờ sang định dạng AM/PM
      const minute = schedule.minute.toString().padStart(2, '0');
      const second = (schedule.second || 0).toString().padStart(2, '0');
      const amPm = hour.amPm;

      scheduleDiv.innerHTML = `
        ${index + 1} | ${schedule.day} ${hour.hour}:${minute}:${second} ${amPm}
        <button onclick="deleteSchedule(${index})">🗑️ Xóa</button>
      `;

      scheduleListDiv.appendChild(scheduleDiv); // Thêm vào UI
    });
  }
}

//6.5 Chuyển đổi giờ sang định dạng 12 giờ (AM/PM)
function convertTo12HourFormat(hour) {
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Chuyển đổi giờ 24h sang 12h
  return { hour: hour12.toString().padStart(2, '0'), amPm };
}

// 6.7 Xóa lịch từ user
//6.7.1 Xoá 1 lịch
function deleteSchedule(index) {
  const schedule = LichTuois[index]; // Lấy lịch cần xóa
  LichTuois.splice(index, 1);
  LichTuois.forEach((schedule, i) => {
    schedule.order = i;
  });

  updateLichTuoiList();


  // 6.7.2 sau khi xóa thì gửi tới backend
  socket.emit("delete_schedule", {
    weekday: schedule.dayIndex,
    hour: schedule.hour,
    minute: schedule.minute,
    second: schedule.second,
    order: schedule.order 
  });
}

//6.7.3 Xoá hết lịch
function xoaTatCaLichTuoi() {
  if (confirm("Bạn có chắc chắn muốn xoá tất cả lịch tưới không?")) {
    LichTuois = [];
    updateLichTuoiList();

    //Gửi yêu cầu xoá toàn bộ tới backend
    socket.emit("delete_all_schedules");

    //console.log("Đã gửi yêu cầu xóa toàn bộ lịch tới backend");
  }
}



// Xem danh sách lịch
function openLichTuoiListModal() {
  document.getElementById("LichTuoiListModal").style.display = "block";
  updateLichTuoiList(); // Cập nhật danh sách khi mở modal
}

function dongLichTuoiListModal() {
  document.getElementById("LichTuoiListModal").style.display = "none";
}


// Phần 7 ĐỘ CHỊU KHÁT của cây
function openDoChiuKhatModal() {
  document.getElementById("DoChiuKhatModal").style.display = "block";
}
function DongDoChiuKhat() {
  // Ẩn modal khi nhấn "Hủy"
  document.getElementById("DoChiuKhatModal").style.display = "none";
}

// 7.1 hàm lưu giá trị sau khi user nhập
function saveDoChiuKhat() {
  const DoChiuKhatInput = document.getElementById("DoChiuKhatInput").value;
  const DoChiuKhatValue = parseInt(DoChiuKhatInput);

  if (!isNaN(DoChiuKhatValue) && DoChiuKhatValue > 9) {
    document.getElementById("waterValue").textContent = `${DoChiuKhatValue}đ`; // Cập nhật giá trị trên giao diện

    socket.emit("set_water_limit", DoChiuKhatValue); // Gửi giá trị tới backend qua Socket.IO
    console.log("Sent water limit value to backend:", DoChiuKhatValue);
    // Đóng modal
    document.getElementById("DoChiuKhatModal").style.display = "none";
  } 
  else {
    alert("Vui lòng nhập một số nguyên dương lớn hơn 10!");
  }

  // Xóa ô nhập
  document.getElementById("DoChiuKhatInput").value = "";
}


// 7.2 lấy giá trị ĐỘ CHỊU KHÁT từ esp8266
document.addEventListener("DOMContentLoaded", () => {
  socket.emit("request_water_limit"); // Gửi yêu cầu tới backend
});

// Lắng nghe giá trị từ backend
socket.on("get_water_limit", (DoChiuKhatValue) => {
  if (DoChiuKhatValue !== null && !isNaN(DoChiuKhatValue)) {
    document.getElementById("waterValue").textContent = `${DoChiuKhatValue}đ`; // Cập nhật giao diện
  } 
});


function toggleTooltip() {
  const tooltip = document.getElementById("tooltipText");
  tooltip.classList.toggle("show");
}



// 8 Mở modal từ điển tưới cây cây
// mở modal từ điển cây
function openthuvienModal() { 
  document.getElementById('thuvienModal').style.display = 'block';
}

// Hàm đóng modal từ điển tưới cây
function dongthuvienModal() {
  document.getElementById('thuvienModal').style.display = 'none';
}

// 8.1 Lắng nghe sự kiện nhập từ người dùng để tìm kiếm cây
document.getElementById('plantSearch').addEventListener('input', function () {
  const query = this.value;
  
  // Gửi sự kiện 'search' đến backend khi người dùng nhập vào ô tìm kiếm
  socket.emit('search', query);
});

// 8.2 Lắng nghe sự kiện 'plantsData' từ backend để hiển thị kết quả tìm kiếm
socket.on('plantsData', (plants) => {
  const suggestions = document.getElementById('suggestions');
  const plantInfo = document.getElementById('plantInfo');

  // Làm sạch các gợi ý và thông tin cây trước
  suggestions.innerHTML = '';
  plantInfo.innerHTML = '';

  if (plants.length > 0) {
    plants.forEach(plant => {
      const li = document.createElement('li');
      li.textContent = plant.name;
      li.onclick = function () {
        // Hiển thị thông tin cây khi nhấp vào tên cây
        plantInfo.innerHTML = `<strong>${plant.name}</strong>: ${plant.info}`;
        suggestions.innerHTML = ''; // Xóa gợi ý sau khi chọn cây
      };
      suggestions.appendChild(li);
    });
  } 
  else {
    suggestions.innerHTML = '<li>Không tìm thấy cây.</li>';
  }
});