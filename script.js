
// 1. CẤU HÌNH & BIẾN TOÀN CỤC

const socket = io("http://localhost:3000");
const BASE_API_URL = "http://localhost:3000"; 

let ChonGardenId = null;
let LichTuois = [];
let allPlantsCache = []; 
let globalManualDuration = 60;
let sensorInterval = null;

// 2. AUTHENTICATION (ĐĂNG NHẬP/ĐĂNG XUẤT) & HELPER

// Kiểm tra token khi vào trang
function checkAuth() {
  const token = localStorage.getItem("userToken");
  if (!token) {
    alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    window.location.href = 'index.html'; 
  }
}
checkAuth(); // Chạy ngay khi load file

// Lấy Headers chứa Token
function getAuthHeaders() {
  const token = localStorage.getItem("userToken");
  if (!token) {
    logout();
    return {}; 
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` 
  };
}

// Hàm Đăng Xuất
function logout() {
  localStorage.removeItem("userToken"); 
  alert("Bạn đã đăng xuất thành công.");
  window.location.href = 'index.html'; 
}

// Giải mã Token (Helper)
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


// 3. API LAYER

// --- 3.1 API CÂY TRỒNG (PLANTS) ---
async function getAllPlants() {
  try {
    const response = await fetch(`${BASE_API_URL}/plants`, {
      method: "GET",
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

async function createPlantAdminAPI(plantData) {
    try {
        const response = await fetch(`${BASE_API_URL}/plants`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(plantData),
        });
        if (response.status === 403) throw new Error("Bạn không có quyền Admin!");
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Lỗi khi thêm cây.");
        }
        return await response.json();
    } catch (error) { throw error; }
}

// --- 3.2 API VƯỜN (GARDEN) ---
async function createGardenAPI(name, plantId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: name, plantId: plantId }), 
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Tạo vườn thất bại.");
    }
    return await response.json();
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
    if (!response.ok) throw new Error("Không thể tải danh sách vườn.");
    return await response.json();
  } catch (error) {
    console.error("Lỗi lấy danh sách vườn:", error);
    throw error;
  }
}

async function getGardenById(gardenId) {
  try {
    const response = await fetch(`${BASE_API_URL}/garden/${gardenId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Không tìm thấy vườn.");
    return await response.json();
  } catch (error) {
    console.error("Lỗi lấy chi tiết vườn:", error);
    throw error;
  }
}

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

// 3.3 API SENSOR 
async function getLatestSensorAPI(gardenId) {
    try {
      
        const response = await fetch(`${BASE_API_URL}/sensor/garden/${gardenId}/latest`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (!response.ok) {
        
            return null; 
        }
        return await response.json(); 
    } catch (error) {
        console.warn("Không lấy được dữ liệu cảm biến:", error);
        return null;
    }
}

// --- 3.4 API IRRIGATION ---
async function startIrrigationAPI(gardenId, durationInSeconds) {
    try {
        const finalDuration = durationInSeconds || 60;
        const bodyData = { duration: finalDuration }; 
        console.log("Đang gửi lệnh bật bơm với thời gian:", finalDuration);

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
    } catch (error) { throw error; }
}

async function stopIrrigationAPI(gardenId) {
    try {
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/stop`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Lỗi dừng bơm.");
        return await response.json();
    } catch (error) { throw error; }
}

async function setIrrigationModeAPI(gardenId, mode) {
    try {
        const response = await fetch(`${BASE_API_URL}/irrigation/${gardenId}/mode`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ irrigationMode: mode }) 
        });
        if (!response.ok) throw new Error("Lỗi chỉnh chế độ.");
        return await response.json();
    } catch (error) { throw error; }
}

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
            pumpStatus: dataPump.status || "off"
        };
    } catch (error) {
        console.error("Lỗi lấy trạng thái:", error);
        return null;
    }
}

// --- 3.5 API LỊCH TƯỚI (SCHEDULE) ---
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

async function getSchedulesByGardenAPI(gardenId) {
    if (!gardenId) return [];
    try {
        const response = await fetch(`${BASE_API_URL}/schedule/garden/${gardenId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (response.status === 404) return []; 
        if (!response.ok) throw new Error(`Lỗi tải lịch (Mã lỗi: ${response.status})`);
        return await response.json();
    } catch (e) { 
        console.error("❌ Lỗi gọi API Lịch:", e);
        return []; 
    }
}

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

// 4. LOGIC GIAO DIỆN CHÍNH (DASHBOARD & VƯỜN)
// Hiển thị thông tin khi chọn Vườn 
async function showEditCayOption(plantName, gardenId) {
   
    const dashboardTitle = document.querySelector('.right h1');
    if(dashboardTitle) dashboardTitle.textContent = `Vườn: ${plantName}`;
    const tenCayDiv = document.getElementById('ChonTenCay');
    if(tenCayDiv) tenCayDiv.textContent = `Đang chọn: ${plantName}`;
    console.log(`Đang tải dữ liệu cho vườn ID: ${gardenId}...`);

    await syncSystemStatus(); 
    if (sensorInterval) clearInterval(sensorInterval);
    const fetchAndShowSensor = async () => {
        const sensorData = await getLatestSensorAPI(gardenId);
        if (sensorData) {
            updateSensorUI(sensorData);
        } else {
            
            // updateSensorUI({ temperature: '--', airHumidity: '--', soilMoisture: '--' });
        }
    };
    await fetchAndShowSensor();
    sensorInterval = setInterval(fetchAndShowSensor, 3000);
}

// Cập nhật giao diện cảm biến
function updateSensorUI(data) {
    if (!data) return;
    const tempEl = document.getElementById('tempValue');
    if (tempEl) tempEl.textContent = (data.temperature != null) ? `${data.temperature}°C` : "--°C";

    const humiEl = document.getElementById('humidityValue');
    if (humiEl) humiEl.textContent = (data.airHumidity != null) ? `${data.airHumidity}%` : "--%";

    const soilEl = document.getElementById('soilValue');
    if (soilEl) soilEl.textContent = (data.soilMoisture != null) ? `${data.soilMoisture}%` : "--%";
}

// Đồng bộ trạng thái hệ thống từ Server
async function syncSystemStatus() {
    if(!ChonGardenId) return;
    const status = await getIrrigationStatusAPI(ChonGardenId);
    if (status) {
        isPumpOn = (status.pumpStatus === "on" || status.pumpStatus === "running");
        updatePumpButtonUI();

        const mode = status.mode.toLowerCase();
        const validModes = ['auto', 'manual', 'schedule', 'off'];
        const finalMode = validModes.includes(mode) ? mode : 'off';
        
        document.getElementById('currentModeDisplay').textContent = finalMode.toUpperCase();
        document.getElementById('irrigationModeSelect').value = finalMode;
    }
}

// Biến trạng thái bơm tạm thời
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
            await stopIrrigationAPI(ChonGardenId);
            alert("✅ Đã tắt bơm.");
            isPumpOn = false;
        } else {
            await startIrrigationAPI(ChonGardenId, globalManualDuration);
            alert(`✅ Đã bật bơm! Máy sẽ chạy trong ${globalManualDuration} giây rồi tự tắt.`);
            isPumpOn = true;
        }
        updatePumpButtonUI();
    } catch (e) {
        alert("❌ Lỗi: " + e.message);
        syncSystemStatus();
    } finally {
        btn.disabled = false;
        if(btn.textContent === "⏳...") btn.textContent = originalText;
    }
}

