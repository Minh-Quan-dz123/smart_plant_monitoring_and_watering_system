<<<<<<< HEAD
//-- script.js--
// 0. kết nối tới server backend đang chạy
const socket = io("http://localhost:3000");
const BASE_API_URL = "http://localhost:3000"; 
let ChonGardenId = null;
let LichTuois = [];
let allPlantsCache = []; 
// --- 1. KIỂM TRA ĐĂNG NHẬP & LẤY HEADERS ---
function checkAuth() {
  const token = localStorage.getItem("userToken");
  // Nếu không có token, đá về trang đăng nhập ngay lập tức
  if (!token) {
    alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    window.location.href = 'index.html'; 
  }
}

checkAuth();

// Hàm lấy Headers chứa Token 
function getAuthHeaders() {
  const token = localStorage.getItem("userToken");
  if (!token) {
    // Nếu đang dùng mà mất token -> logout
    logout();
    return {}; 
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` 
  };
}

// LOGIC XÁC THỰC VÀ BẢO VỆ TUYẾN ĐƯỜNG
function checkAuthAndRedirect() {
    const token = localStorage.getItem("userToken");
    if (!token) {
        //window.location.href = 'index.html'; 
    }
}


// Hàm Đăng Xuất
function logout() {
  // 1. Xóa token
  localStorage.removeItem("userToken"); 
  alert("Bạn đã đăng xuất thành công.");
  window.location.href = 'index.html'; 
}


// LOGIC API GARDEN
// --- CẬP NHẬT TRONG script.js ---
// 1. POST /garden: Tạo vườn mới 
async function createGardenAPI(name, plantId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        name: name,
        plantId: plantId 
      }), 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Tạo vườn thất bại.");
    }
    return await response.json(); // Trả về object garden có chứa ID
  } catch (error) {
    console.error("Lỗi tạo vườn:", error);
    throw error;
  }
}
async function getAllGardens() {
  try {
    const response = await fetch(`${BASE_API_URL}/garden`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải danh sách vườn.");
    }
    return await response.json(); // Trả về mảng các vườn
  } catch (error) {
    console.error("Lỗi lấy danh sách vườn:", error);
    throw error;
  }
}

// 2. GET /garden/{id}: Lấy thông tin chi tiết của một vườn cụ thể
async function getGardenById(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không tìm thấy vườn.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi lấy chi tiết vườn:", error);
    throw error;
  }
}
// 2. PATCH /garden/{id}/esp-device: Kết nối thiết bị ESP (MỚI)
async function connectEspDeviceAPI(gardenId, espId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}/esp-device`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ espId: espId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi kết nối thiết bị ESP.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi kết nối ESP:", error);
    throw error;
  }
}

// 3. DELETE /garden/{id}: Xóa vườn
async function deleteGardenAPI(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Xóa vườn thất bại.");
    return true;
  } catch (error) {
    console.error("Lỗi xóa vườn:", error);
    throw error;
  }
}
// 3. DELETE /garden/{id}: Xóa Vườn (Xóa Cây)
async function deleteGarden(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xóa vườn thất bại.");
    }
    return true; 
  } catch (error) {
    console.error("Lỗi xóa vườn:", error);
    throw error;
  }
}




// --- 1. CÁC HÀM GỌI API (API WRAPPERS) ---

