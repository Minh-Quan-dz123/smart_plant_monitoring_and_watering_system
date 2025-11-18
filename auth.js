// auth.js

// Chờ cho trang HTML được tải xong
document.addEventListener("DOMContentLoaded", () => {

  // Lấy các phần tử từ trang HTML
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");

  // Gắn một hàm xử lý sự kiện khi form được "submit" (nhấn nút Đăng nhập)
  loginForm.addEventListener("submit", async (event) => {
    
    // Ngăn trang web tải lại (hành vi mặc định của form)
    event.preventDefault(); 

    // Xóa thông báo lỗi cũ
    errorMessage.textContent = "";

    // Lấy giá trị người dùng nhập vào
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Gửi yêu cầu đến backend (giống API trong ảnh bạn gửi)
    try {
      const response = await fetch("http://localhost:3000/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Gửi username/password đi
        // LƯU Ý: Đảm bảo key (ví dụ: 'username') khớp với
        // yêu cầu của backend
        body: JSON.stringify({ 
          username: username, // hoặc email: username, tùy vào backend
          password: password 
        }), 
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng nhập THÀNH CÔNG
        // Nếu backend trả về token, hãy lưu nó lại
        if (data.token) {
          localStorage.setItem("userToken", data.token);
        }
        
        // Chuyển hướng đến trang main.html
        window.location.href = "main.html";

      } else {
        // Đăng nhập THẤT BẠI
        // Hiển thị lỗi trả về từ server
        errorMessage.textContent = data.message || "Tên đăng nhập hoặc mật khẩu không đúng.";
      }

    } catch (error) {
      // Lỗi (ví dụ: không kết nối được backend)
      console.error("Lỗi đăng nhập:", error);
      errorMessage.textContent = "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
    }
  });
});