function updatePumpButtonUI() {
    const btn = document.getElementById('An_button');
    const statusText = document.getElementById('status_bom');
    
    if (isPumpOn) {
        btn.textContent = "TẮT BƠM";
        btn.style.backgroundColor = "#e74c3c";
        statusText.textContent = "ĐANG CHẠY 🌊";
        statusText.style.color = "#27ae60";
    } else {
        btn.textContent = "BẬT BƠM";
        btn.style.backgroundColor = "#45b9c6";
        statusText.textContent = "ĐANG TẮT 💤";
        statusText.style.color = "#7f8c8d";
    }
}

// Xử lý đổi chế độ tưới
async function handleModeChange() {
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
            await setIrrigationModeAPI(ChonGardenId, newMode);
            currentDisplay.textContent = newMode.toUpperCase();
            alert(`✅ Đã chuyển chế độ tưới sang: ${newMode.toUpperCase()}`);
            if (newMode === 'manual') await syncSystemStatus();
        } catch (error) {
            alert(`❌ Lỗi cập nhật chế độ: ${error.message}`);
            syncSystemStatus(); 
        }
    }
}

// Cập nhật đồng hồ
function updateTime() {
  const now = new Date();
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const dayOfWeek = days[now.getDay()];
  document.getElementById("timeDisplay").innerText = `${dayOfWeek}, ${hours}:${minutes}:${seconds}`;
}
setInterval(updateTime, 1000);
updateTime();