// API: Bắt đầu tưới (POST /irrigation/{id}/start)
async function startIrrigationAPI(gardenId) {
    try {
        // Body yêu cầu duration (mặc định 60s nếu không nhập)
        const bodyData = { duration: 60 }; 
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/start`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Lỗi bật bơm.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API: Dừng tưới (POST /irrigation/{id}/stop)
async function stopIrrigationAPI(gardenId) {
    try {
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/stop`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Lỗi dừng bơm.");
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API: Cập nhật chế độ tưới (PATCH /irrigation/{id}/mode)
async function setIrrigationModeAPI(gardenId, mode) {
    try {
        // Payload chuẩn: { "irrigationMode": "..." }
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/mode`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ irrigationMode: mode }) 
        });
        if (!response.ok) throw new Error("Lỗi chỉnh chế độ.");
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API TỔNG HỢP: Lấy chế độ & Trạng thái bơm hiện tại
// (Kết hợp 2 API: GET /mode và GET /pump-status)
async function getIrrigationStatusAPI(gardenId) {
    try {
        const [resMode, resPump] = await Promise.all([
            fetch(`${BASE_API_URL}/irrigation/${gardenId}/mode`, { headers: getAuthHeaders() }),
            fetch(`${BASE_API_URL}/irrigation/${gardenId}/pump-status`, { headers: getAuthHeaders() })
        ]);

        const dataMode = resMode.ok ? await resMode.json() : { irrigationMode: "off" };
        const dataPump = resPump.ok ? await resPump.json() : { status: "off" };

        return {
            mode: dataMode.irrigationMode || "off",
            pumpStatus: dataPump.status || "off" // Status trả về từ API pump-status
        };
    } catch (error) {
        console.error("Lỗi lấy trạng thái:", error);
        return null;
    }
}

// --- 2. LOGIC GIAO DIỆN (UI HANDLERS) ---

// Biến lưu trạng thái bơm tạm thời
let isPumpOn = false; 

// Xử lý nút BẬT/TẮT Bơm
async function TogglePump() {
    if (!ChonGardenId) return alert("⚠️ Vui lòng chọn một vườn trước!");

    const btn = document.getElementById('An_button');
    const originalText = btn.textContent;
    btn.disabled = true; 
    btn.textContent = "⏳...";

    try {
        if (isPumpOn) {
            // Đang BẬT -> Gọi lệnh TẮT
            await stopIrrigationAPI(ChonGardenId);
            alert("✅ Đã tắt bơm.");
            isPumpOn = false;
        } else {
            // Đang TẮT -> Gọi lệnh BẬT
            await startIrrigationAPI(ChonGardenId);
            alert("✅ Đã bật bơm.");
            isPumpOn = true;
        }
        updatePumpButtonUI();
    } catch (e) {
        alert("❌ Lỗi: " + e.message);
        // Nếu lỗi, tải lại trạng thái thật từ server để đồng bộ
        syncSystemStatus();
    } finally {
        btn.disabled = false;
        if(btn.textContent === "⏳...") btn.textContent = originalText;
    }
}

// Cập nhật giao diện nút Bơm
function updatePumpButtonUI() {
    const btn = document.getElementById('An_button');
    const statusText = document.getElementById('status_bom');
    
    if (isPumpOn) {
        btn.textContent = "TẮT BƠM";
        btn.style.backgroundColor = "#e74c3c"; // Đỏ
        statusText.textContent = "ĐANG CHẠY 🌊";
        statusText.style.color = "#27ae60";
    } else {
        btn.textContent = "BẬT BƠM";
        btn.style.backgroundColor = "#45b9c6"; // Xanh
        statusText.textContent = "ĐANG TẮT 💤";
        statusText.style.color = "#7f8c8d";
    }
}

// Hàm đồng bộ trạng thái từ Server về UI (Gọi khi chọn vườn hoặc sau khi lỗi)
async function syncSystemStatus() {
    if(!ChonGardenId) return;
    
    const status = await getIrrigationStatusAPI(ChonGardenId);
    if (status) {
        // 1. Cập nhật Bơm
        isPumpOn = (status.pumpStatus === "on" || status.pumpStatus === "running");
        updatePumpButtonUI();

        // 2. Cập nhật Chế độ
        const mode = status.mode.toLowerCase();
        const validModes = ['auto', 'manual', 'schedule', 'off'];
        const finalMode = validModes.includes(mode) ? mode : 'off';
        
        document.getElementById('currentModeDisplay').textContent = finalMode.toUpperCase();
        document.getElementById('irrigationModeSelect').value = finalMode;
    }
}

// --- GIỮ NGUYÊN SOCKET IO ĐỂ CẬP NHẬT REALTIME ---
socket.on('mqtt-data', (data) => {
    updateSensorUI(data);
});
// Hàm xử lý khi người dùng thay đổi chế độ trong dropdown
async function handleModeChange() {
    // 1. Kiểm tra xem đã chọn vườn chưa
    if (!ChonGardenId) {
        alert("⚠️ Vui lòng chọn một Vườn/Cây trong 'Vườn của tôi' trước!");
        document.getElementById('irrigationModeSelect').value = ''; 
        return;
    }

    const modeSelect = document.getElementById('irrigationModeSelect');
    const newMode = modeSelect.value;
    const currentDisplay = document.getElementById('currentModeDisplay');

    if (newMode) {
        try {
            // SỬA TẠI ĐÂY: Gọi đúng tên hàm setIrrigationModeAPI đã khai báo ở trên
            await setIrrigationModeAPI(ChonGardenId, newMode);
            
            // Cập nhật giao diện hiển thị
            currentDisplay.textContent = newMode.toUpperCase();
            alert(`✅ Đã chuyển chế độ tưới sang: ${newMode.toUpperCase()}`);
            
            // Nếu là chế độ thủ công (manual), đồng bộ trạng thái bơm ngay
            if (newMode === 'manual') {
                await syncSystemStatus();
            }
        } catch (error) {
            alert(`❌ Lỗi cập nhật chế độ: ${error.message}`);
            // Quay lại trạng thái hiển thị cũ nếu lỗi
            syncSystemStatus(); 
        }
    }
}

// script.js (Phần 3.5)

// Hàm hiển thị thông tin khi chọn Vườn
async function showEditCayOption(plantName, gardenId) {
    // 1. Cập nhật tiêu đề Dashboard
    const dashboardTitle = document.querySelector('.right h1');
    if(dashboardTitle) dashboardTitle.textContent = `Vườn: ${plantName}`;

    const tenCayDiv = document.getElementById('ChonTenCay'); // Nếu bạn có thẻ này
    if(tenCayDiv) tenCayDiv.textContent = `Đang chọn: ${plantName}`;

    console.log(`Đang tải dữ liệu cho vườn ID: ${gardenId}...`);

    // 2. QUAN TRỌNG: Đồng bộ trạng thái Bơm & Chế độ ngay lập tức
    await syncSystemStatus(); 

    // 3. Lấy dữ liệu Cảm biến
    const sensorData = await getLatestSensorAPI(gardenId);
    if (sensorData) {
        updateSensorUI(sensorData);
    } else {
        updateSensorUI({ temperature: '--', airHumidity: '--', soilMoisture: '--' });
    }
}
// Phần 1. Cập nhật dữ liệu cảm biến
socket.on('connect', () => {
});


function login() {
  window.location.href = 'system-login.html';
}


//Phần 2. Điều khiển máy bơm
// function Bat_May_Bom() {
//   const button = document.getElementById('An_button');
//   const status = document.getElementById('status_bom');

//   //button.textContent = 'BẬT'; // Nút luôn hiển thị "BẬT"
//   status.textContent = 'BẬT'; // Cập nhật trạng thái
//   button.style.backgroundColor = '#45b9c6';
//   socket.emit('relay-control', 'ON'); // Chỉ gửi lệnh ON
// }


// PHẦN 3: QUẢN LÝ VƯỜN 

// 3.1 Mở Modal Quản lý Vườn (Thay thế MoModalCay cũ)
async function MoModalVuon() {
  document.getElementById('QuanLyVuon').style.display = 'block';
  document.getElementById('ThemVuon').style.display = 'block';
  document.getElementById('EditChonVuon').style.display = 'none'; // Ẩn phần sửa/xóa

  // Tải danh sách vườn của User
  await UpdateDanhSachVuonUI();
  
  // Tải danh sách Loại cây (Plant Library) vào Dropdown để chọn
  await loadPlantOptionsForDropdown();
}

// Đóng Modal
function DongModalVuon() {
  document.getElementById("QuanLyVuon").style.display = "none";
}

// 3.2 Tải danh sách Loại cây vào Dropdown (Select box)
async function loadPlantOptionsForDropdown() {
  const select = document.getElementById('ChonLoaiCay');
  select.innerHTML = '<option value="">Đang tải...</option>';
  
  try {
    const plants = await getAllPlants(); // Gọi API GET /plants
    
    select.innerHTML = '<option value="">-- Chọn loại cây trồng --</option>';
    
    if (plants.length === 0) {
        const option = document.createElement('option');
        option.text = "Chưa có dữ liệu cây (Liên hệ Admin)";
        select.add(option);
        return;
    }

    plants.forEach(plant => {
      const option = document.createElement('option');
      option.value = plant.id;   // Giá trị gửi đi là ID (VD: 1)
      option.text = plant.name;  // Hiển thị là Tên (VD: Dâu tây)
      select.add(option);
    });
  } catch (error) {
    select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    console.error(error);
  }
}

// 3.3 Lưu Vườn Mới (Thay thế LuuTenCay cũ)
async function LuuVuonMoi() {
  // Lấy giá trị từ các input mới trong main.html
  const tenVuon = document.getElementById('TenVuonInput').value.trim();
  const plantId = document.getElementById('ChonLoaiCay').value;
  const espId = document.getElementById('EspIdInput').value.trim();

  // Kiểm tra dữ liệu
  if (tenVuon === '') return alert("Vui lòng nhập tên vườn!");
  if (plantId === '') return alert("Vui lòng chọn loại cây trồng!");

  try {

    const newGarden = await createGardenAPI(tenVuon, parseInt(plantId)); 
    let msg = "Tạo vườn thành công!";

 
    if (espId !== "") {
        try {
           
            await connectEspDevice(newGarden.id, espId);
            msg += `\nĐã kết nối thiết bị: ${espId}`;
        } catch (espError) {
            msg += `\n(Lỗi kết nối ESP: ${espError.message})`;
        }
    }

    alert(msg);

    // Bước 3: Reset form và tải lại danh sách
    document.getElementById('TenVuonInput').value = '';
    document.getElementById('EspIdInput').value = '';
    document.getElementById('ChonLoaiCay').value = '';
    
    await UpdateDanhSachVuonUI();

  } catch (error) {
    alert(`Lỗi: ${error.message}`);
  }
}

// 3.4 Hiển thị danh sách vườn
async function UpdateDanhSachVuonUI() {
  const ul = document.getElementById('DanhSachVuonUI');
  ul.innerHTML = '<li>Đang tải...</li>';

  try {
    const gardens = await getAllGardens();
    ul.innerHTML = '';

    if (gardens.length === 0) {
        ul.innerHTML = '<li style="color:#666; font-style:italic;">Bạn chưa có vườn nào.</li>';
        return;
    }

    // Lấy ID đã lưu
    const savedGardenId = localStorage.getItem("currentGardenId");

    gardens.forEach(garden => {
      const li = document.createElement('li');
      li.textContent = `🏡 ${garden.name}`; 
      li.style.cursor = "pointer";
      li.id = `garden-item-${garden.id}`;
      
      // Tự động chọn lại vườn cũ
      if (ChonGardenId === garden.id || (savedGardenId && parseInt(savedGardenId) === garden.id)) {
          li.classList.add("selected-garden");
          
          if (!ChonGardenId) {
              ChonGardenId = garden.id;
              // Gọi hàm hiển thị (Giờ đây hàm này đã được fix lỗi crash)
              showEditCayOption(garden.name, garden.id);
              HienThiTuyChonVuon(garden);
          }
      }

      li.onclick = () => {
        ChonGardenId = garden.id; 
        localStorage.setItem("currentGardenId", garden.id); // Lưu lại
        
        document.querySelectorAll("#DanhSachVuonUI li").forEach(item => item.classList.remove("selected-garden"));
        li.classList.add("selected-garden");

        showEditCayOption(garden.name, garden.id);
        HienThiTuyChonVuon(garden);
      };
      ul.appendChild(li);
    });

  } catch (error) {
    ul.innerHTML = '<li>Lỗi tải danh sách.</li>';
    console.error(error);
  }
}
// 3.5 Các hàm phụ trợ Modal (Chuyển đổi giao diện khi chọn vườn)
function HienThiTuyChonVuon(garden) {
    document.getElementById('ThemVuon').style.display = 'none';
    document.getElementById('EditChonVuon').style.display = 'block';
    document.getElementById('TenVuonDangChon').innerText = `Đang chọn: ${garden.name}`;
}

function DongEditVuon() {
    document.getElementById('EditChonVuon').style.display = 'none';
    document.getElementById('ThemVuon').style.display = 'block';
  
}

// 3.6 Xóa Vườn (Thay thế XoaCayDaChon cũ)
async function XoaVuonDaChon() {
    if (!ChonGardenId) return;
    if (!confirm("Bạn chắc chắn muốn xóa vườn này?")) return;

    try {
        await deleteGarden(ChonGardenId); // API DELETE /garden/{id}
        alert("Đã xóa vườn!");
        
        DongEditVuon();
        UpdateDanhSachVuonUI();
        
        // Reset bảng điều khiển bên phải
        ChonGardenId = null;
        document.getElementById('status_bom').textContent = "";
        
    } catch (error) {
        alert("Lỗi xóa: " + error.message);
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


document.addEventListener("DOMContentLoaded", () => {
  // 1. Đăng xuất
  const logoutButton = document.querySelector("div[style='text-align: center; margin-top: 20px;'] button");
  if (logoutButton) logoutButton.onclick = logout;

  // 2. Yêu cầu dữ liệu IoT
  socket.emit("request_watering_cycle");
  socket.emit("request_water_limit"); 
  socket.emit('request_schedule_upload');

  // 3. Tải danh sách vườn
  UpdateDanhSachVuonUI(); 
  loadAllPlants();  

  // 4. ĐĂNG KÝ SỰ KIỆN CHO FORM LỊCH 
  const formLich = document.getElementById("LichTuoiForm");
  if(formLich) {
      // Clone để xóa event cũ tránh lặp
      const newForm = formLich.cloneNode(true);
      formLich.parentNode.replaceChild(newForm, formLich);
      
      newForm.addEventListener("submit", async function(e) {
          e.preventDefault(); 
          
          if (!ChonGardenId) {
              alert("⚠️ Vui lòng chọn một Vườn trước khi lưu lịch!");
              return;
          }

          const timeStr = document.getElementById("wateringTime").value; 
          const seconds = document.getElementById("wateringSecond").value;
          const dayVal = document.querySelector('input[name="day"]:checked')?.value; 

          if (!timeStr || !dayVal || seconds === "") {
              return alert("Vui lòng nhập đủ thông tin!");
          }

          const daysMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
          
          // PAYLOAD CHUẨN (Không có 'enabled')
          const payload = {
              date: new Date().toISOString().split('T')[0],
              time: timeStr,
              durationSeconds: parseInt(seconds),
              repeat: `weekly:${daysMap[dayVal]}`,
              gardenId: ChonGardenId
          };

          try {
              await createScheduleAPI(payload);
              alert("✅ Đã tạo lịch thành công!");
              cancelLichTuoi();
              
              // Tải lại danh sách nếu đang mở modal danh sách
              const listModal = document.getElementById("LichTuoiListModal");
              if (listModal && listModal.style.display === "block") {
                  loadSchedulesFromAPI();
              }
          } catch (error) {
              alert(`Lỗi khi lưu: ${error.message}`);
          }
      });
  }
});
// Nhận thời gian tiếu cây từ backend và cập nhật giao diện
socket.on("get_watering_cycle", (chuKyValue) => {
  if (!isNaN(chuKyValue) && chuKyValue > 0) {
    document.getElementById("DanhsachChuKy").textContent = `${chuKyValue}`;
  }
});


// 1. GET /plants: Lấy tất cả cây trong thư viện
async function getAllPlants() {
  try {
    const response = await fetch(`${BASE_API_URL}/plants`, {
      method: "GET",
      // Dùng getAuthHeaders() để đảm bảo token (giả hoặc thật) được gửi đi
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tải danh sách thư viện cây.");
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi lấy danh sách thư viện cây:", error);
    throw error;
  }
}

// 2. GET /plants/{id}: Lấy thông tin chi tiết cây theo ID
async function getPlantById(plantId) {
  try {
    const response = await fetch(`${BASE_API_URL}/plants/${plantId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Không thể tải thông tin cây ID: ${plantId}`);
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi lấy thông tin cây theo ID:", error);
    throw error;
  }
}

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



// --- 6.1 KHAI BÁO CÁC HÀM GỌI API (WRAPPER FUNCTIONS) ---

// 1. POST /schedule: Tạo lịch mới 
async function createScheduleAPI(payload) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Tạo lịch thất bại");
        }
        return await response.json();
    } catch (e) { throw e; }
}

// 2. GET /schedule/garden/{gardenId}: Lấy lịch theo Vườn
async function getSchedulesByGardenAPI(gardenId) {
    console.log("📡 Đang gọi API lấy lịch cho Vườn ID:", gardenId); // [Debug] Kiểm tra ID

    if (!gardenId) {
        console.warn("⚠️ Không có Garden ID, trả về mảng rỗng.");
        return [];
    }

    try {
        const response = await fetch(`${BASE_API_URL}/schedule/garden/${gardenId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

      
        if (response.status === 404) {
            console.log("ℹ️ Server trả về 404 -> Vườn này chưa có lịch nào.");
            return []; 
        }

        if (!response.ok) {
            throw new Error(`Lỗi tải lịch (Mã lỗi: ${response.status})`);
        }

        const data = await response.json();
        console.log("✅ Đã tải được:", data.length, "lịch.");
        return data;

    } catch (e) { 
        console.error("❌ Lỗi gọi API Lịch:", e);
        return []; 
    }
}

// 3. DELETE /schedule/{id}: Xóa lịch
async function deleteScheduleByIdAPI(id) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Xóa lịch thất bại");
        return true;
    } catch (e) { throw e; }
}

// 4. PUT /schedule/{id}: Cập nhật lịch 
async function updateScheduleAPI(id, payload) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Cập nhật lịch thất bại");
        return await response.json();
    } catch (e) { throw e; }
}

// 5. GET /schedule/{id}: Xem chi tiết 1 lịch
async function getScheduleByIdAPI(id) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/${id}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Không tìm thấy lịch");
        return await response.json();
    } catch (e) { throw e; }
}

// 6. GET /schedule: Lấy tất cả lịch của User 
async function getAllSchedulesAPI() {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return response.ok ? await response.json() : [];
    } catch (e) { return []; }
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
// Phần 8 Mở modal từ điển tưới cây cây (Đã chuyển sang API REST)
// Hàm tải toàn bộ danh sách cây từ API lần đầu
async function loadAllPlants() {
    try {
        const plants = await getAllPlants();
        allPlantsCache = plants;
    } catch (error) {
        // Thông báo lỗi nếu không tải được thư viện
        alert(`Lỗi tải thư viện cây: ${error.message}`);
        console.error("Lỗi tải toàn bộ cây:", error);
    }
}


// 0. Hàm giải mã Token
function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}
// ============================================================
// PHẦN 8: TỪ ĐIỂN CÂY (User) VÀ QUẢN LÝ CÂY (Admin) - ĐÃ FIX
// ============================================================

// --- A. CHỨC NĂNG TỪ ĐIỂN (TRA CỨU - AI CŨNG DÙNG ĐƯỢC) ---

// 1. Mở Modal Từ Điển (Đúng tên hàm trong HTML)
async function openDictionaryModal() { 
    const modal = document.getElementById('DictionaryModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Reset giao diện tìm kiếm
        const searchInput = document.getElementById('plantSearch');
        if(searchInput) {
            searchInput.value = '';
            searchInput.focus(); 
        }
        
        const suggestions = document.getElementById('suggestions');
        if(suggestions) suggestions.style.display = 'none';
        
        const infoDiv = document.getElementById('plantInfo');
        if(infoDiv) infoDiv.style.display = 'none';

        // Tải danh sách cây về Cache ngay khi mở
        console.log("Đang tải dữ liệu cây...");
        await loadAllPlants(); 
    } else {
        console.error("Lỗi: Không tìm thấy thẻ ID 'DictionaryModal' trong HTML");
    }
}

// 2. Đóng Modal Từ Điển
function closeDictionaryModal() {
    const modal = document.getElementById('DictionaryModal');
    if(modal) modal.style.display = 'none';
}

// 3. Xử lý khi bấm nút "Tìm"
function handleSearchButton() {
    const input = document.getElementById('plantSearch');
    const query = input.value.toLowerCase().trim();
    const suggestions = document.getElementById('suggestions');
    const infoDiv = document.getElementById('plantInfo');

    if (!query) {
        alert("Vui lòng nhập tên cây cần tìm!");
        return;
    }
    
    // Kiểm tra xem dữ liệu đã tải chưa
    if (!allPlantsCache || allPlantsCache.length === 0) {
        alert("Dữ liệu cây đang tải hoặc danh sách trống. Vui lòng thử lại sau giây lát.");
        loadAllPlants(); // Thử tải lại
        return;
    }

    // A. Tìm chính xác 100%
    const exactMatch = allPlantsCache.find(p => p.name.toLowerCase() === query);
    if (exactMatch) {
        displayPlantDetails(exactMatch.id);
        if(suggestions) suggestions.style.display = 'none';
        return;
    }

    // B. Tìm gần đúng
    const partialMatches = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
    
    if (partialMatches.length === 1) {
        // Có 1 kết quả gần đúng -> Hiện luôn
        displayPlantDetails(partialMatches[0].id);
        if(suggestions) suggestions.style.display = 'none';
    } else if (partialMatches.length > 1) {
        // Nhiều kết quả -> Hiện gợi ý
        displaySuggestions(partialMatches);
        if(infoDiv) infoDiv.style.display = 'none'; // Ẩn chi tiết cũ nếu có
    } else {
        // Không thấy
        alert(`Không tìm thấy cây nào có tên: "${input.value}"`);
        if(suggestions) suggestions.style.display = 'none';
        if(infoDiv) infoDiv.style.display = 'none';
    }
}

// 4. Sự kiện nhập liệu (Gợi ý Realtime)
const searchInputElement = document.getElementById('plantSearch');
if (searchInputElement) {
    // Xóa event cũ để tránh lặp (Clone node)
    const newSearchInput = searchInputElement.cloneNode(true);
    searchInputElement.parentNode.replaceChild(newSearchInput, searchInputElement);

    newSearchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const suggestions = document.getElementById('suggestions');
        
        if(suggestions) suggestions.innerHTML = '';
        
        if (query.length === 0) {
            if(suggestions) suggestions.style.display = 'none';
            return;
        }

        const filtered = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
        displaySuggestions(filtered);
    });

    newSearchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            handleSearchButton();
        }
    });
}

// --- B. CHỨC NĂNG QUẢN LÝ (THÊM CÂY - CHỈ ADMIN) ---

// 1. Mở Modal Admin
function openAdminPlantModal() {
    const token = localStorage.getItem("userToken");
    const decoded = parseJwt(token);
    let isAdmin = false;

    // Kiểm tra quyền Admin
    if (decoded) {
        if (Array.isArray(decoded.roles) && (decoded.roles.includes('ADMIN') || decoded.roles.includes('admin'))) isAdmin = true;
        if (decoded.role === 'ADMIN' || decoded.role === 'admin') isAdmin = true;
        if (decoded.roleId === 2) isAdmin = true;
    }

    if (!isAdmin) {
        alert("⛔ BẠN KHÔNG CÓ QUYỀN TRUY CẬP!\nChức năng này chỉ dành cho tài khoản Quản trị viên (Admin).");
        return;
    }

    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'block';
}

// 2. Đóng Modal Admin
function closeAdminPlantModal() {
    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'none';
    
    // Reset form
    const inputs = ['adminPlantName', 'adminPlantDesc', 'minTemp', 'maxTemp', 'minAir', 'maxAir', 'minSoil', 'maxSoil'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

// 3. Sự kiện nhập liệu (Giữ nguyên logic gợi ý khi gõ)

if (searchInput) {
    // Sự kiện khi gõ phím (Realtime suggestion)
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const suggestions = document.getElementById('suggestions');
        
        suggestions.innerHTML = '';
        if (query.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        const filtered = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
        displaySuggestions(filtered);
    });

    // Sự kiện khi nhấn phím ENTER (Gọi hàm tìm kiếm giống như bấm nút)
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Chặn reload form
            handleSearchButton();
        }
    });
}

// 4. Hàm hiển thị gợi ý (Helper)
function displaySuggestions(plants) {
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = '';
    
    if (plants.length > 0) {
        suggestions.style.display = 'block';
        plants.forEach(plant => {
            const li = document.createElement('li');
            li.textContent = plant.name;
            li.onclick = () => {
                document.getElementById('plantSearch').value = plant.name;
                suggestions.style.display = 'none';
                displayPlantDetails(plant.id);
            };
            suggestions.appendChild(li);
        });
    } else {
        suggestions.style.display = 'none';
    }
}


// 2. Hàm tải danh sách cây (GET /plants)
async function loadAllPlants() {
    try {
        const plants = await getAllPlants(); // Gọi API
        allPlantsCache = plants;
        console.log("Đã tải thư viện cây:", plants.length, "loài.");
    } catch (error) {
        console.error("Lỗi tải thư viện cây:", error);
    }
}



// 4. Hiển thị chi tiết cây (GET /plants/{id})
async function displayPlantDetails(plantId) {
    const infoDiv = document.getElementById('plantInfo');
    infoDiv.style.display = 'block';
    infoDiv.innerHTML = '<p>⏳ Đang tải thông tin chi tiết...</p>';

    try {
        const plant = await getPlantById(plantId); // Gọi API lấy chi tiết
        
        // Render giao diện đẹp
        infoDiv.innerHTML = `
            <h3>🌿 ${plant.name}</h3>
            <p><em>${plant.description || "Chưa có mô tả."}</em></p>
            <div style="background: #fff; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #eee;">
                <div class="plant-detail-row">
                    <span>🌡️ Nhiệt độ:</span>
                    <strong>${plant.minTemperature} - ${plant.maxTemperature}°C</strong>
                </div>
                <div class="plant-detail-row">
                    <span>💧 Độ ẩm không khí:</span>
                    <strong>${plant.minAirHumidity} - ${plant.maxAirHumidity}%</strong>
                </div>
                <div class="plant-detail-row" style="border-bottom: none;">
                    <span>🌱 Độ ẩm đất:</span>
                    <strong>${plant.minSoilMoisture} - ${plant.maxSoilMoisture}%</strong>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <small>Thêm bởi Admin ID: ${plant.createdById || 'N/A'}</small>
            </div>
        `;
    } catch (error) {
        infoDiv.innerHTML = `<p style="color:red">❌ Lỗi: ${error.message}</p>`;
    }
}

// 2. Đóng Modal
function dongthuvienModal() {
  document.getElementById('thuvienModal').style.display = 'none';
  // Ẩn các kết quả cũ
  document.getElementById('plantInfo').style.display = 'none';
  document.getElementById('suggestions').style.display = 'none';
}


// 2. Đóng Modal
function dongthuvienModal() {
  document.getElementById('thuvienModal').style.display = 'none';
  document.getElementById('adminPlantName').value = '';
  document.getElementById('adminPlantDesc').value = '';
  document.getElementById('minTemp').value = '';
  document.getElementById('maxTemp').value = '';
  document.getElementById('minAir').value = '';
  document.getElementById('maxAir').value = '';
  document.getElementById('minSoil').value = '';
  document.getElementById('maxSoil').value = '';
}