// 5. QUẢN LÝ VƯỜN (MODAL & DANH SÁCH)

async function MoModalVuon() {
  document.getElementById('QuanLyVuon').style.display = 'block';
  document.getElementById('ThemVuon').style.display = 'block';
  document.getElementById('EditChonVuon').style.display = 'none'; 
  await UpdateDanhSachVuonUI();
  await loadPlantOptionsForDropdown();
}

function DongModalVuon() {
  document.getElementById("QuanLyVuon").style.display = "none";
}

// Tải danh sách Loại cây vào Dropdown
async function loadPlantOptionsForDropdown() {
  const select = document.getElementById('ChonLoaiCay');
  select.innerHTML = '<option value="">Đang tải...</option>';
  try {
    const plants = await getAllPlants(); 
    select.innerHTML = '<option value="">-- Chọn loại cây trồng --</option>';
    if (plants.length === 0) {
        const option = document.createElement('option');
        option.text = "Chưa có dữ liệu cây (Liên hệ Admin)";
        select.add(option);
        return;
    }
    plants.forEach(plant => {
      const option = document.createElement('option');
      option.value = plant.id;   
      option.text = plant.name;  
      select.add(option);
    });
  } catch (error) {
    select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

async function LuuVuonMoi() {
  const tenVuon = document.getElementById('TenVuonInput').value.trim();
  const plantId = document.getElementById('ChonLoaiCay').value;
  const espId = document.getElementById('EspIdInput').value.trim();

  if (tenVuon === '') return alert("Vui lòng nhập tên vườn!");
  if (plantId === '') return alert("Vui lòng chọn loại cây trồng!");

  try {
    const newGarden = await createGardenAPI(tenVuon, parseInt(plantId)); 
    let msg = "Tạo vườn thành công!";
    if (espId !== "") {
        try {
            await connectEspDeviceAPI(newGarden.id, espId);
            msg += `\nĐã kết nối thiết bị: ${espId}`;
        } catch (espError) {
            msg += `\n(Lỗi kết nối ESP: ${espError.message})`;
        }
    }
    alert(msg);
    document.getElementById('TenVuonInput').value = '';
    document.getElementById('EspIdInput').value = '';
    document.getElementById('ChonLoaiCay').value = '';
    await UpdateDanhSachVuonUI();
  } catch (error) {
    alert(`Lỗi: ${error.message}`);
  }
}

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
    const savedGardenId = localStorage.getItem("currentGardenId");
    gardens.forEach(garden => {
      const li = document.createElement('li');
      li.textContent = `🏡 ${garden.name}`; 
      li.style.cursor = "pointer";
      li.id = `garden-item-${garden.id}`;
      
      if (ChonGardenId === garden.id || (savedGardenId && parseInt(savedGardenId) === garden.id)) {
          li.classList.add("selected-garden");
          if (!ChonGardenId) {
              ChonGardenId = garden.id;
              showEditCayOption(garden.name, garden.id);
              HienThiTuyChonVuon(garden);
          }
      }
      li.onclick = () => {
        ChonGardenId = garden.id; 
        localStorage.setItem("currentGardenId", garden.id);
        document.querySelectorAll("#DanhSachVuonUI li").forEach(item => item.classList.remove("selected-garden"));
        li.classList.add("selected-garden");
        showEditCayOption(garden.name, garden.id);
        HienThiTuyChonVuon(garden);
      };
      ul.appendChild(li);
    });
  } catch (error) {
    ul.innerHTML = '<li>Lỗi tải danh sách.</li>';
  }
}