// 3. API POST /plants 
async function createPlantAdminAPI(plantData) {
    try {
        const response = await fetch(`${BASE_API_URL}/plants`, {
            method: "POST",
            headers: getAuthHeaders(), // Token phải là của Admin
            body: JSON.stringify(plantData),
        });

        if (response.status === 403) {
            throw new Error("Bạn không có quyền Admin để thực hiện thao tác này!");
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Lỗi khi thêm cây.");
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// 4. Xử lý sự kiện nút "Lưu Vào Thư Viện"
async function LuuCayMoiAdmin() {
    // A. Lấy dữ liệu từ Form
    const name = document.getElementById('adminPlantName').value.trim();
    const desc = document.getElementById('adminPlantDesc').value.trim();
    
    // Parse các số liệu môi trường
    const minTemp = parseFloat(document.getElementById('minTemp').value);
    const maxTemp = parseFloat(document.getElementById('maxTemp').value);
    const minAir = parseFloat(document.getElementById('minAir').value);
    const maxAir = parseFloat(document.getElementById('maxAir').value);
    const minSoil = parseFloat(document.getElementById('minSoil').value);
    const maxSoil = parseFloat(document.getElementById('maxSoil').value);

    // B. Validate dữ liệu cơ bản
    if (!name) return alert("Vui lòng nhập tên cây!");
    if (isNaN(minTemp) || isNaN(maxTemp) || isNaN(minAir) || isNaN(maxAir) || isNaN(minSoil) || isNaN(maxSoil)) {
        return alert("Vui lòng nhập đầy đủ các thông số môi trường (phải là số)!");
    }

    // C. Chuẩn bị Payload gửi đi 
    const payload = {
        name: name,
        description: desc,
        minTemperature: minTemp,
        maxTemperature: maxTemp,
        minAirHumidity: minAir,
        maxAirHumidity: maxAir,
        minSoilMoisture: minSoil,
        maxSoilMoisture: maxSoil
    };

    // D. Gọi API
    try {
        const result = await createPlantAdminAPI(payload);
        alert(`Thành công! Đã thêm cây: "${result.name}" (ID: ${result.id}) vào thư viện.`);
        dongthuvienModal(); // Đóng modal
        
        
    } catch (error) {
        alert(`Thất bại: ${error.message}`);
    }
}








// --- CẬP NHẬT: LOGIC API SCHEDULE (LỊCH TƯỚI CÂY) ---

// 1. GET /schedule/garden/{gardenId}: Lấy lịch tưới của một vườn cụ thể
//
async function getSchedulesByGardenAPI(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/schedule/garden/${gardenId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
       // Nếu vườn chưa có lịch, backend có thể trả 404 hoặc mảng rỗng
       if(response.status === 404) return [];
       throw new Error("Không thể tải danh sách lịch tưới.");
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi lấy lịch tưới:", error);
    return []; // Trả về mảng rỗng để không lỗi giao diện
  }
}

// 2. POST /schedule: Tạo lịch tưới mới

async function createScheduleAPI(payload) {
  try {
    const response = await fetch(`${BASE_API_URL}/schedule`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload), // Payload: { date, time, durationSeconds, repeat, gardenId }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Tạo lịch tưới thất bại.");
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi tạo lịch:", error);
    throw error;
  }
}

// 3. DELETE /schedule/{id}: Xóa lịch tưới
//
async function deleteScheduleByIdAPI(scheduleId) {
  try {
    const response = await fetch(`${BASE_API_URL}/schedule/${scheduleId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Xóa lịch thất bại.");
    return true; 
  } catch (error) {
    throw error;
  }
}



// 1. Hàm mở menu tùy chọn (Khi bấm vào "Lịch tưới cây")
function openLichTuoiOptions() {
    if (!ChonGardenId) {
        alert("⚠️ Vui lòng chọn một Vườn từ danh sách bên trái trước!");
        return;
    }
    // Cập nhật tiêu đề modal cho đúng vườn đang chọn
    const gardenNameElem = document.getElementById('ChonTenCay');
    const gardenName = gardenNameElem ? gardenNameElem.textContent : "Vườn";
    const titleElem = document.querySelector('#LichTuoiOptionsModal h2');
    if (titleElem) titleElem.textContent = `Quản lý: ${gardenName}`;
    
    document.getElementById("LichTuoiOptionsModal").style.display = "block";
}

function dongLichTuoiOptionsModal() {
    document.getElementById("LichTuoiOptionsModal").style.display = "none";
}

// 2. Hàm mở form Thêm Lịch (Khi bấm nút "Thêm lịch tưới cây")
function openAddLichTuoiModal() {
    document.getElementById("LichTuoiModal").style.display = "block";
    
    // Reset form để nhập mới
    const form = document.getElementById("LichTuoiForm");
    if(form) form.reset(); 
    
    dongLichTuoiOptionsModal(); // Ẩn menu tùy chọn đi
}

function cancelLichTuoi() {
    document.getElementById("LichTuoiModal").style.display = "none";
}

// 3. Hàm mở danh sách lịch & Tải dữ liệu
function openLichTuoiListModal() {
    if (!ChonGardenId) return;
    document.getElementById("LichTuoiListModal").style.display = "block";
    dongLichTuoiOptionsModal();
    loadSchedulesFromAPI(); // Gọi hàm tải dữ liệu từ Server
}

function dongLichTuoiListModal() {
    document.getElementById("LichTuoiListModal").style.display = "none";
}

// 4. Xử lý sự kiện Submit Form Thêm Lịch
const formLich = document.getElementById("LichTuoiForm");
if(formLich) {
    // Xóa các event listener cũ để tránh bị gọi kép (nếu có cơ chế clone)
    const newForm = formLich.cloneNode(true);
    formLich.parentNode.replaceChild(newForm, formLich);
    
    newForm.addEventListener("submit", async function(e) {
        e.preventDefault(); // Chặn tải lại trang

        if (!ChonGardenId) {
            alert("⚠️ Hệ thống không xác định được vườn. Vui lòng chọn lại vườn!");
            return;
        }

        // Lấy dữ liệu từ ô nhập
        const timeStr = document.getElementById("wateringTime").value; 
        const seconds = document.getElementById("wateringSecond").value;
        const dayVal = document.querySelector('input[name="day"]:checked')?.value; 

        if (!timeStr || !dayVal || seconds === "") {
            return alert("Vui lòng nhập đủ: Giờ, Giây tưới và Thứ trong tuần!");
        }

        // Chuyển đổi dữ liệu sang chuẩn API (weekly:X)
        const daysMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
        
        const payload = {
            date: new Date().toISOString().split('T')[0], // Ngày hiện tại (API yêu cầu)
            time: timeStr,            // "HH:mm"
            durationSeconds: parseInt(seconds),
            repeat: `weekly:${daysMap[dayVal]}`, // VD: "weekly:1"
            gardenId: ChonGardenId,   // ID vườn đang chọn
  
        };

        try {
            // Gọi API tạo lịch (Hàm bạn đã khai báo đúng)
            await createScheduleAPI(payload); 
            
            alert("✅ Đã lưu lịch tưới thành công!");
            
            // Đóng modal thêm
            cancelLichTuoi();
            
            openLichTuoiListModal(); 
            
        } catch (error) {
            alert(`Lỗi khi lưu: ${error.message}`);
        }
    });
}

// 5. Hàm tải và hiển thị danh sách lịch
async function loadSchedulesFromAPI() {
    const container = document.getElementById("scheduleList");
    
    // Kiểm tra kỹ ID trước khi tải
    if (!ChonGardenId) {
        container.innerHTML = "<div style='color:red'>⚠️ Chưa xác định được ID vườn. Hãy chọn lại vườn!</div>";
        return;
    }

    container.innerHTML = "<div>⏳ Đang tải dữ liệu từ Server...</div>";

    try {
        const data = await getSchedulesByGardenAPI(ChonGardenId); 
        LichTuois = data; 
        renderScheduleList(data);
    } catch (error) {
        console.error(error);
        container.innerHTML = "<div style='color:red'>Có lỗi khi tải dữ liệu. Xem Console (F12) để biết chi tiết.</div>";
    }
}

function renderScheduleList(schedules) {
    const container = document.getElementById("scheduleList");
    container.innerHTML = "";

    if (!schedules || schedules.length === 0) {
        container.innerHTML = "<div style='padding:20px; color:#666'>Chưa có lịch nào.</div>";
        return;
    }

    // Sắp xếp lịch: Thứ -> Giờ
    schedules.sort((a, b) => {
        const dayA = parseInt(a.repeat.split(':')[1] || 8);
        const dayB = parseInt(b.repeat.split(':')[1] || 8);
        if (dayA !== dayB) return dayA - dayB;
        return a.time.localeCompare(b.time);
    });

    const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    schedules.forEach((sch, index) => {
        const dayIdx = parseInt(sch.repeat.split(':')[1]);
        
        const div = document.createElement("div");
        div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;";
        
        div.innerHTML = `
            <div>
                <strong>${index+1}. ${dayNames[dayIdx] || 'Lặp lại'}</strong> - <span style="color:#2980b9; font-weight:bold">${sch.time}</span>
                <br><small>Tưới: ${sch.durationSeconds} giây</small>
            </div>
            <button onclick="deleteSchedule(${sch.id})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Xóa</button>
        `;
        container.appendChild(div);
    });
}

// 6. Hàm xóa lịch
async function deleteSchedule(id) {
    if (!confirm("Bạn chắc chắn muốn xóa lịch này?")) return;
    try {
        await deleteScheduleByIdAPI(id);
        alert("Đã xóa!");
        loadSchedulesFromAPI(); // Tải lại danh sách
    } catch (e) {
        alert("Lỗi xóa: " + e.message);
    }
}

// 7. Hàm xóa tất cả
async function xoaTatCaLichTuoi() {
    if (!confirm("CẢNH BÁO: Bạn muốn xóa TOÀN BỘ lịch của vườn này?")) return;
    if (LichTuois.length === 0) return alert("Danh sách trống.");

    try {
        // Lặp qua từng lịch để xóa (do chưa có API xóa hết)
        for (const s of LichTuois) {
            await deleteScheduleByIdAPI(s.id);
        }
        alert("Đã xóa sạch lịch!");
        loadSchedulesFromAPI();
    } catch (e) {
        alert("Có lỗi xảy ra: " + e.message);
    }
}
// ============================================================
// PHẦN 8: TỪ ĐIỂN CÂY (User) VÀ QUẢN LÝ CÂY (Admin) - FIXED
// ============================================================

// 1. Hàm tải toàn bộ danh sách cây từ API (Cache để tìm kiếm nhanh)
async function loadAllPlants() {
    try {
        const plants = await getAllPlants();
        allPlantsCache = plants; // Lưu vào biến toàn cục
        console.log("Đã tải thư viện cây:", plants.length, "loài.");
    } catch (error) {
        console.error("Lỗi tải toàn bộ cây:", error);
    }
}

// --- A. CHỨC NĂNG TỪ ĐIỂN (TRA CỨU) ---

// 2. Mở Modal Từ Điển
async function openDictionaryModal() { 
    const modal = document.getElementById('DictionaryModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Reset giao diện tìm kiếm
        const sInput = document.getElementById('plantSearch');
        if(sInput) {
            sInput.value = '';
            sInput.focus(); 
        }
        
        const suggestions = document.getElementById('suggestions');
        if(suggestions) suggestions.style.display = 'none';
        
        const infoDiv = document.getElementById('plantInfo');
        if(infoDiv) infoDiv.style.display = 'none';

        // Tải danh sách cây về Cache ngay khi mở
        await loadAllPlants(); 
    } else {
        console.error("Lỗi: Không tìm thấy thẻ ID 'DictionaryModal' trong HTML");
    }
}

// 3. Đóng Modal Từ Điển
function closeDictionaryModal() {
    const modal = document.getElementById('DictionaryModal');
    if(modal) modal.style.display = 'none';
}

// 4. Xử lý khi bấm nút "Tìm"
function handleSearchButton() {
    const sInput = document.getElementById('plantSearch');
    const query = sInput.value.toLowerCase().trim();
    const suggestions = document.getElementById('suggestions');
    const infoDiv = document.getElementById('plantInfo');

    if (!query) {
        alert("Vui lòng nhập tên cây cần tìm!");
        return;
    }
    
    // Kiểm tra dữ liệu
    if (!allPlantsCache || allPlantsCache.length === 0) {
        alert("Đang tải dữ liệu... Vui lòng thử lại sau giây lát.");
        loadAllPlants(); 
        return;
    }

    // A. Tìm chính xác 100%
    const exactMatch = allPlantsCache.find(p => p.name.toLowerCase() === query);
    if (exactMatch) {
        displayPlantDetails(exactMatch.id);
        if(suggestions) suggestions.style.display = 'none';
        return;
    }

    // B. Tìm gần đúng
    const partialMatches = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
    
    if (partialMatches.length === 1) {
        displayPlantDetails(partialMatches[0].id);
        if(suggestions) suggestions.style.display = 'none';
    } else if (partialMatches.length > 1) {
        displaySuggestions(partialMatches);
        if(infoDiv) infoDiv.style.display = 'none'; 
    } else {
        alert(`Không tìm thấy cây nào có tên: "${sInput.value}"`);
    }
}

// 5. Hàm hiển thị gợi ý (Helper)
function displaySuggestions(plants) {
  const suggestions = document.getElementById('suggestions');
  if(!suggestions) return;

  suggestions.innerHTML = ''; 
  suggestions.style.display = 'block';
  
  if (plants.length > 0) {
    plants.forEach(plant => {
      const li = document.createElement('li');
      li.textContent = plant.name;
      // Khi bấm vào gợi ý -> Tìm luôn
      li.onclick = function () {
        const searchBox = document.getElementById('plantSearch');
        if(searchBox) searchBox.value = plant.name;
        displayPlantDetails(plant.id); 
        suggestions.style.display = 'none';
      };
      suggestions.appendChild(li);
    });
  } else {
      suggestions.style.display = 'none';
  }
}

// 6. Hàm hiển thị chi tiết cây
async function displayPlantDetails(plantId) {
    const plantInfo = document.getElementById('plantInfo');
    if(!plantInfo) return;

    plantInfo.style.display = 'block';
    plantInfo.innerHTML = '⏳ Đang tải thông tin chi tiết...';

    try {
        const plant = await getPlantById(plantId); 
        plantInfo.innerHTML = `
            <h3 style="color: #27ae60; margin-top:0;">🌿 ${plant.name}</h3>
            <p><em>${plant.description || "Chưa có mô tả."}</em></p>
            <div style="background: #f9f9f9; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #eee;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>🌡️ Nhiệt độ:</span>
                    <strong>${plant.minTemperature} - ${plant.maxTemperature}°C</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>💧 Độ ẩm KK:</span>
                    <strong>${plant.minAirHumidity} - ${plant.maxAirHumidity}%</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>🌱 Độ ẩm Đất:</span>
                    <strong>${plant.minSoilMoisture} - ${plant.maxSoilMoisture}%</strong>
                </div>
            </div>
        `;
    } catch (error) {
        plantInfo.innerHTML = `<span style="color:red">Lỗi: ${error.message}</span>`;
    }
}

// 7. ĐĂNG KÝ SỰ KIỆN TÌM KIẾM (Đảm bảo chạy sau khi HTML load)
setTimeout(() => {
    const sInputElement = document.getElementById('plantSearch');
    if (sInputElement) {
        // Clone để xóa các event cũ (tránh bị lặp)
        const newSearchInput = sInputElement.cloneNode(true);
        sInputElement.parentNode.replaceChild(newSearchInput, sInputElement);

        // Gắn sự kiện nhập liệu (Input)
        newSearchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const suggestions = document.getElementById('suggestions');
            
            if (!query) {
                if(suggestions) suggestions.style.display = 'none';
                return;
            }

            // Lọc từ cache
            const filtered = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
            displaySuggestions(filtered);
        });

        // Gắn sự kiện phím Enter
        newSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                handleSearchButton();
            }
        });
    }
}, 1000); // Chờ 1s để đảm bảo DOM đã sẵn sàng

// --- B. CHỨC NĂNG QUẢN lý (ADMIN) ---

function openAdminPlantModal() {
    const token = localStorage.getItem("userToken");
    const decoded = parseJwt(token);
    let isAdmin = false;

    if (decoded) {
        if (Array.isArray(decoded.roles) && (decoded.roles.includes('ADMIN') || decoded.roles.includes('admin'))) isAdmin = true;
        if (decoded.role === 'ADMIN' || decoded.role === 'admin') isAdmin = true;
        if (decoded.roleId === 2) isAdmin = true;
    }

    if (!isAdmin) {
        alert("⛔ BẠN KHÔNG CÓ QUYỀN TRUY CẬP!\nChức năng này chỉ dành cho tài khoản Quản trị viên.");
        return;
    }

    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'block';
}

function closeAdminPlantModal() {
    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'none';
=======
//-- script.js--
// 0. kết nối tới server backend đang chạy
const socket = io("http://localhost:3000");
const BASE_API_URL = "http://localhost:3000"; 
let ChonGardenId = null;
let LichTuois = [];
let allPlantsCache = []; 
// --- 1. KIỂM TRA ĐĂNG NHẬP & LẤY HEADERS ---
function checkAuth() {
  const token = localStorage.getItem("userToken");
  // Nếu không có token, đá về trang đăng nhập ngay lập tức
  if (!token) {
    alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    window.location.href = 'index.html'; 
  }
}

checkAuth();

// Hàm lấy Headers chứa Token 
function getAuthHeaders() {
  const token = localStorage.getItem("userToken");
  if (!token) {
    // Nếu đang dùng mà mất token -> logout
    logout();
    return {}; 
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` 
  };
}

// LOGIC XÁC THỰC VÀ BẢO VỆ TUYẾN ĐƯỜNG
function checkAuthAndRedirect() {
    const token = localStorage.getItem("userToken");
    if (!token) {
        //window.location.href = 'index.html'; 
    }
}


// Hàm Đăng Xuất
function logout() {
  // 1. Xóa token
  localStorage.removeItem("userToken"); 
  alert("Bạn đã đăng xuất thành công.");
  window.location.href = 'index.html'; 
}


// LOGIC API GARDEN
// --- CẬP NHẬT TRONG script.js ---
// 1. POST /garden: Tạo vườn mới 
async function createGardenAPI(name, plantId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        name: name,
        plantId: plantId 
      }), 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Tạo vườn thất bại.");
    }
    return await response.json(); // Trả về object garden có chứa ID
  } catch (error) {
    console.error("Lỗi tạo vườn:", error);
    throw error;
  }
}
async function getAllGardens() {
  try {
    const response = await fetch(`${BASE_API_URL}/garden`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải danh sách vườn.");
    }
    return await response.json(); // Trả về mảng các vườn
  } catch (error) {
    console.error("Lỗi lấy danh sách vườn:", error);
    throw error;
  }
}