function HienThiTuyChonVuon(garden) {
    document.getElementById('ThemVuon').style.display = 'none';
    document.getElementById('EditChonVuon').style.display = 'block';
    document.getElementById('TenVuonDangChon').innerText = `Đang chọn: ${garden.name}`;
}

function DongEditVuon() {
    document.getElementById('EditChonVuon').style.display = 'none';
    document.getElementById('ThemVuon').style.display = 'block';
}

async function XoaVuonDaChon() {
    if (!ChonGardenId) return;
    if (!confirm("Bạn chắc chắn muốn xóa vườn này?")) return;
    try {
        await deleteGardenAPI(ChonGardenId); 
        if (sensorInterval) clearInterval(sensorInterval);
        alert("Đã xóa vườn!");
        DongEditVuon();
        UpdateDanhSachVuonUI();
        ChonGardenId = null;
        document.getElementById('status_bom').textContent = "";
    } catch (error) {
        alert("Lỗi xóa: " + error.message);
    }
}

// 6. THIẾT LẬP THỜI GIAN & ĐỘ CHỊU KHÁT

function MoChuKy() { document.getElementById("ModalChuky").style.display = "block"; }
function DongModal() { document.getElementById("ModalChuky").style.display = "none"; }
function DongChuKy() { DongModal(); }

function LuuChuKy() {
  const chuKyInput = document.getElementById("InputChuky").value;
  const chuKyValue = parseInt(chuKyInput);
  if (!isNaN(chuKyValue) && chuKyValue > 0) {
    globalManualDuration = chuKyValue;
    document.getElementById("DanhsachChuKy").textContent = `${chuKyValue} giây`;
    socket.emit("set_wateringtime", chuKyValue);
    alert(`✅ Đã lưu thời gian bơm thủ công là: ${chuKyValue} giây.`);
    DongModal();
    document.getElementById("InputChuky").value = "";
  } else {
    alert("Vui lòng nhập số giây (nguyên dương)!");
  }
}

function openDoChiuKhatModal() { document.getElementById("DoChiuKhatModal").style.display = "block"; }
function DongDoChiuKhat() { document.getElementById("DoChiuKhatModal").style.display = "none"; }

function saveDoChiuKhat() {
  const DoChiuKhatInput = document.getElementById("DoChiuKhatInput").value;
  const DoChiuKhatValue = parseInt(DoChiuKhatInput);
  if (!isNaN(DoChiuKhatValue) && DoChiuKhatValue > 9) {
    document.getElementById("waterValue").textContent = `${DoChiuKhatValue}đ`; 
    socket.emit("set_water_limit", DoChiuKhatValue); 
    document.getElementById("DoChiuKhatModal").style.display = "none";
  } else {
    alert("Vui lòng nhập một số nguyên dương lớn hơn 10!");
  }
  document.getElementById("DoChiuKhatInput").value = "";
}

// 7. QUẢN LÝ LỊCH TƯỚI (SCHEDULE)

function openLichTuoiOptions() {
    if (!ChonGardenId) return alert("⚠️ Vui lòng chọn một Vườn trước!");
    const gardenNameElem = document.getElementById('ChonTenCay');
    const gardenName = gardenNameElem ? gardenNameElem.textContent : "Vườn";
    const titleElem = document.querySelector('#LichTuoiOptionsModal h2');
    if (titleElem) titleElem.textContent = `Quản lý: ${gardenName}`;
    document.getElementById("LichTuoiOptionsModal").style.display = "block";
}
function dongLichTuoiOptionsModal() { document.getElementById("LichTuoiOptionsModal").style.display = "none"; }

function openAddLichTuoiModal() {
    document.getElementById("LichTuoiModal").style.display = "block";
    const form = document.getElementById("LichTuoiForm");
    if(form) form.reset(); 
    dongLichTuoiOptionsModal();
}
function cancelLichTuoi() { document.getElementById("LichTuoiModal").style.display = "none"; }