// 2. GET /garden/{id}: Lấy thông tin chi tiết của một vườn cụ thể
async function getGardenById(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không tìm thấy vườn.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi lấy chi tiết vườn:", error);
    throw error;
  }
}
// 2. PATCH /garden/{id}/esp-device: Kết nối thiết bị ESP (MỚI)
async function connectEspDeviceAPI(gardenId, espId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}/esp-device`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ espId: espId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi kết nối thiết bị ESP.");
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi kết nối ESP:", error);
    throw error;
  }
}

// 3. DELETE /garden/{id}: Xóa vườn
async function deleteGardenAPI(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Xóa vườn thất bại.");
    return true;
  } catch (error) {
    console.error("Lỗi xóa vườn:", error);
    throw error;
  }
}
// 3. DELETE /garden/{id}: Xóa Vườn (Xóa Cây)
async function deleteGarden(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xóa vườn thất bại.");
    }
    return true; 
  } catch (error) {
    console.error("Lỗi xóa vườn:", error);
    throw error;
  }
}




// --- 1. CÁC HÀM GỌI API (API WRAPPERS) ---

// API: Bắt đầu tưới (POST /irrigation/{id}/start)
async function startIrrigationAPI(gardenId) {
    try {
        // Body yêu cầu duration (mặc định 60s nếu không nhập)
        const bodyData = { duration: 60 }; 
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/start`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Lỗi bật bơm.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API: Dừng tưới (POST /irrigation/{id}/stop)
async function stopIrrigationAPI(gardenId) {
    try {
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/stop`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Lỗi dừng bơm.");
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API: Cập nhật chế độ tưới (PATCH /irrigation/{id}/mode)
async function setIrrigationModeAPI(gardenId, mode) {
    try {
        // Payload chuẩn: { "irrigationMode": "..." }
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/mode`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ irrigationMode: mode }) 
        });
        if (!response.ok) throw new Error("Lỗi chỉnh chế độ.");
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API TỔNG HỢP: Lấy chế độ & Trạng thái bơm hiện tại
// (Kết hợp 2 API: GET /mode và GET /pump-status)
async function getIrrigationStatusAPI(gardenId) {
    try {
        const [resMode, resPump] = await Promise.all([
            fetch(`${BASE_API_URL}/irrigation/${gardenId}/mode`, { headers: getAuthHeaders() }),
            fetch(`${BASE_API_URL}/irrigation/${gardenId}/pump-status`, { headers: getAuthHeaders() })
        ]);

        const dataMode = resMode.ok ? await resMode.json() : { irrigationMode: "off" };
        const dataPump = resPump.ok ? await resPump.json() : { status: "off" };

        return {
            mode: dataMode.irrigationMode || "off",
            pumpStatus: dataPump.status || "off" // Status trả về từ API pump-status
        };
    } catch (error) {
        console.error("Lỗi lấy trạng thái:", error);
        return null;
    }
}

// --- 2. LOGIC GIAO DIỆN (UI HANDLERS) ---

// Biến lưu trạng thái bơm tạm thời
let isPumpOn = false; 

// Xử lý nút BẬT/TẮT Bơm
async function TogglePump() {
    if (!ChonGardenId) return alert("⚠️ Vui lòng chọn một vườn trước!");

    const btn = document.getElementById('An_button');
    const originalText = btn.textContent;
    btn.disabled = true; 
    btn.textContent = "⏳...";

    try {
        if (isPumpOn) {
            // Đang BẬT -> Gọi lệnh TẮT
            await stopIrrigationAPI(ChonGardenId);
            alert("✅ Đã tắt bơm.");
            isPumpOn = false;
        } else {
            // Đang TẮT -> Gọi lệnh BẬT
            await startIrrigationAPI(ChonGardenId);
            alert("✅ Đã bật bơm.");
            isPumpOn = true;
        }
        updatePumpButtonUI();
    } catch (e) {
        alert("❌ Lỗi: " + e.message);
        // Nếu lỗi, tải lại trạng thái thật từ server để đồng bộ
        syncSystemStatus();
    } finally {
        btn.disabled = false;
        if(btn.textContent === "⏳...") btn.textContent = originalText;
    }
}

// Cập nhật giao diện nút Bơm
function updatePumpButtonUI() {
    const btn = document.getElementById('An_button');
    const statusText = document.getElementById('status_bom');
    
    if (isPumpOn) {
        btn.textContent = "TẮT BƠM";
        btn.style.backgroundColor = "#e74c3c"; // Đỏ
        statusText.textContent = "ĐANG CHẠY 🌊";
        statusText.style.color = "#27ae60";
    } else {
        btn.textContent = "BẬT BƠM";
        btn.style.backgroundColor = "#45b9c6"; // Xanh
        statusText.textContent = "ĐANG TẮT 💤";
        statusText.style.color = "#7f8c8d";
    }
}

// Hàm đồng bộ trạng thái từ Server về UI (Gọi khi chọn vườn hoặc sau khi lỗi)
async function syncSystemStatus() {
    if(!ChonGardenId) return;
    
    const status = await getIrrigationStatusAPI(ChonGardenId);
    if (status) {
        // 1. Cập nhật Bơm
        isPumpOn = (status.pumpStatus === "on" || status.pumpStatus === "running");
        updatePumpButtonUI();

        // 2. Cập nhật Chế độ
        const mode = status.mode.toLowerCase();
        const validModes = ['auto', 'manual', 'schedule', 'off'];
        const finalMode = validModes.includes(mode) ? mode : 'off';
        
        document.getElementById('currentModeDisplay').textContent = finalMode.toUpperCase();
        document.getElementById('irrigationModeSelect').value = finalMode;
    }
}

// --- GIỮ NGUYÊN SOCKET IO ĐỂ CẬP NHẬT REALTIME ---
socket.on('mqtt-data', (data) => {
    updateSensorUI(data);
});
// Hàm xử lý khi người dùng thay đổi chế độ trong dropdown
async function handleModeChange() {
    // 1. Kiểm tra xem đã chọn vườn chưa
    if (!ChonGardenId) {
        alert("⚠️ Vui lòng chọn một Vườn/Cây trong 'Vườn của tôi' trước!");
        document.getElementById('irrigationModeSelect').value = ''; 
        return;
    }

    const modeSelect = document.getElementById('irrigationModeSelect');
    const newMode = modeSelect.value;
    const currentDisplay = document.getElementById('currentModeDisplay');

    if (newMode) {
        try {
            // SỬA TẠI ĐÂY: Gọi đúng tên hàm setIrrigationModeAPI đã khai báo ở trên
            await setIrrigationModeAPI(ChonGardenId, newMode);
            
            // Cập nhật giao diện hiển thị
            currentDisplay.textContent = newMode.toUpperCase();
            alert(`✅ Đã chuyển chế độ tưới sang: ${newMode.toUpperCase()}`);
            
            // Nếu là chế độ thủ công (manual), đồng bộ trạng thái bơm ngay
            if (newMode === 'manual') {
                await syncSystemStatus();
            }
        } catch (error) {
            alert(`❌ Lỗi cập nhật chế độ: ${error.message}`);
            // Quay lại trạng thái hiển thị cũ nếu lỗi
            syncSystemStatus(); 
        }
    }
}

// script.js (Phần 3.5)

// Hàm hiển thị thông tin khi chọn Vườn
async function showEditCayOption(plantName, gardenId) {
    // 1. Cập nhật tiêu đề Dashboard
    const dashboardTitle = document.querySelector('.right h1');
    if(dashboardTitle) dashboardTitle.textContent = `Vườn: ${plantName}`;

    const tenCayDiv = document.getElementById('ChonTenCay'); // Nếu bạn có thẻ này
    if(tenCayDiv) tenCayDiv.textContent = `Đang chọn: ${plantName}`;

    console.log(`Đang tải dữ liệu cho vườn ID: ${gardenId}...`);

    // 2. QUAN TRỌNG: Đồng bộ trạng thái Bơm & Chế độ ngay lập tức
    await syncSystemStatus(); 

    // 3. Lấy dữ liệu Cảm biến
    const sensorData = await getLatestSensorAPI(gardenId);
    if (sensorData) {
        updateSensorUI(sensorData);
    } else {
        updateSensorUI({ temperature: '--', airHumidity: '--', soilMoisture: '--' });
    }
}
// Phần 1. Cập nhật dữ liệu cảm biến
socket.on('connect', () => {
});


function login() {
  window.location.href = 'system-login.html';
}


//Phần 2. Điều khiển máy bơm
// function Bat_May_Bom() {
//   const button = document.getElementById('An_button');
//   const status = document.getElementById('status_bom');

//   //button.textContent = 'BẬT'; // Nút luôn hiển thị "BẬT"
//   status.textContent = 'BẬT'; // Cập nhật trạng thái
//   button.style.backgroundColor = '#45b9c6';
//   socket.emit('relay-control', 'ON'); // Chỉ gửi lệnh ON
// }


// PHẦN 3: QUẢN LÝ VƯỜN 

// 3.1 Mở Modal Quản lý Vườn (Thay thế MoModalCay cũ)
async function MoModalVuon() {
  document.getElementById('QuanLyVuon').style.display = 'block';
  document.getElementById('ThemVuon').style.display = 'block';
  document.getElementById('EditChonVuon').style.display = 'none'; // Ẩn phần sửa/xóa

  // Tải danh sách vườn của User
  await UpdateDanhSachVuonUI();
  
  // Tải danh sách Loại cây (Plant Library) vào Dropdown để chọn
  await loadPlantOptionsForDropdown();
}

// Đóng Modal
function DongModalVuon() {
  document.getElementById("QuanLyVuon").style.display = "none";
}

// 3.2 Tải danh sách Loại cây vào Dropdown (Select box)
async function loadPlantOptionsForDropdown() {
  const select = document.getElementById('ChonLoaiCay');
  select.innerHTML = '<option value="">Đang tải...</option>';
  
  try {
    const plants = await getAllPlants(); // Gọi API GET /plants
    
    select.innerHTML = '<option value="">-- Chọn loại cây trồng --</option>';
    
    if (plants.length === 0) {
        const option = document.createElement('option');
        option.text = "Chưa có dữ liệu cây (Liên hệ Admin)";
        select.add(option);
        return;
    }

    plants.forEach(plant => {
      const option = document.createElement('option');
      option.value = plant.id;   // Giá trị gửi đi là ID (VD: 1)
      option.text = plant.name;  // Hiển thị là Tên (VD: Dâu tây)
      select.add(option);
    });
  } catch (error) {
    select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    console.error(error);
  }
}

// 3.3 Lưu Vườn Mới (Thay thế LuuTenCay cũ)
async function LuuVuonMoi() {
  // Lấy giá trị từ các input mới trong main.html
  const tenVuon = document.getElementById('TenVuonInput').value.trim();
  const plantId = document.getElementById('ChonLoaiCay').value;
  const espId = document.getElementById('EspIdInput').value.trim();

  // Kiểm tra dữ liệu
  if (tenVuon === '') return alert("Vui lòng nhập tên vườn!");
  if (plantId === '') return alert("Vui lòng chọn loại cây trồng!");

  try {

    const newGarden = await createGardenAPI(tenVuon, parseInt(plantId)); 
    let msg = "Tạo vườn thành công!";

 
    if (espId !== "") {
        try {
           
            await connectEspDevice(newGarden.id, espId);
            msg += `\nĐã kết nối thiết bị: ${espId}`;
        } catch (espError) {
            msg += `\n(Lỗi kết nối ESP: ${espError.message})`;
        }
    }

    alert(msg);

    // Bước 3: Reset form và tải lại danh sách
    document.getElementById('TenVuonInput').value = '';
    document.getElementById('EspIdInput').value = '';
    document.getElementById('ChonLoaiCay').value = '';
    
    await UpdateDanhSachVuonUI();

  } catch (error) {
    alert(`Lỗi: ${error.message}`);
  }
}

// 3.4 Hiển thị danh sách vườn
async function UpdateDanhSachVuonUI() {
  const ul = document.getElementById('DanhSachVuonUI');
  ul.innerHTML = '<li>Đang tải...</li>';

  try {
    const gardens = await getAllGardens();
    ul.innerHTML = '';

    if (gardens.length === 0) {
        ul.innerHTML = '<li style="color:#666; font-style:italic;">Bạn chưa có vườn nào.</li>';
        return;
    }

    // Lấy ID đã lưu
    const savedGardenId = localStorage.getItem("currentGardenId");

    gardens.forEach(garden => {
      const li = document.createElement('li');
      li.textContent = `🏡 ${garden.name}`; 
      li.style.cursor = "pointer";
      li.id = `garden-item-${garden.id}`;
      
      // Tự động chọn lại vườn cũ
      if (ChonGardenId === garden.id || (savedGardenId && parseInt(savedGardenId) === garden.id)) {
          li.classList.add("selected-garden");
          
          if (!ChonGardenId) {
              ChonGardenId = garden.id;
              // Gọi hàm hiển thị (Giờ đây hàm này đã được fix lỗi crash)
              showEditCayOption(garden.name, garden.id);
              HienThiTuyChonVuon(garden);
          }
      }

      li.onclick = () => {
        ChonGardenId = garden.id; 
        localStorage.setItem("currentGardenId", garden.id); // Lưu lại
        
        document.querySelectorAll("#DanhSachVuonUI li").forEach(item => item.classList.remove("selected-garden"));
        li.classList.add("selected-garden");

        showEditCayOption(garden.name, garden.id);
        HienThiTuyChonVuon(garden);
      };
      ul.appendChild(li);
    });

  } catch (error) {
    ul.innerHTML = '<li>Lỗi tải danh sách.</li>';
    console.error(error);
  }
}
// 3.5 Các hàm phụ trợ Modal (Chuyển đổi giao diện khi chọn vườn)
function HienThiTuyChonVuon(garden) {
    document.getElementById('ThemVuon').style.display = 'none';
    document.getElementById('EditChonVuon').style.display = 'block';
    document.getElementById('TenVuonDangChon').innerText = `Đang chọn: ${garden.name}`;
}

function DongEditVuon() {
    document.getElementById('EditChonVuon').style.display = 'none';
    document.getElementById('ThemVuon').style.display = 'block';
  
}