function openLichTuoiListModal() {
    if (!ChonGardenId) return;
    document.getElementById("LichTuoiListModal").style.display = "block";
    dongLichTuoiOptionsModal();
    loadSchedulesFromAPI(); 
}
function dongLichTuoiListModal() { document.getElementById("LichTuoiListModal").style.display = "none"; }

async function loadSchedulesFromAPI() {
    const container = document.getElementById("scheduleList");
    if (!ChonGardenId) {
        container.innerHTML = "<div style='color:red'>⚠️ Chưa xác định được ID vườn.</div>";
        return;
    }
    container.innerHTML = "<div>⏳ Đang tải dữ liệu...</div>";
    try {
        const data = await getSchedulesByGardenAPI(ChonGardenId); 
        LichTuois = data; 
        renderScheduleList(data);
    } catch (error) {
        container.innerHTML = "<div style='color:red'>Có lỗi khi tải dữ liệu.</div>";
    }
}

function renderScheduleList(schedules) {
    const container = document.getElementById("scheduleList");
    container.innerHTML = "";
    if (!schedules || schedules.length === 0) {
        container.innerHTML = "<div style='padding:20px; color:#666'>Chưa có lịch nào.</div>";
        return;
    }
    schedules.sort((a, b) => a.time.localeCompare(b.time));
    const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    schedules.forEach((sch, index) => {
        let displayLabel = "";
        let styleColor = "";
        if (!sch.repeat) {
            displayLabel = "🚫 Chỉ một lần";
            styleColor = "color: #e74c3c;";
        } else if (sch.repeat === 'daily') {
            displayLabel = "🔄 Hàng ngày";
            styleColor = "color: #27ae60;"; 
        } else if (sch.repeat.startsWith('weekly:')) {
            const parts = sch.repeat.split(':');
            const dayIdx = parseInt(parts[1]);
            if (!isNaN(dayIdx) && dayNames[dayIdx]) {
                displayLabel = dayNames[dayIdx];
                styleColor = "color: #2c3e50;"; 
            } else {
                displayLabel = "Lặp lại hàng tuần";
            }
        } else {
            displayLabel = sch.repeat; 
        }
        
        const div = document.createElement("div");
        div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;";
        div.innerHTML = `
            <div>
                <strong style="${styleColor}">${index+1}. ${displayLabel}</strong> 
                - <span style="color:#2980b9; font-weight:bold; font-size: 1.1em;">${sch.time}</span>
                <br><small style="color:#888;">⏱️ Tưới trong: ${sch.durationSeconds} giây</small>
            </div>
            <button onclick="deleteSchedule(${sch.id})" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Xóa</button>
        `;
        container.appendChild(div);
    });
}

async function deleteSchedule(id) {
    if (!confirm("Bạn chắc chắn muốn xóa lịch này?")) return;
    try {
        await deleteScheduleByIdAPI(id);
        alert("Đã xóa!");
        loadSchedulesFromAPI(); 
    } catch (e) { alert("Lỗi xóa: " + e.message); }
}

async function xoaTatCaLichTuoi() {
    if (!confirm("CẢNH BÁO: Bạn muốn xóa TOÀN BỘ lịch của vườn này?")) return;
    if (LichTuois.length === 0) return alert("Danh sách trống.");
    try {
        for (const s of LichTuois) { await deleteScheduleByIdAPI(s.id); }
        alert("Đã xóa sạch lịch!");
        loadSchedulesFromAPI();
    } catch (e) { alert("Có lỗi xảy ra: " + e.message); }
}

// 8. TỪ ĐIỂN CÂY (SEARCH) & ADMIN
async function loadAllPlants() {
    try {
        const plants = await getAllPlants();
        allPlantsCache = plants;
        console.log("Đã tải thư viện cây:", plants.length, "loài.");
    } catch (error) { console.error("Lỗi tải toàn bộ cây:", error); }
}