// 3.6 Xóa Vườn (Thay thế XoaCayDaChon cũ)
async function XoaVuonDaChon() {
    if (!ChonGardenId) return;
    if (!confirm("Bạn chắc chắn muốn xóa vườn này?")) return;

    try {
        await deleteGarden(ChonGardenId); // API DELETE /garden/{id}
        alert("Đã xóa vườn!");
        
        DongEditVuon();
        UpdateDanhSachVuonUI();
        
        // Reset bảng điều khiển bên phải
        ChonGardenId = null;
        document.getElementById('status_bom').textContent = "";
        
    } catch (error) {
        alert("Lỗi xóa: " + error.message);
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


document.addEventListener("DOMContentLoaded", () => {
  // 1. Đăng xuất
  const logoutButton = document.querySelector("div[style='text-align: center; margin-top: 20px;'] button");
  if (logoutButton) logoutButton.onclick = logout;

  // 2. Yêu cầu dữ liệu IoT
  socket.emit("request_watering_cycle");
  socket.emit("request_water_limit"); 
  socket.emit('request_schedule_upload');

  // 3. Tải danh sách vườn
  UpdateDanhSachVuonUI(); 
  loadAllPlants();  

  // 4. ĐĂNG KÝ SỰ KIỆN CHO FORM LỊCH 
  const formLich = document.getElementById("LichTuoiForm");
  if(formLich) {
      // Clone để xóa event cũ tránh lặp
      const newForm = formLich.cloneNode(true);
      formLich.parentNode.replaceChild(newForm, formLich);
      
      newForm.addEventListener("submit", async function(e) {
          e.preventDefault(); 
          
          if (!ChonGardenId) {
              alert("⚠️ Vui lòng chọn một Vườn trước khi lưu lịch!");
              return;
          }

          const timeStr = document.getElementById("wateringTime").value; 
          const seconds = document.getElementById("wateringSecond").value;
          const dayVal = document.querySelector('input[name="day"]:checked')?.value; 

          if (!timeStr || !dayVal || seconds === "") {
              return alert("Vui lòng nhập đủ thông tin!");
          }

          const daysMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
          
          // PAYLOAD CHUẨN (Không có 'enabled')
          const payload = {
              date: new Date().toISOString().split('T')[0],
              time: timeStr,
              durationSeconds: parseInt(seconds),
              repeat: `weekly:${daysMap[dayVal]}`,
              gardenId: ChonGardenId
          };

          try {
              await createScheduleAPI(payload);
              alert("✅ Đã tạo lịch thành công!");
              cancelLichTuoi();
              
              // Tải lại danh sách nếu đang mở modal danh sách
              const listModal = document.getElementById("LichTuoiListModal");
              if (listModal && listModal.style.display === "block") {
                  loadSchedulesFromAPI();
              }
          } catch (error) {
              alert(`Lỗi khi lưu: ${error.message}`);
          }
      });
  }
});
// Nhận thời gian tiếu cây từ backend và cập nhật giao diện
socket.on("get_watering_cycle", (chuKyValue) => {
  if (!isNaN(chuKyValue) && chuKyValue > 0) {
    document.getElementById("DanhsachChuKy").textContent = `${chuKyValue}`;
  }
});


// 1. GET /plants: Lấy tất cả cây trong thư viện
async function getAllPlants() {
  try {
    const response = await fetch(`${BASE_API_URL}/plants`, {
      method: "GET",
      // Dùng getAuthHeaders() để đảm bảo token (giả hoặc thật) được gửi đi
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tải danh sách thư viện cây.");
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi lấy danh sách thư viện cây:", error);
    throw error;
  }
}

// 2. GET /plants/{id}: Lấy thông tin chi tiết cây theo ID
async function getPlantById(plantId) {
  try {
    const response = await fetch(`${BASE_API_URL}/plants/${plantId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Không thể tải thông tin cây ID: ${plantId}`);
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi lấy thông tin cây theo ID:", error);
    throw error;
  }
}

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



// --- 6.1 KHAI BÁO CÁC HÀM GỌI API (WRAPPER FUNCTIONS) ---

// 1. POST /schedule: Tạo lịch mới 
async function createScheduleAPI(payload) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Tạo lịch thất bại");
        }
        return await response.json();
    } catch (e) { throw e; }
}

// 2. GET /schedule/garden/{gardenId}: Lấy lịch theo Vườn
async function getSchedulesByGardenAPI(gardenId) {
    console.log("📡 Đang gọi API lấy lịch cho Vườn ID:", gardenId); // [Debug] Kiểm tra ID

    if (!gardenId) {
        console.warn("⚠️ Không có Garden ID, trả về mảng rỗng.");
        return [];
    }

    try {
        const response = await fetch(`${BASE_API_URL}/schedule/garden/${gardenId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

      
        if (response.status === 404) {
            console.log("ℹ️ Server trả về 404 -> Vườn này chưa có lịch nào.");
            return []; 
        }

        if (!response.ok) {
            throw new Error(`Lỗi tải lịch (Mã lỗi: ${response.status})`);
        }

        const data = await response.json();
        console.log("✅ Đã tải được:", data.length, "lịch.");
        return data;

    } catch (e) { 
        console.error("❌ Lỗi gọi API Lịch:", e);
        return []; 
    }
}

// 3. DELETE /schedule/{id}: Xóa lịch
async function deleteScheduleByIdAPI(id) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Xóa lịch thất bại");
        return true;
    } catch (e) { throw e; }
}

// 4. PUT /schedule/{id}: Cập nhật lịch 
async function updateScheduleAPI(id, payload) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Cập nhật lịch thất bại");
        return await response.json();
    } catch (e) { throw e; }
}

// 5. GET /schedule/{id}: Xem chi tiết 1 lịch
async function getScheduleByIdAPI(id) {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/${id}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Không tìm thấy lịch");
        return await response.json();
    } catch (e) { throw e; }
}

// 6. GET /schedule: Lấy tất cả lịch của User 
async function getAllSchedulesAPI() {
    try {
        const response = await fetch(`${BASE_API_URL}/schedule`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return response.ok ? await response.json() : [];
    } catch (e) { return []; }
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
// Phần 8 Mở modal từ điển tưới cây cây (Đã chuyển sang API REST)
// Hàm tải toàn bộ danh sách cây từ API lần đầu
async function loadAllPlants() {
    try {
        const plants = await getAllPlants();
        allPlantsCache = plants;
    } catch (error) {
        // Thông báo lỗi nếu không tải được thư viện
        alert(`Lỗi tải thư viện cây: ${error.message}`);
        console.error("Lỗi tải toàn bộ cây:", error);
    }
}


// 0. Hàm giải mã Token
function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}
// ============================================================
// PHẦN 8: TỪ ĐIỂN CÂY (User) VÀ QUẢN LÝ CÂY (Admin) - ĐÃ FIX
// ============================================================

// --- A. CHỨC NĂNG TỪ ĐIỂN (TRA CỨU - AI CŨNG DÙNG ĐƯỢC) ---

// 1. Mở Modal Từ Điển (Đúng tên hàm trong HTML)
async function openDictionaryModal() { 
    const modal = document.getElementById('DictionaryModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Reset giao diện tìm kiếm
        const searchInput = document.getElementById('plantSearch');
        if(searchInput) {
            searchInput.value = '';
            searchInput.focus(); 
        }
        
        const suggestions = document.getElementById('suggestions');
        if(suggestions) suggestions.style.display = 'none';
        
        const infoDiv = document.getElementById('plantInfo');
        if(infoDiv) infoDiv.style.display = 'none';

        // Tải danh sách cây về Cache ngay khi mở
        console.log("Đang tải dữ liệu cây...");
        await loadAllPlants(); 
    } else {
        console.error("Lỗi: Không tìm thấy thẻ ID 'DictionaryModal' trong HTML");
    }
}

// 2. Đóng Modal Từ Điển
function closeDictionaryModal() {
    const modal = document.getElementById('DictionaryModal');
    if(modal) modal.style.display = 'none';
}

// 3. Xử lý khi bấm nút "Tìm"
function handleSearchButton() {
    const input = document.getElementById('plantSearch');
    const query = input.value.toLowerCase().trim();
    const suggestions = document.getElementById('suggestions');
    const infoDiv = document.getElementById('plantInfo');

    if (!query) {
        alert("Vui lòng nhập tên cây cần tìm!");
        return;
    }
    
    // Kiểm tra xem dữ liệu đã tải chưa
    if (!allPlantsCache || allPlantsCache.length === 0) {
        alert("Dữ liệu cây đang tải hoặc danh sách trống. Vui lòng thử lại sau giây lát.");
        loadAllPlants(); // Thử tải lại
        return;
    }

    // A. Tìm chính xác 100%
    const exactMatch = allPlantsCache.find(p => p.name.toLowerCase() === query);
    if (exactMatch) {
        displayPlantDetails(exactMatch.id);
        if(suggestions) suggestions.style.display = 'none';
        return;
    }

    // B. Tìm gần đúng
    const partialMatches = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
    
    if (partialMatches.length === 1) {
        // Có 1 kết quả gần đúng -> Hiện luôn
        displayPlantDetails(partialMatches[0].id);
        if(suggestions) suggestions.style.display = 'none';
    } else if (partialMatches.length > 1) {
        // Nhiều kết quả -> Hiện gợi ý
        displaySuggestions(partialMatches);
        if(infoDiv) infoDiv.style.display = 'none'; // Ẩn chi tiết cũ nếu có
    } else {
        // Không thấy
        alert(`Không tìm thấy cây nào có tên: "${input.value}"`);
        if(suggestions) suggestions.style.display = 'none';
        if(infoDiv) infoDiv.style.display = 'none';
    }
}

// 4. Sự kiện nhập liệu (Gợi ý Realtime)
const searchInputElement = document.getElementById('plantSearch');
if (searchInputElement) {
    // Xóa event cũ để tránh lặp (Clone node)
    const newSearchInput = searchInputElement.cloneNode(true);
    searchInputElement.parentNode.replaceChild(newSearchInput, searchInputElement);

    newSearchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const suggestions = document.getElementById('suggestions');
        
        if(suggestions) suggestions.innerHTML = '';
        
        if (query.length === 0) {
            if(suggestions) suggestions.style.display = 'none';
            return;
        }

        const filtered = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
        displaySuggestions(filtered);
    });

    newSearchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            handleSearchButton();
        }
    });
}

// --- B. CHỨC NĂNG QUẢN LÝ (THÊM CÂY - CHỈ ADMIN) ---

// 1. Mở Modal Admin
function openAdminPlantModal() {
    const token = localStorage.getItem("userToken");
    const decoded = parseJwt(token);
    let isAdmin = false;

    // Kiểm tra quyền Admin
    if (decoded) {
        if (Array.isArray(decoded.roles) && (decoded.roles.includes('ADMIN') || decoded.roles.includes('admin'))) isAdmin = true;
        if (decoded.role === 'ADMIN' || decoded.role === 'admin') isAdmin = true;
        if (decoded.roleId === 2) isAdmin = true;
    }

    if (!isAdmin) {
        alert("⛔ BẠN KHÔNG CÓ QUYỀN TRUY CẬP!\nChức năng này chỉ dành cho tài khoản Quản trị viên (Admin).");
        return;
    }

    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'block';
}

// 2. Đóng Modal Admin
function closeAdminPlantModal() {
    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'none';
    
    // Reset form
    const inputs = ['adminPlantName', 'adminPlantDesc', 'minTemp', 'maxTemp', 'minAir', 'maxAir', 'minSoil', 'maxSoil'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

// 3. Sự kiện nhập liệu (Giữ nguyên logic gợi ý khi gõ)

if (searchInput) {
    // Sự kiện khi gõ phím (Realtime suggestion)
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const suggestions = document.getElementById('suggestions');
        
        suggestions.innerHTML = '';
        if (query.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        const filtered = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
        displaySuggestions(filtered);
    });

    // Sự kiện khi nhấn phím ENTER (Gọi hàm tìm kiếm giống như bấm nút)
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Chặn reload form
            handleSearchButton();
        }
    });
}

// 4. Hàm hiển thị gợi ý (Helper)
function displaySuggestions(plants) {
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = '';
    
    if (plants.length > 0) {
        suggestions.style.display = 'block';
        plants.forEach(plant => {
            const li = document.createElement('li');
            li.textContent = plant.name;
            li.onclick = () => {
                document.getElementById('plantSearch').value = plant.name;
                suggestions.style.display = 'none';
                displayPlantDetails(plant.id);
            };
            suggestions.appendChild(li);
        });
    } else {
        suggestions.style.display = 'none';
    }
}


// 2. Hàm tải danh sách cây (GET /plants)
async function loadAllPlants() {
    try {
        const plants = await getAllPlants(); // Gọi API
        allPlantsCache = plants;
        console.log("Đã tải thư viện cây:", plants.length, "loài.");
    } catch (error) {
        console.error("Lỗi tải thư viện cây:", error);
    }
}



// 4. Hiển thị chi tiết cây (GET /plants/{id})
async function displayPlantDetails(plantId) {
    const infoDiv = document.getElementById('plantInfo');
    infoDiv.style.display = 'block';
    infoDiv.innerHTML = '<p>⏳ Đang tải thông tin chi tiết...</p>';

    try {
        const plant = await getPlantById(plantId); // Gọi API lấy chi tiết
        
        // Render giao diện đẹp
        infoDiv.innerHTML = `
            <h3>🌿 ${plant.name}</h3>
            <p><em>${plant.description || "Chưa có mô tả."}</em></p>
            <div style="background: #fff; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #eee;">
                <div class="plant-detail-row">
                    <span>🌡️ Nhiệt độ:</span>
                    <strong>${plant.minTemperature} - ${plant.maxTemperature}°C</strong>
                </div>
                <div class="plant-detail-row">
                    <span>💧 Độ ẩm không khí:</span>
                    <strong>${plant.minAirHumidity} - ${plant.maxAirHumidity}%</strong>
                </div>
                <div class="plant-detail-row" style="border-bottom: none;">
                    <span>🌱 Độ ẩm đất:</span>
                    <strong>${plant.minSoilMoisture} - ${plant.maxSoilMoisture}%</strong>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <small>Thêm bởi Admin ID: ${plant.createdById || 'N/A'}</small>
            </div>
        `;
    } catch (error) {
        infoDiv.innerHTML = `<p style="color:red">❌ Lỗi: ${error.message}</p>`;
    }
}

// 2. Đóng Modal
function dongthuvienModal() {
  document.getElementById('thuvienModal').style.display = 'none';
  // Ẩn các kết quả cũ
  document.getElementById('plantInfo').style.display = 'none';
  document.getElementById('suggestions').style.display = 'none';
}


// 2. Đóng Modal
function dongthuvienModal() {
  document.getElementById('thuvienModal').style.display = 'none';
  document.getElementById('adminPlantName').value = '';
  document.getElementById('adminPlantDesc').value = '';
  document.getElementById('minTemp').value = '';
  document.getElementById('maxTemp').value = '';
  document.getElementById('minAir').value = '';
  document.getElementById('maxAir').value = '';
  document.getElementById('minSoil').value = '';
  document.getElementById('maxSoil').value = '';
}

// 3. API POST /plants 
async function createPlantAdminAPI(plantData) {
    try {
        const response = await fetch(`${BASE_API_URL}/plants`, {
            method: "POST",
            headers: getAuthHeaders(), // Token phải là của Admin
            body: JSON.stringify(plantData),
        });

        if (response.status === 403) {
            throw new Error("Bạn không có quyền Admin để thực hiện thao tác này!");
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Lỗi khi thêm cây.");
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// 4. Xử lý sự kiện nút "Lưu Vào Thư Viện"
async function LuuCayMoiAdmin() {
    // A. Lấy dữ liệu từ Form
    const name = document.getElementById('adminPlantName').value.trim();
    const desc = document.getElementById('adminPlantDesc').value.trim();
    
    // Parse các số liệu môi trường
    const minTemp = parseFloat(document.getElementById('minTemp').value);
    const maxTemp = parseFloat(document.getElementById('maxTemp').value);
    const minAir = parseFloat(document.getElementById('minAir').value);
    const maxAir = parseFloat(document.getElementById('maxAir').value);
    const minSoil = parseFloat(document.getElementById('minSoil').value);
    const maxSoil = parseFloat(document.getElementById('maxSoil').value);

    // B. Validate dữ liệu cơ bản
    if (!name) return alert("Vui lòng nhập tên cây!");
    if (isNaN(minTemp) || isNaN(maxTemp) || isNaN(minAir) || isNaN(maxAir) || isNaN(minSoil) || isNaN(maxSoil)) {
        return alert("Vui lòng nhập đầy đủ các thông số môi trường (phải là số)!");
    }

    // C. Chuẩn bị Payload gửi đi 
    const payload = {
        name: name,
        description: desc,
        minTemperature: minTemp,
        maxTemperature: maxTemp,
        minAirHumidity: minAir,
        maxAirHumidity: maxAir,
        minSoilMoisture: minSoil,
        maxSoilMoisture: maxSoil
    };

    // D. Gọi API
    try {
        const result = await createPlantAdminAPI(payload);
        alert(`Thành công! Đã thêm cây: "${result.name}" (ID: ${result.id}) vào thư viện.`);
        dongthuvienModal(); // Đóng modal
        
        
    } catch (error) {
        alert(`Thất bại: ${error.message}`);
    }
}








// --- CẬP NHẬT: LOGIC API SCHEDULE (LỊCH TƯỚI CÂY) ---

// 1. GET /schedule/garden/{gardenId}: Lấy lịch tưới của một vườn cụ thể
//
async function getSchedulesByGardenAPI(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/schedule/garden/${gardenId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
       // Nếu vườn chưa có lịch, backend có thể trả 404 hoặc mảng rỗng
       if(response.status === 404) return [];
       throw new Error("Không thể tải danh sách lịch tưới.");
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi lấy lịch tưới:", error);
    return []; // Trả về mảng rỗng để không lỗi giao diện
  }
}

// 2. POST /schedule: Tạo lịch tưới mới

async function createScheduleAPI(payload) {
  try {
    const response = await fetch(`${BASE_API_URL}/schedule`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload), // Payload: { date, time, durationSeconds, repeat, gardenId }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Tạo lịch tưới thất bại.");
    }
    return await response.json(); 
  } catch (error) {
    console.error("Lỗi tạo lịch:", error);
    throw error;
  }
}

// 3. DELETE /schedule/{id}: Xóa lịch tưới
//
async function deleteScheduleByIdAPI(scheduleId) {
  try {
    const response = await fetch(`${BASE_API_URL}/schedule/${scheduleId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Xóa lịch thất bại.");
    return true; 
  } catch (error) {
    throw error;
  }
}



// 1. Hàm mở menu tùy chọn (Khi bấm vào "Lịch tưới cây")
function openLichTuoiOptions() {
    if (!ChonGardenId) {
        alert("⚠️ Vui lòng chọn một Vườn từ danh sách bên trái trước!");
        return;
    }
    // Cập nhật tiêu đề modal cho đúng vườn đang chọn
    const gardenNameElem = document.getElementById('ChonTenCay');
    const gardenName = gardenNameElem ? gardenNameElem.textContent : "Vườn";
    const titleElem = document.querySelector('#LichTuoiOptionsModal h2');
    if (titleElem) titleElem.textContent = `Quản lý: ${gardenName}`;
    
    document.getElementById("LichTuoiOptionsModal").style.display = "block";
}

function dongLichTuoiOptionsModal() {
    document.getElementById("LichTuoiOptionsModal").style.display = "none";
}

// 2. Hàm mở form Thêm Lịch (Khi bấm nút "Thêm lịch tưới cây")
function openAddLichTuoiModal() {
    document.getElementById("LichTuoiModal").style.display = "block";
    
    // Reset form để nhập mới
    const form = document.getElementById("LichTuoiForm");
    if(form) form.reset(); 
    
    dongLichTuoiOptionsModal(); // Ẩn menu tùy chọn đi
}

function cancelLichTuoi() {
    document.getElementById("LichTuoiModal").style.display = "none";
}

// 3. Hàm mở danh sách lịch & Tải dữ liệu
function openLichTuoiListModal() {
    if (!ChonGardenId) return;
    document.getElementById("LichTuoiListModal").style.display = "block";
    dongLichTuoiOptionsModal();
    loadSchedulesFromAPI(); // Gọi hàm tải dữ liệu từ Server
}

function dongLichTuoiListModal() {
    document.getElementById("LichTuoiListModal").style.display = "none";
}

// 4. Xử lý sự kiện Submit Form Thêm Lịch
const formLich = document.getElementById("LichTuoiForm");
if(formLich) {
    // Xóa các event listener cũ để tránh bị gọi kép (nếu có cơ chế clone)
    const newForm = formLich.cloneNode(true);
    formLich.parentNode.replaceChild(newForm, formLich);
    
    newForm.addEventListener("submit", async function(e) {
        e.preventDefault(); // Chặn tải lại trang

        if (!ChonGardenId) {
            alert("⚠️ Hệ thống không xác định được vườn. Vui lòng chọn lại vườn!");
            return;
        }

        // Lấy dữ liệu từ ô nhập
        const timeStr = document.getElementById("wateringTime").value; 
        const seconds = document.getElementById("wateringSecond").value;
        const dayVal = document.querySelector('input[name="day"]:checked')?.value; 

        if (!timeStr || !dayVal || seconds === "") {
            return alert("Vui lòng nhập đủ: Giờ, Giây tưới và Thứ trong tuần!");
        }

        // Chuyển đổi dữ liệu sang chuẩn API (weekly:X)
        const daysMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
        
        const payload = {
            date: new Date().toISOString().split('T')[0], // Ngày hiện tại (API yêu cầu)
            time: timeStr,            // "HH:mm"
            durationSeconds: parseInt(seconds),
            repeat: `weekly:${daysMap[dayVal]}`, // VD: "weekly:1"
            gardenId: ChonGardenId,   // ID vườn đang chọn
  
        };

        try {
            // Gọi API tạo lịch (Hàm bạn đã khai báo đúng)
            await createScheduleAPI(payload); 
            
            alert("✅ Đã lưu lịch tưới thành công!");
            
            // Đóng modal thêm
            cancelLichTuoi();
            
            openLichTuoiListModal(); 
            
        } catch (error) {
            alert(`Lỗi khi lưu: ${error.message}`);
        }
    });
}

// 5. Hàm tải và hiển thị danh sách lịch
async function loadSchedulesFromAPI() {
    const container = document.getElementById("scheduleList");
    
    // Kiểm tra kỹ ID trước khi tải
    if (!ChonGardenId) {
        container.innerHTML = "<div style='color:red'>⚠️ Chưa xác định được ID vườn. Hãy chọn lại vườn!</div>";
        return;
    }

    container.innerHTML = "<div>⏳ Đang tải dữ liệu từ Server...</div>";

    try {
        const data = await getSchedulesByGardenAPI(ChonGardenId); 
        LichTuois = data; 
        renderScheduleList(data);
    } catch (error) {
        console.error(error);
        container.innerHTML = "<div style='color:red'>Có lỗi khi tải dữ liệu. Xem Console (F12) để biết chi tiết.</div>";
    }
}

function renderScheduleList(schedules) {
    const container = document.getElementById("scheduleList");
    container.innerHTML = "";

    if (!schedules || schedules.length === 0) {
        container.innerHTML = "<div style='padding:20px; color:#666'>Chưa có lịch nào.</div>";
        return;
    }

    // Sắp xếp lịch: Thứ -> Giờ
    schedules.sort((a, b) => {
        const dayA = parseInt(a.repeat.split(':')[1] || 8);
        const dayB = parseInt(b.repeat.split(':')[1] || 8);
        if (dayA !== dayB) return dayA - dayB;
        return a.time.localeCompare(b.time);
    });

    const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    schedules.forEach((sch, index) => {
        const dayIdx = parseInt(sch.repeat.split(':')[1]);
        
        const div = document.createElement("div");
        div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;";
        
        div.innerHTML = `
            <div>
                <strong>${index+1}. ${dayNames[dayIdx] || 'Lặp lại'}</strong> - <span style="color:#2980b9; font-weight:bold">${sch.time}</span>
                <br><small>Tưới: ${sch.durationSeconds} giây</small>
            </div>
            <button onclick="deleteSchedule(${sch.id})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Xóa</button>
        `;
        container.appendChild(div);
    });
}

// 6. Hàm xóa lịch
async function deleteSchedule(id) {
    if (!confirm("Bạn chắc chắn muốn xóa lịch này?")) return;
    try {
        await deleteScheduleByIdAPI(id);
        alert("Đã xóa!");
        loadSchedulesFromAPI(); // Tải lại danh sách
    } catch (e) {
        alert("Lỗi xóa: " + e.message);
    }
}

// 7. Hàm xóa tất cả
async function xoaTatCaLichTuoi() {
    if (!confirm("CẢNH BÁO: Bạn muốn xóa TOÀN BỘ lịch của vườn này?")) return;
    if (LichTuois.length === 0) return alert("Danh sách trống.");

    try {
        // Lặp qua từng lịch để xóa (do chưa có API xóa hết)
        for (const s of LichTuois) {
            await deleteScheduleByIdAPI(s.id);
        }
        alert("Đã xóa sạch lịch!");
        loadSchedulesFromAPI();
    } catch (e) {
        alert("Có lỗi xảy ra: " + e.message);
    }
}
// ============================================================
// PHẦN 8: TỪ ĐIỂN CÂY (User) VÀ QUẢN LÝ CÂY (Admin) - FIXED
// ============================================================

// 1. Hàm tải toàn bộ danh sách cây từ API (Cache để tìm kiếm nhanh)
async function loadAllPlants() {
    try {
        const plants = await getAllPlants();
        allPlantsCache = plants; // Lưu vào biến toàn cục
        console.log("Đã tải thư viện cây:", plants.length, "loài.");
    } catch (error) {
        console.error("Lỗi tải toàn bộ cây:", error);
    }
}

// --- A. CHỨC NĂNG TỪ ĐIỂN (TRA CỨU) ---

// 2. Mở Modal Từ Điển
async function openDictionaryModal() { 
    const modal = document.getElementById('DictionaryModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Reset giao diện tìm kiếm
        const sInput = document.getElementById('plantSearch');
        if(sInput) {
            sInput.value = '';
            sInput.focus(); 
        }
        
        const suggestions = document.getElementById('suggestions');
        if(suggestions) suggestions.style.display = 'none';
        
        const infoDiv = document.getElementById('plantInfo');
        if(infoDiv) infoDiv.style.display = 'none';

        // Tải danh sách cây về Cache ngay khi mở
        await loadAllPlants(); 
    } else {
        console.error("Lỗi: Không tìm thấy thẻ ID 'DictionaryModal' trong HTML");
    }
}

// 3. Đóng Modal Từ Điển
function closeDictionaryModal() {
    const modal = document.getElementById('DictionaryModal');
    if(modal) modal.style.display = 'none';
}

// 4. Xử lý khi bấm nút "Tìm"
function handleSearchButton() {
    const sInput = document.getElementById('plantSearch');
    const query = sInput.value.toLowerCase().trim();
    const suggestions = document.getElementById('suggestions');
    const infoDiv = document.getElementById('plantInfo');

    if (!query) {
        alert("Vui lòng nhập tên cây cần tìm!");
        return;
    }
    
    // Kiểm tra dữ liệu
    if (!allPlantsCache || allPlantsCache.length === 0) {
        alert("Đang tải dữ liệu... Vui lòng thử lại sau giây lát.");
        loadAllPlants(); 
        return;
    }

    // A. Tìm chính xác 100%
    const exactMatch = allPlantsCache.find(p => p.name.toLowerCase() === query);
    if (exactMatch) {
        displayPlantDetails(exactMatch.id);
        if(suggestions) suggestions.style.display = 'none';
        return;
    }

    // B. Tìm gần đúng
    const partialMatches = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
    
    if (partialMatches.length === 1) {
        displayPlantDetails(partialMatches[0].id);
        if(suggestions) suggestions.style.display = 'none';
    } else if (partialMatches.length > 1) {
        displaySuggestions(partialMatches);
        if(infoDiv) infoDiv.style.display = 'none'; 
    } else {
        alert(`Không tìm thấy cây nào có tên: "${sInput.value}"`);
    }
}

// 5. Hàm hiển thị gợi ý (Helper)
function displaySuggestions(plants) {
  const suggestions = document.getElementById('suggestions');
  if(!suggestions) return;

  suggestions.innerHTML = ''; 
  suggestions.style.display = 'block';
  
  if (plants.length > 0) {
    plants.forEach(plant => {
      const li = document.createElement('li');
      li.textContent = plant.name;
      // Khi bấm vào gợi ý -> Tìm luôn
      li.onclick = function () {
        const searchBox = document.getElementById('plantSearch');
        if(searchBox) searchBox.value = plant.name;
        displayPlantDetails(plant.id); 
        suggestions.style.display = 'none';
      };
      suggestions.appendChild(li);
    });
  } else {
      suggestions.style.display = 'none';
  }
}

// 6. Hàm hiển thị chi tiết cây
async function displayPlantDetails(plantId) {
    const plantInfo = document.getElementById('plantInfo');
    if(!plantInfo) return;

    plantInfo.style.display = 'block';
    plantInfo.innerHTML = '⏳ Đang tải thông tin chi tiết...';

    try {
        const plant = await getPlantById(plantId); 
        plantInfo.innerHTML = `
            <h3 style="color: #27ae60; margin-top:0;">🌿 ${plant.name}</h3>
            <p><em>${plant.description || "Chưa có mô tả."}</em></p>
            <div style="background: #f9f9f9; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #eee;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>🌡️ Nhiệt độ:</span>
                    <strong>${plant.minTemperature} - ${plant.maxTemperature}°C</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>💧 Độ ẩm KK:</span>
                    <strong>${plant.minAirHumidity} - ${plant.maxAirHumidity}%</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>🌱 Độ ẩm Đất:</span>
                    <strong>${plant.minSoilMoisture} - ${plant.maxSoilMoisture}%</strong>
                </div>
            </div>
        `;
    } catch (error) {
        plantInfo.innerHTML = `<span style="color:red">Lỗi: ${error.message}</span>`;
    }
}

// 7. ĐĂNG KÝ SỰ KIỆN TÌM KIẾM (Đảm bảo chạy sau khi HTML load)
setTimeout(() => {
    const sInputElement = document.getElementById('plantSearch');
    if (sInputElement) {
        // Clone để xóa các event cũ (tránh bị lặp)
        const newSearchInput = sInputElement.cloneNode(true);
        sInputElement.parentNode.replaceChild(newSearchInput, sInputElement);

        // Gắn sự kiện nhập liệu (Input)
        newSearchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const suggestions = document.getElementById('suggestions');
            
            if (!query) {
                if(suggestions) suggestions.style.display = 'none';
                return;
            }

            // Lọc từ cache
            const filtered = allPlantsCache.filter(p => p.name.toLowerCase().includes(query));
            displaySuggestions(filtered);
        });

        // Gắn sự kiện phím Enter
        newSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                handleSearchButton();
            }
        });
    }
}, 1000); // Chờ 1s để đảm bảo DOM đã sẵn sàng

// --- B. CHỨC NĂNG QUẢN lý (ADMIN) ---

function openAdminPlantModal() {
    const token = localStorage.getItem("userToken");
    const decoded = parseJwt(token);
    let isAdmin = false;

    if (decoded) {
        if (Array.isArray(decoded.roles) && (decoded.roles.includes('ADMIN') || decoded.roles.includes('admin'))) isAdmin = true;
        if (decoded.role === 'ADMIN' || decoded.role === 'admin') isAdmin = true;
        if (decoded.roleId === 2) isAdmin = true;
    }

    if (!isAdmin) {
        alert("⛔ BẠN KHÔNG CÓ QUYỀN TRUY CẬP!\nChức năng này chỉ dành cho tài khoản Quản trị viên.");
        return;
    }

    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'block';
}

function closeAdminPlantModal() {
    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'none';
>>>>>>> fc4be9b (done)
}