async function openDictionaryModal() { 
    const modal = document.getElementById('DictionaryModal');
    if (modal) {
        modal.style.display = 'block';
        const sInput = document.getElementById('plantSearch');
        if(sInput) { sInput.value = ''; sInput.focus(); }
        const suggestions = document.getElementById('suggestions');
        if(suggestions) suggestions.style.display = 'none';
        const infoDiv = document.getElementById('plantInfo');
        if(infoDiv) infoDiv.style.display = 'none';
        await loadAllPlants(); 
    }
}
function closeDictionaryModal() {
    const modal = document.getElementById('DictionaryModal');
    if(modal) modal.style.display = 'none';
}

function handleSearchButton() {
    const sInput = document.getElementById('plantSearch');
    const query = sInput.value.toLowerCase().trim();
    const suggestions = document.getElementById('suggestions');
    const infoDiv = document.getElementById('plantInfo');
    if (!query) return alert("Vui lòng nhập tên cây cần tìm!");
    
    if (!allPlantsCache || allPlantsCache.length === 0) {
        alert("Đang tải dữ liệu... Thử lại sau.");
        loadAllPlants(); 
        return;
    }
    const exactMatch = allPlantsCache.find(p => p.name.toLowerCase() === query);
    if (exactMatch) {
        displayPlantDetails(exactMatch.id);
        if(suggestions) suggestions.style.display = 'none';
        return;
    }
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

function displaySuggestions(plants) {
  const suggestions = document.getElementById('suggestions');
  if(!suggestions) return;
  suggestions.innerHTML = ''; 
  suggestions.style.display = 'block';
  if (plants.length > 0) {
    plants.forEach(plant => {
      const li = document.createElement('li');
      li.textContent = plant.name;
      li.onclick = function () {
        document.getElementById('plantSearch').value = plant.name;
        displayPlantDetails(plant.id); 
        suggestions.style.display = 'none';
      };
      suggestions.appendChild(li);
    });
  } else { suggestions.style.display = 'none'; }
}

async function displayPlantDetails(plantId) {
    const plantInfo = document.getElementById('plantInfo');
    if(!plantInfo) return;
    plantInfo.style.display = 'block';
    plantInfo.innerHTML = '⏳ Đang tải thông tin...';
    try {
        const plant = await getPlantById(plantId); 
        plantInfo.innerHTML = `
            <h3 style="color: #27ae60; margin-top:0;">🌿 ${plant.name}</h3>
            <p><em>${plant.description || "Chưa có mô tả."}</em></p>
            <div style="background: #f9f9f9; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #eee;">
                <div>🌡️ Nhiệt độ: <strong>${plant.minTemperature} - ${plant.maxTemperature}°C</strong></div>
                <div>💧 Độ ẩm KK: <strong>${plant.minAirHumidity} - ${plant.maxAirHumidity}%</strong></div>
                <div>🌱 Độ ẩm Đất: <strong>${plant.minSoilMoisture} - ${plant.maxSoilMoisture}%</strong></div>
            </div>`;
    } catch (error) { plantInfo.innerHTML = `<span style="color:red">Lỗi: ${error.message}</span>`; }
}

// --- ADMIN ---
function openAdminPlantModal() {
    const token = localStorage.getItem("userToken");
    const decoded = parseJwt(token);
    let isAdmin = false;
    if (decoded) {
        if (Array.isArray(decoded.roles) && (decoded.roles.includes('ADMIN') || decoded.roles.includes('admin'))) isAdmin = true;
        if (decoded.role === 'ADMIN' || decoded.role === 'admin') isAdmin = true;
        if (decoded.roleId === 2) isAdmin = true;
    }
    if (!isAdmin) return alert("⛔ Chức năng này chỉ dành cho Admin.");
    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'block';
}

function closeAdminPlantModal() {
    const modal = document.getElementById('AdminPlantModal');
    if(modal) modal.style.display = 'none';
    const inputs = ['adminPlantName', 'adminPlantDesc', 'minTemp', 'maxTemp', 'minAir', 'maxAir', 'minSoil', 'maxSoil'];
    inputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}

async function LuuCayMoiAdmin() {
    const name = document.getElementById('adminPlantName').value.trim();
    const desc = document.getElementById('adminPlantDesc').value.trim();
    const minTemp = parseFloat(document.getElementById('minTemp').value);
    const maxTemp = parseFloat(document.getElementById('maxTemp').value);
    const minAir = parseFloat(document.getElementById('minAir').value);
    const maxAir = parseFloat(document.getElementById('maxAir').value);
    const minSoil = parseFloat(document.getElementById('minSoil').value);
    const maxSoil = parseFloat(document.getElementById('maxSoil').value);

    if (!name) return alert("Vui lòng nhập tên cây!");
    if (isNaN(minTemp)) return alert("Vui lòng nhập đủ thông số!");

    const payload = {
        name: name, description: desc,
        minTemperature: minTemp, maxTemperature: maxTemp,
        minAirHumidity: minAir, maxAirHumidity: maxAir,
        minSoilMoisture: minSoil, maxSoilMoisture: maxSoil
    };
    try {
        await createPlantAdminAPI(payload);
        alert(`Thành công! Đã thêm cây: "${name}"`);
        closeAdminPlantModal();
    } catch (error) { alert(`Thất bại: ${error.message}`); }
}

// 9. KHỞI TẠO (INIT & LISTENERS)

// Lắng nghe sự kiện Socket.IO
socket.on('mqtt-data', (data) => updateSensorUI(data));
socket.on("get_watering_cycle", (val) => {
  if (!isNaN(val) && val > 0) document.getElementById("DanhsachChuKy").textContent = `${val}`;
});
socket.on("get_water_limit", (val) => {
  if (val !== null && !isNaN(val)) document.getElementById("waterValue").textContent = `${val}đ`; 
});

// Chạy khi trang web load xong
document.addEventListener("DOMContentLoaded", () => {
  // 1. Gán sự kiện đăng xuất
  const logoutButton = document.querySelector(".logout-btn");
  if (logoutButton) logoutButton.onclick = logout;

  // 2. Yêu cầu dữ liệu IoT ban đầu
  socket.emit("request_watering_cycle");
  socket.emit("request_water_limit"); 
  socket.emit('request_schedule_upload');

  // 3. Tải dữ liệu ban đầu
  UpdateDanhSachVuonUI(); 
  loadAllPlants();  

  // 4. Xử lý Form Lịch (Ngăn chặn reload)
  const formLich = document.getElementById("LichTuoiForm");
  if(formLich) {
      const newForm = formLich.cloneNode(true);
      formLich.parentNode.replaceChild(newForm, formLich);
      
      newForm.addEventListener("submit", async function(e) {
          e.preventDefault(); 
          if (!ChonGardenId) return alert("⚠️ Vui lòng chọn Vườn trước!");

          const timeStr = document.getElementById("wateringTime").value; 
          const seconds = document.getElementById("wateringSecond").value;
          const dayVal = document.querySelector('input[name="day"]:checked')?.value; 

          if (!timeStr || !dayVal || seconds === "") return alert("Thiếu thông tin!");

          const daysMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
          let repeatString = null; 
          if (dayVal === "Everyday") repeatString = "daily"; 
          else if (dayVal !== "Once") repeatString = `weekly:${daysMap[dayVal]}`;
          
          const payload = {
              date: new Date().toISOString().split('T')[0], 
              time: timeStr,
              durationSeconds: parseInt(seconds),
              repeat: repeatString, 
              gardenId: ChonGardenId
          };

          try {
              await createScheduleAPI(payload);
              alert("✅ Đã tạo lịch thành công!");
              cancelLichTuoi();
              const listModal = document.getElementById("LichTuoiListModal");
              if (listModal && listModal.style.display === "block") loadSchedulesFromAPI();
          } catch (error) { alert(`Lỗi: ${error.message}`); }
      });
  }

  // 5. Xử lý Tìm kiếm cây (Plant Search)
  const sInputElement = document.getElementById('plantSearch');
  if (sInputElement) {
      const newSearchInput = sInputElement.cloneNode(true);
      sInputElement.parentNode.replaceChild(newSearchInput, sInputElement);

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
});
